import { useState } from "react";

const LINKS = [
  { id: "home",          label: "Home" },
  { id: "login",         label: "Login" },
  { id: "signup",        label: "SignUp" },
  { id: "home-register", label: "Home Register" },
];

export default function Navbar({ page, go }) {
  const [open, setOpen] = useState(false);
  const nav = (id) => { go(id); setOpen(false); };

  return (
    <>
      <nav className="nav">
        {/* LOGO — image + KHOJ text, same style as screenshot */}
        <div className="nav-brand" onClick={() => nav("home")}>
          <div className="logo-wrap">
            <img src="/logo.png" alt="KHOJ logo" />
          </div>
          <span className="brand-name">KHOJ</span>
        </div>

        {/* Desktop links */}
        <ul className="nav-links">
          {LINKS.map(l => (
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

        {/* Hamburger */}
        <button
          className="hamburger"
          aria-label="Toggle menu"
          onClick={() => setOpen(o => !o)}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile dropdown */}
      <div className={`mobile-nav${open ? " open" : ""}`}>
        {LINKS.map(l => (
          <button key={l.id} onClick={() => nav(l.id)}>{l.label}</button>
        ))}
      </div>
    </>
  );
}
