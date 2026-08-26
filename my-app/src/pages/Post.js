import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { API_BASE } from "../config";

const AMENITIES = [
  "Oven", "Fridge", "Washing Machine", "AC",
  "Balcony", "Attached Bath", "Shared Kitchen",
  "Wi-Fi", "Rooftop Access", "Generator",
];

const GATE_TIMES = [
  "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM",
  "11:00 PM", "11:30 PM", "12:00 AM", "No Gate / 24hr Open",
];

const UTILITY_OPTIONS = [
  { key: "electricity24_7",   label: "⚡ 24/7 Electricity (Backup available)", value: "24/7 Electricity" },
  { key: "ips",               label: "🔋 IPS Available",                       value: "IPS" },
  { key: "lift",               label: "🛗 Lift / Elevator",                     value: "Lift" },
  { key: "security",          label: "🔒 Security Guard",                      value: "Security Guard" },
  { key: "gas",               label: "🔥 Gas Available",                       value: "Gas" },
  { key: "waterBillIncluded", label: "💧 Water Bill Included in Rent",         value: "Water Bill Included" },
];

const STEPS = ["📸 Photos", "🏠 Details", "⚙️ Facilities", "✅ Preview & Post"];

export default function Post({ go, user }) {
  const handleProfileClick = () => go("profile");

  const [step, setStep] = useState(1);

  const [houses, setHouses] = useState([]);
  const [housesLoading, setHousesLoading] = useState(true);
  const [housesError, setHousesError] = useState("");

  const [form, setForm] = useState({
    registeredHouse:   "",   
    rent:              "",
    contactPhone:      user?.phone || user?.mobile || "", // 👉 Added to form state so it is editable
    electricity24_7:   false,
    ips:               false,
    lift:              false,
    security:          false,
    gateCloseTime:     "",
    gas:               false,
    waterBillIncluded: false,
    amenities:         [],
    reasonToLeave:     "",
  });

  const [photo1, setPhoto1] = useState(null);
  const [photo2, setPhoto2] = useState(null);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = k => setForm(f => ({ ...f, [k]: !f[k] }));
  const toggleA = a => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(a)
      ? f.amenities.filter(x => x !== a)
      : [...f.amenities, a],
  }));

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  useEffect(() => {
    const fetchApprovedHouses = async () => {
      setHousesLoading(true);
      setHousesError("");
      try {
        const response = await fetch(`${API_BASE}/home-register/approved`);
        const result = await response.json();
        if (response.ok && result.success) {
          setHouses(result.data || []);
        } else {
          throw new Error(result.message || "Could not load your approved properties.");
        }
      } catch (err) {
        setHousesError(err.message);
      } finally {
        setHousesLoading(false);
      }
    };
    fetchApprovedHouses();
  }, []);

  const selectedHouse = houses.find(h => h._id === form.registeredHouse);

  const submitPost = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();

      // FIX: this used to send `user?.id` (a field that doesn't even exist
      // on the app's user object — it's `_id`), so it silently fell back to
      // a hardcoded placeholder id for every single post, from every
      // student, always. The backend now derives the real author from the
      // authenticated session instead, so nothing needs to be sent here at
      // all — just make sure the request carries the session cookie
      // (`credentials: "include"` below).

      formData.append("registeredHouse", form.registeredHouse);
      formData.append("ownerName", user?.name || "");
      formData.append("contactPhone", form.contactPhone); // 👉 Submits the edited state value now
      formData.append("monthlyRent", form.rent);
      formData.append("gateClosedTime", form.gateCloseTime);

      const utilities = UTILITY_OPTIONS.filter(u => form[u.key]).map(u => u.value);
      formData.append("utilities", JSON.stringify(utilities));
      formData.append("features", JSON.stringify(form.amenities));
      formData.append("reasonTenantLeft", form.reasonToLeave);

      if (photo1) formData.append("photos", photo1);
      if (photo2) formData.append("photos", photo2);

      const response = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        credentials: "include", // FIX: required now that /posts needs a logged-in session
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitted(true);
      } else {
        const serverError = result.errors ? result.errors.join(", ") : result.message;
        throw new Error(serverError || "Something went wrong.");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="page">
        <Navbar page="post" go={go} user={user} onProfileClick={handleProfileClick} />
        <div className="post-content">
          <div className="profile-section" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚀</div>
            <h2>Post <span>Submitted!</span></h2>
            <p style={{ color: "var(--gray-text)", marginTop: ".75rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Your listing for <strong>{selectedHouse?.housePropertyName}</strong> is now pending admin review.
              You'll get a notification once it's approved or rejected.
            </p>
            <button className="btn-submit" onClick={() => go("dashboard")}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar page="post" go={go} user={user} onProfileClick={handleProfileClick} />

      <div className="post-content">
        <button className="back-btn" onClick={() => go("dashboard")}>← Back to Home</button>
        <h2 className="post-title">Post Your <span>Property</span></h2>
        <p className="post-sub">Complete the steps below to submit your listing. Admin will approve before it goes live.</p>

        {errorMessage && (
          <div style={{ background: "#ffebee", color: "#c62828", padding: "1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <div className="step-bar">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const cls = step === n ? "active" : step > n ? "done" : "";
            return <div key={n} className={`step-item ${cls}`}>{step > n ? "✓ " : ""}{s}</div>;
          })}
        </div>

        {/* ── STEP 1 — PHOTOS ── */}
        {step === 1 && (
          <div className="profile-section">
            <div className="profile-section-title">📸 Upload 2 House Photos</div>
            <p style={{ fontSize: ".85rem", color: "var(--gray-text)", marginBottom: "1rem" }}>
              Both photos are required and will be uploaded when you submit for review.
            </p>

            <div className="photo-grid">
              {[
                { n: 1, file: photo1, setFile: setPhoto1 },
                { n: 2, file: photo2, setFile: setPhoto2 },
              ].map(({ n, file, setFile }) => (
                <label key={n} className={`photo-slot${file ? " selected" : ""}`} style={{ cursor: "pointer" }}>
                  <span className="slot-icon">{file ? "✅" : "📷"}</span>
                  <span className="slot-label">{file ? file.name : `Photo ${n}`}</span>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0] || null)} />
                </label>
              ))}
            </div>

            <div className="step-actions">
              <button className="btn-submit" onClick={() => {
                if (!photo1 || !photo2) {
                  alert("⚠️ Please select both photo slots to continue.");
                  return;
                }
                next();
              }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 — PROPERTY DETAILS ── */}
        {step === 2 && (
          <div className="profile-section">
            <div className="profile-section-title">🏠 Property Details</div>

            <div className="fg">
              <label>House / Property Name</label>
              {housesLoading ? (
                <div style={{ fontSize: ".85rem", color: "var(--gray-text)" }}>Loading your approved properties...</div>
              ) : housesError ? (
                <div style={{ fontSize: ".85rem", color: "#c62828" }}>⚠️ {housesError}</div>
              ) : houses.length === 0 ? (
                <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: ".75rem 1rem", fontSize: ".85rem", color: "#795548" }}>
                  You don't have any admin-approved properties yet. Register a property first, and once an admin approves it, it will show up here.
                </div>
              ) : (
                <select value={form.registeredHouse} onChange={set("registeredHouse")}>
                  <option value="">— Select a registered property —</option>
                  {houses.map(h => (
                    <option key={h._id} value={h._id}>{h.housePropertyName}</option>
                  ))}
                </select>
              )}
            </div>

            {/* 👉 Removed Linked Full Address input box and Location Map view components from here */}

            <div className="fg">
              <label>Owner Name</label>
              <input type="text" value={user?.name || ""} readOnly style={{ background: "#f0f4ff", color: "#3f51b5", fontWeight: 600, cursor: "not-allowed", border: "1.5px solid #c5cae9" }} />
            </div>

            <div className="fg">
              <label>Contact Phone</label>
              <input 
                type="text" 
                placeholder="Enter contact number for this listing"
                value={form.contactPhone} 
                onChange={set("contactPhone")} // 👉 Made editable
              />
            </div>

            <div className="fg">
              <label>Monthly Rent (৳)</label>
              <input type="number" placeholder="e.g. 7000" value={form.rent} onChange={set("rent")} />
            </div>

            <div className="fg">
              <label>Gate Close Time</label>
              <select value={form.gateCloseTime} onChange={set("gateCloseTime")}>
                <option value="">— Select gate close time —</option>
                {GATE_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="step-actions">
              <button className="btn-submit secondary" onClick={prev}>← Back</button>
              <button className="btn-submit" onClick={() => {
                if (!form.registeredHouse || !form.rent || !form.contactPhone.trim()) {
                  alert("Please select a property, fill in the rent, and enter a contact phone number.");
                  return;
                }
                next();
              }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — FACILITIES ── */}
        {step === 3 && (
          <div className="profile-section">
            <div className="profile-section-title">⚙️ Facilities & Details</div>

            <div style={{ fontWeight: 700, fontSize: ".9rem", marginBottom: ".6rem" }}>Utilities</div>
            <div className="checkbox-group">
              {UTILITY_OPTIONS.map(item => (
                <div className="checkbox-item" key={item.key} onClick={() => toggle(item.key)}>
                  <input type="checkbox" checked={form[item.key]} onChange={() => toggle(item.key)} />
                  <label>{item.label}</label>
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 700, fontSize: ".9rem", margin: "1.1rem 0 .6rem" }}>Features / Amenities</div>
            <div className="amenity-row">
              {AMENITIES.map(a => (
                <button key={a} type="button" className={`amenity-pill${form.amenities.includes(a) ? " selected" : ""}`} onClick={() => toggleA(a)}>
                  {form.amenities.includes(a) ? "✓ " : ""}{a}
                </button>
              ))}
            </div>

            <div className="fg" style={{ marginTop: "1rem" }}>
              <label>Reason Previous Tenant Left (optional)</label>
              <textarea placeholder="e.g. Graduated, moved to campus dorm..." value={form.reasonToLeave} onChange={set("reasonToLeave")} />
            </div>

            <div className="step-actions">
              <button className="btn-submit secondary" onClick={prev}>← Back</button>
              <button className="btn-submit" onClick={next}>Review Post →</button>
            </div>
          </div>
        )}

        {/* ── STEP 4 — REVIEW & SUBMIT ── */}
        {step === 4 && (
          <div className="profile-section">
            <div className="profile-section-title">✅ Review Your Post</div>

            {[
              ["🏠 House Name",       selectedHouse?.housePropertyName || "—"],
              ["👤 Owner",            user?.name || "—"],
              ["📞 Contact Phone",    form.contactPhone || "—"], // 👉 Shows updated custom phone number string configuration
              ["💰 Monthly Rent",    `৳${form.rent}`],
              ["🌙 Gate Closes",      form.gateCloseTime || "Not specified"],
              ["⚡ 24/7 Electricity", form.electricity24_7 ? "Yes" : "No"],
              ["🔋 IPS",              form.ips       ? "Yes" : "No"],
              ["🛗 Lift",             form.lift      ? "Yes" : "No"],
              ["🔒 Security",         form.security  ? "Yes" : "No"],
              ["🔥 Gas",              form.gas       ? "Yes" : "No"],
              ["💧 Water Bill",       form.waterBillIncluded ? "Included" : "Not included"],
            ].map(([k, v]) => (
              <div className="summary-row" key={k}>
                <span className="summary-key">{k}</span>
                <span className="summary-value">{v}</span>
              </div>
            ))}

            {/* 👉 Removed Redundant Address Rows and Location Map Review layout boxes completely from preview view layer parameters */}

            {form.amenities.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 700, marginBottom: ".45rem", color: "var(--gray-text)" }}>✨ Amenities</div>
                <div className="chips-row">
                  {form.amenities.map(a => <span className="tag-chip" key={a}>✅ {a}</span>)}
                </div>
              </div>
            )}

            {form.reasonToLeave && (
              <div className="reason-box" style={{ marginTop: "1rem" }}>
                <div className="reason-label">📋 Reason Tenant Left</div>
                <p>{form.reasonToLeave}</p>
              </div>
            )}

            <div style={{ marginTop: "1rem", background: "var(--gray-bg)", borderRadius: 10, padding: "12px 14px", fontSize: ".82rem", color: "var(--gray-text)" }}>
              📸 <strong>{[photo1, photo2].filter(Boolean).length} of 2 photos selected</strong> — {photo1?.name}{photo1 && photo2 ? ", " : ""}{photo2?.name}
            </div>

            <div style={{ marginTop: "1rem", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "12px 14px", fontSize: ".82rem", color: "#795548" }}>
              ⏳ <strong>Admin Review Required</strong> — your post will be visible on the dashboard only after an admin approves it.
            </div>

            <div className="step-actions" style={{ marginTop: "1.4rem" }}>
              <button className="btn-submit secondary" onClick={prev}>← Edit</button>
              <button className="btn-submit" onClick={submitPost} disabled={loading}>
                {loading ? "Uploading & Submitting..." : "🚀 Submit for Review"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}