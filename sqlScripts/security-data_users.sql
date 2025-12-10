-- מחיקת הטבלה הישנה כדי להתחיל נקי
DROP TABLE IF EXISTS users;

-- יצירת הטבלה החדשה
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- מקום רחב ל-Bcrypt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INT DEFAULT 0, -- הכנה לדרישות הפרויקט
    is_locked BOOLEAN DEFAULT FALSE      -- הכנה לנעילת משתמשים
);

SELECT * FROM users;