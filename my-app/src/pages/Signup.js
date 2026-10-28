import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import Navbar from "../components/Navbar";
import { API_USERS as API_BASE, API_BASE as API_ROOT } from "../config";
import { IoHomeOutline } from "react-icons/io5";
import { saveSession } from "../auth";

const IUT_EMAIL = /^[a-zA-Z0-9._%+-]+@iut-dhaka\.edu$/;
const ANY_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BD_PHONE = /^01\d{9}$/;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

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

// Reads the payload of the Google ID token (a JWT) so we can see the email.
// This is only for a quick check in the browser; the backend must verify the
// token's signature and re-check the email domain too.
function decodeGoogleCredential(credential) {
  try {
    const base64 = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch (err) {
    console.error("Could not read Google credential:", err);
    return null;
  }
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

/* ───────────── Email OTP (shared by both forms) ───────────── */

const normEmail = (e) => e.trim().toLowerCase();

async function postJson(path, body) {
  try {
    const res = await fetch(`${API_ROOT}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, message: data.message || (res.ok ? "" : "Something went wrong. Please try again.") };
  } catch (err) {
    console.error("OTP request error:", err);
    return { ok: false, message: "Could not connect to the server. Please try again later." };
  }
}

// Keeps all OTP state for one form. "Sent" and "verified" are remembered per
// email address, so editing the email afterwards automatically cancels them.
function useEmailOtp() {
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (email) => {
    const key = normEmail(email);
    setBusy(true);
    setError("");
    const r = await postJson("/otp/generate-otp", { email: key });
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setSentTo(key);
    setCode("");
    setCooldown(RESEND_SECONDS);
  };

  const verify = async (email) => {
    if (code.length !== OTP_LENGTH) return setError(`Please enter the ${OTP_LENGTH}-digit OTP.`);
    const key = normEmail(email);
    setBusy(true);
    setError("");
    const r = await postJson("/otp/verify-otp", { email: key, otp: code });
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setVerifiedEmail(key);
  };

  return {
    code, setCode, busy, error, setError, cooldown, send, verify,
    isSent: (email) => sentTo !== "" && sentTo === normEmail(email),
    isVerified: (email) => verifiedEmail !== "" && verifiedEmail === normEmail(email),
  };
}

// validate(email) returns an error string, or "" when the email is acceptable.
function EmailOtpControls({ email, validate, otp }) {
  if (otp.isVerified(email)) {
    return (
      <div className="fg">
        <p style={{ color: "var(--green)", fontWeight: 500 }}>✓ Email verified</p>
      </div>
    );
  }

  const handleSend = () => {
    const msg = validate(email);
    if (msg) return otp.setError(msg);
    otp.send(email);
  };

  if (!otp.isSent(email)) {
    return (
      <div className="fg">
        <button type="button" className="btn-submit secondary" onClick={handleSend} disabled={otp.busy}>
          {otp.busy ? "Sending..." : "Send OTP to email"}
        </button>
        {otp.error && <span className="err-msg">{otp.error}</span>}
      </div>
    );
  }

  return (
    <Field label="Enter OTP" error={otp.error}>
      <input
        type="text"
        name="email-otp-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        className={otp.error ? "error" : ""}
        placeholder={`Enter the ${OTP_LENGTH}-digit code`}
        value={otp.code}
        maxLength={OTP_LENGTH}
        onChange={(e) => /^\d*$/.test(e.target.value) && otp.setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            otp.verify(email);
          }
        }}
      />
      <p style={{ opacity: 0.7, fontSize: ".8rem", marginTop: ".35rem" }}>
        We sent a code to {normEmail(email)}. It expires in 5 minutes.
      </p>
      <button
        type="button"
        className="btn-submit"
        style={{ marginTop: "0.75rem" }}
        onClick={() => otp.verify(email)}
        disabled={otp.busy}
      >
        {otp.busy ? "Checking..." : "Verify OTP"}
      </button>
      <button
        type="button"
        className="btn-submit secondary"
        style={{ marginTop: "0.5rem" }}
        onClick={handleSend}
        disabled={otp.busy || otp.cooldown > 0}
      >
        {otp.cooldown > 0 ? `Resend OTP in ${otp.cooldown}s` : "Resend OTP"}
      </button>
    </Field>
  );
}

/* ───────────── Register with Email ───────────── */

const validateIutEmail = (email) => {
  if (!email) return "Email is required.";
  if (!IUT_EMAIL.test(email)) return "Only @iut-dhaka.edu email addresses are allowed.";
  return "";
};

function EmailSignup({ onDone }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const otp = useEmailOtp();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    const emailErr = validateIutEmail(form.email);
    if (emailErr) errs.email = emailErr;
    else if (!otp.isVerified(form.email)) errs.otp = "Please verify your email with the OTP first.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";

    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setSubmitting(true);

    const result = await registerUser({
      method: "email",
      name: form.name.trim(),
      email: normEmail(form.email),
      password: form.password,
      otp: otp.code, // the backend re-checks this, so verification can't be skipped
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

      <EmailOtpControls email={form.email} validate={validateIutEmail} otp={otp} />
      {errors.otp && !otp.isVerified(form.email) && (
        <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{errors.otp}</span>
      )}

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

// For rank signup the email can be any provider, but it is now required
// because the OTP is sent to it.
const validateAnyEmail = (email) => {
  if (!email) return "Email is required to receive the OTP.";
  if (!ANY_EMAIL.test(email)) return "Please enter a valid email address.";
  return "";
};

function RankSignup({ onDone }) {
  const [form, setForm] = useState({ rank: "", name: "", phone: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const otp = useEmailOtp();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.rank.trim()) errs.rank = "Rank is required.";
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.phone) errs.phone = "Phone number is required.";
    else if (!BD_PHONE.test(form.phone)) errs.phone = "Enter a valid 11-digit phone number (01XXXXXXXXX).";
    const emailErr = validateAnyEmail(form.email);
    if (emailErr) errs.email = emailErr;
    else if (!otp.isVerified(form.email)) errs.otp = "Please verify your email with the OTP first.";
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
      email: normEmail(form.email),
      password: form.password,
      otp: otp.code, // the backend re-checks this, so verification can't be skipped
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
          onChange={(e) => /^\d*$/.test(e.target.value) && set("phone")(e)}
        />
      </Field>

      <Field label="Email Address" error={errors.email}>
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

      <EmailOtpControls email={form.email} validate={validateAnyEmail} otp={otp} />
      {errors.otp && !otp.isVerified(form.email) && (
        <span className="err-msg" style={{ display: "block", marginBottom: 10 }}>{errors.otp}</span>
      )}

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

  const sessionUser = {
    _id: finalUser._id,
    name: finalUser.name,
    email: finalUser.email || "",
    mobile: finalUser.phone || "",
    type: method === "rank" ? "temporary" : "student",
    rank: finalUser.rank || "",
    dept: finalUser.dept || "",
    batch: finalUser.batch || "",
    bio: finalUser.bio || "",
    picture: finalUser.picture || "",
    role: finalUser.role || (method === "rank" ? "temporary" : "student"),
  };

  saveSession(sessionUser);
  onLogin(sessionUser);
};

  const handleGoogleSuccess = (credentialResponse) => {
    setGoogleError("");
    const profile = decodeGoogleCredential(credentialResponse.credential);
    const email = (profile?.email || "").trim().toLowerCase();
    console.log("Google sign-in email:", email, "verified:", profile?.email_verified);

    if (!email || !profile?.email_verified) {
      return setGoogleError("Could not verify your Google email. Please try again.");
    }
    if (!IUT_EMAIL.test(email)) {
      return setGoogleError("Only @iut-dhaka.edu Google accounts are allowed.");
    }

    // TODO: send credentialResponse.credential to backend (which must also
    // verify the token and the @iut-dhaka.edu domain), then onLogin(user)
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
