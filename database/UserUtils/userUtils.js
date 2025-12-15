const mysql = require('mysql2/promise');

const config = {
    host: 'localhost', 
    user: 'root', 
    password: '1234', 
    database: 'security-data'
};

const checkUserExists = async (username) => {
    const connection = await mysql.createConnection(config);
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [ mysql.escape(username)]);
        return rows.length > 0;
    } finally {
        await connection.end();
    }
};

const createUser = async (username, email, passwordHash) => {
    const connection = await mysql.createConnection(config);
    try {
        const sql = `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`;
        const [result] = await connection.execute(sql, [mysql.escape(username), mysql.escape(email), mysql.escape(passwordHash)]);
        return result;
        
    } catch (error) {
        throw error;
    } finally {
        await connection.end();
    }
};

const getUserByUsername = async (username) => {
    const connection = await mysql.createConnection(config);
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    } finally {
        await connection.end();
    }
};

const testDB = async () => {
    const connection = await mysql.createConnection(config);
    try {
        const [rows] = await connection.execute('SELECT * FROM users');
        return rows;
    } finally {
        await connection.end();
    }
};

module.exports = { createUser, testDB, checkUserExists, getUserByUsername };



