USE `security-data`;

CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(20) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    failed_login_attempts INT DEFAULT 0,
    is_locked TINYINT(1) DEFAULT 0,
    lock_until DATETIME DEFAULT NULL,
    password_history JSON DEFAULT NULL,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expires DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS customers (
    customerId INT AUTO_INCREMENT PRIMARY KEY,
    userName VARCHAR(20) NOT NULL,
    customerName VARCHAR(20) NOT NULL,
    customerPhone VARCHAR(20) DEFAULT NULL,
    FOREIGN KEY (userName) REFERENCES users(username) ON DELETE CASCADE
);
