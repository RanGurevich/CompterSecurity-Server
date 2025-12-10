const express = require('express');
const cors = require('cors');

// הייבואים שלך נשארו אותו דבר
const bcryptUtils = require('./Encryptes/bcrypt'); 
const database = require('./database/UserUtils/userUtils'); 

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- REGISTER ---
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // בדיקת שדות
    if (!username || !email || !password) {
        console.log("Register failed: Missing fields");  
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        const userExists = await database.checkUserExists(username);
        if (userExists) {
            console.log(`Register failed: Username '${username}' taken`);
            return res.status(409).json({ message: "Username is already taken!" });
        }

        const passwordHash = await bcryptUtils.createUserHash(password);
        await database.createUser(username, email, passwordHash);

        console.log(`New user registered: ${username}`);
        res.status(201).json({ message: "Registration successful" });

    } catch (error) {
        console.error("Register Error:", error.message);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: "Email already exists" });
        } else {
            res.status(500).json({ message: "Server error" });
        }
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`); 

    if (!username || !password) {
        return res.status(400).json({ message: "Missing username or password" });
    }

    try {
        const user = await database.getUserByUsername(username);

        if (!user) {
            console.log("Login failed: User not found");
            return res.status(401).json({ message: "Username or Password incorrect" });
        }

        const isMatch = await bcryptUtils.checkIfThePasswordIsCorrect(password, user.password_hash);
        
        if (isMatch) {
            console.log("Login success!");
            res.status(200).json({ message: "Login successful" });
        } else {
            console.log("Login failed: Wrong password");
            res.status(401).json({ message: "Username or Password incorrect" });
        }

    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// מסלולי בדיקה 
app.get('/', (req, res) => res.send('Server is up!'));

app.get('/test', async (req, res) => {
    try {
        const users = await database.testDB();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'DB error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});