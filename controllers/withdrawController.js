const path = require('path');
const {db, queryAsync} = require('../utils/db');
const bot = require('../utils/bot');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const TonWeb = require('tonweb');

exports.getWithdraw = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/withdraw.html'));
};

exports.getDeposit = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/deposit.html'));
};

exports.getWithdrawHistory = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/withdraw-history.html'));
};

exports.getData = async (req, res) => {
    const initData = req.cookies.initData;
    if (!initData) {
        console.error('initData is missing in cookies');
        return res.status(400).json({error: 'initData is missing in cookies'});
    }

    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    const address = params.get('address');
    const state_init = params.get('state_init');

    if (!userParam || !address || !state_init) {
        console.error('Required user data is missing');
        return res.status(400).json({error: 'Required user data is missing'});
    }

    try {
        const parsedUser = JSON.parse(userParam);
        const userId = parsedUser.id;

        const query = 'SELECT balance FROM users WHERE user_id = ? AND address = ? AND state_init = ?';
        const results = await queryAsync(query, [userId, address, state_init]);
        const tonForPay = results.length > 0 ? results[0].balance : 0;

        res.json({tonForPay});
    } catch (err) {
        console.error('Invalid user data:', err);
        res.status(400).json({error: 'Invalid user data'});
    }
};

exports.createOrder = async (req, res) => {
    const initData = req.cookies.initData;
    if (!initData) {
        console.error('initData is missing in cookies');
        return res.status(400).json({error: 'initData is missing in cookies'});
    }

    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    const address = params.get('address');
    const state_init = params.get('state_init');

    if (!userParam || !address || !state_init) {
        console.error('Required user data is missing');
        return res.status(400).json({error: 'Required user data is missing'});
    }

    try {
        const parsedUser = JSON.parse(userParam);
        const userId = parsedUser.id;

        const query = 'SELECT balance FROM users WHERE user_id = ? AND address = ? AND state_init = ?';
        const results = await queryAsync(query, [userId, address, state_init]);
        const balance = results.length > 0 ? results[0].balance : 0;

        if (balance <= 0) {
            return res.status(400).json({error: 'No funds available for withdrawal'});
        }

        const insertQuery = 'INSERT INTO orders_games (user_id, address, amount, status) VALUES (?, ?, ?, ?)';
        await queryAsync(insertQuery, [userId, address, balance, 'Pending']);

        const updateQuery = 'UPDATE users SET balance = 0 WHERE user_id = ? AND address = ? AND state_init = ?';
        await queryAsync(updateQuery, [userId, address, state_init]);

        res.json({success: true});
    } catch (err) {
        console.error('Invalid user data:', err);
        res.status(400).json({error: 'Invalid user data'});
    }
};

exports.getWithdrawHistoryOrders = async (req, res) => {
    const initData = req.cookies.initData;

    if (!initData) {
        console.error('initData is missing in cookies');
        return res.status(400).json({error: 'initData is missing in cookies'});
    }

    let params;
    try {
        params = new URLSearchParams(initData);
    } catch (e) {
        console.error('Invalid initData format:', e);
        return res.status(400).json({error: 'Invalid initData format'});
    }

    const userParam = params.get('user');
    if (!userParam) {
        console.error('User data is missing');
        return res.status(400).json({error: 'User data is missing'});
    }

    let parsedUser;
    try {
        parsedUser = JSON.parse(userParam);
    } catch (e) {
        console.error('Invalid user data format:', e);
        return res.status(400).json({error: 'Invalid user data format'});
    }

    const userId = parsedUser.id;
    if (!userId) {
        console.error('User ID is missing');
        return res.status(400).json({error: 'User ID is missing'});
    }

    const query = `
        SELECT
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at,
            amount,
            status
        FROM orders_games
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    try {
        const results = await queryAsync(query, [userId]);
        res.json(results);
    } catch (err) {
        console.error('Internal server error:', err);
        res.status(500).json({error: 'Internal server error'});
    }
};

exports.updateStartPageBalance = async (req, res) => {
    const initData = req.cookies.initData;
    if (!initData) {
        return res.status(400).json({ error: 'initData not found in cookies' });
    }

    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    const address = params.get('address');
    const state_init = params.get('state_init');

    if (!userParam || !address || !state_init) {
        return res.status(400).json({ error: 'Required user data is missing' });
    }

    let parsedUser;
    try {
        parsedUser = JSON.parse(userParam);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid user data format' });
    }

    const userId = parsedUser.id;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is missing' });
    }

    try {
        const tonApiUrl1 = `https://tonapi.io/v2/blockchain/accounts/${address}/transactions?limit=10`;
        const response1 = await fetch(tonApiUrl1, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer AFHSHW3AQY2TKOYAAAAGS3PFP523BAAS6WYWBTHWIVUARTKWTIU75E377MEMB6XIJLPSPWA'
            }
        });

        if (!response1.ok) {
            throw new Error(`Request error: ${response1.status} ${response1.statusText}`);
        }

        const data1 = await response1.json();

        if (!data1.transactions || data1.transactions.length === 0) {
            return res.status(400).json({ error: 'No transactions found' });
        }

        const destinationAddress = "0:2ba165f9a7614674db114a164ec0a672249e9158bc27e0a6403f87d4af544a0c";

        db.beginTransaction(async (err) => {
            if (err) {
                return res.status(500).json({ error: 'Transaction error' });
            }

            try {
                await Promise.all(
                    data1.transactions.map(async (transaction) => {
                        const outMsgs = transaction.out_msgs;

                        if (!outMsgs || outMsgs.length === 0) {
                            return;
                        }

                        for (const outMsg of outMsgs) {
                            const createdLt = outMsg.created_lt;
                            const sourceAddress = outMsg.source?.address;
                            const hash = transaction.in_msg?.hash;
                            const value = outMsg.value;

                            if (value == null) {
                                continue;
                            }

                            if (outMsg.destination?.address !== destinationAddress) {
                                continue;
                            }

                            const rows = await queryAsync(
                                'SELECT * FROM deposit WHERE created_lt = ? AND source_address = ? AND hash = ?',
                                [createdLt, sourceAddress, hash]
                            );

                            if (!Array.isArray(rows)) {
                                throw new Error('Unexpected result format from DB');
                            }

                            if (rows.length === 0) {
                                await queryAsync(
                                    'INSERT INTO deposit (amount, created_lt, source_address, hash) VALUES (?, ?, ?, ?)',
                                    [value, createdLt, sourceAddress, hash]
                                );

                                const plusBalance = value / 1000000000;
                                await queryAsync(
                                    'UPDATE users SET balance = balance + ? WHERE user_id = ? AND address = ? AND state_init = ?',
                                    [plusBalance, userId, address, state_init]
                                );

                                const message = `💎 An amount of ${plusBalance} TON has been credited to your balance.`;
                                await bot.sendMessage(userId, message);
                            }
                        }
                    })
                );

                db.commit((commitErr) => {
                    if (commitErr) {
                        db.rollback(() => {});
                    } else {
                        return res.status(200).json({ message: 'Balance successfully updated' });
                    }
                });
            } catch (error) {
                db.rollback(() => {});
            }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};



