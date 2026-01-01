const mysql = require('mysql2/promise');

const config = {
    host: 'localhost', 
    user: 'root', 
    password: '1234', 
    database: 'security-data',
};

const pool = mysql.createPool(config);

const checkUserExists = async (username) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows.length > 0;
};

const createUser = async (username, email, passwordHash) => {
    const sql = `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`;
    const [result] = await pool.execute(sql, [username, email, passwordHash]);
    return result;
};

const getUserByUsername = async (username) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
};

async function updateUserPassword(username, newHash, historyJson) {
    const query = `
        UPDATE users 
        SET password_hash = ?, password_history = ? 
        WHERE username = ?
    `;
    const [result] = await pool.execute(query, [newHash, historyJson, username]);
    return result; 
}


const resetLoginAttempts = async (username) => {
    const sql = `UPDATE users SET failed_login_attempts = 0, is_locked = 0, lock_until = NULL WHERE username = ?`;
    await pool.execute(sql, [username]);
};

const incrementLoginAttempts = async (username) => {
    const sql = `UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE username = ?`;
    await pool.execute(sql, [username]);
};

const lockUser = async (username) => {
    const sql = `UPDATE users SET is_locked = 1, lock_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE username = ?`;
    await pool.execute(sql, [username]);
};

const testDB = async () => {
    const [rows] = await pool.execute('SELECT * FROM users');
    return rows;
};

const saveResetToken = async (email, token, expiry) => {
    // תיקון Timezone קריטי: ממיר לזמן מקומי שמתאים ל-MySQL
    // ללא זה, השרת שומר זמן UTC והשאילתה חושבת שהטוקן פג תוקף מייד
    const offset = expiry.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(expiry - offset)).toISOString().slice(0, 19).replace('T', ' ');

    const sql = `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?`;
    const [result] = await pool.execute(sql, [token, localISOTime, email]);
    return result;
};

const getUserByResetToken = async (token) => {
    const sql = `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()`;
    const [rows] = await pool.execute(sql, [token]);
    return rows[0];
};

const clearResetToken = async (username) => {
    const sql = `UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE username = ?`;
    await pool.execute(sql, [username]);
};

module.exports = { 
    createUser, 
    testDB, 
    checkUserExists, 
    getUserByUsername, 
    updateUserPassword,
    resetLoginAttempts,
    incrementLoginAttempts,
    lockUser,
    saveResetToken,
    getUserByResetToken,
    clearResetToken
};