document.addEventListener("DOMContentLoaded", async () => {
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = "expires=" + date.toUTCString();
        document.cookie = `${name}=${value};${expires};path=/;Secure;SameSite=Strict;`;
    }
    
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://wanaby.online/tonconnect-manifest.json',
        buttonRootId: 'ton-connect'
    });

    tonConnectUI.onStatusChange(async (walletInfo) => {
        if (walletInfo && walletInfo.account) {
            if (window.Telegram.WebApp.initDataUnsafe.start_param) {
                let startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
                let modifiedStartParam = startParam.substring(4);
            }
            try {
                const address = walletInfo.account.address;
                const state_init = walletInfo.account.walletStateInit;
                const initData = window.Telegram.WebApp.initData;
                const extendedInitData = `${initData}&address=${encodeURIComponent(address)}&state_init=${encodeURIComponent(state_init)}`;
                const referId = window.Telegram.WebApp.initDataUnsafe.start_param ? window.Telegram.WebApp.initDataUnsafe.start_param.substring(6) : '';
                const finalInitData = referId ? `${extendedInitData}&refer_id=${encodeURIComponent(referId)}` : extendedInitData;
                setCookie("initData", finalInitData, 1);

                const response = await fetch('/check-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        cookie: finalInitData
                    }),
                });

                const responseBody = await response.json();

                if (response.status === 200 && responseBody.redirect) {
                    window.location.href = responseBody.redirect;
                } else if (response.status === 200 && responseBody.message) {
                    if (responseBody.message.includes('wallet address')) {
                        document.getElementById('addressProblemModal').style.display = 'block';
                        document.getElementById('addressProblemModal').querySelector('p').innerText = responseBody.message;
                    } else if (responseBody.message.includes('user with this ID')) {
                        document.getElementById('idProblemModal').style.display = 'block';
                        document.getElementById('idProblemModal').querySelector('p').innerText = responseBody.message;
                    }
                } else {
                    console.error('Error: Could not handle response');
                }
            } catch (error) {
                console.error('Error checking user:', error);
            }
        } else {
            console.error('Error: walletInfo or walletInfo.account is missing');
        }

        document.getElementById('js-id-close-button').addEventListener('click', function () {
            document.getElementById('idProblemModal').style.display = 'none';
        });

        document.getElementById('js-wallet-close-button').addEventListener('click', function () {
            document.getElementById('addressProblemModal').style.display = 'none';
        });
    });
});