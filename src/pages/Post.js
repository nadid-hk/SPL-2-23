import { useState } from "react";
import Navbar from "../components/Navbar";

const AMENITIES = [
  "Oven", "Fridge", "Washing Machine", "AC",
  "Balcony", "Attached Bath", "Shared Kitchen",
  "Wi-Fi", "Rooftop Access", "Generator",
];

const GATE_TIMES = [
  "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM",
  "11:00 PM", "11:30 PM", "12:00 AM", "No Gate / 24hr Open",
];

const STEPS = ["📸 Photos", "🏠 Basic Info", "⚙️ Facilities", "✅ Preview & Post"];

export default function Post({ go, user }) {
  const handleProfileClick = () => go("profile");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    houseName: "", 
    rent: "", 
    address: "",
    electricity24_7: false,
    ips: false,
    lift: false,
    security: false,
    gateCloseTime: "",
    gas: false,
    waterBillIncluded: false,
    amenities: [],
    reasonToLeave: "",
    photo1: false,
    photo2: false,
  });

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

  const submitPost = () => {
    alert(
      `✅ House posted successfully! (demo)\n\n` +
      `House: ${form.houseName}\n` +
      `Rent: ৳${form.rent}/month\n\n` +
      `Your post will appear in the dashboard once the database is connected.`
    );
    go("dashboard");
  };

  return (
    <div className="page">
      <Navbar page="post" go={go} user={user} onProfileClick={handleProfileClick} />

      <div className="post-content">
        <button className="back-btn" onClick={() => go("dashboard")}>← Back to Home</button>
        <h2 className="post-title">Post a <span>House</span></h2>
        <p className="post-sub">Share a listing to help fellow IUT students find accommodation.</p>

        {/* STEP BAR */}
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
              Photo upload requires database integration. Click each slot to mark as selected (demo).
            </p>

            <div className="photo-grid">
              {[1, 2].map(n => {
                const key = `photo${n}`;
                return (
                  <div
                    key={n}
                    className={`photo-slot${form[key] ? " selected" : ""}`}
                    onClick={() => toggle(key)}
                  >
                    <span className="slot-icon">{form[key] ? "✅" : "📷"}</span>
                    <span className="slot-label">
                      {form[key] ? "Photo Selected (demo)" : `Photo ${n}`}
                    </span>
                    <span className="badge">Under Construction</span>
                  </div>
                );
              })}
            </div>

            <div className="step-actions">
              <button
                className="btn-submit"
                onClick={() => {
                  if (!form.photo1 || !form.photo2) {
                    alert("⚠️ Please select both photo slots to continue.");
                    return;
                  }
                  next();
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 — BASIC INFO ── */}
        {step === 2 && (
          <div className="profile-section">
            <div className="profile-section-title">🏠 Basic House Information</div>

            <div className="fg">
              <label>House / Property Name</label>
              <input type="text" placeholder="e.g. Sunrise Hostel" value={form.houseName} onChange={set("houseName")} />
            </div>
            <div className="fg">
              <label>Monthly Rent (৳)</label>
              <input type="number" placeholder="e.g. 7000" value={form.rent} onChange={set("rent")} />
            </div>
            <div className="fg">
              <label>Full Address</label>
              <input type="text" placeholder="e.g. House 5, Road 2, BoardBazar, Gazipur" value={form.address} onChange={set("address")} />
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
              <button
                className="btn-submit"
                onClick={() => {
                  if (!form.houseName || !form.rent) {
                    alert("Please fill in House Name and Rent.");
                    return;
                  }
                  next();
                }}
              >
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
              {[
                { key: "electricity24_7",   label: "⚡ 24/7 Electricity (Backup available)" },
                { key: "ips",               label: "🔋 IPS Available" },
                { key: "lift",              label: "🛗 Lift / Elevator" },
                { key: "security",          label: "🔒 Security Guard" },
                { key: "gas",               label: "🔥 Gas Available" },
                { key: "waterBillIncluded", label: "💧 Water Bill Included in Rent" },
              ].map(item => (
                <div className="checkbox-item" key={item.key} onClick={() => toggle(item.key)}>
                  <input type="checkbox" checked={form[item.key]} onChange={() => toggle(item.key)} />
                  <label>{item.label}</label>
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 700, fontSize: ".9rem", margin: "1.1rem 0 .6rem" }}>
              Features / Amenities
            </div>
            <div className="amenity-row">
              {AMENITIES.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`amenity-pill${form.amenities.includes(a) ? " selected" : ""}`}
                  onClick={() => toggleA(a)}
                >
                  {form.amenities.includes(a) ? "✓ " : ""}{a}
                </button>
              ))}
            </div>

            <div className="fg" style={{ marginTop: "1rem" }}>
              <label>Reason Previous Tenant Left (optional)</label>
              <textarea
                placeholder="e.g. Graduated, moved to campus dorm..."
                value={form.reasonToLeave}
                onChange={set("reasonToLeave")}
              />
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
              ["🏠 House Name",   form.houseName],
              ["💰 Monthly Rent", `৳${form.rent}`],
              ["📍 Address",      form.address || "—"],
              ["🌙 Gate Closes",  form.gateCloseTime || "Not specified"],
              ["⚡ 24/7 Electricity", form.electricity24_7 ? "Yes" : "No"],
              ["🔋 IPS",          form.ips       ? "Yes" : "No"],
              ["🛗 Lift",         form.lift      ? "Yes" : "No"],
              ["🔒 Security",     form.security  ? "Yes" : "No"],
              ["🔥 Gas",          form.gas       ? "Yes" : "No"],
              ["💧 Water Bill",   form.waterBillIncluded ? "Included" : "Not included"],
            ].map(([k, v]) => (
              <div className="summary-row" key={k}>
                <span className="summary-key">{k}</span>
                <span className="summary-value">{v}</span>
              </div>
            ))}

            {form.amenities.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 700, marginBottom: ".45rem", color: "var(--gray-text)" }}>
                  ✨ Amenities
                </div>
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

            <div style={{ marginTop: "1.5rem" }}>
              <div
                className="detail-section-title"
                style={{
                  fontSize: ".9rem",
                  marginBottom: ".75rem",
                }}
              >
                Property Location
              </div>

              <div className="uc-box">
                <div className="uc-icon">📍</div>
                <p>Interactive map view will be available here.</p>
                <span className="badge">🚧 Under Construction</span>
              </div>
            </div>

            <div style={{ marginTop: "1rem", background: "var(--gray-bg)", borderRadius: 10, padding: "12px 14px", fontSize: ".82rem", color: "var(--gray-text)" }}>
              📸 <strong>2 photos selected</strong> (demo — actual upload requires database)
            </div>

            <div className="step-actions" style={{ marginTop: "1.4rem" }}>
              <button className="btn-submit secondary" onClick={prev}>← Edit</button>
              <button className="btn-submit" onClick={submitPost}>🚀 Submit Post</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
