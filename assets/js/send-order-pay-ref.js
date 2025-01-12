document.addEventListener('DOMContentLoaded', () => {
    const withdrawButton = document.querySelector('.js-send-offer-game-pay');
    const successModal = document.getElementById('success-withdrawal');
    const closeButton = document.getElementById('js-success-close-button');

    withdrawButton.addEventListener('click', async () => {
        try {
            const result = await createWithdrawalOrder();
            if (result.success) {
                successModal.style.display = 'block';
                await updateReferralData();
            } else {
                console.log('Failed to create referral withdrawal order: ' + result.error);
            }
        } catch (error) {
            console.error('Error creating referral withdrawal order:', error);
        }
    });

    closeButton.addEventListener('click', () => {
        successModal.style.display = 'none';
    });
});

async function createWithdrawalOrder() {
    const response = await fetch('/referals/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to create withdrawal order');
    return response.json();
}
