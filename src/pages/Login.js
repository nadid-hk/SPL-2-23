import { useState } from "react";
import Navbar from "../components/Navbar";

const TYPES = [
  { id: "student", label: "Student"    },
  { id: "owner",   label: "Home Owner" },
  { id: "admin",   label: "Admin"      },
];

// Only @iut-dhaka.edu addresses are accepted for students
const IUT_EMAIL = /^[a-zA-Z0-9._%+-]+@iut-dhaka\.edu$/;

export default function Login({ go, onLogin }) {
  const [type, setType] = useState("student");
  const [form, setForm] = useState({ email: "", mobile: "", password: "" });
  const [errors, setErrors] = useState({});
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = e => {
    e.preventDefault();
    const errs = {};

    if (type === "student") {
      if (!IUT_EMAIL.test(form.email))
        errs.email = "⚠️ Only @iut-dhaka.edu email addresses are allowed for student login.";
    }
    if (type === "admin") {
      if (!form.email.includes("@")) errs.email = "Please enter a valid email.";
    }
    if (!form.password) errs.password = "Password is required.";

    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    // Build a minimal user object and pass it up to App
    const name = form.email
      ? form.email.split("@")[0]
      : form.mobile;

    onLogin({ name, email: form.email, mobile: form.mobile, type });
    go("dashboard");
  };

  return (
    <div className="page">
      <Navbar page="login" go={go} />
      <div className="auth-wrap">
        <div className="auth-box">
          <button className="back-btn" onClick={() => go("home")}>← Back to Home</button>
          <h2>Welcome back to <span>KHOJ</span></h2>
          <p className="subtitle">Select your account type to continue</p>

          {/* TYPE SELECTOR */}
          <div className="type-selector">
            {TYPES.map(t => (
              <button
                key={t.id}
                className={`type-btn${type === t.id ? " sel" : ""}`}
                onClick={() => setType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {/* Student / Admin → email */}
            {(type === "student" || type === "admin") && (
              <div className="fg">
                <label>
                  Email Address
                  {type === "student" && (
                    <span style={{ color: "var(--red)", fontSize: "0.75rem", marginLeft: 6 }}>
                      (@iut-dhaka.edu only)
                    </span>
                  )}
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

            {/* Home Owner → mobile */}
            {type === "owner" && (
              <div className="fg">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+880 1X XX XXX XXXX"
                  value={form.mobile}
                  onChange={set("mobile")}
                  required
                />
              </div>
            )}

            <div className="fg">
              <label>Password</label>
              <input
                type="password"
                className={errors.password ? "error" : ""}
                placeholder="Enter your password"
                value={form.password}
                onChange={set("password")}
              />
              {errors.password && <span className="err-msg">{errors.password}</span>}
            </div>

            <button type="submit" className="btn-submit">
              Login as {TYPES.find(t => t.id === type).label}
            </button>
          </form>

          <p className="auth-foot">
            Don't have an account?{" "}
            <button onClick={() => go("signup")}>Create account</button>
          </p>
          <p className="auth-foot" style={{ marginTop: ".35rem" }}>
            Own a house?{" "}
            <button onClick={() => go("home-register")}>Register property</button>
          </p>
        </div>
      </div>
    </div>
  );
}
