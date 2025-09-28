export function setCookie(name, value, days = 30) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/`;
}

export function getCookie(name) {
    const cookies = document.cookie.split(';');
    const targetCookie = cookies.find(cookie => {
        const trimmedCookie = cookie.trim();
        return trimmedCookie.startsWith(name + '=');
    });

    if (!targetCookie) {
        return null;
    }

    try {
        const cookieValue = targetCookie.split('=')[1];
        return JSON.parse(decodeURIComponent(cookieValue));
    } catch {
        return null;
    }
}