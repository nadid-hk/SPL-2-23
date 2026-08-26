// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. One shared Socket.IO connection for the whole app.
//
// It's created lazily and reused: the navbar badge and the chat page both
// listen on it, and opening a second connection per component would mean
// duplicate "message:new" events and a socket left dangling on every page
// change.
//
// Auth: withCredentials sends the httpOnly accessToken cookie along with the
// handshake, which is what the server verifies (see chat.socket.js). The
// browser never sees the raw JWT, so there is no token to pass here.
// ─────────────────────────────────────────────────────────────────────────
import { io } from "socket.io-client";
import { API_ORIGIN } from "./config";

const SOCKET_URL = API_ORIGIN;

let socket = null;

export function getSocket() {
    if (socket) return socket;

    socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"]
    });

    return socket;
}

// Called on logout so the next user doesn't inherit a socket still
// authenticated as the previous one.
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
