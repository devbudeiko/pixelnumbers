document.addEventListener("DOMContentLoaded", () => {
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://salessystems.online/ludkatest/tonconnect-manifest.json',
        buttonRootId: 'ton-connect'
    });

    (async function() {
        const startClient = Date.now();
        console.log('Старт загрузки страницы:', new Date(startClient).toISOString());

        // Вызов метода updateStartPageBalance при загрузке страницы
        try {
            const response = await fetch('/balance/updateStartPageBalance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('Время выполнения fetch: ', Date.now() - startClient, 'ms');

            if (!response.ok) {
                console.error('Ошибка при выполнении updateStartPageBalance:', response.statusText);
            } else {
                console.log('Баланс успешно обновлён при загрузке страницы.');
            }
        } catch (error) {
            console.error('Ошибка при попытке выполнить updateStartPageBalance:', error);
        }

        async function sendTransaction(nanoAmount) {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 60,
                messages: [
                    {
                        address: "UQAroWX5p2FGdNsRShZOwKZyJJ6RWLwn4KZAP4fUr1RKDNY8",
                        amount: nanoAmount
                    }
                ]
            };

            try {
                const startTransaction = Date.now();
                const boc = await tonConnectUI.sendTransaction(transaction);
                console.log('Время выполнения sendTransaction: ', Date.now() - startTransaction, 'ms');

                const bocValue = typeof boc === 'string' ? boc : boc.boc;

                if (bocValue) {
                    document.getElementById('success-deposit').style.display = 'block';
                    const conversionAmount = nanoAmount / 1000000000;
                    await fetch('/balance/updateBalance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bocValue, amount: nanoAmount, plusBalance: conversionAmount })
                    });
                } else {
                    console.error('BOC не получен или пуст');
                    throw new Error('BOC не получен');
                }

            } catch (error) {
                console.error('Ошибка при отправке транзакции:', error);
                document.getElementById('error-deposit').style.display = 'block';
            }
        }

        // Обработчики событий и логика управления интерфейсом
        document.getElementById('js-success-close-button').addEventListener('click', function () {
            document.getElementById('success-deposit').style.display = 'none';
        });

        document.getElementById('js-error-close-button').addEventListener('click', function () {
            document.getElementById('error-deposit').style.display = 'none';
        });

        const depositInput = document.querySelector('.js-deposit-value');
        const increaseBtn = document.querySelector('.increase-btn');
        const decreaseBtn = document.querySelector('.decrease-btn');
        const minDeposit = 0.001;
        const step = 0.001;

        const updateButtonsState = () => {
            if (parseFloat(depositInput.value) <= minDeposit) {
                decreaseBtn.disabled = true;
            } else {
                decreaseBtn.disabled = false;
            }
        };

        increaseBtn.addEventListener('click', () => {
            window.Telegram.WebApp.HapticFeedback.impactOccurred("heavy");
            let currentValue = parseFloat(depositInput.value);
            currentValue += step;
            depositInput.value = currentValue.toFixed(1);
            updateButtonsState();
            updateDepositButtonState();
        });

        decreaseBtn.addEventListener('click', () => {
            window.Telegram.WebApp.HapticFeedback.impactOccurred("heavy");
            let currentValue = parseFloat(depositInput.value);
            if (currentValue > minDeposit) {
                currentValue -= step;
                depositInput.value = currentValue.toFixed(1);
            }
            updateButtonsState();
            updateDepositButtonState();
        });

        const updateDepositButtonState = () => {
            const numericValue = parseFloat(depositInput.value);
            const button = document.querySelector('.js-send-transaction-deposit');
            if (numericValue >= minDeposit) {
                button.disabled = false;
                button.classList.remove('disabled');
            } else {
                button.disabled = true;
                button.classList.add('disabled');
            }

            window.nanoAmount = (numericValue * 10 ** 9).toFixed(0);
        };

        updateButtonsState();
        updateDepositButtonState();

        document.querySelector('.js-send-transaction-deposit').addEventListener('click', () => {
            if (window.nanoAmount) {
                sendTransaction(window.nanoAmount);
            }
        });

    })(); // Закрываем асинхронную функцию
});
