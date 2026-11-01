import { useState } from "react";
import Navbar from "../components/Navbar";
import { GoogleLogin } from '@react-oauth/google';
// import {API_USERS} from "../config";
import { API_USERS as API_BASE } from "../config";
import { IoHomeOutline } from "react-icons/io5";
import { saveSession } from "../auth";
// require("dotenv").config();

const TYPES = [
  { id: "student",   label: "Student"    },
  { id: "owner",     label: "Home Owner" },
  { id: "admin",     label: "Admin"      },
  { id: "temporary", label: "Temporary"  },
];

const IUT_EMAIL = /^[a-zA-Z0-9._%+-]+@iut-dhaka\.edu$/;

function GoogleBtn({ label, onSuccess, onError }) {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
      <GoogleLogin onSuccess={onSuccess} onError={onError} useOneTap text="continue_with" shape="rectangular" width="100%" />
    </div>
  );
}

export default function Login({ go, onLogin: onLoginProp }) {
  // Wrap onLogin so every login path also persists the session,
  // which lets the app restore the user after a page refresh.
  const onLogin = (user) => {
    saveSession(user);
    onLoginProp(user);
  };
  const [type, setType] = useState("student");
  const [form, setForm] = useState({ email: "", mobile: "", password: "", rank: "", khatianNumber: "", adminKey: "" }); 
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      if (type === "student" && !IUT_EMAIL.test(decoded.email)) {
        setErrors({ google: "Only @iut-dhaka.edu Google accounts are allowed for student login." });
        return;
      }

      const res = await fetch(`${API_BASE}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          googleId: decoded.sub,
          picture: decoded.picture || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ google: data.message || "Google login failed on the server." });
        return;
      }

      const u = data.data.user;

      onLogin({
        _id: u._id,
        name: u.name,
        email: u.email,
        mobile: u.phone || "",
        type,
        googleId: u.googleId,
        picture: u.picture || "",
        dept: u.dept || "",
        batch: u.batch || "",
        bio: u.bio || "",
        role: u.role || type
      });
      go("dashboard");
    } catch (error) {
      console.error('Error processing Google login:', error);
      setErrors({ google: "Failed to process Google login" });
    }
  };

  const handleGoogleError = () => {
    setErrors({ google: "Google login failed. Please try again." });
  };

  const submit = async e => {
    e.preventDefault();
    const errs = {};

    if (type === "student") {
      if (!form.email) {
        errs.email = "Email is required.";
      } else if (!IUT_EMAIL.test(form.email)) {
        errs.email = "Only @iut-dhaka.edu email addresses are allowed for student login.";
      }
    }
    if (type === "admin" && !form.adminKey) {
    errs.adminKey = "Admin key is required.";
}
    if (type === "temporary") {
      // if (!form.email) errs.email = "Email is required.";
      if (!form.rank) errs.rank = "Rank is required.";
    }
    if (type === "owner") {
      if (!form.khatianNumber) errs.khatianNumber = "Khatian number is required.";
    }
    if (type !== "admin" && !form.password) {
      errs.password = "Password is required.";
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    // Admin login with .env key verification
   if (type === "admin") {
    setSubmitting(true);

    try {
        const res = await fetch(`${API_BASE}/admin/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                adminKey: form.adminKey
            })
        });

        const data = await res.json();

        if (!res.ok) {
            setErrors({
                adminKey: data.message || "Invalid admin key."
            });
            return;
        }

        onLogin({
            name: "Admin",
            type: "admin",
            role: "admin"
        });

        go("adminDashboard");

    } catch (err) {
        console.error("Admin login error:", err);

        setErrors({
            adminKey: "Could not connect to the server."
        });

    } finally {
        setSubmitting(false);
    }

    return;
}

    setSubmitting(true);
    try {
      let payload;
      if (type === "temporary") {
        payload = { rank: form.rank, password: form.password };
      } else if (type === "owner") {
        payload = { khatianNumber: form.khatianNumber, password: form.password };
      } else {
        payload = { email: form.email, password: form.password };
      }

      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.message || "Login failed. Please check your credentials." });
        setSubmitting(false);
        return;
      }

      const u = data.data.user;
      onLogin({
        _id: u._id,
        name: u.name,
        email: u.email || "",
        mobile: u.phone || "",
        type,
        rank: u.rank || "",
        dept: u.dept || "",
        batch: u.batch || "",
        bio: u.bio || "",
        picture: u.picture || "",
        role: u.role || type,
        housePropertyName: u.homeRegister?.housePropertyName || "",
        houseAddress: u.homeRegister?.houseAddress || "",
      });
      go("dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ form: "Could not connect to the server. Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  const showGoogle = type !== "temporary" &&
                     type !== "owner" &&
                     type !== "admin";

  return (
    <div className="page">
      <Navbar page="login" go={go} />
      <div className="auth-wrap">
        <div className="auth-box">
          <button className="back-btn" onClick={() => go("home")}><IoHomeOutline /> Back to Home</button>
          <h2>Log in to <span>KHOJ</span></h2>
          <p className="subtitle">Select your account type to continue</p>

          <div className="type-selector">
            {TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                className={`type-btn${type === t.id ? " sel" : ""}`}
                onClick={() => {
                  setType(t.id);
                  setErrors({});
                  setForm({ email: "", mobile: "", password: "", rank: "", khatianNumber: "", adminKey: "" });
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {showGoogle && (
            <>
              <GoogleBtn label="Continue with Google" onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
              <div className="auth-divider"><span>or</span></div>
            </>
          )}

          {errors.google && <span className="err-msg" style={{ display: 'block', marginBottom: '10px' }}>{errors.google}</span>}
          {errors.form && <span className="err-msg" style={{ display: 'block', marginBottom: '10px' }}>{errors.form}</span>}

          {type === "temporary" && (
            <p className="auth-note">Temporary accounts have limited access and expire after 6 months.</p>
          )}

          <form onSubmit={submit}>
            {(type === "student") && (
              <div className="fg">
                <label>
                  Email Address
                  {type === "student" && <span style={{ color: "var(--red)", fontSize: "0.75rem", marginLeft: 6 }}>(@iut-dhaka.edu only)</span>}
                </label>
                <input
                  type="email"
                  className={errors.email ? "error" : ""}
                  placeholder={type === "student" ? "yourname@iut-dhaka.edu" : "you@example.com"}
                  value={form.email}
                  onChange={set("email")}
                />
                {errors.email && <span className="err-msg">{errors.email}</span>}
              </div>
            )}
            
            {type === "admin" && (
              <div className="fg">
                <label>Admin Key</label>
                <input
                  type="adminKey"
                  className={errors.adminKey ? "error" : ""}
                  placeholder="Enter admin key"
                  value={form.adminKey}
                  onChange={set("adminKey")}
                />
                {errors.adminKey && <span className="err-msg">{errors.adminKey}</span>}
              </div>
            )}

            {type === "temporary" && (
              <div className="fg">
                <label>Admission / Merit Rank</label>
                <input type="text" className={errors.rank ? "error" : ""} placeholder="e.g. 00142" value={form.rank} onChange={set("rank")} />
                {errors.rank && <span className="err-msg">{errors.rank}</span>}
              </div>
            )}

            {type === "owner" && (
              <div className="fg">
                <label>Khatian Number</label>
                <input
                  type="text"
                  className={errors.khatianNumber ? "error" : ""}
                  placeholder="Enter your Khatian Number"
                  value={form.khatianNumber}
                  onChange={set("khatianNumber")}
                />
                {errors.khatianNumber && <span className="err-msg">{errors.khatianNumber}</span>}
              </div>
            )}

            {type !== "admin" && (
              <div className="fg">
                <label>Password</label>
                <input type="password" className={errors.password ? "error" : ""} placeholder="Enter your password" value={form.password} onChange={set("password")} />
                {errors.password && <span className="err-msg">{errors.password}</span>}
              </div>
            )}

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? "Logging in..." : `Login as ${TYPES.find(t => t.id === type).label}`}
            </button>
          </form>

          <p className="auth-foot">Don't have an account? <button type="button" onClick={() => go("signup")}>Create account</button></p>
          <p className="auth-foot" style={{ marginTop: ".35rem" }}>Own a house? <button type="button" onClick={() => go("home-register")}>Register property</button></p>
        </div>
      </div>
    </div>
  );
}