window.addEventListener('DOMContentLoaded', () => {
    let scores = [0, 0];
    let playerTurn = 1;
    let isProcessing = false;
    let gameEnded = false;

    let playerWins = [0, 0];
    let chanceGames = [];

    const randomNicknames = [
        'Sekath', 'Jems', 'BTC 🔸', 'CryptoHalk', 'waleed', 'RESTroy',
        'Md Shan', 'kiiuu', 'roma_sik', 'Марик', 'Captain Walker', 'A D I T',
        'Capp777', 'Егор', 'Who are you?', 'Wardy 🤍', 'Smashed Nat', 'Смирнов В.', '9s9',
        '555', 'gr[7]', 'gage74', 'aeroDrug', 'Катерина', 'Lenochka', 'Mysly Ha', 'Alina', 'Виктор Т.',
        'Pavlus^*^', 'dmd5as', 'creepy', 'Никита', 'Лена', 'Sa Mh', 'ctr_93', 'Alexis', 'Айк Пис', 'MonPon',
        'sevenYork', 'arb_dot', 'Алексей', 'ex = 220', 'cRaYt', 'Miha', 'Kamalyx', '5enso', 'Egro63',
        'Ashed Gy', 'Ludik', 'ZxYzW', 'ZEMTil', 'Alenа🐼', 'Е.М.А.С', 'E 🦴 M', 'Dmitry Drozdov',
        'Усман', 'x', 'RemArsiiik💎', 'Дмитрий Семухин', 'Nikitus', 'August', 'Nurik', 'ArEmAr *',
        'Black Horse', 'Maria Litvina', 'Rebel 95', 'Райан Гослинг🤙', 'v1rus', 'Alex Шевченко', 'spravent',
        'adent biven', 'NewCastle', 'heartunderblade6', 'Гефас', 'Lumpenoid', 'LeHaVo', 'WHOIAMM',
        'MaVeRiK222', 'Родион', 'фонбет бу', 'Leha nu yomayo!', 'Astartes911', 'Барсук', 'Volerga', 'Чикибамбони',
        'Hitoshi Nakamura', 'dominik988', 'Spalax', 'Uncle Nicknack', 'Иван Иваныч', 'Крококряк', 'Джереми',
        'рахим', 'Это вам не хехе', 'Хромая судьба', 'ТяжелыйБарсук', 'infp9w1', 'Ёська', 'Tony91', 'hard spawn player',
        'Ocemenitel_2006', 'Гиперзвуковая саранча', 'Андрюха100', 'Ярик', 'Reizand', 'Уьлюдлк', 'Павелий',
        'Mirilion', 'ScoNNatT', 'Gormless George', 'kusturica', 'Etayyn', '(Shook)', 'koωi', 'Серёбжа',
        'Goward', 'Bruhman', 'Misanthropy¼', 'максъм', 'DeimosSs', 'shinratensei', 'Личный кабинет',
        'Ja', 'V 4D 1M 🐋💨♿', 'КараМЕЛЬ', 'flex_alexey', 'Worldmaker', 'Эрнест', 'Denis_GCV', 'Бармаглот',
        'Ardee', 'Большой бас', 'Ашк', 'Продавец кошмаров', 'хоуми', 'Рома Мицелий', 'Дима', 'im_abramon',
        'KuDiSe', 'Necromom', 'Greenfield', 'UndeadDragon', 'Мушавер', 'Art', 'Pañuelito', 'Егарян', 'Vrum',
        'Paprikanotcrab', 'Руслан.', 'тугосеряпузожитель', 'Проректорат Тану-Тувы', 'Depressed Neko',
        'MrDracula', 'Basilozavr', 'Арсюша', 'Мадао', 'Ruslan_Borisov', 'Lavciel', 'freezecheezecouffteen', 'Halogen',
        'Julia1999', 'Artur27', 'Maga00maga', 'РУslan', 'H.A.R.O.N.', 'Евгений Романов55', 'kusok_bigmaka',
        'skaze.', 'AkelaMiss', 'Danilqqw', 'Берок', 'Чукигек', 'Xaum', 'Slot_55'
    ];
    let playerTwoNickname = randomNicknames[Math.floor(Math.random() * randomNicknames.length)];

    let numberDisplayTimeout = null;
    let playerTwoAutoMoveTimeout = null;

    const playerOne = document.getElementById('player1');
    const playerTwo = document.getElementById('player2');

    function truncateName(name, maxLength = 7) {
        return name.length > maxLength ? name.slice(0, maxLength) + '...' : name;
    }

    const playerOneName = window.Telegram.WebApp.initDataUnsafe.user.first_name;
    const truncatedPlayerOneName = truncateName(playerOneName);

    const truncatedPlayerTwoNickname = truncateName(playerTwoNickname);

    playerOne.querySelector('h2').innerText = truncatedPlayerOneName;
    playerTwo.querySelector('h2').innerText = truncatedPlayerTwoNickname;

    const SECRET_KEY = 'a9fbc13e04f841a7b1a6d8f3c593c71b742ecec1568b2a9d0ad93cf1a03e5234';

    async function initializeChanceGames() {
        try {
            const response = await fetch('/getChanceGames', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch chance games from server');
            }

            const data = await response.json();

            const decryptedData = CryptoJS.AES.decrypt(data.chances, SECRET_KEY).toString(CryptoJS.enc.Utf8);
            chanceGames = JSON.parse(decryptedData);
        } catch (error) {
            console.error('Error initializing chance games:', error);
        }
    }

    async function updateChanceGames() {
        chanceGames.shift();

        try {
            const encryptedChances = CryptoJS.AES.encrypt(JSON.stringify(chanceGames), SECRET_KEY).toString();
            const response = await fetch('/updateChanceGames', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chanceGames: encryptedChances }),
            });

            if (!response.ok) {
                throw new Error('Failed to update chance games on server');
            }

            const data = await response.json();
            const decryptedChances = CryptoJS.AES.decrypt(data.chances, SECRET_KEY).toString(CryptoJS.enc.Utf8);
            const chances = JSON.parse(decryptedChances);
        } catch (error) {
            console.error('Error updating chance games:', error);
        }
    }

    function rollDice() {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("heavy");
        if (isProcessing || gameEnded) {
            return;
        }

        isProcessing = true;
        document.getElementById('numberDisplay').style.pointerEvents = 'none';

        const chance = chanceGames[0];

        let roll1, roll2;

        if (chance === 0) {
            roll1 = Math.floor(Math.random() * 50) + 51;
            roll2 = Math.floor(Math.random() * 50) + 1;
        } else {
            roll1 = Math.floor(Math.random() * 50) + 1;
            roll2 = Math.floor(Math.random() * 50) + 51;
        }

        const result = playerTurn === 1 ? roll1 : roll2;

        anime({
            targets: '#numberDisplay',
            innerHTML: [0, result],
            duration: 500,
            easing: 'easeOutQuad',
            round: 1,
            update: function (anim) {
                document.getElementById('numberDisplay').innerHTML = Math.round(anim.progress / 100 * result);
            }
        });

        scores[playerTurn - 1] = result;

        if (scores[0] > 0 && scores[1] > 0) {
            setTimeout(checkWinner, 1000);
        } else {
            playerTurn = playerTurn === 1 ? 2 : 1;
            clearTimeout(numberDisplayTimeout);
            numberDisplayTimeout = setTimeout(() => {
                updateNumberDisplay();
            }, 3000);
        }

        setTimeout(() => {
            if (!gameEnded) {
                document.getElementById('numberDisplay').style.pointerEvents = 'auto';
                isProcessing = false;
            }
        }, 3000);
    }

    function checkWinner() {
        const chance = chanceGames[0];

        let result;
        if (chance === 0) {
            document.getElementById('winModal').style.display = "flex";
            playerWins[0]++;
            result = 'win';
        } else {
            document.getElementById('loseModal').style.display = "flex";
            playerWins[1]++;
            result = 'lose';
        }

        fetch('/updateGameStats1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({result})
        })
            .then(response => response.json())
            .then(data => console.log('Game stats updated:', data))
            .catch(error => console.error('Error updating game stats:', error));

        updateChanceGames();
        gameEnded = true;
        clearTimeout(playerTwoAutoMoveTimeout);
    }

    function updateNumberDisplay() {
        const numberDisplay = document.getElementById('numberDisplay');
        numberDisplay.style.pointerEvents = gameEnded ? 'none' : 'auto';

        playerOne.classList.remove('active-player');
        playerTwo.classList.remove('active-player');

        if (playerTurn === 1) {
            playerOne.classList.add('active-player');
        } else {
            playerTwo.classList.add('active-player');
            if (!gameEnded) {
                clearTimeout(playerTwoAutoMoveTimeout);
                playerTwoAutoMoveTimeout = setTimeout(() => {
                    if (!isProcessing && !gameEnded && playerTurn === 2) {
                        document.dispatchEvent(playerTwoTurnEvent);
                    }
                }, 0);
            }
        }
    }

    function resetGame() {
        scores = [0, 0];
        playerTurn = 1;
        isProcessing = false;
        gameEnded = false;
        playerTwoNickname = randomNicknames[Math.floor(Math.random() * randomNicknames.length)];
        playerTwo.querySelector('h2').innerText = playerTwoNickname;
        clearTimeout(numberDisplayTimeout);
        clearTimeout(playerTwoAutoMoveTimeout);
        updateNumberDisplay();
    }

    initializeChanceGames();

    const playerTwoTurnEvent = new Event('playerTwoTurn');

    document.addEventListener('playerTwoTurn', () => {
        if (!isProcessing && !gameEnded) {
            rollDice();
        }
    });

    updateNumberDisplay();
    document.getElementById('numberDisplay').onclick = rollDice;
    document.getElementById('js-win-close-button').onclick = () => {
        window.location.href = '../room';
    };
    document.getElementById('js-lose-close-button').onclick = () => {
        window.location.href = '../room';
    };
});
