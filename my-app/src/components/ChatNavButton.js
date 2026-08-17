// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. The navbar's "Messages" button with its unread-count pill.
//
// It lives in its own component on purpose: the badge needs a hook
// (useUnreadChatCount), and putting that hook directly in Navbar.js would
// mean a bigger edit to a file the whole team touches. Navbar only has to
// render <ChatNavButton /> — everything chat-related stays in here.
// ─────────────────────────────────────────────────────────────────────────
import { useUnreadChatCount } from "../chatNotifications";
import "../Chat.css";

export default function ChatNavButton({ user, active, onClick }) {
  const unreadCount = useUnreadChatCount(user?._id);

  // Nothing to show for logged-out visitors — chat is private.
  if (!user) return null;

  return (
    <button
      className="chat-nav-btn"
      onClick={onClick}
      title="Messages"
      aria-label={unreadCount > 0 ? `Messages (${unreadCount} unread)` : "Messages"}
      style={active ? { background: "var(--red-hover)" } : undefined}
    >
      💬
      {unreadCount > 0 && (
        <span className="chat-nav-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
      )}
    </button>
  );
}
