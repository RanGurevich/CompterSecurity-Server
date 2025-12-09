const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const database = require('./database/UserUtils/userUtils');

const app = express();
const port = 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Routes ---
// שליפת כל המשתמשים (לצורך בדיקה)
app.get('/', async (req, res) => {
    try {
        const users = await database.testDB();
        res.json(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // 1. בדיקת שדות חובה
    if (!username || !email || !password) {
        return res.status(400).send("Missing fields");
    }

    try {
        const userExists = await database.checkUserExists(username);
        
        if (userExists) {
            return res.status(409).send("Username is already taken! Please choose another.");
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hmac = crypto.createHmac('sha256', salt);
        hmac.update(password);
        const passwordHash = hmac.digest('hex');

        // 3. שמירה ב-DB
        await database.createUser(username, email, passwordHash, salt);
        
        res.status(201).send("Registration successful");

    } catch (error) {
        console.error("Register Error:", error);
        // עדיין נשאיר את ההגנה הזו למקרה של אימייל כפול
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).send("Email already exists");
        } else {
            res.status(500).send("Server error");
        }
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send("Missing username or password");
    }

    try {
        const user = await database.getUserByUsername(username);

        if (!user) {
            return res.status(401).send("Username or Password incorrect");
        }

        const salt = user.salt; 
        const hmac = crypto.createHmac('sha256', salt);
        hmac.update(password);
        const loginHash = hmac.digest('hex');

        if (loginHash === user.password_hash) {
            res.status(200).send("Login successful");
        } 
        else {
            res.status(401).send("Username or Password incorrect");
        }

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});