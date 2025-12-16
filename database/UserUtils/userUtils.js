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
    // הפקודה DATE_ADD(NOW(), INTERVAL 15 MINUTE) עובדת תמיד
    const sql = `UPDATE users SET is_locked = 1, lock_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE username = ?`;
    await pool.execute(sql, [username]);
};

const testDB = async () => {
    const [rows] = await pool.execute('SELECT * FROM users');
    return rows;
};

module.exports = { 
    createUser, 
    testDB, 
    checkUserExists, 
    getUserByUsername, 
    updateUserPassword,
    resetLoginAttempts,
    incrementLoginAttempts,
    lockUser
};