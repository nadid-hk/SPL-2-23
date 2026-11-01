import { useState } from "react";
// ─── CHAT FEATURE (Talha) ───
import ChatNavButton from "./ChatNavButton";
// ─── END CHAT FEATURE ───
import { MdOutlineDarkMode } from "react-icons/md";
import { MdOutlineLightMode } from "react-icons/md";
import NotificationBell from "./NotificationBell";
import { FiUser } from "react-icons/fi";

export default function Navbar({ page, go, user }) {
  const [open, setOpen]   = useState(false);
  const [dark, setDark]   = useState(() => document.body.classList.contains("dark"));

  const nav = (id) => { go(id); setOpen(false); };

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
        <span className="brand-name" style={{fontSize:"30px"}}>খোঁজ</span>
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

          {/* ─── CHAT FEATURE (Talha) ───
              Messages button + unread badge. The unread count and its live
              socket updates all live inside ChatNavButton, so nothing else
              in this file needs to know about chat. */}
          <ChatNavButton user={user} active={page === "chat"} onClick={() => nav("chat")} />
          {/* ─── END CHAT FEATURE ─── */}

          {/* NOTIFICATION BELL — self-contained.*/}



          {/* This is for the both admin and user */}
          {/* {user && <NotificationBell user={user} isAdmin={isPlatformAdmin} />} */}
          {user && !isPlatformAdmin && <NotificationBell user={user} />}




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
            {dark ?<MdOutlineLightMode style={{
        fontSize: "30px",
        color: "#e3dad8",
        cursor: "pointer"
    }} />: <MdOutlineDarkMode style={{
        fontSize: "30px",
        color: "var(--red)",
        cursor: "pointer"
    }} />}
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
                backgroundColor: user.picture ? "transparent" : "var(--red)",
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
          <button onClick={() => nav("profile")} style={{ fontWeight: "bold", borderTop: "1px solid var(--gray-mid)", display: "flex", alignItems: "center", gap: "8px" }}>
            <FiUser /> Profile ({user.name})
          </button>
        )}
      </div>
    </>
  );
}