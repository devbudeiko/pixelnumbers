const cookieParser = require('cookie-parser');
const path = require('path');
const {queryAsync} = require('../utils/db');
const Joi = require('joi');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function shuffleWithBalance(array) {
    let shuffled = [];

    array = shuffleArray(array);

    while (array.length > 0) {
        const current = array.shift();

        if (shuffled.length === 0 || shuffled[shuffled.length - 1] !== current) {
            shuffled.push(current);
        } else {
            array.push(current);
            array = shuffleArray(array);
        }
    }

    return shuffled;
}

function createBalancedChanceGames() {
    let chances = [...Array(5).fill(0), ...Array(5).fill(1)];
    let shuffled = [];

    while (chances.length > 0) {
        const current = chances.splice(Math.floor(Math.random() * chances.length), 1)[0];

        if (shuffled.length >= 2 && shuffled[shuffled.length - 1] === current && shuffled[shuffled.length - 2] === current) {
            chances.push(current);
        } else {
            shuffled.push(current);
        }
    }

    return JSON.stringify(shuffled);
}

exports.checkUser = async (req, res, next) => {
    try {
        const initData = req.cookies.initData;
        if (!initData) {
            return res.status(400).send('initData is missing');
        }

        const params = new URLSearchParams(initData);
        const userParam = params.get('user');
        const address = params.get('address');
        const state_init = params.get('state_init');
        const referId = params.get('refer_id');

        if (!userParam || !address || !state_init) {
            return res.status(400).send('Required fields are missing');
        }

        let parsedUser;
        try {
            parsedUser = JSON.parse(userParam);
        } catch (error) {
            console.error('Error parsing userParam:', error);
            return res.status(400).send('Invalid format for userParam');
        }

        const userIdString = String(parsedUser.id);

        const schema = Joi.object({
            first_name: Joi.string().max(255).required(),
            id: Joi.string().max(255).required(),
            username: Joi.string().max(255).allow(null, ''),
            address: Joi.string().max(255).required(),
            state_init: Joi.string().min(1).required(),
            referId: Joi.string().max(255).allow(null, '')
        });

        const dataToValidate = {
            first_name: parsedUser.first_name,
            id: userIdString,
            username: parsedUser.username || '',
            address: address,
            state_init: state_init,
            referId: referId || ''
        };

        const { error } = schema.validate(dataToValidate);
        if (error) {
            console.error('Validation error:', error.details);
            return res.status(400).send(`Validation error: ${error.details[0].message}`);
        }

        const checkUserQuery = `
            SELECT 
                CASE 
                    WHEN user_id = ? AND address = ? AND state_init = ? THEN 'exact_match'
                    WHEN address = ? AND state_init = ? AND user_id <> ? THEN 'same_address_state'
                    WHEN user_id = ? AND (address <> ? OR state_init <> ?) THEN 'same_user_different_details'
                    ELSE 'no_match' 
                END AS match_type 
            FROM users
            WHERE (user_id = ? OR address = ?)
        `;

        const userCheckResults = await queryAsync(checkUserQuery, [
            userIdString, address, state_init,
            address, state_init, userIdString,
            userIdString, address, state_init,
            userIdString, address
        ]);

        if (userCheckResults.length > 0) {
            const matchType = userCheckResults[0].match_type;

            if (matchType === 'exact_match') {
                return res.status(200).json({ redirect: '/home' });
            } else if (matchType === 'same_address_state') {
                return res.status(200).json({ message: 'The wallet address is already in our system.' +
                        ' ' + 'Please use a different wallet address for this application.' });
            } else if (matchType === 'same_user_different_details') {
                return res.status(200).json({ message: 'The user with this ID is already registered.' +
                        ' ' + 'Please use a different Telegram account.' });
            }
        }

        const insertUserQuery = `
            INSERT INTO users (name, user_id, user_name, address, state_init, win_count, game_count, ton_earned, ref_earned, ref_for_pay, balance, chance_games)
            VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?)
        `;
        const initialChanceGames = createBalancedChanceGames();
        await queryAsync(insertUserQuery, [parsedUser.first_name, userIdString, parsedUser.username || '', address, state_init, initialChanceGames]);

        if (referId && referId !== userIdString) {
            const checkReferalQuery = 'SELECT * FROM referals WHERE ref_from_user_id = ? AND ref_for_user_id = ?';
            const referalResults = await queryAsync(checkReferalQuery, [referId, userIdString]);

            if (referalResults.length === 0) {
                const insertReferalQuery = 'INSERT INTO referals (ref_from_user_id, ref_for_user_id) VALUES (?, ?)';
                await queryAsync(insertReferalQuery, [referId, userIdString]);
            } else {
                console.log('Referral already exists, not adding.');
            }
        }

        return res.status(200).json({ redirect: '/home' });
    } catch (err) {
        console.error('Error processing request:', err);
        return res.status(500).send('Internal server error');
    }
};




