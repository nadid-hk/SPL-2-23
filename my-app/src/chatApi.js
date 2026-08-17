// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. Thin fetch wrapper for the /api/chat endpoints.
//
// Chat is called from four different places (the chat page, the navbar
// badge, the "Message Owner" button, the unread store), so unlike the older
// pages it isn't practical to inline the fetch each time — every caller
// needs the same credentials/error handling and would otherwise drift.
// ─────────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000/api";

// All chat routes are behind verifyJWT, and this app keeps the JWT in an
// httpOnly cookie — so every request must send credentials.
async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}/chat${path}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...options
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok || !result.success) {
        throw new Error(result.message || "Something went wrong. Please try again.");
    }

    return result.data;
}

export const chatApi = {
    // Opens (or reuses) the thread with another user — returns the conversation.
    startConversation: (recipientId, postId) =>
        request("/conversations", {
            method: "POST",
            body: JSON.stringify({ recipientId, postId })
        }),

    // Every thread I'm in, newest first, each with an unreadCount.
    conversations: () => request("/conversations"),

    // Full history of one thread — { conversation, messages }.
    // Calling this also marks the thread as read server-side.
    messages: (conversationId) => request(`/conversations/${conversationId}/messages`),

    // HTTP fallback for sending; the socket is the normal path.
    sendMessage: (conversationId, text) =>
        request(`/conversations/${conversationId}/messages`, {
            method: "POST",
            body: JSON.stringify({ text })
        })
};
