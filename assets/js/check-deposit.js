document.addEventListener("DOMContentLoaded", async () => {
    const preloader = document.getElementById('preloader');
    const preloaderNumber = document.getElementById('preloaderNumber');

    let dotCount = 0;
    const maxDots = 3;
    const baseText = "Checking transactions";

    const dotInterval = setInterval(() => {
        dotCount = (dotCount + 1) % (maxDots + 1);
        preloaderNumber.textContent = baseText + '.'.repeat(dotCount);
    }, 500);

    try {
        const response = await fetch('/balance/updateStartPageBalance', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });

        if (!response.ok) {
            return;
        }

        const result = await response.json();

    } catch (error) {
        console.error('Failed to copy text: ', error);
    } finally {
        clearInterval(dotInterval);
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
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

    document.querySelector('.js-copy-address').addEventListener('click', () => {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("heavy");
        const address = document.querySelector('.js-address').innerText.trim();
        copyReferralLink(address);
    });
});