import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Profile({ go, user, onUpdateUser }) {
  const [form, setForm] = useState({
    name:   user?.name   || "",
    email:  user?.email  || "",
    mobile: user?.mobile || "",
    dept:   user?.dept   || "",
    batch:  user?.batch  || "",
    bio:    user?.bio    || "",
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleProfileClick = () => {};   // already on profile page

  const save = e => {
    e.preventDefault();
    onUpdateUser(form);
    alert(" Profile updated successfully!");
  };

  return (
    <div className="page">
      <Navbar page="profile" go={go} user={user} onProfileClick={handleProfileClick} />

      <div className="profile-content">
        <button className="back-btn" onClick={() => go("dashboard")}>← Back to Home</button>

        {/* HEADER */}
        <div className="profile-header">
          <div className="profile-avatar-big">
            {form.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="profile-name">{form.name || "Your Name"}</div>
            <div className="profile-email-sub">{form.email || "No email set"}</div>
            <div className="profile-badge">IUT Student • KHOJ Member</div>
          </div>
        </div>

        <form onSubmit={save}>
          {/* PERSONAL INFO */}
          <div className="profile-section">
            <div className="profile-section-title">Personal Information</div>
            <div className="profile-grid">
              <div className="fg">
                <label>Full Name</label>
                <input type="text" placeholder="Your full name" value={form.name} onChange={set("name")} />
              </div>
              <div className="fg">
                <label>Email Address</label>
                <input type="email" placeholder="yourname@iut-dhaka.edu" value={form.email} onChange={set("email")} />
              </div>
              <div className="fg">
                <label>Mobile Number</label>
                <input type="tel" placeholder="+880 1X XX XXX XXXX" value={form.mobile} onChange={set("mobile")} />
              </div>
              <div className="fg">
                <label>Department</label>
                <input type="text" placeholder="e.g. CSE, EEE, ME" value={form.dept} onChange={set("dept")} />
              </div>
              <div className="fg">
                <label>Batch / Year</label>
                <input type="text" placeholder="e.g. 2022" value={form.batch} onChange={set("batch")} />
              </div>
            </div>
            <div className="fg">
              <label>Bio / Short Note</label>
              <textarea
                placeholder="Tell others a bit about yourself..."
                value={form.bio}
                onChange={set("bio")}
              />
            </div>
          </div>

          {/* PROFILE PICTURE — under construction */}
          <div className="profile-section">
            <div className="profile-section-title">Profile Picture</div>
            <div className="uc-box">
              <div className="uc-icon"></div>
              <p>Profile photo upload requires database integration</p>
              <span className="badge">Under Construction</span>
            </div>
          </div>

          {/* SECURITY — under construction */}
          <div className="profile-section">
            <div className="profile-section-title">Security</div>
            <div className="uc-box">
              <div className="uc-icon"></div>
              <p>Password change and two-factor authentication coming soon</p>
              <span className="badge">Under Construction</span>
            </div>
          </div>

          <button type="submit" className="btn-submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}
