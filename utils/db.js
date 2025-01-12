const mysql = require('mysql');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        return;
    }
});

async function checkUserExists(userId) {
    const query = 'SELECT COUNT(*) AS count FROM users WHERE user_id = ?';
    try {
        const result = await queryAsync(query, [userId]);
        return result[0].count > 0;
    } catch (error) {
        throw error;
    }
}

async function checkUserInDb(req, res, next) {
    const initData = req.cookies.initData;
    if (!initData) {
        return res.status(403).sendFile(path.join(__dirname, '../views/403.html'));
    }

    const params = new URLSearchParams(initData);
    const userParam = params.get('user');

    if (!userParam) {
        return res.status(403).sendFile(path.join(__dirname, '../views/403.html'));
    }

    let userId;
    try {
        const parsedUser = JSON.parse(userParam);
        userId = parsedUser.id;
    } catch {
        return res.status(403).sendFile(path.join(__dirname, '../views/403.html'));
    }

    try {
        const userExists = await checkUserExists(userId);
        if (!userExists) {
            return res.status(403).sendFile(path.join(__dirname, '../views/403.html'));
        }
        next();
    } catch {
        return res.status(500).json({ error: 'Internal server error' });
    }
}

function queryAsync(sql, args) {
    return new Promise((resolve, reject) => {
        db.query(sql, args, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

module.exports = {
    db,
    checkUserExists,
    queryAsync,
    checkUserInDb
};