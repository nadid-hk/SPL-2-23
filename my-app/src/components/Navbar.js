import { useState } from "react";

export default function Navbar({ page, go, user, notifications = [], clearNotification }) {
  const [open, setOpen]   = useState(false);
  const [dark, setDark]   = useState(() => document.body.classList.contains("dark"));
  const [showNotif, setShowNotif] = useState(false);

  const nav = (id) => { go(id); setOpen(false); setShowNotif(false); };

  const toggleDark = () => {
    const isDark = document.body.classList.toggle("dark");
    setDark(isDark);
  };

  const isPlatformAdmin =
    user?.role?.toLowerCase() === "admin" ||
    user?.isAdmin === true ||
    user?.userType?.toLowerCase() === "admin";

  const visibleLinks = user
    ? isPlatformAdmin
      ? [
          { id: "home",           label: "Home" },
          { id: "dashboard",      label: "Dashboard" },
          { id: "adminDashboard", label: "Admin Dashboard" }
        ]
      : [
          // { id: "home",      label: "Home" },
          { id: "dashboard", label: "Dashboard" }
        ]
    : [
        { id: "home",          label: "Home" },
        { id: "login",         label: "Login" },
        { id: "signup",        label: "SignUp" },
        { id: "home-register", label: "Home Register" },
      ];

  return (
    <>
      <nav className="nav" style={{ position: "relative" }}>
        {/* LOGO */}
        <div className="nav-brand" onClick={() => nav("home")}>
          <div className="logo-wrap">
            <img src="/logo.png" alt="KHOJ logo" />
          </div>
          <span className="brand-name">KHOJ</span>
        </div>

        {/* Desktop links */}
        <ul className="nav-links">
          {visibleLinks.map(l => (
            <li key={l.id}>
              <button
                className={page === l.id ? "active" : ""}
                onClick={() => nav(l.id)}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Action controls + Dynamic Profile Circle */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          
          {/* NOTIFICATION BELL BUTTON */}
          {user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.3rem",
                  padding: "6px 8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  position: "relative"
                }}
                title="Notifications"
              >
                🔔
                {notifications.length > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    background: "#c62828",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "0.65rem",
                    fontWeight: "bold"
                  }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {showNotif && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "40px",
                  background: "var(--bg, #fff)",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  width: "280px",
                  zIndex: 1000,
                  maxHeight: "350px",
                  overflowY: "auto",
                  padding: "0.5rem"
                }}>
                  <div style={{ fontWeight: "bold", padding: "0.5rem", borderBottom: "1px solid #eee", fontSize: "0.9rem", display: "flex", justifyContent: "space-between" }}>
                    <span>Notifications</span>
                    {notifications.length > 0 && <span style={{ fontSize: "0.75rem", color: "#007bff", cursor: "pointer" }} onClick={() => notifications.forEach((_, i) => clearNotification(i))}>Clear all</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8rem", color: "#888" }}>No new notifications</div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div key={idx} style={{
                        padding: "0.75rem 0.5rem",
                        borderBottom: idx !== notifications.length - 1 ? "1px solid #f5f5f5" : "none",
                        fontSize: "0.8rem",
                        position: "relative"
                      }}>
                        <button 
                          onClick={() => clearNotification(idx)}
                          style={{ position: "absolute", right: "4px", top: "4px", background: "none", border: "none", cursor: "pointer", color: "#aaa" }}
                        >
                          ×
                        </button>
                        <div style={{ fontWeight: "700", color: notif.type === "success" ? "#2e7d32" : "#c62828" }}>
                          {notif.type === "success" ? "✅ Post Approved" : "❌ Post Rejected"}
                        </div>
                        <div style={{ fontWeight: "600", margin: "2px 0" }}>{notif.houseName}</div>
                        <div style={{ color: "var(--gray-text)" }}>{notif.message}</div>
                        <span style={{ fontSize: "0.7rem", color: "#b0bec5", display: "block", marginTop: "4px" }}>{notif.time}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <button
            className="nav-links-btn"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.3rem",
              lineHeight: 1,
              padding: "6px 8px",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {dark ? "☀️" : "🌙"}
          </button>

          {/* DYNAMIC PROFILE AVATAR ICON */}
          {user && (
            <div
              className={`profile-avatar-nav ${page === "profile" ? "active" : ""}`}
              onClick={() => nav("profile")}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: user.picture ? "transparent" : "#007bff",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                cursor: "pointer",
                border: page === "profile" ? "2px solid #fff" : "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                userSelect: "none",
                overflow: "hidden"
              }}
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "Profile"}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                user.name?.[0]?.toUpperCase() || "U"
              )}
            </div>
          )}

          <button
            className="hamburger"
            aria-label="Toggle menu"
            onClick={() => setOpen(o => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div className={`mobile-nav${open ? " open" : ""}`}>
        {visibleLinks.map(l => (
          <button key={l.id} onClick={() => nav(l.id)}>{l.label}</button>
        ))}
        {user && (
          <button onClick={() => nav("profile")} style={{ fontWeight: "bold", borderTop: "1px solid #eee" }}>
            👤 Profile ({user.name})
          </button>
        )}
      </div>
    </>
  );
}