// app.js
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); 

const bcryptUtils = require('./Encryptes/bcrypt'); 
const database = require('./database/UserUtils/userUtils'); 
const config = require('./passwordSecurityConfig'); 

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// הגדרת Rate Limiter (הגנה רשתית)
const loginLimiter = rateLimit(config.rateLimit);

// --- REGISTER ---
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) 
        return res.status(400).json({ message: "Missing fields" });

    // בדיקת סיסמה מול ה-Regex בקונפיגורציה
    if (!config.passwordPolicy.regex.test(password)) {
        return res.status(400).json({ message: "Password does not meet complexity requirements" });
    }

    try {
        const userExists = await database.checkUserExists(username);
        if (userExists) return res.status(409).json({ message: "Username taken" });

        const passwordHash = await bcryptUtils.createUserHash(password);
        await database.createUser(username, email, passwordHash);
        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: ${username}`);

    try {
        const user = await database.getUserByUsername(username);
        
        if (!user) return res.status(401).json({ message: "Auth failed" });

        // --- לוגיקה חדשה: בדיקת זמן שחרור ---
        if (user.is_locked) {
            const now = new Date();
            const lockUntil = user.lock_until ? new Date(user.lock_until) : null;

            if (lockUntil && now > lockUntil) {
                await database.resetLoginAttempts(username);
                console.log(`User ${username} auto-unlocked.`);
            } else {
                const timeLeft = lockUntil ? lockUntil - now : 0;
                return res.status(403).json({ 
                    message: "Account locked", 
                    timeLeft: timeLeft > 0 ? timeLeft : 0 
                });
            }
        }
        // ------------------------------------

        const isMatch = await bcryptUtils.checkIfThePasswordIsCorrect(password, user.password_hash);
        
        if (isMatch) {
            console.log("Login Success");
            await database.resetLoginAttempts(username);
            res.status(200).json({ message: "Login successful", username: user.username });
        } else {
            console.log("Login Failed: Bad password");
            await database.incrementLoginAttempts(username);
            
            const currentAttempts = (user.failed_login_attempts || 0) + 1;
           if (currentAttempts >= config.loginPolicy.maxAttempts) {
                console.log(`Locking user: ${username}`);
                
                // שינוי: לא שולחים זמן, הפונקציה יודעת לבד שזה 15 דקות
                await database.lockUser(username);
                
                // מחזירים לקלינט שזה ל-15 דקות (בשביל הטיימר הראשוני)
                const fifteenMinutes = 15 * 60 * 1000;
                return res.status(403).json({ 
                    message: "Account locked", 
                    timeLeft: fifteenMinutes 
                });
            }

            res.status(401).json({ 
                message: "Auth failed", 
                attemptsLeft: config.loginPolicy.maxAttempts - currentAttempts 
            });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// --- CHANGE PASSWORD ---
app.post('/change-password', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) 
        return res.status(400).json({ message: "Missing fields" });

    // בדיקת חוזק סיסמה
    if (!config.passwordPolicy.regex.test(newPassword))
         return res.status(400).json({ message: "Password weak" });

    // בדיקת מילים אסורות
    if (config.passwordPolicy.forbiddenPasswords.includes(newPassword.toLowerCase())) {
        return res.status(400).json({ message: "Password is too common" });
    }

    try {
        const user = await database.getUserByUsername(username);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcryptUtils.checkIfThePasswordIsCorrect(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect old password" });
        }

        let history = [];
        try { history = JSON.parse(user.password_history || "[]"); } catch (e) {}

        // היסטוריה
        for (let oldHash of history) {
            if (await bcryptUtils.checkIfThePasswordIsCorrect(newPassword, oldHash)) {
                return res.status(400).json({ message: "Password in history" });
            }
        }
        
        if (await bcryptUtils.checkIfThePasswordIsCorrect(newPassword, user.password_hash)) {
             return res.status(400).json({ message: "Same as current password" });
        }

        const newHash = await bcryptUtils.createUserHash(newPassword);
        
        history.unshift(user.password_hash);
        if (history.length > config.passwordPolicy.historyLimit) history.pop();

        const result = await database.updateUserPassword(username, newHash, JSON.stringify(history));
        
        if (result && result.affectedRows > 0) {
            console.log("SUCCESS: Password Changed!");
            res.status(200).json({ message: "Password updated" });
        } else {
            res.status(500).json({ message: "Update failed internally" });
        }

    } catch (error) {
        console.error("Change Pwd Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});