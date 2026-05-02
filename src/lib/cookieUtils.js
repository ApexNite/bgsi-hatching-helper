function hasLocalStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function setCookie(name, value, days = 30) {
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(name, JSON.stringify(value));
      return;
    } catch {}
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const isHttps =
    typeof location !== "undefined" && location.protocol === "https:";
  const secure = isHttps ? ";Secure" : "";

  document.cookie = `${name}=${encodeURIComponent(
    JSON.stringify(value),
  )};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`;
}

export function getCookie(name) {
  if (hasLocalStorage()) {
    const raw = window.localStorage.getItem(name);
    if (raw != null) {
      const parsed = safeJsonParse(raw);
      if (parsed != null) {
        return parsed;
      }

      window.localStorage.removeItem(name);
    }
  }

  const cookies = document.cookie.split(";");
  const targetCookie = cookies.find((cookie) => {
    const trimmedCookie = cookie.trim();
    return trimmedCookie.startsWith(name + "=");
  });

  if (!targetCookie) {
    return null;
  }

  const cookieValue = targetCookie.split("=")[1];
  const parsed = safeJsonParse(decodeURIComponent(cookieValue));
  if (parsed == null) {
    return null;
  }

  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(name, JSON.stringify(parsed));
    } catch {}
  }

  return parsed;
}

export function deleteCookie(name) {
  if (hasLocalStorage()) {
    try {
      window.localStorage.removeItem(name);
    } catch {}
  }
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;SameSite=Lax`;
}
