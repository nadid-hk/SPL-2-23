// import { useState } from "react";

// const LINKS = [
//   { id: "home",          label: "Home" },
//   { id: "login",         label: "Login" },
//   { id: "signup",        label: "SignUp" },
//   { id: "home-register", label: "Home Register" },
//   {id: "profile", label: "Profile"}
// ];

// export default function Navbar({ page, go }) {
//   const [open, setOpen]   = useState(false);
//   const [dark, setDark]   = useState(() => document.body.classList.contains("dark"));
//   const nav = (id) => { go(id); setOpen(false); };

//   const toggleDark = () => {
//     const isDark = document.body.classList.toggle("dark");
//     setDark(isDark);
//   };

//   return (
//     <>
//       <nav className="nav">
//         {/* LOGO */}
//         <div className="nav-brand" onClick={() => nav("home")}>
//           <div className="logo-wrap">
//             <img src="/logo.png" alt="KHOJ logo" />
//           </div>
//           <span className="brand-name">KHOJ</span>
//         </div>

//         {/* Desktop links */}
//         <ul className="nav-links">
//           {LINKS.map(l => (
//             <li key={l.id}>
//               <button
//                 className={page === l.id ? "active" : ""}
//                 onClick={() => nav(l.id)}
//               >
//                 {l.label}
//               </button>
//             </li>
//           ))}
//         </ul>

//         {/* Dark mode toggle + Hamburger */}
//         <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//           <button
//             className="nav-links-btn"
//             onClick={toggleDark}
//             aria-label="Toggle dark mode"
//             title={dark ? "Switch to light mode" : "Switch to dark mode"}
//             style={{
//               background: "none",
//               border: "none",
//               fontSize: "1.3rem",
//               lineHeight: 1,
//               padding: "6px 8px",
//               borderRadius: "8px",
//               cursor: "pointer",
//               transition: "background 0.2s",
//             }}
//           >
//             {dark ? "☀️" : "🌙"}
//           </button>

//           <button
//             className="hamburger"
//             aria-label="Toggle menu"
//             onClick={() => setOpen(o => !o)}
//           >
//             <span /><span /><span />
//           </button>
//         </div>
//       </nav>

//       {/* Mobile dropdown */}
//       <div className={`mobile-nav${open ? " open" : ""}`}>
//         {LINKS.map(l => (
//           <button key={l.id} onClick={() => nav(l.id)}>{l.label}</button>
//         ))}
//       </div>
//     </>
//   );
// }
import { useState } from "react";

export default function Navbar({ page, go, user }) {
  const [open, setOpen]   = useState(false);
  const [dark, setDark]   = useState(() => document.body.classList.contains("dark"));
  const nav = (id) => { go(id); setOpen(false); };

  const toggleDark = () => {
    const isDark = document.body.classList.toggle("dark");
    setDark(isDark);
  };
  

  // Dynamically filter links depending on user session state
  // Dynamically filter links depending on user session state and role
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
          { id: "home",      label: "Home" },
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
      <nav className="nav">
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
                backgroundColor: "#007bff",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                cursor: "pointer",
                border: page === "profile" ? "2px solid #fff" : "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                userSelect: "none"
              }}
            >
              {user.name?.[0]?.toUpperCase() || "U"}
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