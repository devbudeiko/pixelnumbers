const path = require('path');
const { db, queryAsync } = require('../utils/db');
const cookieParser = require('cookie-parser');

exports.getReferals = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/referals.html'));
};

exports.getWithdrawHistory = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/referals-history.html'));
};

exports.getTotalReferals = async (req, res) => {
    const initData = req.cookies.initData;
    if (!initData) {
        console.error('initData is missing in cookies');
        return res.status(400).json({ error: 'initData is missing in cookies' });
    }

    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    const address = params.get('address');
    const state_init = params.get('state_init');

    if (!userParam || !address || !state_init) {
        console.error('Required user data is missing');
        return res.status(400).json({ error: 'Required user data is missing' });
    }

    try {
        const parsedUser = JSON.parse(userParam);
        const userId = parsedUser.id;

        const totalInvitationsQuery = `
            SELECT COUNT(*) AS total 
            FROM referals 
            WHERE ref_from_user_id = ?
        `;
        const totalInvitationsResults = await queryAsync(totalInvitationsQuery, [userId]);
        const totalInvitations = totalInvitationsResults[0].total;

        const levelOneGamesQuery = `
            SELECT COUNT(*) AS played
            FROM referals 
            JOIN users ON referals.ref_for_user_id = users.user_id
            WHERE referals.ref_from_user_id = ? AND users.game_count > 0
        `;
        const levelOneGamesResults = await queryAsync(levelOneGamesQuery, [userId]);
        const levelOneGames = levelOneGamesResults[0].played || 0;

        const levelTwoGamesQuery = `
            SELECT COUNT(*) AS played
            FROM referals r1
            JOIN referals r2 ON r1.ref_for_user_id = r2.ref_from_user_id
            JOIN users ON r2.ref_for_user_id = users.user_id
            WHERE r1.ref_from_user_id = ? AND users.game_count > 0
        `;
        const levelTwoGamesResults = await queryAsync(levelTwoGamesQuery, [userId]);
        const levelTwoGames = levelTwoGamesResults[0].played || 0;

        const levelThreeGamesQuery = `
            SELECT COUNT(*) AS played
            FROM referals r1
            JOIN referals r2 ON r1.ref_for_user_id = r2.ref_from_user_id
            JOIN referals r3 ON r2.ref_for_user_id = r3.ref_from_user_id
            JOIN users ON r3.ref_for_user_id = users.user_id
            WHERE r1.ref_from_user_id = ? AND users.game_count > 0
        `;
        const levelThreeGamesResults = await queryAsync(levelThreeGamesQuery, [userId]);
        const levelThreeGames = levelThreeGamesResults[0].played || 0;

        const earnedQuery = `
            SELECT ref_for_pay 
            FROM users 
            WHERE user_id = ? AND address = ? AND state_init = ?
        `;
        const earnedResults = await queryAsync(earnedQuery, [userId, address, state_init]);
        const earned = earnedResults.length > 0 ? earnedResults[0].ref_for_pay : 0;
        
        const data = {
            totalInvitations,
            levelOneGames,
            levelTwoGames,
            levelThreeGames,
            earned,
            userId
        };

        res.json(data);
    } catch (err) {
        console.error('Error fetching referral data:', err);
        res.status(400).json({ error: 'Error fetching referral data' });
    }
};

exports.createReferralOrder = async (req, res) => {
    const initData = req.cookies.initData;

    if (!initData) {
        console.error('initData is missing in cookies');
        return res.status(400).json({ error: 'initData is missing in cookies' });
    }

    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    const address = params.get('address');
    const state_init = params.get('state_init');

    if (!userParam || !address || !state_init) {
        console.error('Required user data is missing');
        return res.status(400).json({ error: 'Required user data is missing' });
    }

    try {
        const parsedUser = JSON.parse(userParam);
        const userId = parsedUser.id;

        const earnedQuery = 'SELECT ref_for_pay FROM users WHERE user_id = ? AND address = ? AND state_init = ?';
        const earnedResults = await queryAsync(earnedQuery, [userId, address, state_init]);
        const earned = earnedResults.length > 0 ? earnedResults[0].ref_for_pay : 0;

        if (earned < 0.01) {
            return res.status(400).json({ error: 'Insufficient funds for withdrawal' });
        }

        const insertQuery = 'INSERT INTO orders_ref (user_id, address, amount, status) VALUES (?, ?, ?, ?)';
        await queryAsync(insertQuery, [userId, address, earned, 'Pending']);

        const updateQuery = 'UPDATE users SET ref_for_pay = 0 WHERE user_id = ? AND address = ? AND state_init = ?';
        await queryAsync(updateQuery, [userId, address, state_init]);

        res.json({ success: true });
    } catch (err) {
        console.error('Invalid user data:', err);
        res.status(400).json({ error: 'Invalid user data' });
    }
};

exports.getReferalsHistoryOrders = async (req, res) => {
    const initData = req.cookies.initData;

    if (!initData) {
        console.error('initData is missing in cookies');
        return res.status(400).json({ error: 'initData is missing in cookies' });
    }

    let params;
    try {
        params = new URLSearchParams(initData);
    } catch (e) {
        console.error('Invalid initData format:', e);
        return res.status(400).json({ error: 'Invalid initData format' });
    }

    const userParam = params.get('user');
    if (!userParam) {
        console.error('User data is missing');
        return res.status(400).json({ error: 'User data is missing' });
    }

    let parsedUser;
    try {
        parsedUser = JSON.parse(userParam);
    } catch (e) {
        console.error('Invalid user data format:', e);
        return res.status(400).json({ error: 'Invalid user data format' });
    }

    const userId = parsedUser.id;
    if (!userId) {
        console.error('User ID is missing');
        return res.status(400).json({ error: 'User ID is missing' });
    }

    const query = `
        SELECT
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at,
            amount,
            status
        FROM orders_ref
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    try {
        const results = await queryAsync(query, [userId]);
        res.json(results);
    } catch (err) {
        console.error('Internal server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};