require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); 
const jwt = require('jsonwebtoken');
const bcryptUtils = require('./Encryptes/bcrypt'); 
const database = require('./database/UserUtils/userUtils'); 
const config = require('./passwordSecurityConfig'); 
const authJWT = require('./Encryptes/authJWT');
const cookieParser = require('cookie-parser'); 

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));app.use(express.json());

app.use(cookieParser()); 
// הגדרת Rate Limiter (הגנה רשתית)
const loginLimiter = rateLimit(config.rateLimit);

// --- REGISTER ---
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) 
        return res.status(400).json({ message: "Missing fields" });

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

app.get('/protectedJWT', authJWT.authenticateToken, (req, res) => {
  res.json({ message: `Hello user ${req.user.id}` });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: ${username}`);

    try {
        const user = await database.getUserByUsername(username);
        
        if (!user) return res.status(401).json({ message: "Auth failed" });

        // ---  בדיקת זמן שחרור ---
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

        const isMatch = await bcryptUtils.checkIfThePasswordIsCorrect(password, user.password_hash);
        
        if (isMatch) {
            console.log("Login Success");
            await database.resetLoginAttempts(username);
            authJWT.setAuthCookie(res, username);
            res.status(200).json({ message: "Login successful", username: user.username });
        } else {
            console.log("Login Failed: Bad password");
            await database.incrementLoginAttempts(username);
            
            const currentAttempts = (user.failed_login_attempts || 0) + 1;
           if (currentAttempts >= config.loginPolicy.maxAttempts) {
                console.log(`Locking user: ${username}`);
                await database.lockUser(username);
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
app.post('/change-password', authJWT.authenticateToken, async (req, res) => {
    console.log(req.headers.cookie);
    const {oldPassword, newPassword } = req.body;
    console.log(req.username.user)
    username = req.username.user;
    if (!username || !oldPassword || !newPassword) 
        return res.status(400).json({ message: "Missing fields" });

    if (!config.passwordPolicy.regex.test(newPassword))
         return res.status(400).json({ message: "Password weak" });

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


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// --- FORGOT PASSWORD ---
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log(`[REQUEST] Forgot password for: ${email}`);

    const rawToken = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha1').update(rawToken).digest('hex');
    const expiryDate = new Date(Date.now() + 15 * 60 * 1000); 

    try {
        await database.saveResetToken(email, tokenHash, expiryDate);
        
        const mailOptions = {
         from: `"Syber Security Support" <${process.env.GMAIL_USER}>`,

            to: email,
            subject: 'Reset Your Password - Syber sequrity',
            html: `
                <h3>Password Reset Request</h3>
                <p>Hello,</p>
                <p>You requested to reset your password. Please copy the code below:</p>
                <h2 style="background-color: #f0f0f0; padding: 10px; display: inline-block;">${rawToken}</h2>
                <p>This code is valid for 15 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
            `
        };
        console.log("MAIL USER:", process.env.GMAIL_USER);
        console.log("MAIL PASS exists:", !!process.env.GMAIL_APP_PASSWORD);


        // שליחה בפועל
        await transporter.sendMail(mailOptions);
        console.log(`[SUCCESS] Email sent successfully to ${email}`);
        
        res.json({ message: "Reset code sent to your email." });

    } catch (error) {
        console.error("[ERROR] Failed to process request:", error);
        res.status(500).json({ message: "Error sending email. Check address or server config." });
    }
});

// --- RESET PASSWORD (עם אכיפת היסטוריה) ---
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const tokenHash = crypto.createHash('sha1').update(token).digest('hex');

    try {
        const user = await database.getUserByResetToken(tokenHash);
        
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        if (!config.passwordPolicy.regex.test(newPassword)) {
             return res.status(400).json({ message: "Password weak" });
        }

        let history = [];
        try { 
            history = JSON.parse(user.password_history || "[]"); 
        } catch (e) { 
            history = []; 
        }

        const isSameAsCurrent = await bcryptUtils.checkIfThePasswordIsCorrect(newPassword, user.password_hash);
        if (isSameAsCurrent) {
            return res.status(400).json({ message: "Cannot use current password" });
        }

        for (let oldHash of history) {
            const isMatch = await bcryptUtils.checkIfThePasswordIsCorrect(newPassword, oldHash);
            if (isMatch) {
                return res.status(400).json({ message: "Password is in history (last 3 passwords)" });
            }
        }
        // ---------------------------------------------------------

        const newPassHash = await bcryptUtils.createUserHash(newPassword);
        
        history.unshift(user.password_hash);
        if (history.length > config.passwordPolicy.historyLimit) history.pop(); 

        await database.updateUserPassword(user.username, newPassHash, JSON.stringify(history));
        await database.clearResetToken(user.username);
        
        res.json({ message: "Password reset successful" });
        
    } catch (error) {
        console.error("Reset Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});