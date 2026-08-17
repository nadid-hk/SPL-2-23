// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. App-wide "which conversations have unread messages" store.
//
// Why a module-level store instead of component state: this app has no
// router and no global context — Navbar is re-mounted from scratch on every
// page, so the unread badge would reset to zero on each navigation if the
// count lived in the component. Keeping it here means the badge survives
// page switches and updates live from the socket, the same way the
// Messenger/WhatsApp app icon tracks unread *chats* (not unread messages).
//
// Chat.js tells this store which thread is currently open via
// setActiveConversation(), so a message arriving in the thread you're
// already reading never lights up the badge.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { chatApi } from "./chatApi";
import { getSocket } from "./socket";

let unreadIds = new Set();
let activeConversationId = null;
let loadedForUserId = undefined; // undefined = never loaded for anyone yet
let socketBound = false;
// Threads read while the initial list request is still in flight. That
// response is a snapshot from before the read, so applying it verbatim would
// light the badge back up for a thread the user has just opened.
let readWhileLoading = null;
const listeners = new Set();

function notify() {
    listeners.forEach((setCount) => setCount(unreadIds.size));
}

// Populated `sender` comes back as an object; the local optimistic copy is a
// plain id. Normalise both.
function senderId(sender) {
    return String(sender?._id || sender?.id || sender || "");
}

function conversationId(conversation) {
    return conversation._id || conversation.id;
}

function markRead(id) {
    if (!id) return;
    if (readWhileLoading) readWhileLoading.add(id);
    if (unreadIds.delete(id)) notify();
}

function markUnread(id) {
    if (id && !unreadIds.has(id)) {
        unreadIds.add(id);
        notify();
    }
}

function setActiveConversation(id) {
    activeConversationId = id || null;
}

// Bound once for the lifetime of the tab — re-binding on every login would
// stack duplicate handlers on the shared socket.
function bindSocketOnce() {
    if (socketBound) return;
    socketBound = true;

    getSocket().on("message:new", ({ conversationId: id, message }) => {
        // My own message echoed back from the server isn't "unread".
        if (senderId(message.sender) === String(loadedForUserId)) return;
        if (id === activeConversationId) markRead(id);
        else markUnread(id);
    });
}

// Pulls the authoritative unread state from the server once per logged-in
// user, and re-syncs if a different user logs in in the same tab.
function ensureLoaded(userId) {
    if (loadedForUserId === userId) return;
    loadedForUserId = userId;

    if (!userId) {
        unreadIds = new Set();
        notify();
        return;
    }

    bindSocketOnce();

    const readDuringFetch = new Set();
    readWhileLoading = readDuringFetch;

    chatApi
        .conversations()
        .then((conversations) => {
            unreadIds = new Set(
                conversations
                    .filter((c) => (c.unreadCount || 0) > 0)
                    .map((c) => conversationId(c))
                    .filter((id) => !readDuringFetch.has(id))
            );
            notify();
        })
        .catch(() => {
            // A failed badge fetch must never break the page it's mounted on.
        })
        .finally(() => {
            readWhileLoading = null;
        });
}

export const chatNotifications = { markRead, markUnread, setActiveConversation };

// Number of conversations with unread messages, kept live for the caller.
export function useUnreadChatCount(userId) {
    const [count, setCount] = useState(unreadIds.size);

    useEffect(() => {
        ensureLoaded(userId);
        setCount(unreadIds.size);
        listeners.add(setCount);
        return () => listeners.delete(setCount);
    }, [userId]);

    return count;
}
