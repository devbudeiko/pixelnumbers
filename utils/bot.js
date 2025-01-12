const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

bot.setMyCommands([
    {command: '/start', description: 'Start'}
]);

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{text: 'Play 🎮', url: 'https://t.me/ludkatestsukbot/start'}],
                [{text: 'Channel 📢', url: 'https://t.me/Pixel_Numbers'}]
            ]
        }
    };

    bot.sendMessage(chatId, 'Welcome 👋\n\n' +
        'Pixel Numbers is a game of luck where two players take turns tapping ' +
        'a button with numbers, aiming to score more points than their opponent 🎲\n\n' +
        'Double your winnings on a successful bet 💰\n\n' +
        'Earn from every game played by your referrals 💎\n\n' +
        'A 3-level reward system applies:\n' +
        '1st level – 0.01 TON\n' +
        '2nd level – 0.005 TON\n' +
        '3rd level – 0.001 TON\n\n' +
        'Good luck 🍀', options)
        .catch((error) => {
            console.error('Error message:', error);
        });
});

module.exports = bot;
