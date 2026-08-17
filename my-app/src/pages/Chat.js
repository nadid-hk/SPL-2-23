// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. The chat page: conversation list on the left, message thread on
// the right. Reached via go("chat") from the navbar, or
// go("chat", conversationId) from the "Message Owner" button on a listing.
//
// The list is the landing state, exactly like Messenger/WhatsApp: arriving
// from the navbar shows *only* the list, and a thread opens when its row is
// clicked. That click is also what marks the thread seen, and the ✕ in the
// thread header closes it again — with nothing open, incoming messages go
// back to counting towards the navbar badge.
// ─────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { chatApi } from "../chatApi";
import { getSocket } from "../socket";
import { chatNotifications } from "../chatNotifications";
import "../Chat.css";

const ONE_HOUR_MS = 60 * 60 * 1000;

function sameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// WhatsApp/Messenger-style divider label: Today / Yesterday / weekday (this
// week) / DD-MM (this year) / DD-MM-YYYY (older).
function formatDateDivider(date) {
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (sameCalendarDay(d, now)) return "Today";
  if (sameCalendarDay(d, yesterday)) return "Yesterday";

  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays > 0 && diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "long" });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
}

// A divider goes above a message when it lands on a different calendar day
// than the one before it AND more than an hour has passed — otherwise two
// messages sent minutes apart across midnight would get a divider between
// them, which reads as a much bigger gap than it was.
function needsDateDivider(prevMessage, message) {
  if (!prevMessage) return true;
  const prev = new Date(prevMessage.createdAt);
  const curr = new Date(message.createdAt);
  return !sameCalendarDay(prev, curr) && curr - prev > ONE_HOUR_MS;
}

function formatBubbleTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

// A populated sender is an object; lastMessage.sender is a bare id.
function senderId(sender) {
  return String(sender?._id || sender?.id || sender || "");
}

function conversationId(conversation) {
  return conversation._id || conversation.id;
}

export default function Chat({ go, user, initialConversationId = null }) {
  const myId = String(user?._id || "");

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  // Threads opened during this visit. The conversation list can arrive
  // *after* one of them was opened — React's dev double-mount fires the load
  // twice and the two requests race — and that response is a snapshot taken
  // before the read. Replaying it verbatim puts the unread bold back on the
  // thread the user is looking at, and nothing clears it again because
  // `activeId` never changed. Anything in here is forced to unreadCount 0
  // whenever a list lands.
  const readIds = useRef(new Set(initialConversationId ? [initialConversationId] : []));

  const otherParty = (c) =>
    c?.participants?.find((p) => String(p._id || p.id) !== myId);

  const propertyName = (c) => c?.post?.registeredHouse?.housePropertyName;

  const applyLocalReads = useCallback(
    (list) =>
      list.map((c) => (readIds.current.has(conversationId(c)) ? { ...c, unreadCount: 0 } : c)),
    []
  );

  // Load the conversation list once on mount. Nothing is opened
  // automatically — arriving from the navbar leaves the user on the list,
  // the way Messenger/WhatsApp do. The one exception is `initialConversationId`,
  // set by "Message Owner", where the user did ask for a specific thread.
  useEffect(() => {
    let cancelled = false;

    chatApi
      .conversations()
      .then((list) => {
        if (!cancelled) setConversations(applyLocalReads(list));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyLocalReads]);

  const loadMessages = useCallback((id) => {
    // No thread open means nothing to show — and, deliberately, no GET, so
    // nothing gets marked seen.
    if (!id) {
      setMessages([]);
      return;
    }

    chatApi
      .messages(id)
      .then((data) => setMessages(data.messages))
      .catch((err) => setError(err.message));
  }, []);

  // Switching threads: pull its history and clear the unread state. The GET
  // above already marks it read on the server, so we only mirror that
  // locally here rather than making a second call.
  useEffect(() => {
    loadMessages(activeId);
    setText("");
    chatNotifications.setActiveConversation(activeId);

    // Closing a thread (activeId back to null) marks nothing: with no thread
    // on screen there is nothing being seen, so new messages keep counting
    // towards the navbar badge.
    if (!activeId) return;

    setConversations((prev) =>
      prev.map((c) => (conversationId(c) === activeId ? { ...c, unreadCount: 0 } : c))
    );
    chatNotifications.markRead(activeId);
  }, [activeId, loadMessages]);

  const openConversation = (id) => {
    readIds.current.add(id);
    setActiveId(id);
  };

  // Back to list-only mode. From here the thread behaves like any other:
  // anything new in it counts as unread again.
  const closeConversation = () => {
    setActiveId(null);
    setError("");
  };

  // Leaving the page means no thread is "being viewed" anymore, so new
  // messages should start counting towards the navbar badge again.
  useEffect(() => () => chatNotifications.setActiveConversation(null), []);

  // Live incoming messages.
  useEffect(() => {
    const socket = getSocket();

    const onNewMessage = ({ conversationId: id, message }) => {
      const isMine = senderId(message.sender) === myId;
      const isActive = id === activeId;

      if (isActive) {
        setMessages((prev) => [...prev, message]);
        // We're looking right at it — tell the server it's read too.
        if (!isMine) socket.emit("conversation:read", { conversationId: id });
      } else if (!isMine) {
        // Landed in a thread that isn't on screen — closed, or a different
        // one is open. It is unread again even if it was read earlier in
        // this visit, so drop it from the local read set.
        readIds.current.delete(id);
      }

      // Bump the thread to the top of the list with a fresh preview.
      setConversations((prev) => {
        const idx = prev.findIndex((c) => conversationId(c) === id);
        if (idx === -1) return prev;

        const updated = {
          ...prev[idx],
          lastMessage: {
            text: message.text,
            sender: senderId(message.sender),
            at: message.createdAt
          },
          unreadCount: isMine || isActive ? 0 : (prev[idx].unreadCount || 0) + 1
        };

        return [updated, ...prev.filter((_, i) => i !== idx)];
      });
    };

    socket.on("message:new", onNewMessage);
    return () => socket.off("message:new", onNewMessage);
  }, [activeId, myId]);

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Grow the write box as the message wraps onto more lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const send = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !activeId) return;

    setText("");

    // The server broadcasts message:new back to us as well (we're a
    // participant), so the bubble is NOT appended here — doing both would
    // show every sent message twice.
    getSocket().emit("message:send", { conversationId: activeId, text: body }, (ack) => {
      if (ack && !ack.ok) setError(ack.error || "Failed to send message.");
    });
  };

  const active = conversations.find((c) => conversationId(c) === activeId);

  return (
    <div className="page">
      <Navbar page="chat" go={go} user={user} />

      <div className="chat-wrap">
        {error && <div className="chat-error">⚠️ {error}</div>}

        {loading ? (
          <div className="chat-empty">
            <div style={{ fontWeight: 700 }}>Loading messages...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="chat-empty">
            <span className="chat-empty-icon">💬</span>
            <p>No conversations yet. Open a listing and message the owner to start one.</p>
            <button
              className="btn-primary"
              style={{ marginTop: "1rem", padding: ".6rem 1.2rem", fontSize: ".85rem" }}
              onClick={() => go("dashboard")}
            >
              Browse listings →
            </button>
          </div>
        ) : (
          <div className={`chat-layout${activeId ? "" : " list-only"}`}>
            {/* ── Conversation list — always on screen ── */}
            <aside className="chat-list">
              {conversations.map((c) => {
                const id = conversationId(c);
                const other = otherParty(c);
                const last = c.lastMessage;
                const lastIsMine = last && senderId(last.sender) === myId;
                const unread = !lastIsMine && (c.unreadCount || 0) > 0;

                return (
                  <button
                    key={id}
                    className={`chat-list-item${id === activeId ? " active" : ""}`}
                    onClick={() => openConversation(id)}
                  >
                    <span className="chat-avatar">
                      {other?.picture ? (
                        <img src={other.picture} alt={other.name || "User"} />
                      ) : (
                        other?.name?.[0]?.toUpperCase() || "?"
                      )}
                    </span>
                    <span className="chat-list-text">
                      <span className="chat-list-name">{other?.name || "Unknown"}</span>
                      <span className={`chat-list-preview${unread ? " unread" : ""}`}>
                        {last?.text ? (
                          lastIsMine ? (
                            <>
                              <span className="chat-list-you">You:</span> {last.text}
                            </>
                          ) : (
                            last.text
                          )
                        ) : (
                          "No messages yet"
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* ── Message thread — only after a row has been clicked ──
                Until then the right-hand side is an inert placeholder: no
                history is fetched for it, so nothing is marked seen. */}
            {!activeId ? (
              <section className="chat-thread chat-thread-placeholder">
                <span className="chat-empty-icon">💬</span>
                <p>Select a conversation to open it.</p>
              </section>
            ) : (
              <section className="chat-thread">
                <div className="chat-thread-header">
                  <span className="chat-thread-title">
                    {active ? `Chat with ${otherParty(active)?.name || "Unknown"}` : "Chat"}
                    {propertyName(active) && (
                      <span className="muted"> · about {propertyName(active)}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="chat-close-btn"
                    onClick={closeConversation}
                    title="Close chat"
                    aria-label="Close chat"
                  >
                    ✕
                  </button>
                </div>

                <div className="chat-messages">
                  {messages.map((m, i) => {
                    const mine = senderId(m.sender) === myId;
                    const showDivider = needsDateDivider(messages[i - 1], m);

                    return (
                      <div key={m._id || m.id}>
                        {showDivider && (
                          <div className="chat-date-divider">
                            <span>{formatDateDivider(m.createdAt)}</span>
                          </div>
                        )}
                        <div className={`chat-message-row${mine ? " mine" : ""}`}>
                          <div className={`chat-bubble${mine ? " mine" : ""}`}>
                            {!mine && <span className="chat-bubble-name">{m.sender?.name}</span>}
                            <span>{m.text}</span>
                            <span className="chat-bubble-time">{formatBubbleTime(m.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>

                {/* Enter inserts a newline (normal textarea behaviour); sending
                    is the button only, so a multi-line message can't be sent
                    half-finished by accident. */}
                <form className="chat-input" onSubmit={send}>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!text.trim()}
                    aria-label="Send message"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
