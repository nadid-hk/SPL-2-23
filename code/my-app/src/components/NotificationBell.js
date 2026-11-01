import { useState, useEffect, useRef, useCallback } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import { API_BASE } from "../config";

/**
 * Self-contained notification bell (same idea as ChatNavButton).
 * - User:  fetches ONLY their own notifications (GET /notifications/me);
 *          the only action is "mark as read" — no delete / clear.
 * - Admin: fetches ALL notifications sent to users (GET /notifications/admin/all),
 *          read-only — no mark-as-read, no delete / clear.
 */
export default function NotificationBell({ user, isAdmin = false }) {
  const [items, setItems] = useState([]);
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const url = isAdmin ? `${API_BASE}/notifications/admin/all` : `${API_BASE}/notifications/me`;
      const res = await fetch(url, { credentials: "include" });
      const result = await res.json();
      if (res.ok && result.success) {
        setItems(isAdmin ? (result.data?.items || []) : (result.data || []));
      }
    } catch { /* retry on next poll */ }
  }, [isAdmin]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user?._id, user?.id, load]); // eslint-disable-line react-hooks/exhaustive-deps

  // close dropdown on outside click
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const markRead = async (id) => {
    setItems(ns => ns.map(n => (n._id === id ? { ...n, isRead: true } : n))); // optimistic
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) load(); // roll back to server truth
    } catch { load(); }
  };

  // Users see how many are unread for them; the admin bell shows no badge.
  const unread = isAdmin ? 0 : items.filter(n => !n.isRead).length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        title="Notifications"
        style={{
          background: "none", border: "none", fontSize: "1.3rem", padding: "6px 8px",
          borderRadius: "8px", cursor: "pointer", position: "relative",
        }}
      >
        <IoMdNotificationsOutline style={{ fontSize: "30px", color: "#e0594a", cursor: "pointer" }} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: "2px", right: "2px", background: "#c62828", color: "white",
            borderRadius: "50%", padding: "2px 6px", fontSize: "0.65rem", fontWeight: "bold",
          }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "40px", background: "var(--white)",
          border: "1px solid var(--gray-mid)", color: "var(--dark)", borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", width: "300px", zIndex: 1000,
          maxHeight: "350px", overflowY: "auto", padding: "0.5rem",
        }}>
          <div style={{
            fontWeight: "bold", padding: "0.5rem", borderBottom: "1px solid var(--gray-mid)", fontSize: "0.9rem",
          }}>
            {isAdmin ? "Sent notifications" : "Notifications"}
          </div>

          {items.length === 0 ? (
            <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8rem", color: "#888" }}>
              No notifications
            </div>
          ) : (
            items.map((n, idx) => (
              <div
                key={n._id}
                onClick={() => !isAdmin && !n.isRead && markRead(n._id)}
                title={!isAdmin && !n.isRead ? "Click to mark as read" : ""}
                style={{
                  padding: "0.75rem 0.5rem",
                  borderBottom: idx !== items.length - 1 ? "1px solid var(--gray-bg)" : "none",
                  fontSize: "0.8rem",
                  cursor: !isAdmin && !n.isRead ? "pointer" : "default",
                  background: !isAdmin && !n.isRead ? "var(--gray-bg)" : "transparent",
                  opacity: !isAdmin && n.isRead ? 0.7 : 1,
                }}
              >
                {isAdmin && (
                  <div style={{ fontSize: "0.7rem", color: "var(--gray-text)", marginBottom: "2px" }}>
                    To: {n.user?.name || "Unknown"} · {n.isRead ? "Read" : "Unread"}
                  </div>
                )}
                <div style={{ fontWeight: 700 }}>{n.title}</div>
                <div style={{ color: "var(--gray-text)", margin: "2px 0" }}>{n.message}</div>
                <span style={{ fontSize: "0.7rem", color: "#b0bec5", display: "block", marginTop: "4px" }}>
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}