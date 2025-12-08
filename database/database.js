const mysql      = require('mysql2/promise');


const testDB = async () => {
    let connection;
    
    try {
        // 2. יצירת החיבור היא גם אסינכרונית כאן
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'security-data'
        });

        // 3. עכשיו ה-await באמת יעצור ויחכה לתוצאות
        // execute מומלץ יותר מ-query מטעמי אבטחה, והתוצאה מגיעה במערך שבו האיבר הראשון הוא השורות
        const [rows, fields] = await connection.execute('select * from users');
        
        console.log('התוצאה מהדאטה בייס:', rows);
        return rows;

    } catch (error) {
        console.error('קרתה שגיאה:', error);
    } finally {
        // 4. סגירת החיבור בסוף, גם אם הייתה שגיאה
        if (connection) await connection.end();
    }
}

module.exports = {
    testDB
}

