const path = require('path');
const db = require('../utils/db');
const bot = require('../utils/bot');
const bcrypt = require('bcrypt');

async function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

exports.showPasswordPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/password.html'));
};

exports.verifyPassword = async (req, res) => {
    const { password } = req.body;
    const correctPassword = process.env.ORDERS_PASSWORD_HASH;

    try {
        const isMatch = await comparePassword(password, correctPassword);
        if (isMatch) {
            res.cookie('authenticated', 'true', { maxAge: 3600000, httpOnly: true });
            res.redirect('/newyork1789/orders');
        } else {
            res.status(403).sendFile(path.join(__dirname, '../views/403.html'));
        }
    } catch (err) {
        console.error('Password error:', err);
        res.status(500).send('Server error');
    }
};

exports.showOrdersPage = (req, res) => {
    if (req.cookies.authenticated === 'true') {
        res.sendFile(path.join(__dirname, '../views/orders.html'));
    } else {
        res.redirect('/newyork1789');
    }
};

exports.getOrdersData = async (req, res) => {
    if (req.cookies.authenticated === 'true') {
        try {
            const ordersGames = await db.queryAsync('SELECT id, user_id, address, amount FROM orders_games WHERE status = "Pending"');
            const ordersRef = await db.queryAsync('SELECT id, user_id, address, amount FROM orders_ref WHERE status = "Pending"');

            res.json({
                ordersGames,
                ordersRef
            });
        } catch (err) {
            console.error('Error database:', err);
            res.status(500).json({ error: 'Error database' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

async function getOrderDetails(orderId, table) {
    let query = '';
    if (table === 'orders_games') {
        query = 'SELECT user_id, amount FROM orders_games WHERE id = ?';
    } else if (table === 'orders_ref') {
        query = 'SELECT user_id, amount FROM orders_ref WHERE id = ?';
    } else {
        throw new Error('Invalid table name');
    }

    const result = await db.queryAsync(query, [orderId]);
    if (result.length === 0) {
        throw new Error('Order not found');
    }
    return result[0];
}

exports.updateOrderStatus = async (req, res) => {
    const { id, table } = req.body;

    let query = '';
    let message = '';

    if (table === 'orders_games') {
        query = 'UPDATE orders_games SET status = "Confirm" WHERE id = ?';
    } else if (table === 'orders_ref') {
        query = 'UPDATE orders_ref SET status = "Confirm" WHERE id = ?';
    } else {
        return res.status(400).json({ error: 'Invalid table name' });
    }

    try {
        await db.queryAsync(query, [id]);

        const orderDetails = await getOrderDetails(id, table);
        const { user_id, amount } = orderDetails;

        if (table === 'orders_games') {
            message = `💎 Payout of ${amount} TON has been successfully processed.`;
        } else if (table === 'orders_ref') {
            message = `💎 Referral payout of ${amount} TON has been successfully processed.`;
        }

        const chatId = user_id;
        await bot.sendMessage(chatId, message);

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error database:', err);
        res.status(500).json({ error: 'Error database' });
    }
};




