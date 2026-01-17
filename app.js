require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); 
const jwt = require('jsonwebtoken');
const bcryptUtils = require('./Encryptes/bcrypt'); 
const database = require('./database/UserUtils/userUtils'); 
const customerDatabase = require('./database/CustomerUtils/customerUtils');
const config = require('./passwordSecurityConfig'); 
const authJWT = require('./Encryptes/authJWT');
const cookieParser = require('cookie-parser'); 
const blockPlainText = require('./middleware/blockPlainText');
const validateInputLength = require('./middleware/validateLength');


const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));app.use(express.json());

app.use(cookieParser()); 
app.use(blockPlainText);
app.use(validateInputLength);
const loginLimiter = rateLimit(config.rateLimit);
app.use(loginLimiter);

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
        if (userExists) {
            return res.status(409).json({ message: "Username taken" });
        }
        const mailNotInUse = await database.checkIfMailNotInUse(email);
        if (!mailNotInUse) {
            return res.status(409).json({ message: "Email already in use" });
        }

        const passwordHash = await bcryptUtils.createUserHash(password);
        await database.createUser(username, email, passwordHash);
        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


app.get('/getUserName', authJWT.authenticateToken, async (req, res) => {
    try {
        console.log(req.username.user)
        const  username  = req.username.user;
        const tokenUsername = req.username.user;

        if (!username) {
            return res.status(400).json({ message: "Missing username parameter" });
        }

        if (tokenUsername !== username) {
            return res.status(403).json({ message: "ACCESS BLOCKED" });
        }

        const user = await database.getUserByUsername(username);
        
        if (!user) {
            return res.status(404).json({ message: "NOT FOUND" });
        }

        res.status(200).json({ username: user.username });
    } catch (error) {
        console.error("Get User Name Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: ${username}`);

    try {
        const user = await database.getUserByUsername(username);
        
        if (!user) return res.status(401).json({ message: "Auth failed" });

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
    const username = req.username.user;
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
         from: `"Cyber Security Support" <${process.env.GMAIL_USER}>`,

            to: email,
            subject: 'Reset Your Password - Cyber security',
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

        await transporter.sendMail(mailOptions);
        console.log(`[SUCCESS] Email sent successfully to ${email}`);
        
        res.json({ message: "Reset code sent to your email." });

    } catch (error) {
        console.error("[ERROR] Failed to process request:", error);
        res.status(500).json({ message: "Error sending email. Check address or server config." });
    }
});

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

app.get('/customers', authJWT.authenticateToken, async (req, res) => {
    try {
        const username = req.username.user;
        if (!username) {
            return res.status(401).json({ message: "ACCESS BLOCKED: Invalid token" });
        }

        const customers = await customerDatabase.getCustomersByUsername(username);
        res.status(200).json({ customers });
    } catch (error) {
        console.error("Get Customers Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.get('/customers/:customerId', authJWT.authenticateToken, async (req, res) => {
    try {
        const username = req.username.user;
        const customerId = parseInt(req.params.customerId);

        if (!username) {
            return res.status(401).json({ message: "ACCESS BLOCKED: Invalid token" });
        }

        if (isNaN(customerId)) {
            return res.status(400).json({ message: "Invalid customer ID" });
        }

        const customer = await customerDatabase.getCustomerById(customerId);
        
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        if (customer.userName !== username) {
            return res.status(403).json({ message: "ACCESS BLOCKED: You can only access your own customers" });
        }

        res.status(200).json({ customer });
    } catch (error) {
        console.error("Get Customer Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/customers', authJWT.authenticateToken, async (req, res) => {
    try {
        const username = req.username.user;
        const { customerName, customerPhone, userName } = req.body;

        if (!username) {
            return res.status(401).json({ message: "ACCESS BLOCKED: Invalid token" });
        }

        if (userName && userName !== username) {
            return res.status(403).json({ message: "ACCESS BLOCKED: You can only create customers for your own account" });
        }

        if (!customerName) {
            return res.status(400).json({ message: "Missing customerName field" });
        }

        const result = await customerDatabase.createCustomer(username, customerName, customerPhone || null);
        
        if (result && result.affectedRows > 0) {
            res.status(201).json({ message: "Customer created successfully", customerId: result.insertId });
        } else {
            res.status(500).json({ message: "Failed to create customer" });
        }
    } catch (error) {
        console.error("Create Customer Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/customers/search', authJWT.authenticateToken, async (req, res) => {
    try {
        const username = req.username.user;
        const { customerName } = req.body;

        if (!username) {
            return res.status(401).json({ message: "ACCESS BLOCKED: Invalid token" });
        }

        if (!customerName) {
            return res.status(400).json({ message: "Missing customerName field" });
        }

        const customer = await customerDatabase.getCustomerByNameAndUsername(customerName, username);
        console.log(customer);
        
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.status(200).json({ customer : customer });
    } catch (error) {
        console.error("Search Customer Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});