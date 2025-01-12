window.addEventListener('DOMContentLoaded', () => {
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://wanaby.online/tonconnect-manifest.json',
        buttonRootId: 'ton-connect'
    });

    tonConnectUI.onStatusChange((walletInfo) => {
        if (!walletInfo) {
            window.location.href = 'https://wanaby.online'
        }
    });
});