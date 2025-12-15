const express = require('express');
const cors = require('cors');

const bcryptUtils = require('./Encryptes/bcrypt'); 
const database = require('./database/UserUtils/userUtils'); 

const app = express();
const port = 3000;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
const HISTORY_LIMIT = 2;
app.use(cors());
app.use(express.json());

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "Missing fields" });

    try {
        const userExists = await database.checkUserExists(username);
        if (userExists) return res.status(409).json({ message: "Username taken" });

        const passwordHash = await bcryptUtils.createUserHash(password);
        await database.createUser(username, email, passwordHash);
        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- LOGIN ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: ${username}`);

    try {
        const user = await database.getUserByUsername(username);
        if (!user) return res.status(401).json({ message: "Auth failed" });

        const isMatch = await bcryptUtils.checkIfThePasswordIsCorrect(password, user.password_hash);
        if (isMatch) {
            console.log("Login Success");
            res.status(200).json({ message: "Login successful", username: user.username });
        } else {
            console.log("Login Failed: Bad password");
            res.status(401).json({ message: "Auth failed" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


// --- CHANGE PASSWORD ---
app.post('/change-password', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) 
        return res.status(400).json({ message: "Missing fields" });

    if (!passwordRegex.test(newPassword))
         return res.status(400).json({ message: "Password weak" });

    try {
        const user = await database.getUserByUsername(username);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcryptUtils.checkIfThePasswordIsCorrect(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect old password" });
        }

        let history = [];
        try { history = JSON.parse(user.password_history || "[]"); } catch (e) {}

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
        if (history.length > HISTORY_LIMIT) history.pop();

        const result = await database.updateUserPassword(username, newHash, JSON.stringify(history));
        
        console.log("DB Update Result:", result); 

        if (result && result.affectedRows > 0) {
            console.log("SUCCESS: Password Changed!");
            res.status(200).json({ message: "Password updated" });
        } else {
            console.log("ERROR: No rows affected!");
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