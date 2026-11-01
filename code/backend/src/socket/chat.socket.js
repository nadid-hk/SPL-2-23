// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file (new folder: src/socket/). Real-time delivery for chat.
//
// Auth note: this app keeps the JWT in an httpOnly cookie, so the browser
// never holds the raw token and the client CANNOT hand it to us in
// `auth: { token }`. Instead the socket handshake carries the cookie itself
// (the client connects with withCredentials: true), and we verify it here
// the same way verifyJWT does for HTTP requests. A Bearer token is still
// accepted as a fallback for non-browser clients.
//
// Rooms: each socket joins a personal room `user:<id>`. Messages are pushed
// to the participants' personal rooms rather than to a conversation room, so
// a user gets the message on every tab they have open — including tabs
// sitting on a different page — which is what the navbar unread badge needs.
// ─────────────────────────────────────────────────────────────────────────
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Conversation } from "../models/conversation.model.js";
import {
    assertParticipant,
    createMessage,
    markConversationRead
} from "../services/chat.service.js";

const userRoom = (userId) => `user:${userId}`;

// Minimal cookie-header parser — cookie-parser is Express middleware and
// doesn't run for a websocket handshake.
const readCookie = (cookieHeader, name) => {
    if (!cookieHeader) return null;

    const match = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`));

    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

export const initChatSocket = (io) => {
    // Reject unauthenticated sockets at handshake time so no handler below
    // ever has to wonder whether socket.userId is trustworthy.
    io.use(async (socket, next) => {
        try {
            const token =
                readCookie(socket.handshake.headers?.cookie, "accessToken") ||
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace("Bearer ", "");

            if (!token) {
                return next(new Error("Unauthorized request"));
            }

            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken._id).select("-password -refreshToken");

            if (!user) {
                return next(new Error("Invalid Access Token"));
            }

            socket.userId = user._id;
            return next();
        } catch (error) {
            return next(new Error(error?.message || "Invalid access token"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(userRoom(socket.userId));

        // Send a message: persist once (same service the REST route uses),
        // then push to every participant — the sender included, so their own
        // bubble appears from the server's copy and we never render a message
        // that failed to save.
        socket.on("message:send", async ({ conversationId, text }, ack) => {
            try {
                const { message, conversation } = await createMessage({
                    conversationId,
                    senderId: socket.userId,
                    text
                });

                conversation.participants.forEach((participantId) => {
                    io.to(userRoom(participantId)).emit("message:new", {
                        conversationId: String(conversation._id),
                        message
                    });
                });

                if (ack) ack({ ok: true, message });
            } catch (error) {
                if (ack) ack({ ok: false, error: error?.message || "Failed to send message" });
            }
        });

        // The user is looking at this thread right now, so a message that
        // just arrived over the socket counts as read without a page reload.
        socket.on("conversation:read", async ({ conversationId }, ack) => {
            try {
                const conversation = await Conversation.findById(conversationId).select("participants");

                if (!conversation) {
                    throw new Error("Conversation not found");
                }

                assertParticipant(conversation, socket.userId);
                await markConversationRead(conversation._id, socket.userId);

                if (ack) ack({ ok: true });
            } catch (error) {
                if (ack) ack({ ok: false, error: error?.message || "Failed to mark as read" });
            }
        });

        // "typing…" relayed to the other participant only.
        socket.on("typing", async ({ conversationId, isTyping }) => {
            try {
                const conversation = await Conversation.findById(conversationId).select("participants");
                if (!conversation) return;

                assertParticipant(conversation, socket.userId);

                conversation.participants
                    .filter((participantId) => String(participantId) !== String(socket.userId))
                    .forEach((participantId) => {
                        io.to(userRoom(participantId)).emit("typing", { conversationId, isTyping });
                    });
            } catch (error) {
                // A typing ping is best-effort — never worth surfacing.
            }
        });
    });
};
