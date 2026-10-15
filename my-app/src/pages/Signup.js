import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import Navbar from "../components/Navbar";
import { API_USERS as API_BASE } from "../config";
import { IoHomeOutline } from "react-icons/io5";

const IUT_EMAIL = /^[a-zA-Z0-9._%+-]+@iut-dhaka\.edu$/;
const ANY_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BD_PHONE = /^01\d{9}$/;

// Set to true once you have a real OTP backend. While false, the rank form
// skips OTP entirely (it used to block submission forever because the
// "Send OTP" button was commented out).
const OTP_ENABLED = false;

/* ───────────── shared helpers ───────────── */

function GoogleBtn({ onSuccess, onError }) {
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", margin: "0.5rem 0" }}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap
        text="continue_with"
        shape="rectangular"
        width="100%"
      />
    </div>
  );
}

// One place that talks to the backend. Returns { ok, message, user }.
async function registerUser(payload) {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, message: data.message || "Registration failed. Please try again." };
    }
    console.log("Register response:", data); // check the shape of your API response here

    // Take the user from wherever the API puts it...
    const fromApi = data.user || data.data?.user || data.data || {};
    // ...and fall back to what the person just typed, so the dashboard
    // always has a name even if the API only returns { success, message }.
    const { password, otp, method, ...typed } = payload;
    const user = { ...typed, ...(typeof fromApi === "object" ? fromApi : {}) };
    return { ok: true, user };
  } catch (err) {
    console.error("Signup error:", err);
    return { ok: false, message: "Could not connect to the server. Please try again later." };
  }
}

// Endpoint that returns the currently logged-in user (cookie session).
// Set this to your real one, e.g. `${API_BASE}/me`. While it is null the
// loading screen just waits MIN_WAIT_MS and uses the data from /register.
const ME_URL = null;
const MIN_WAIT_MS = 1200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Shows the loading screen long enough for the backend to finish, and (if
// ME_URL is set) keeps asking the server for the saved user, retrying a few
// times, so the dashboard opens with complete data.
async function waitForUser(baseUser) {
  const started = Date.now();
  let user = baseUser;

  if (ME_URL) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await fetch(ME_URL, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const u = data.user || data.data?.user || data.data || data;
          if (u && (u._id || u.id)) {
            user = { ...baseUser, ...u };
            break;
          }
        }
      } catch (err) {
        console.warn("Waiting for account to be ready...", err);
      }
      await sleep(700);
    }
  }

  const left = MIN_WAIT_MS - (Date.now() - started);
  if (left > 0) await sleep(left);
  return user;
}

function SettingUp() {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
      <style>{`@keyframes khoj-spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 42, height: 42, margin: "0 auto 1rem",
          border: "4px solid var(--gray-bg, #e5e5e5)",
          borderTopColor: "var(--green, #2e7d32)",
          borderRadius: "50%",
          animation: "khoj-spin 0.8s linear infinite",
        }}
      />
      <div style={{ fontWeight: 700 }}>Creating your account...</div>
      <p style={{ opacity: 0.7, marginTop: ".4rem", fontSize: ".85rem" }}>
        Please wait, we're getting everything ready.
      </p>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="fg">
      <label>{label}</label>
      {children}
      {error && <span className="err-msg">{error}</span>}
    </div>
  );
}

/* ───────────── Register with Email ───────────── */

function EmailSignup({ onDone }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.email) errs.email = "Email is required.";
    else if (!IUT_EMAIL.test(form.email)) errs.email = "Only @iut-dhaka.edu email addresses are allowed.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";

    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setSubmitting(true);

    const result = await registerUser({
      method: "email",
      name: form.name.trim(),
      email: form.email,
      password: form.password,
    });

    setSubmitting(false);
    if (!result.ok) return setErrors({ form: result.message });
    onDone(result.user);
  };

  return (
    <form onSubmit={submit} autoComplete="on">
      {errors.form && (
        <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{errors.form}</span>
      )}

      <Field label="Full Name" error={errors.name}>
        <input
          type="text"
          name="email-signup-name"
          autoComplete="name"
          className={errors.name ? "error" : ""}
          placeholder="Your full name"
          value={form.name}
          onChange={set("name")}
        />
      </Field>

      <Field
        label={
          <>
            Email Address
            <span style={{ color: "var(--red)", fontSize: "0.75rem", marginLeft: 6 }}>
              (@iut-dhaka.edu only)
            </span>
          </>
        }
        error={errors.email}
      >
        <input
          type="email"
          name="email-signup-email"
          autoComplete="email"
          className={errors.email ? "error" : ""}
          placeholder="yourname@iut-dhaka.edu"
          value={form.email}
          onChange={set("email")}
        />
      </Field>

      <Field label="Password" error={errors.password}>
        <input
          type="password"
          name="email-signup-password"
          autoComplete="new-password"
          className={errors.password ? "error" : ""}
          placeholder="Create a strong password"
          value={form.password}
          onChange={set("password")}
        />
      </Field>

      <button type="submit" className="btn-submit" disabled={submitting}>
        {submitting ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}

/* ───────────── Register with Rank ───────────── */

function RankSignup({ onDone }) {
  const [form, setForm] = useState({ rank: "", name: "", phone: "", otp: "", email: "", password: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSendOTP = () => {
    if (!BD_PHONE.test(form.phone)) {
      return setErrors((p) => ({ ...p, phone: "Enter a valid 11-digit phone number (01XXXXXXXXX)." }));
    }
    // TODO: real OTP API call
    alert(`OTP sent to ${form.phone}`);
    setErrors((p) => ({ ...p, phone: undefined }));
    setOtpSent(true);
    setOtpVerified(false);
  };

  const handleVerifyOTP = () => {
    if (form.otp.length !== 6) {
      return setErrors((p) => ({ ...p, otp: "Please enter the 6-digit OTP." }));
    }
    // TODO: real OTP verification call
    setOtpVerified(true);
    setErrors((p) => ({ ...p, otp: undefined }));
  };

  const changePhone = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setForm((f) => ({ ...f, otp: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.rank.trim()) errs.rank = "Rank is required.";
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.phone) errs.phone = "Phone number is required.";
    else if (!BD_PHONE.test(form.phone)) errs.phone = "Enter a valid 11-digit phone number (01XXXXXXXXX).";
    if (OTP_ENABLED && !otpVerified) errs.otp = "Please verify your phone number via OTP first.";
    // Email is optional here and can be any provider (not only IUT)
    if (form.email && !ANY_EMAIL.test(form.email)) errs.email = "Please enter a valid email address.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";

    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setSubmitting(true);

    const result = await registerUser({
      method: "rank",
      rank: form.rank.trim(),
      name: form.name.trim(),
      phone: form.phone,
      email: form.email || undefined,
      password: form.password,
      ...(OTP_ENABLED ? { otp: form.otp } : {}),
    });

    setSubmitting(false);
    if (!result.ok) return setErrors({ form: result.message });
    onDone(result.user);
  };

  return (
    <form onSubmit={submit} autoComplete="off">
      {errors.form && (
        <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{errors.form}</span>
      )}

      <Field label="Admission / Merit Rank" error={errors.rank}>
        <input
          type="text"
          name="rank-signup-rank"
          autoComplete="off"
          className={errors.rank ? "error" : ""}
          placeholder="e.g. 00142"
          value={form.rank}
          onChange={set("rank")}
        />
      </Field>

      <Field label="Full Name" error={errors.name}>
        <input
          type="text"
          name="rank-signup-name"
          autoComplete="off"
          className={errors.name ? "error" : ""}
          placeholder="Your full name"
          value={form.name}
          onChange={set("name")}
        />
      </Field>

      {/* Phone (+ optional OTP) */}
      {!otpVerified ? (
        <Field label="Phone Number" error={errors.phone}>
          <input
            type="tel"
            name="rank-signup-phone"
            autoComplete="off"
            inputMode="numeric"
            className={errors.phone ? "error" : ""}
            placeholder="01XXXXXXXXX"
            value={form.phone}
            maxLength={11}
            disabled={otpSent}
            onChange={(e) => /^\d*$/.test(e.target.value) && set("phone")(e)}
          />
          {OTP_ENABLED && !otpSent && (
            <button type="button" className="btn-submit" style={{ marginTop: "0.75rem" }} onClick={handleSendOTP}>
              Send OTP
            </button>
          )}
        </Field>
      ) : (
        <div className="fg">
          <p style={{ color: "var(--green)", fontWeight: 500 }}>✓ Phone verified: {form.phone}</p>
          <button type="button" className="btn-submit secondary" style={{ marginTop: "0.5rem" }} onClick={changePhone}>
            Change Phone
          </button>
        </div>
      )}

      {OTP_ENABLED && otpSent && !otpVerified && (
        <Field label="Enter OTP" error={errors.otp}>
          <input
            type="text"
            name="rank-signup-otp"
            autoComplete="one-time-code"
            className={errors.otp ? "error" : ""}
            placeholder="Enter the 6-digit code"
            value={form.otp}
            maxLength={6}
            onChange={set("otp")}
          />
          <button type="button" className="btn-submit" style={{ marginTop: "0.75rem" }} onClick={handleVerifyOTP}>
            Verify OTP
          </button>
          <button type="button" className="btn-submit secondary" style={{ marginTop: "0.5rem" }} onClick={changePhone}>
            Change Phone
          </button>
        </Field>
      )}

      <Field label="Email Address (optional)" error={errors.email}>
        <input
          type="email"
          name="rank-signup-email"
          autoComplete="off"
          className={errors.email ? "error" : ""}
          placeholder="yourname@gmail.com"
          value={form.email}
          onChange={set("email")}
        />
      </Field>

      <Field label="Password" error={errors.password}>
        <input
          type="password"
          name="rank-signup-password"
          autoComplete="new-password"
          className={errors.password ? "error" : ""}
          placeholder="Create a strong password"
          value={form.password}
          onChange={set("password")}
        />
      </Field>

      <button type="submit" className="btn-submit" disabled={submitting}>
        {submitting ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}

/* ───────────── Page ───────────── */

export default function Signup({ go, onLogin }) {
  const [method, setMethod] = useState("email");
  const [googleError, setGoogleError] = useState("");
  const [finishing, setFinishing] = useState(false);

  // Show the loading screen, wait for the backend, then hand the user to App
  // (which sets it as the current user and opens the dashboard).
  const handleDone = async (user) => {
    setFinishing(true);
    const finalUser = await waitForUser(user);
    onLogin(finalUser);
  };

  const handleGoogleSuccess = (credentialResponse) => {
    console.log("Google login success:", credentialResponse);
    // TODO: send credentialResponse.credential to backend, then onLogin(user)
  };

  return (
    <div className="page">
      <Navbar page="signup" go={go} />
      <div className="auth-wrap">
        <div className="auth-box">
          <button className="back-btn" onClick={() => go("home")}>
            <IoHomeOutline /> Back to Home
          </button>
          <h2>Sign up to <span>KHOJ</span></h2>
          <p className="subtitle">Create your student account to find housing</p>

          {finishing ? (
            <SettingUp />
          ) : (
          <>
          <GoogleBtn
            onSuccess={handleGoogleSuccess}
            onError={() => setGoogleError("Google sign-up failed. Please try again.")}
          />
          {googleError && (
            <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{googleError}</span>
          )}
          <div className="auth-divider"><span>or</span></div>

          <div className="method-toggle">
            <button
              type="button"
              className={`method-btn${method === "email" ? " active" : ""}`}
              onClick={() => setMethod("email")}
            >
              Register with Email
            </button>
            <button
              type="button"
              className={`method-btn${method === "rank" ? " active" : ""}`}
              onClick={() => setMethod("rank")}
            >
              Register with Rank
            </button>
          </div>

          {/* Each form owns its own state, so nothing leaks between them */}
          {method === "email" ? (
            <EmailSignup key="email" onDone={handleDone} />
          ) : (
            <RankSignup key="rank" onDone={handleDone} />
          )}
          </>
          )}

          {!finishing && (
            <>
              <p className="auth-foot">
                Already have an account? <button onClick={() => go("login")}>Login</button>
              </p>
              <p className="auth-foot" style={{ marginTop: ".35rem" }}>
                Own a house? <button onClick={() => go("home-register")}>Register property</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}