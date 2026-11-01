const USER_KEY = "khojUser";
const TOKEN_KEY = "khojToken"; // holds the user id

export function saveSession(user) {
  try {
    if (!user) return clearSession();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user._id) localStorage.setItem(TOKEN_KEY, user._id);
  } catch (e) {
    console.error("Could not save session:", e);
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.log("Error:",e);
  }
}