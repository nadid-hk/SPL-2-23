import { useState } from "react";
import Navbar from "../components/Navbar";

const IUT_EMAIL = /^[a-zA-Z0-9._%+-]+@iut-dhaka\.edu$/;

export default function Signup({ go }) {
  const [method, setMethod] = useState("email");
  const [form, setForm]     = useState({ name: "", rank: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = e => {
    e.preventDefault();
    const errs = {};
    if (form.email && !IUT_EMAIL.test(form.email))
      errs.email = "Only @iut-dhaka.edu email addresses are allowed.";
    if (!form.password) errs.password = "Password is required.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    alert("Student account created! (demo)\nPlease login to continue.");
    go("login");
  };

  return (
    <div className="page">
      <Navbar page="signup" go={go} />
      <div className="auth-wrap">
        <div className="auth-box">
          <button className="back-btn" onClick={() => go("home")}>← Back to Home</button>
          <h2>Join <span>KHOJ</span></h2>
          <p className="subtitle">Create your student account to find housing</p>

          <div className="method-toggle">
            <button className={`method-btn${method === "email" ? " active" : ""}`} onClick={() => setMethod("email")}>
              Register with Email
            </button>
            <button className={`method-btn${method === "rank" ? " active" : ""}`} onClick={() => setMethod("rank")}>
              Register with Rank
            </button>
          </div>

          <form onSubmit={submit}>
            {method === "rank" && (
              <>
                <div className="fg">
                  <label>Admission / Merit Rank</label>
                  <input type="text" placeholder="e.g. 00142" value={form.rank} onChange={set("rank")} required />
                </div>
                <div className="fg">
                  <label>Full Name</label>
                  <input type="text" placeholder="Your full name" value={form.name} onChange={set("name")} required />
                </div>
                <div className="fg">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="+880 1X XX XXX XXXX" value={form.phone} onChange={set("phone")} required />
                </div>
              </>
            )}

            <div className="fg">
              <label>
                Email Address
                <span style={{ color: "var(--red)", fontSize: "0.75rem", marginLeft: 6 }}>
                  (@iut-dhaka.edu required)
                </span>
              </label>
              <input
                type="email"
                className={errors.email ? "error" : ""}
                placeholder="yourname@iut-dhaka.edu"
                value={form.email}
                onChange={set("email")}
                required
              />
              {errors.email && <span className="err-msg">{errors.email}</span>}
            </div>

            <div className="fg">
              <label>Password</label>
              <input
                type="password"
                className={errors.password ? "error" : ""}
                placeholder="Create a strong password"
                value={form.password}
                onChange={set("password")}
                required
              />
              {errors.password && <span className="err-msg">{errors.password}</span>}
            </div>

            <button type="submit" className="btn-submit">Create Student Account</button>
          </form>

          <p className="auth-foot">
            Already have an account? <button onClick={() => go("login")}>Login</button>
          </p>
          <p className="auth-foot" style={{ marginTop: ".35rem" }}>
            Own a house? <button onClick={() => go("home-register")}>Register property</button>
          </p>
        </div>
      </div>
    </div>
  );
}
