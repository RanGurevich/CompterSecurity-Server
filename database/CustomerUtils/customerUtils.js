const mysql = require('mysql2/promise');

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'security-data',
};

const pool = mysql.createPool(config);

const checkCustomerExists = async (userName) => {
    const [rows] = await pool.execute('SELECT * FROM customers WHERE userName = ?', [userName]);
    return rows.length > 0;
};

const createCustomer = async (userName, customerName, customerPhone) => {
    const sql = `INSERT INTO customers (userName, customerName, customerPhone) VALUES (?, ?, ?)`;
    const [result] = await pool.execute(sql, [userName, customerName, customerPhone]);
    return result;
};

const getCustomerById = async (customerId) => {
    const [rows] = await pool.execute('SELECT * FROM customers WHERE customerId = ?', [customerId]);
    return rows[0];
};

const getCustomerByNameAndUsername = async (customerName, userName) => {
    const [rows] = await pool.execute('SELECT * FROM customers WHERE customerName like ? AND userName = ?', [`%${customerName}%`, userName]);
    return rows;
};

const getCustomersByUsername = async (userName) => {
    const [rows] = await pool.execute('SELECT * FROM customers WHERE userName = ?', [userName]);
    return rows;
};


module.exports = { 
    createCustomer,
    getCustomerByNameAndUsername,
    checkCustomerExists,
    getCustomerById,
    getCustomersByUsername
};
