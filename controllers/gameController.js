const path = require('path');
const {db, queryAsync} = require('../utils/db');
const cookieParser = require('cookie-parser');
const CryptoJS = require('crypto-js');

const getUserBalance = async (userId, address, state_init) => {
    const query = `SELECT balance
                   FROM users
                   WHERE user_id = ?
                     AND address = ?
                     AND state_init = ?`;
    const result = await queryAsync(query, [userId, address, state_init]);
    return result.length > 0 ? result[0].balance : 0;
};

const handleGameRequest = async (req, res, gameFile, minBalance) => {
    try {
        const initData = req.cookies.initData;
        if (!initData) {
            return res.status(403).sendFile(path.join(__dirname, '../views/auth-problem.html'));
        }

        const params = new URLSearchParams(initData);
        const userParam = params.get('user');
        const address = params.get('address');
        const state_init = params.get('state_init');

        if (!userParam || !address || !state_init) {
            console.error('Missing required user data in cookies');
            return res.status(403).sendFile(path.join(__dirname, '../views/auth-problem.html'));
        }

        const parsedUser = JSON.parse(userParam);
        const balance = await getUserBalance(parsedUser.id, address, state_init);

        if (balance >= minBalance) {
            res.sendFile(path.join(__dirname, `../views/${gameFile}`));
        } else {
            res.status(403).sendFile(path.join(__dirname, '../views/balance-problem.html'));
        }
    } catch (error) {
        console.error('Error processing game request:', error);
        res.status(403).sendFile(path.join(__dirname, '../views/balance-problem.html'));
    }
};

exports.getGame01 = [(req, res) => handleGameRequest(req, res, 'game-01.html', 0.12)];
exports.getGame03 = [(req, res) => handleGameRequest(req, res, 'game-03.html', 0.32)];
exports.getGame05 = [(req, res) => handleGameRequest(req, res, 'game-05.html', 0.52)];
exports.getGame08 = [(req, res) => handleGameRequest(req, res, 'game-08.html', 0.82)];
exports.getGame1 = [(req, res) => handleGameRequest(req, res, 'game-1.html', 1.02)];

const updateGameStats = async (req, res, tonEarned) => {
    const getUserDetails = async (userId) => {
        const query = `
            SELECT address, state_init
            FROM users
            WHERE user_id = ?
        `;
        const result = await queryAsync(query, [userId]);
        if (result.length === 0) {
            throw new Error(`User with ID ${userId} not found`);
        }
        return {
            address: result[0].address,
            state_init: result[0].state_init
        };
    };

    try {
        const initData = req.cookies.initData;

        if (!initData) {
            console.error('initData is missing in cookies');
            return res.status(400).send('initData is missing');
        }

        const params = new URLSearchParams(initData);
        const userParam = params.get('user');
        const address = params.get('address');
        const state_init = params.get('state_init');

        if (!userParam || !address || !state_init) {
            console.error('Missing required fields:', {
                userParam: !!userParam,
                address: !!address,
                state_init: !!state_init
            });
            return res.status(400).send('Missing required fields');
        }

        const parsedUser = JSON.parse(userParam);

        const {result} = req.body;

        if (!result) {
            return res.status(400).send('Missing result field');
        }

        let query;
        let values;

        if (result === 'win') {
            const adjustedWinAmount = tonEarned - 0.02;
            query = `
                UPDATE users
                SET game_count  = game_count + 1,
                    win_count   = win_count + 1,
                    ton_earned  = ton_earned + ?,
                    balance     = balance + ?
                WHERE user_id = ?
                  AND address = ?
                  AND state_init = ?
            `;
            values = [tonEarned, adjustedWinAmount, parsedUser.id, address, state_init];
        } else {
            const penalty = tonEarned + 0.02;
            query = `

                UPDATE users
                SET game_count = game_count + 1,
                    balance    = balance - ?
                WHERE user_id = ?
                  AND address = ?
                  AND state_init = ?
            `;
            values = [penalty, parsedUser.id, address, state_init];
        }

        await queryAsync(query, values);

        const checkReferralsQuery = `
            SELECT ref_from_user_id
            FROM referals
            WHERE ref_for_user_id = ?
        `;
        const referrals = await queryAsync(checkReferralsQuery, [parsedUser.id]);

        if (referrals.length > 0) {
            const refFromUserId = referrals[0].ref_from_user_id;

            const referrerDetails = await getUserDetails(refFromUserId);

            const firstLevelBonus = 0.01;
            await queryAsync(`
                UPDATE users 
                SET ref_earned = ref_earned + ?, ref_for_pay = ref_for_pay + ? 
                WHERE user_id = ?
                  AND address = ?
                  AND state_init = ?
            `, [firstLevelBonus, firstLevelBonus, refFromUserId, referrerDetails.address, referrerDetails.state_init]);

            const secondLevelReferQuery = 'SELECT ref_from_user_id FROM referals WHERE ref_for_user_id = ?';
            const secondLevelResult = await queryAsync(secondLevelReferQuery, [refFromUserId]);

            if (secondLevelResult.length > 0) {
                const secondLevelReferId = secondLevelResult[0].ref_from_user_id;

                const secondLevelDetails = await getUserDetails(secondLevelReferId);

                const secondLevelBonus = 0.005;
                await queryAsync(`
                    UPDATE users 
                    SET ref_earned = ref_earned + ?, ref_for_pay = ref_for_pay + ? 
                    WHERE user_id = ?
                      AND address = ?
                      AND state_init = ?
                `, [secondLevelBonus, secondLevelBonus, secondLevelReferId, secondLevelDetails.address, secondLevelDetails.state_init]);

                const thirdLevelReferQuery = 'SELECT ref_from_user_id FROM referals WHERE ref_for_user_id = ?';
                const thirdLevelResult = await queryAsync(thirdLevelReferQuery, [secondLevelReferId]);

                if (thirdLevelResult.length > 0) {
                    const thirdLevelReferId = thirdLevelResult[0].ref_from_user_id;

                    const thirdLevelDetails = await getUserDetails(thirdLevelReferId);

                    const thirdLevelBonus = 0.001;
                    await queryAsync(`
                        UPDATE users 
                        SET ref_earned = ref_earned + ?, ref_for_pay = ref_for_pay + ? 
                        WHERE user_id = ?
                          AND address = ?
                          AND state_init = ?
                    `, [thirdLevelBonus, thirdLevelBonus, thirdLevelReferId, thirdLevelDetails.address, thirdLevelDetails.state_init]);
                }
            }
        } else {
            console.log('No referrals found for user');
        }

        res.status(200).json({
            success: true,
            message: 'Game stats, balance, and referral bonuses updated successfully'
        });

    } catch (err) {
        console.error('Error processing request:', err);
        res.status(400).send('Invalid request');
    }
};

exports.updateGameStats01 = [(req, res) => updateGameStats(req, res, 0.1)];
exports.updateGameStats03 = [(req, res) => updateGameStats(req, res, 0.3)];
exports.updateGameStats05 = [(req, res) => updateGameStats(req, res, 0.5)];
exports.updateGameStats08 = [(req, res) => updateGameStats(req, res, 0.8)];
exports.updateGameStats1 = [(req, res) => updateGameStats(req, res, 1.0)];

const SECRET_KEY = process.env.SECRET_KEY;

exports.getChanceGames = async (req, res) => {
    try {
        const initData = req.cookies.initData;
        if (!initData) {
            console.error('initData is missing in cookies');
            return res.status(400).send('initData is missing');
        }

        const params = new URLSearchParams(initData);
        const userParam = params.get('user');
        const address = params.get('address');
        const state_init = params.get('state_init');

        if (!userParam || !address || !state_init) {
            console.error('Missing required user data in cookies');
            return res.status(400).send('Missing required user data');
        }

        const parsedUser = JSON.parse(userParam);
        const userId = parsedUser.id;

        const chanceQuery = `
            SELECT chance_games 
            FROM users 
            WHERE user_id = ? 
              AND address = ? 
              AND state_init = ?
        `;
        const userData = await queryAsync(chanceQuery, [userId, address, state_init]);

        if (userData.length === 0) {
            return res.status(404).json({error: 'User not found'});
        }

        const chances = JSON.parse(userData[0].chance_games);

        const encryptedChances = CryptoJS.AES.encrypt(JSON.stringify(chances), SECRET_KEY).toString();

        return res.status(200).json({chances: encryptedChances});
    } catch (error) {
        console.error('Error fetching chance games:', error);
        return res.status(500).json({error: 'Failed to fetch chance games'});
    }
};

function shuffleArrayWithoutLongRepeats(array) {
    function hasLongRepeats(arr, maxRepeats = 2) {
        let count = 1;
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] === arr[i - 1]) {
                count++;
                if (count > maxRepeats) return true;
            } else {
                count = 1;
            }
        }
        return false;
    }

    let shuffledArray;
    do {
        shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
    } while (hasLongRepeats(shuffledArray));

    return shuffledArray;
}

exports.updateChanceGames = async (req, res) => {
    try {
        const initData = req.cookies.initData;
        if (!initData) {
            console.error('initData is missing in cookies');
            return res.status(400).send('initData is missing');
        }

        const params = new URLSearchParams(initData);
        const userParam = params.get('user');
        const address = params.get('address');
        const state_init = params.get('state_init');

        if (!userParam || !address || !state_init) {
            console.error('Missing required user data in cookies');
            return res.status(400).send('Missing required user data');
        }

        const parsedUser = JSON.parse(userParam);
        const userId = parsedUser.id;

        const chanceQuery = `
            SELECT chance_games 
            FROM users 
            WHERE user_id = ? 
              AND address = ? 
              AND state_init = ?
        `;
        const userData = await queryAsync(chanceQuery, [userId, address, state_init]);

        if (userData.length === 0) {
            return res.status(404).json({error: 'User not found'});
        }

        let chances = JSON.parse(userData[0].chance_games);

        chances.shift();

        if (chances.length === 0) {
            const startWith = Math.random() < 0.5 ? 0 : 1;
            chances = startWith === 0
                ? [...Array(5).fill(0), ...Array(5).fill(1)]
                : [...Array(5).fill(1), ...Array(5).fill(0)];

            chances = shuffleArrayWithoutLongRepeats(chances);
        }

        const updateQuery = `
            UPDATE users
            SET chance_games = ?
            WHERE user_id = ? 
              AND address = ? 
              AND state_init = ?
        `;
        await queryAsync(updateQuery, [JSON.stringify(chances), userId, address, state_init]);
        
        const encryptedChances = CryptoJS.AES.encrypt(JSON.stringify(chances), SECRET_KEY).toString();

        return res.status(200).json({success: true, chances: encryptedChances});
    } catch (error) {
        console.error('Error updating chance games:', error);
        return res.status(500).json({error: 'Failed to update chance games'});
    }
};


