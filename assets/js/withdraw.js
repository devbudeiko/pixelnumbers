async function updateTonForPay() {
    try {
        const response = await fetch('/balance/getData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch ton_for_pay data');

        const data = await response.json();
        const tonForPayElement = document.querySelector('.js-ton-for-pay');
        tonForPayElement.textContent = `Your balance: ${data.tonForPay} TON`;
        const withdrawButton = document.querySelector('.js-send-offer-ref-pay');
        const noWithdrawMessage = document.querySelector('.js-no-withdrawal-game-pay-msg');

        if (data.tonForPay > 0) {
            withdrawButton.disabled = false;
            withdrawButton.classList.remove('disabled');
            noWithdrawMessage.style.display = 'none';
        } else {
            withdrawButton.disabled = true;
            withdrawButton.classList.add('disabled');
            noWithdrawMessage.style.display = 'block';
        }

    } catch (error) {
        console.error('Error fetching ton_for_pay data:', error);
    }
}

document.addEventListener('DOMContentLoaded', updateTonForPay);
