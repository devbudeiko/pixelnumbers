document.addEventListener("DOMContentLoaded", () => {
    if (window.Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
    }

    const platform = Telegram ? Telegram.WebApp.platform : "webapp";
    if (
        !["ios", "android", "android_x"].includes(platform) &&
        window.location.pathname !== "/403"
    ) {
        window.location.href = "/403";
    }
    
    document.addEventListener('gesturestart', (event) => {
        event.preventDefault();
    });

    document.addEventListener('gesturechange', (event) => {
        event.preventDefault();
    });

    document.addEventListener('gestureend', (event) => {
        event.preventDefault();
    });
});
