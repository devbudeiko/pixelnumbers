document.addEventListener('DOMContentLoaded', () => {
    const withdrawButton = document.querySelector('.js-send-offer-ref-pay');
    const successModal = document.getElementById('success-withdrawal');
    const closeButton = document.getElementById('js-success-close-button');

    withdrawButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/balance/createOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to create withdrawal order');

            const result = await response.json();
            if (result.success) {
                successModal.style.display = 'block';
                updateTonForPay();
            } else {
                console.log('Failed to create withdrawal order: ' + result.error);
            }
        } catch (error) {
            console.error('Error creating withdrawal order:', error);
        }
    });

    closeButton.addEventListener('click', () => {
        successModal.style.display = 'none';
    });
});