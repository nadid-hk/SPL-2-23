import { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { API_USERS as API_BASE } from "../config";

// ─────────────────────────────────────────────
// STUDENT PROFILE
// ─────────────────────────────────────────────
function StudentProfile({ go, user, onUpdateUser, handleLogout }) {
  const [activeTab, setActiveTab] = useState("info");
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name:   user?.name   || "",
    email:  user?.email  || "",
    mobile: user?.phone  || user?.mobile || "",
    dept:   user?.dept   || "",
    batch:  user?.batch  || "",
    bio:    user?.bio    || "",
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.picture || "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const save = async e => {
    e.preventDefault();
    setError(""); setSaving(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("mobile", form.mobile);
    formData.append("dept", form.dept);
    formData.append("batch", form.batch);
    formData.append("bio", form.bio);
    if (selectedFile) {
      formData.append("profilePicture", selectedFile);
    }

    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to update."); return; }
      
      const u = data.data;
      onUpdateUser({ 
        ...user,
        name: u.name, 
        email: u.email || user.email, 
        phone: u.phone, 
        dept: u.dept, 
        batch: u.batch, 
        bio: u.bio,
        picture: u.picture || previewUrl
      });
      alert("Student profile updated successfully!");
    } catch { 
      setError("Could not connect to the server."); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="page">
      <Navbar page="profile" go={go} user={user} onProfileClick={() => {}} />
      <div className="profile-content">
        <button className="back-btn" onClick={() => go("dashboard")}>← Back to Home</button>

        <div className="profile-header">
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar" className="profile-avatar-big" style={{ objectFit: "cover", borderRadius: "50%" }} />
          ) : (
            <div className="profile-avatar-big">{form.name?.[0]?.toUpperCase() || "U"}</div>
          )}
          <div>
            <div className="profile-name">{form.name || "Your Name"}</div>
            <div className="profile-email-sub">{form.email || "No email set"}</div>
            <div className="profile-badge">IUT Student • KHOJ Member</div>
          </div>
        </div>

        {error && <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{error}</span>}

        <ProfileTabs tabs={[{ id: "info", label: "Personal Info" }, { id: "picture", label: "Profile Picture" }]} active={activeTab} onChange={setActiveTab} />

        <form onSubmit={save}>
          {activeTab === "info" && (
            <div className="profile-section">
              <div className="profile-section-title">Personal Information</div>
              <div className="profile-grid">
                <div className="fg"><label>Full Name</label>
                  <input type="text" placeholder="Your full name" value={form.name} onChange={set("name")} /></div>
                <div className="fg"><label>Email Address</label>
                  <input type="email" placeholder="yourname@iut-dhaka.edu" value={form.email} disabled style={{ background: "#f5f5f5", cursor: "not-allowed" }} /></div>
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
              <div className="profile-section-title">Change Profile Image</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", border: "2px dashed #ccc", borderRadius: "10px" }}>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
                <button type="button" className="type-btn sel" onClick={() => fileInputRef.current.click()}>Select New Photo</button>
                {selectedFile && <p style={{ fontSize: "0.85rem", color: "green" }}>Selected: {selectedFile.name}</p>}
              </div>
              <button type="submit" className="btn-submit" disabled={saving} style={{ marginTop: "1.5rem" }}>
                {saving ? "Uploading..." : "Apply New Photo"}
              </button>
            </div>
          )}
        </form>

        {/* MIDDLE BOTTOM LOGOUT BUTTON */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem", paddingBottom: "1.5rem" }}>
          <button 
            type="button"
            onClick={handleLogout} 
            style={{
              backgroundColor: "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 2.5rem",
              fontWeight: "600",
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(220, 53, 69, 0.25)"
            }}
          >
            Logout 
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HOME OWNER PROFILE
// ─────────────────────────────────────────────
function HomeOwnerProfile({ go, user, onUpdateUser, handleLogout }) {
  const [activeTab, setActiveTab] = useState("info");
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.picture || "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const save = async e => {
    e.preventDefault();
    setError(""); setSaving(true);

    const formData = new FormData();
    if (selectedFile) {
      formData.append("profilePicture", selectedFile);
    }

    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to update."); return; }

      const u = data.data;
      onUpdateUser({ 
        ...user, 
        picture: u.picture || previewUrl,
        homeRegister: u.homeRegister
      });
      alert("Home Owner profile modifications committed successfully!");
    } catch { 
      setError("Could not connect to the server."); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="page">
      <Navbar page="profile" go={go} user={user} onProfileClick={() => {}} />
      <div className="profile-content">
        <button className="back-btn" onClick={() => go("dashboard")}>← Back to Home</button>

        <div className="profile-header">
          <img src={previewUrl} alt="Avatar" className="profile-avatar-big" style={{ objectFit: "cover", borderRadius: "50%" }} />
          <div>
            <div className="profile-badge" style={{ background: "#e8eaf6", color: "#3949ab" }}>
              🏠 Home Owner
            </div>
          </div>
        </div>

        {error && <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{error}</span>}

        <ProfileTabs tabs={[{ id: "picture", label: "Profile Picture" }]} active={activeTab} onChange={setActiveTab} color="#3949ab" />

        <form onSubmit={save}>
          {activeTab === "picture" && (
            <div className="profile-section">
              <div className="profile-section-title">Change Profile Image</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", border: "2px dashed #3949ab", borderRadius: "10px" }}>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
                <button type="button" className="type-btn sel" style={{ background: "#3949ab", color: "#fff" }} onClick={() => fileInputRef.current.click()}>Select Image Photo</button>
                {selectedFile && <p style={{ fontSize: "0.85rem", color: "green" }}>Selected: {selectedFile.name}</p>}
              </div>
              <button type="submit" className="btn-submit" disabled={saving} style={{ marginTop: "1.5rem", background: "#3949ab" }}>
                {saving ? "Uploading..." : "Apply New Photo"}
              </button>
            </div>
          )}
        </form>

        {/* MIDDLE BOTTOM LOGOUT BUTTON */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem", paddingBottom: "1.5rem" }}>
          <button 
            type="button"
            onClick={handleLogout} 
            style={{
              backgroundColor: "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 2.5rem",
              fontWeight: "600",
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(220, 53, 69, 0.25)"
            }}
          >
            Logout 
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN PROFILE
// ─────────────────────────────────────────────
function AdminProfile({ go, user, onUpdateUser, handleLogout }) {
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async e => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      
      const res = await fetch(`${API_BASE}/profile`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to update."); return; }
      onUpdateUser({ ...user, name: data.data?.name || form.name });
      alert("Admin profile updated!");
    } catch { 
      setError("Could not connect to the server."); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="page">
      <Navbar page="profile" go={go} user={user} onProfileClick={() => {}} />
      <div className="profile-content">
        <button className="back-btn" onClick={() => go("admin-dashboard")}>← Back to Admin Dashboard</button>

        <div className="profile-header" style={{ background: "linear-gradient(135deg, #1a237e 0%, #4a148c 100%)", borderRadius: 14, padding: "1.5rem", color: "#fff", marginBottom: "1.5rem" }}>
          <div className="profile-avatar-big" style={{ background: "rgba(255,255,255,.2)", color: "#fff", border: "2px solid rgba(255,255,255,.4)" }}>👑</div>
          <div>
            <div className="profile-name" style={{ color: "#fff" }}>{form.name || "Admin"}</div>
            <div className="profile-email-sub" style={{ color: "rgba(255,255,255,.75)" }}>{form.email}</div>
            <div style={{ display: "inline-block", marginTop: ".4rem", background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.4)", borderRadius: 20, padding: ".25rem .85rem", fontSize: ".78rem", fontWeight: 700, color: "#fff" }}>👑 KHOJ Admin</div>
          </div>
        </div>

        {error && <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{error}</span>}

        <form onSubmit={save}>
          <div className="profile-section">
            <div className="profile-section-title">Account Information</div>
            <div className="profile-grid">
              <div className="fg"><label>Full Name</label>
                <input type="text" placeholder="Admin name" value={form.name} onChange={set("name")} /></div>
            </div>
            <button type="submit" className="btn-submit" disabled={saving} style={{ marginTop: "1.5rem", background: "#4a148c" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* MIDDLE BOTTOM LOGOUT BUTTON */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem", paddingBottom: "1.5rem" }}>
          <button 
            type="button"
            onClick={handleLogout} 
            style={{
              backgroundColor: "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 2.5rem",
              fontWeight: "600",
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(220, 53, 69, 0.25)"
            }}
          >
            Logout 
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SHARED COMPONENTS
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

export default function Profile({ go, user, onUpdateUser, onLogout }) {
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    }

    if (onLogout) {
      onLogout();
    } else if (onUpdateUser) {
      onUpdateUser(null);
    }

    // Redirect to home page
    go("home");
  };

  const role = user?.role || "student";
  if (role === "admin") return <AdminProfile go={go} user={user} onUpdateUser={onUpdateUser} handleLogout={handleLogout} />;
  if (role === "owner" || role === "homeowner") return <HomeOwnerProfile go={go} user={user} onUpdateUser={onUpdateUser} handleLogout={handleLogout} />;
  return <StudentProfile go={go} user={user} onUpdateUser={onUpdateUser} handleLogout={handleLogout} />;
}