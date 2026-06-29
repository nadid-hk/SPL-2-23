import { useState } from "react";
import Navbar from "../components/Navbar";
import LocationMap from "../components/LocationMap";

const AMENITIES = [
  "Oven", "Fridge", "Washing Machine", "AC",
  "Balcony", "Attached Bath", "Shared Kitchen",
  "Wi-Fi", "Rooftop Access", "Generator",
];

const GATE_TIMES = [
  "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM",
  "11:00 PM", "11:30 PM", "12:00 AM", "No Gate / 24hr Open",
];

<<<<<<< HEAD
const STEPS = ["📸 Photos", "🏠 Details", "⚙️ Facilities", "✅ Preview & Post"];
=======
const STEPS = ["📸 Photos", "🏠 Basic Info", "⚙️ Facilities", "✅ Preview & Post"];
>>>>>>> 98a5b1d45de5c540d8c911683050d882fe5e5ac3

export default function Post({ go, user }) {
  const handleProfileClick = () => go("profile");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
<<<<<<< HEAD
    // House name & owner info auto-merged from homeowner registration
    houseName:         user?.houseName     || "",   // pre-filled from owner profile
    rent:              "",
    address:           user?.propertyAddress || "",
    electricity24_7:   false,
    ips:               false,
    lift:              false,
    security:          false,
    gateCloseTime:     "",
    gas:               false,
    waterBillIncluded: false,
    amenities:         [],
    reasonToLeave:     "",
    photo1:            false,
    photo2:            false,
=======
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
>>>>>>> 98a5b1d45de5c540d8c911683050d882fe5e5ac3
  });
  const [mapPosition, setMapPosition] = useState(
    user?.propertyCoords || [24.242, 90.404]
  );

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
      `✅ Post submitted for admin review! (demo)\n\n` +
      `House: ${form.houseName}\n` +
      `Rent: ৳${form.rent}/month\n` +
      `Owner: ${user?.name || "Home Owner"}\n\n` +
      `An admin will review and publish your listing to the dashboard.`
    );
    go("dashboard");
  };

  // Whether the owner's house name/address is already known from their profile
  const ownerHouseKnown = Boolean(user?.houseName);

  return (
    <div className="page">
      <Navbar page="post" go={go} user={user} onProfileClick={handleProfileClick} />

      <div className="post-content">
        <button className="back-btn" onClick={() => go("dashboard")}>← Back to Home</button>
        <h2 className="post-title">Post Your <span>Property</span></h2>
        <p className="post-sub">Complete the steps below to submit your listing. Admin will approve before it goes live.</p>

        {/* Auto-merged owner info banner */}
        {ownerHouseKnown && (
          <div style={{
            background: "#e8f5e9",
            border: "1px solid #a5d6a7",
            borderRadius: 10,
            padding: ".85rem 1.1rem",
            marginBottom: "1.5rem",
            fontSize: ".85rem",
            color: "#2e7d32",
            display: "flex",
            alignItems: "center",
            gap: ".6rem"
          }}>
            <span style={{ fontSize: "1.1rem" }}>✅</span>
            <div>
              <strong>Property info auto-filled</strong> from your registered account —&nbsp;
              <em>{user.houseName}</em>. Owner name &amp; contact are linked automatically.
            </div>
          </div>
        )}

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
            <div className="profile-section-title">🏠 Property Details</div>

            <div className="fg">
              <label>House / Property Name</label>
              <input
                type="text"
                placeholder="e.g. Sunrise Hostel"
                value={form.houseName}
                onChange={set("houseName")}
                readOnly={ownerHouseKnown}
                style={ownerHouseKnown ? {
                  background: "#f0f4ff",
                  color: "#3f51b5",
                  fontWeight: 600,
                  cursor: "not-allowed",
                  border: "1.5px solid #c5cae9"
                } : {}}
              />
              {ownerHouseKnown && (
                <span style={{ fontSize: ".76rem", color: "#5c6bc0", marginTop: ".3rem", display: "block" }}>
                  🔗 Auto-filled from your registered property
                </span>
              )}
            </div>

            <div className="fg">
              <label>Owner Name</label>
              <input
                type="text"
                value={user?.name || ""}
                readOnly
                style={{
                  background: "#f0f4ff",
                  color: "#3f51b5",
                  fontWeight: 600,
                  cursor: "not-allowed",
                  border: "1.5px solid #c5cae9"
                }}
              />
              <span style={{ fontSize: ".76rem", color: "#5c6bc0", marginTop: ".3rem", display: "block" }}>
                🔗 Auto-linked from your account
              </span>
            </div>

            <div className="fg">
              <label>Contact Phone</label>
              <input
                type="text"
                value={user?.phone || user?.mobile || ""}
                readOnly
                style={{
                  background: "#f0f4ff",
                  color: "#3f51b5",
                  fontWeight: 600,
                  cursor: "not-allowed",
                  border: "1.5px solid #c5cae9"
                }}
              />
              <span style={{ fontSize: ".76rem", color: "#5c6bc0", marginTop: ".3rem", display: "block" }}>
                🔗 Auto-linked from your account
              </span>
            </div>

            <div className="fg">
              <label>Monthly Rent (৳)</label>
              <input type="number" placeholder="e.g. 7000" value={form.rent} onChange={set("rent")} />
            </div>

            <div className="fg">
              <label>Full Address</label>
              <input
                type="text"
                placeholder="e.g. House 5, Road 2, BoardBazar, Gazipur"
                value={form.address}
                onChange={set("address")}
              />
            </div>

            <div className="fg">
              <label>Pin Exact Location</label>
              <LocationMap
                title="Pin Property Location"
                description="Drag the marker to set the exact pin location."
                center={mapPosition}
                markerPosition={mapPosition}
                draggable
                zoom={16}
                height={320}
                onPositionChange={setMapPosition}
              />
              <div className="map-coordinates">
                Selected point: {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
              </div>
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
              ["🏠 House Name",       form.houseName],
              ["👤 Owner",            user?.name || "—"],
              ["📞 Owner Phone",      user?.phone || user?.mobile || "—"],
              ["💰 Monthly Rent",     `৳${form.rent}`],
              ["📍 Address",          form.address || "—"],
              ["📌 Location Pin",     `${mapPosition[0].toFixed(5)}, ${mapPosition[1].toFixed(5)}`],
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
<<<<<<< HEAD
              <div className="detail-section-title" style={{ fontSize: ".9rem", marginBottom: ".75rem" }}>
                Property Location
              </div>
              <LocationMap
                title="Selected Location Preview"
                description="This is the location that will be saved with your post."
                center={mapPosition}
                markerPosition={mapPosition}
                zoom={16}
                height={300}
              />
              <div className="map-coordinates">
                Pinned: {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
              </div>
            </div>

            <div style={{
              marginTop: "1rem",
              background: "var(--gray-bg)",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: ".82rem",
              color: "var(--gray-text)"
            }}>
=======
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
>>>>>>> 98a5b1d45de5c540d8c911683050d882fe5e5ac3
              📸 <strong>2 photos selected</strong> (demo — actual upload requires database)
            </div>

            <div style={{
              marginTop: "1rem",
              background: "#fff8e1",
              border: "1px solid #ffe082",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: ".82rem",
              color: "#795548"
            }}>
              ⏳ <strong>Admin Review Required</strong> — your post will be visible on the dashboard only after an admin approves it.
            </div>

            <div className="step-actions" style={{ marginTop: "1.4rem" }}>
              <button className="btn-submit secondary" onClick={prev}>← Edit</button>
              <button className="btn-submit" onClick={submitPost}>🚀 Submit for Review</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}