// One shared Socket.IO connection for the whole app.
//
// The socket object is created once and never replaced, so listeners
// attached by Chat and the navbar badge survive logins and logouts.
// autoConnect is off: the handshake (which sends the httpOnly accessToken
// cookie and decides which user this socket is) only happens when
// connectSocket() is called.
import { io } from "socket.io-client";
import { API_ORIGIN } from "./config";

const socket = io(API_ORIGIN, { withCredentials: true, autoConnect: false });

export const getSocket = () => socket;

// Call on login and whenever the logged-in user changes. The server reads
// the cookie at handshake time, so a reconnect is what picks up the new user.
export const connectSocket = () => {
    socket.disconnect();
    socket.connect();
    return socket;
};

// Call on logout so the next user doesn't inherit a socket still
// authenticated as the previous one.
export const disconnectSocket = () => {
    socket.disconnect();
};