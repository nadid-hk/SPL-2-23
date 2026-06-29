import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google"; // ✅ Import added
import Navbar from "../components/Navbar";

const IUT_EMAIL = /^[a-zA-Z0-9._%+-]+@iut-dhaka\.edu$/;
const API_BASE = "http://localhost:8000/api/v1/users";

function GoogleBtn({ onSuccess, onError }) {
  return (
    <div style={{ 
      width: "100%", 
      display: "flex", 
      justifyContent: "center", 
      marginTop: "0.5rem",
      marginBottom: "0.5rem"
    }}>
      <GoogleLogin
        onSuccess={onSuccess} // ✅ Props wired up
        onError={onError}
        useOneTap
        text="continue_with"
        shape="rectangular"
        width="100%"
      />
    </div>
  );
}

export default function Signup({ go }) {
  const [method, setMethod] = useState("email");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false); // ✅ Track verification
  const [form, setForm] = useState({ name: "", rank: "", email: "", phone: "", otp: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ✅ Clear OTP state when switching methods
  const switchMethod = (m) => {
    setMethod(m);
    setOtpSent(false);
    setOtpVerified(false);
    setErrors({});
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!form.phone) {
      setErrors((prev) => ({ ...prev, phone: "Please enter a valid phone number first." }));
      return;
    }
    // TODO: Replace with real OTP API call
    // await fetch(`${API_BASE}/send-otp`, { method: "POST", body: JSON.stringify({ phone: form.phone }) });
    alert(`OTP sent to ${form.phone}`);
    setOtpSent(true);
    setOtpVerified(false);
  };

  // ✅ OTP verification step
  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (!form.otp || form.otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "Please enter the 6-digit OTP." }));
      return;
    }
    // TODO: Replace with real OTP verification call
    // For now, mark as verified
    setOtpVerified(true);
    setErrors((prev) => ({ ...prev, otp: undefined }));
  };

  const handleGoogleSuccess = (credentialResponse) => {
    console.log("Google login success:", credentialResponse);
    // TODO: Send credentialResponse.credential to your backend
  };

  const handleGoogleError = () => {
    setErrors({ form: "Google sign-up failed. Please try again." });
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (method === "email") {
      if (!form.email) {
        errs.email = "Email is required.";
      } else if (!IUT_EMAIL.test(form.email)) {
        errs.email = "Only @iut-dhaka.edu email addresses are allowed.";
      }
      if (!form.name) errs.name = "Name is required.";
    } else {
      if (!form.rank) errs.rank = "Rank is required.";
      if (!form.name) errs.name = "Name is required.";
      if (!form.phone) errs.phone = "Phone number is required.";
      // ✅ Enforce OTP verification before submission
      if (!otpVerified) errs.otp = "Please verify your phone number via OTP before continuing.";
      if (form.email && !IUT_EMAIL.test(form.email)) {
        errs.email = "Only @iut-dhaka.edu email addresses are allowed.";
      }
    }

    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const payload = {
        method,
        name: form.name,
        password: form.password,
        email: form.email || undefined,
        ...(method === "rank"
          ? {
              rank: form.rank,
              phone: form.phone,
              otp: form.otp, // ✅ Include OTP in payload
            }
          : {}),
      };

      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.message || "Registration failed. Please try again." });
        setSubmitting(false);
        return;
      }

      alert("Account created successfully!\nPlease login to continue.");
      go("login");
    } catch (err) {
      console.error("Signup error:", err);
      setErrors({ form: "Could not connect to the server. Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <Navbar page="signup" go={go} />
      <div className="auth-wrap">
        <div className="auth-box">
          <button className="back-btn" onClick={() => go("home")}>
            ← Back to Home
          </button>
          <h2>
            Join <span>KHOJ</span>
          </h2>
          <p className="subtitle">Create your student account to find housing</p>

          {/* ✅ Google sign-up with handlers wired */}
          <GoogleBtn onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="method-toggle">
            <button
              type="button"
              className={`method-btn${method === "email" ? " active" : ""}`}
              onClick={() => switchMethod("email")} // ✅ Uses switchMethod to reset OTP state
            >
              Register with Email
            </button>
            <button
              type="button"
              className={`method-btn${method === "rank" ? " active" : ""}`}
              onClick={() => switchMethod("rank")} // ✅ Uses switchMethod to reset OTP state
            >
              Register with Rank
            </button>
          </div>

          {errors.form && (
            <span className="err-msg" style={{ display: "block", marginBottom: "10px" }}>
              {errors.form}
            </span>
          )}

          <form onSubmit={submit}>
            {method === "rank" && (
              <>
                <div className="fg">
                  <label>Admission / Merit Rank</label>
                  <input
                    type="text"
                    className={errors.rank ? "error" : ""}
                    placeholder="e.g. 00142"
                    value={form.rank}
                    onChange={set("rank")}
                    required
                  />
                  {errors.rank && <span className="err-msg">{errors.rank}</span>}
                </div>
                <div className="fg">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className={errors.name ? "error" : ""}
                    placeholder="Your full name"
                    value={form.name}
                    onChange={set("name")}
                    required
                  />
                  {errors.name && <span className="err-msg">{errors.name}</span>}
                </div>

                {/* Phone / OTP flow */}
                {!otpSent ? (
                  <div className="fg">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      className={errors.phone ? "error" : ""}
                      placeholder="+880 1X XX XXX XXXX"
                      value={form.phone}
                      onChange={set("phone")}
                      required
                    />
                    {errors.phone && <span className="err-msg">{errors.phone}</span>}
                    <button
                      type="button"
                      className="btn-submit"
                      style={{ marginTop: "0.75rem" }}
                      onClick={handleSendOTP}
                    >
                      Send OTP
                    </button>
                  </div>
                ) : otpVerified ? (
                  // ✅ Show verified state
                  <div className="fg">
                    <p style={{ color: "var(--green)", fontWeight: 500 }}>
                      ✓ Phone verified: {form.phone}
                    </p>
                    <button
                      type="button"
                      className="btn-submit secondary"
                      style={{ marginTop: "0.5rem" }}
                      onClick={() => {
                        setOtpSent(false);
                        setOtpVerified(false);
                        setForm((f) => ({ ...f, phone: "", otp: "" }));
                      }}
                    >
                      Change Phone
                    </button>
                  </div>
                ) : (
                  // ✅ OTP entry + verify button
                  <>
                    <div className="fg">
                      <label htmlFor="otp">Enter OTP</label>
                      <input
                        id="otp"
                        type="text"
                        className={errors.otp ? "error" : ""}
                        placeholder="Enter the 6-digit code"
                        value={form.otp}
                        onChange={set("otp")}
                        maxLength={6}
                        required
                      />
                      {errors.otp && <span className="err-msg">{errors.otp}</span>}
                      <button
                        type="button"
                        className="btn-submit"
                        style={{ marginTop: "0.75rem" }}
                        onClick={handleVerifyOTP}
                      >
                        Verify OTP
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                      <button
                        type="button"
                        className="btn-submit secondary"
                        onClick={() => {
                          setOtpSent(false);
                          setForm((f) => ({ ...f, otp: "" }));
                        }}
                      >
                        Change Phone
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {method === "email" && (
              <div className="fg">
                <label>Full Name</label>
                <input
                  type="text"
                  className={errors.name ? "error" : ""}
                  placeholder="Your full name"
                  value={form.name}
                  onChange={set("name")}
                  required
                />
                {errors.name && <span className="err-msg">{errors.name}</span>}
              </div>
            )}

            <div className="fg">
              <label>
                Email Address
                {method === "email" && (
                  <span style={{ color: "var(--red)", fontSize: "0.75rem", marginLeft: 6 }}>
                    (@iut-dhaka.edu only)
                  </span>
                )}
              </label>
              <input
                type="email"
                className={errors.email ? "error" : ""}
                placeholder={
                  method === "email"
                    ? "yourname@iut-dhaka.edu"
                    : "yourname@gmail.com"
                }
                value={form.email}
                onChange={set("email")}
                required={method === "email"}
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

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Create Account"}
            </button>
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