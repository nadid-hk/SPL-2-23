import { useState } from "react";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:8000/api/v1/users";

// ─────────────────────────────────────────────
// STUDENT PROFILE
// Fields: name, email, mobile, dept, batch, bio
// Tabs: Personal Info | Profile Picture
// ─────────────────────────────────────────────
function StudentProfile({ go, user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState("info");
  const [form, setForm] = useState({
    name:   user?.name   || "",
    email:  user?.email  || "",
    mobile: user?.phone  || user?.mobile || "",
    dept:   user?.dept   || "",
    batch:  user?.batch  || "",
    bio:    user?.bio    || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async e => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to update."); return; }
      const u = data.data;
      onUpdateUser({ name: u.name, email: u.email || "", mobile: u.phone || "", dept: u.dept || "", batch: u.batch || "", bio: u.bio || "" });
      alert("Profile updated successfully!");
    } catch { setError("Could not connect to the server."); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: "info",    label: "Personal Info"    },
    { id: "picture", label: "Profile Picture"  },
  ];

  return (
    <div className="page">
      <Navbar page="profile" go={go} user={user} onProfileClick={() => {}} />
      <div className="profile-content">
        <button className="back-btn" onClick={() => go("dashboard")}>← Back to Home</button>

        <div className="profile-header">
          <div className="profile-avatar-big">{form.name?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <div className="profile-name">{form.name || "Your Name"}</div>
            <div className="profile-email-sub">{form.email || "No email set"}</div>
            <div className="profile-badge">IUT Student • KHOJ Member</div>
          </div>
        </div>

        {error && <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{error}</span>}

        <ProfileTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        <form onSubmit={save}>
          {activeTab === "info" && (
            <div className="profile-section">
              <div className="profile-section-title">Personal Information</div>
              <div className="profile-grid">
                <div className="fg"><label>Full Name</label>
                  <input type="text" placeholder="Your full name" value={form.name} onChange={set("name")} /></div>
                <div className="fg"><label>Email Address</label>
                  <input type="email" placeholder="yourname@iut-dhaka.edu" value={form.email} onChange={set("email")} /></div>
                <div className="fg"><label>Mobile Number</label>
                  <input type="tel" placeholder="+880 1X XX XXX XXXX" value={form.mobile} onChange={set("mobile")} /></div>
                <div className="fg"><label>Department</label>
                  <input type="text" placeholder="e.g. CSE, EEE, ME" value={form.dept} onChange={set("dept")} /></div>
                <div className="fg"><label>Batch / Year</label>
                  <input type="text" placeholder="e.g. 2022" value={form.batch} onChange={set("batch")} /></div>
              </div>
              <div className="fg"><label>Bio / Short Note</label>
                <textarea placeholder="Tell others a bit about yourself..." value={form.bio} onChange={set("bio")} /></div>
              <button type="submit" className="btn-submit" disabled={saving} style={{ marginTop: "1.5rem" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
          {activeTab === "picture" && (
            <div className="profile-section">
              <div className="profile-section-title">Profile Picture</div>
              <div className="uc-box">
                <div className="uc-icon"></div>
                <p>Profile photo upload requires database integration</p>
                <span className="badge">Under Construction</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HOME OWNER PROFILE
// Fields: name, email, phone only
// Tabs: Account Info | Profile Picture
// NO dept, batch, bio, security
// ─────────────────────────────────────────────
function HomeOwnerProfile({ go, user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState("info");
  const [form, setForm] = useState({
    name:   user?.name             || "",
    email:  user?.email            || "",
    mobile: user?.phone || user?.mobile || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async e => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to update."); return; }
      onUpdateUser({ ...user, name: data.data?.name || form.name, mobile: form.mobile });
      alert("Profile updated successfully!");
    } catch { setError("Could not connect to the server."); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: "info",    label: "Account Info"    },
    { id: "picture", label: "Profile Picture" },
  ];

  return (
    <div className="page">
      <Navbar page="profile" go={go} user={user} onProfileClick={() => {}} />
      <div className="profile-content">
        <button className="back-btn" onClick={() => go("dashboard")}>← Back to Home</button>

        <div className="profile-header">
          <div className="profile-avatar-big" style={{ background: "linear-gradient(135deg, #1a237e 0%, #3949ab 100%)" }}>
            {form.name?.[0]?.toUpperCase() || "O"}
          </div>
          <div>
            <div className="profile-name">{form.name || "Home Owner"}</div>
            <div className="profile-email-sub">{form.email || "No email set"}</div>
            <div className="profile-badge" style={{ background: "#e8eaf6", color: "#3949ab" }}>
              🏠 Home Owner • KHOJ Partner
            </div>
          </div>
        </div>

        {error && <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{error}</span>}

        <ProfileTabs tabs={tabs} active={activeTab} onChange={setActiveTab} color="#3949ab" />

        <form onSubmit={save}>
          {activeTab === "info" && (
            <div className="profile-section">
              <div className="profile-section-title">Account Information</div>
              <div className="profile-grid">
                <div className="fg"><label>Full Name</label>
                  <input type="text" placeholder="Your full name" value={form.name} onChange={set("name")} /></div>
                <div className="fg"><label>Email Address</label>
                  <input type="email" placeholder="your@email.com" value={form.email} onChange={set("email")} /></div>
                <div className="fg"><label>Mobile Number</label>
                  <input type="tel" placeholder="+880 1X XX XXX XXXX" value={form.mobile} onChange={set("mobile")} /></div>
              </div>
              <div style={{
                background: "#e8eaf6", borderRadius: 10,
                padding: ".85rem 1.1rem", fontSize: ".82rem",
                color: "#3949ab", marginTop: ".75rem", lineHeight: 1.6
              }}>
                💡 Your <strong>name</strong> and <strong>phone</strong> are shown automatically on your property listings.
              </div>
              <button type="submit" className="btn-submit" disabled={saving}
                style={{ marginTop: "1.5rem", background: "#3949ab" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
          {activeTab === "picture" && (
            <div className="profile-section">
              <div className="profile-section-title">Profile Picture</div>
              <div className="uc-box">
                <div className="uc-icon"></div>
                <p>Profile photo upload requires database integration</p>
                <span className="badge">Under Construction</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN PROFILE
// Fields: name, email only — no dept/batch/bio/security
// Tabs: Account Info only
// NOTE: Admin management work is done in AdminDashboard.js
// ─────────────────────────────────────────────
function AdminProfile({ go, user, onUpdateUser }) {
  const [form, setForm] = useState({
    name:  user?.name  || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async e => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to update."); return; }
      onUpdateUser({ ...user, name: data.data?.name || form.name });
      alert("Profile updated!");
    } catch { setError("Could not connect to the server."); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <Navbar page="profile" go={go} user={user} onProfileClick={() => {}} />
      <div className="profile-content">
        <button className="back-btn" onClick={() => go("admin-dashboard")}>← Back to Admin Dashboard</button>

        {/* Admin header */}
        <div className="profile-header" style={{
          background: "linear-gradient(135deg, #1a237e 0%, #4a148c 100%)",
          borderRadius: 14, padding: "1.5rem", color: "#fff", marginBottom: "1.5rem"
        }}>
          <div className="profile-avatar-big" style={{ background: "rgba(255,255,255,.2)", color: "#fff", border: "2px solid rgba(255,255,255,.4)" }}>
            👑
          </div>
          <div>
            <div className="profile-name" style={{ color: "#fff" }}>{form.name || "Admin"}</div>
            <div className="profile-email-sub" style={{ color: "rgba(255,255,255,.75)" }}>{form.email}</div>
            <div style={{
              display: "inline-block", marginTop: ".4rem",
              background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.4)",
              borderRadius: 20, padding: ".25rem .85rem",
              fontSize: ".78rem", fontWeight: 700, color: "#fff"
            }}>
              👑 KHOJ Admin
            </div>
          </div>
        </div>

        {error && <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{error}</span>}

        <form onSubmit={save}>
          <div className="profile-section">
            <div className="profile-section-title">Account Information</div>
            <div className="profile-grid">
              <div className="fg"><label>Full Name</label>
                <input type="text" placeholder="Admin name" value={form.name} onChange={set("name")} /></div>
              <div className="fg"><label>Email Address</label>
                <input type="email" placeholder="admin@khoj.com" value={form.email} onChange={set("email")} /></div>
            </div>
            <button type="submit" className="btn-submit" disabled={saving}
              style={{ marginTop: "1.5rem", background: "#4a148c" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Quick link back to admin work */}
        <div style={{
          marginTop: "1.5rem", background: "#f3e5f5",
          borderRadius: 12, padding: "1.1rem 1.25rem",
          fontSize: ".875rem", color: "#6a1b9a", lineHeight: 1.6
        }}>
          👑 <strong>Admin work</strong> — approving posts, confirming registrations and managing listings —
          is all done from the{" "}
          <button
            type="button"
            onClick={() => go("admin-dashboard")}
            style={{
              background: "none", border: "none", color: "#4a148c",
              fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0
            }}
          >
            Admin Dashboard
          </button>.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SHARED: Tab bar
// ─────────────────────────────────────────────
function ProfileTabs({ tabs, active, onChange, color = "#007bff" }) {
  return (
    <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", marginBottom: "1.5rem", overflowX: "auto" }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          style={{
            padding: ".75rem 1.1rem", background: "none", border: "none",
            borderBottom: active === tab.id ? `3px solid ${color}` : "3px solid transparent",
            fontWeight: active === tab.id ? 700 : 500,
            color: active === tab.id ? color : "var(--gray-text)",
            cursor: "pointer", transition: "all 0.2s",
            whiteSpace: "nowrap", fontSize: ".875rem"
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT — route by role
// ─────────────────────────────────────────────
export default function Profile({ go, user, onUpdateUser }) {
  const role = user?.role || "student";
  if (role === "admin")     return <AdminProfile     go={go} user={user} onUpdateUser={onUpdateUser} />;
  if (role === "homeowner") return <HomeOwnerProfile go={go} user={user} onUpdateUser={onUpdateUser} />;
  return                           <StudentProfile   go={go} user={user} onUpdateUser={onUpdateUser} />;
}