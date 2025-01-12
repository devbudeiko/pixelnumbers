document.addEventListener('DOMContentLoaded', async () => {
    try {
        await updateReferralData();
    } catch (error) {
        console.error('Error fetching referral data:', error.message || error);
    }
});

async function updateReferralData() {
    try {
        const response = await fetch('/referals/getData', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to fetch referral data');

        const data = await response.json();

        if (!data || !data.userId) {
            throw new Error('Invalid server response: missing userId');
        }

        const { totalInvitations, levelOneGames, levelTwoGames, levelThreeGames, earned, userId } = data;

        const tableBody = document.querySelector('.referals tbody');
        if (!tableBody) {
            throw new Error('Table not found on the page');
        }

        tableBody.innerHTML = `
        <tr>
            <td>${levelOneGames}</td>
            <td>${levelTwoGames}</td>
            <td>${levelThreeGames}</td>
            <td id="js-balance">${earned} TON</td>
        </tr>
        `;

        const withdrawButton = document.querySelector('.js-send-offer-game-pay');
        if (!withdrawButton) {
            throw new Error('Withdraw button not found on the page');
        }

        const noWithdrawalMsg = document.querySelector('.js-no-withdrawal-ref-msg');
        if (!noWithdrawalMsg) {
            throw new Error('No withdrawal message element not found');
        }

        if (earned >= 0.01) {
            withdrawButton.classList.remove('disabled');
            withdrawButton.removeAttribute('disabled');
            noWithdrawalMsg.style.display = 'none';
        } else {
            withdrawButton.classList.add('disabled');
            withdrawButton.setAttribute('disabled', 'disabled');
            noWithdrawalMsg.style.display = 'block';
        }

        const referralLink = `https://t.me/ludkatestsukbot/start?startapp=ref_id${userId}`;

        const copyButton = document.querySelector('.copy-button');
        if (!copyButton) {
            throw new Error('Copy button not found on the page');
        }

        copyButton.addEventListener('click', () => {
            window.Telegram.WebApp.HapticFeedback.impactOccurred("heavy");
            copyReferralLink(referralLink);
        });

    } catch (error) {
        console.error('Error updating referral data:', error.message || error);
    }
}

function copyReferralLink(link) {
    navigator.clipboard.writeText(link)
        .then(() => {
            const toast = document.getElementById('toast');
            if (toast) {
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 2000);
            }
        })
        .catch(err => console.error('Failed to copy text: ', err));
}
