import { useState } from "react";
import Navbar from "../components/Navbar";
import LocationMap from "../components/LocationMap";
import { API_BASE } from "../config";

const STEPS = ["👤 Owner & Login", "🏠 Property & Files", "✅ Review & Submit"];

export default function HomeRegister({ go, user }) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    ownerFullName: "",
    phoneNumber: "",
    khatianNumber: "", // NEW Khatian number for THIS property (own login)
    password: "",      // NEW password for THIS property (own login)
    housePropertyName: "",
    houseAddress: "",
  });

  // Dedicated states for the binary files
  const [housePicture, setHousePicture] = useState(null);
  const [khatianCertificate, setKhatianCertificate] = useState(null);

  const [mapPosition, setMapPosition] = useState([23.9482, 90.3794]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ── "Register another property" linking state ──────────────────────────
  // A returning owner can type in the Khatian number of a property they
  // registered before. We look it up, autofill their name/phone (still
  // editable), and remember the number so it's sent along on submit. The
  // server re-resolves this into the real link server-side — this is just
  // for autofill + intent, not the source of truth.
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [prevKhatianInput, setPrevKhatianInput] = useState("");
  const [linkedKhatianNumber, setLinkedKhatianNumber] = useState("");
  const [linkedPropertyName, setLinkedPropertyName] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  const fetchPreviousOwnerInfo = async () => {
    const khatian = prevKhatianInput.trim();
    if (!khatian) {
      setLookupError("Enter the Khatian number of a property you registered before.");
      return;
    }

    setLookupLoading(true);
    setLookupError("");

    try {
      const response = await fetch(
        `${API_BASE}/home-register/lookup/${encodeURIComponent(khatian)}`
      );
      const result = await response.json();

      if (response.ok && result.success) {
        setForm(f => ({
          ...f,
          ownerFullName: result.data.ownerFullName,
          phoneNumber: result.data.phoneNumber,
        }));
        setLinkedKhatianNumber(khatian);
        setLinkedPropertyName(result.data.previousPropertyName || "");
      } else {
        setLinkedKhatianNumber("");
        setLinkedPropertyName("");
        throw new Error(result.message || "No property found for that Khatian number.");
      }
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  const clearLink = () => {
    setLinkedKhatianNumber("");
    setLinkedPropertyName("");
    setPrevKhatianInput("");
    setLookupError("");
  };

  // Submit handler bundling multi-part data, now incorporating credentials
  const submit = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();

      const temporaryOwnerId = user?.id || "65f1abc234def56789012345";
      formData.append("ownerId", temporaryOwnerId);

      formData.append("ownerFullName", form.ownerFullName);
      formData.append("phoneNumber", form.phoneNumber);
      formData.append("khatianNumber", form.khatianNumber);
      formData.append("password", form.password);
      formData.append("housePropertyName", form.housePropertyName);
      formData.append("houseAddress", form.houseAddress);
      formData.append("latitude", mapPosition[0]);
      formData.append("longitude", mapPosition[1]);

      // NEW: only sent when the owner successfully looked up a previous
      // property. The server re-verifies this Khatian number exists and
      // uses it to link this new property to their existing review/owner
      // group.
      if (linkedKhatianNumber) {
        formData.append("previousKhatianNumber", linkedKhatianNumber);
      }

      if (housePicture) formData.append("housePicture", housePicture);
      if (khatianCertificate) formData.append("khatianCertificate", khatianCertificate);

      const response = await fetch(`${API_BASE}/home-register`, {
        method: "POST",
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
        <Navbar page="home-register" go={go} />
        <div className="auth-wrap">
          <div className="auth-box" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏠</div>
            <h2>Registration <span>Submitted!</span></h2>
            <p style={{ color: "var(--gray-text)", marginTop: ".75rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Your property registration for <strong>{form.housePropertyName}</strong> is pending admin review.
              Once approved, you'll be able to log in and manage your listing using your Khatian Number.
            </p>
            <div style={{
              background: "var(--gray-bg)",
              borderRadius: 10,
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              textAlign: "left",
              fontSize: ".875rem",
              lineHeight: 1.7
            }}>
              <div style={{ fontWeight: 700, marginBottom: ".5rem", color: "var(--gray-text)" }}>Submitted Details</div>
              <div>👤 {form.ownerFullName}</div>
              <div>📞 {form.phoneNumber}</div>
              <div>🔑 Khatian No: {form.khatianNumber}</div>
              <div>🏠 {form.housePropertyName}</div>
              <div>📍 {form.houseAddress}</div>
              <div>🗺️ {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}</div>
              {linkedKhatianNumber && (
                <div>🔗 Linked to previous property: {linkedPropertyName || linkedKhatianNumber}</div>
              )}
            </div>
            <button className="btn-submit" onClick={() => go("home")}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar page="home-register" go={go} />
      <div className="auth-wrap">
        <div className="auth-box wide">
          <button className="back-btn" onClick={() => go("home")}>← Back to Home</button>
          <h2>Register Your <span>Property</span></h2>
          <p className="subtitle">
            Fill in your details, set your credentials, and pin your property on the map.
          </p>

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

          {/* ── STEP 1 — OWNER DETAILS & LOGIN CREDENTIALS ── */}
          {step === 1 && (
            <div>
              {/* ── "Register another property" — previous Khatian lookup ── */}
              {!showLinkForm && !linkedKhatianNumber && (
                <div style={{ marginBottom: "1rem" }}>
                  <button
                    type="button"
                    className="btn-submit secondary"
                    style={{ width: "100%" }}
                    onClick={() => setShowLinkForm(true)}
                  >
                    🏘️ Already registered a property before? Link it
                  </button>
                </div>
              )}

              {showLinkForm && !linkedKhatianNumber && (
                <div style={{
                  background: "var(--gray-bg)",
                  borderRadius: 10,
                  padding: "1rem",
                  marginBottom: "1.25rem"
                }}>
                  <div style={{ fontWeight: 700, marginBottom: ".5rem" }}>
                    Link to a property you registered before
                  </div>
                  <p style={{ fontSize: ".82rem", color: "var(--gray-text)", marginBottom: ".75rem" }}>
                    Enter the Khatian Number of a property you already registered. We'll pull in your
                    name and phone number automatically — you can still edit them. Your reviews across
                    all your properties will be shown together.
                  </p>

                  {lookupError && (
                    <div style={{ color: "#c62828", fontSize: ".8rem", marginBottom: ".5rem" }}>
                      ⚠️ {lookupError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: ".5rem" }}>
                    <input
                      type="text"
                      placeholder="Previous Khatian Number"
                      value={prevKhatianInput}
                      onChange={e => setPrevKhatianInput(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={fetchPreviousOwnerInfo}
                      disabled={lookupLoading}
                    >
                      {lookupLoading ? "Looking up..." : "Fetch My Info"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setShowLinkForm(false); setLookupError(""); }}
                    style={{ marginTop: ".6rem", fontSize: ".8rem", background: "none", border: "none", color: "var(--gray-text)", cursor: "pointer" }}
                  >
                    Cancel, this is my first property
                  </button>
                </div>
              )}

              {linkedKhatianNumber && (
                <div style={{
                  background: "#e8f5e9",
                  border: "1px solid #a5d6a7",
                  borderRadius: 10,
                  padding: "1rem",
                  marginBottom: "1.25rem",
                  fontSize: ".85rem",
                  color: "#2e7d32"
                }}>
                  ✅ Linked to your previous property{linkedPropertyName ? ` "${linkedPropertyName}"` : ""}
                  {" "}(Khatian No: {linkedKhatianNumber}). Your name and phone were autofilled below —
                  feel free to edit them. This new property will still have its own separate Khatian
                  Number and password, but your reviews will show combined.
                  <div>
                    <button
                      type="button"
                      onClick={clearLink}
                      style={{ marginTop: ".5rem", fontSize: ".8rem", background: "none", border: "none", color: "#2e7d32", textDecoration: "underline", cursor: "pointer" }}
                    >
                      Unlink / start fresh
                    </button>
                  </div>
                </div>
              )}

              <div className="auth-divider"><span>Owner Details &amp; Login Credentials</span></div>

              <div className="fg">
                <label>Owner Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.ownerFullName}
                  onChange={set("ownerFullName")}
                  required
                />
              </div>

              <div className="fg">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={form.phoneNumber}
                  onChange={set("phoneNumber")}
                  required
                />
              </div>

              <div className="fg">
                <label>Khatian Number (Used for Login){linkedKhatianNumber ? " — for THIS property" : ""}</label>
                <input
                  type="text"
                  placeholder="Enter this property's unique Khatian Number"
                  value={form.khatianNumber}
                  onChange={set("khatianNumber")}
                  required
                />
              </div>

              <div className="fg">
                <label>Account Password{linkedKhatianNumber ? " — for THIS property" : ""}</label>
                <input
                  type="password"
                  placeholder="Create a secure password"
                  value={form.password}
                  onChange={set("password")}
                  required
                />
              </div>

              <div className="step-actions">
                <button className="btn-submit" onClick={() => {
                  if (!form.ownerFullName.trim() || !form.phoneNumber.trim() || !form.khatianNumber.trim() || !form.password.trim()) {
                    alert("⚠️ Please fill in your name, phone number, Khatian Number, and password to continue.");
                    return;
                  }
                  if (linkedKhatianNumber && form.khatianNumber.trim() === linkedKhatianNumber) {
                    alert("⚠️ This property needs its own new Khatian Number, different from the one you linked.");
                    return;
                  }
                  next();
                }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 — PROPERTY METADATA & FILES ── */}
          {step === 2 && (
            <div>
              <div className="auth-divider"><span>Property Metadata &amp; Files</span></div>

              <div className="fg">
                <label>House / Property Name</label>
                <input
                  type="text"
                  placeholder="e.g. Green Valley Boarding"
                  value={form.housePropertyName}
                  onChange={set("housePropertyName")}
                  required
                />
              </div>

              <div className="fg">
                <label>House Number / Address</label>
                <input
                  type="text"
                  placeholder="e.g. House 12, Road 5, BoardBazar"
                  value={form.houseAddress}
                  onChange={set("houseAddress")}
                  required
                />
              </div>

              <div className="fg">
                <label>House Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHousePicture(e.target.files[0] || null)}
                  required
                />
                {housePicture && (
                  <div style={{ fontSize: ".8rem", color: "var(--gray-text)", marginTop: ".35rem" }}>
                    ✅ {housePicture.name}
                  </div>
                )}
              </div>

              <div className="fg">
                <label>Location on Map</label>
                <LocationMap
                  title="Choose Property Location"
                  description="Drag the pin to match the exact property entrance."
                  center={mapPosition}
                  markerPosition={mapPosition}
                  draggable
                  zoom={16}
                  height={340}
                  onPositionChange={setMapPosition}
                />
                <div className="map-coordinates">
                  Selected point: {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
                </div>
              </div>

              <div className="fg">
                <label>Khatian Certificate Document</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setKhatianCertificate(e.target.files[0] || null)}
                  required
                />
                {khatianCertificate && (
                  <div style={{ fontSize: ".8rem", color: "var(--gray-text)", marginTop: ".35rem" }}>
                    ✅ {khatianCertificate.name}
                  </div>
                )}
              </div>

              <div className="step-actions">
                <button className="btn-submit secondary" onClick={prev}>← Back</button>
                <button className="btn-submit" onClick={() => {
                  if (!form.housePropertyName.trim() || !form.houseAddress.trim() || !housePicture || !khatianCertificate) {
                    alert("⚠️ Please fill in the property name and address, and upload both the house picture and Khatian certificate to continue.");
                    return;
                  }
                  next();
                }}>
                  Review Registration →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — REVIEW & SUBMIT ── */}
          {step === 3 && (
            <div>
              <div className="auth-divider"><span>Review Your Registration</span></div>

              {[
                ["👤 Owner Full Name", form.ownerFullName || "—"],
                ["📞 Phone Number", form.phoneNumber || "—"],
                ["🔑 Khatian Number", form.khatianNumber || "—"],
                ["🔒 Password", form.password ? "•".repeat(form.password.length) : "—"],
                ["🏠 Property Name", form.housePropertyName || "—"],
                ["📍 Address", form.houseAddress || "—"],
                ["🗺️ Coordinates", `${mapPosition[0].toFixed(5)}, ${mapPosition[1].toFixed(5)}`],
                ...(linkedKhatianNumber
                  ? [["🔗 Linked Previous Property", linkedPropertyName || linkedKhatianNumber]]
                  : []),
              ].map(([k, v]) => (
                <div className="summary-row" key={k}>
                  <span className="summary-key">{k}</span>
                  <span className="summary-value">{v}</span>
                </div>
              ))}

              <div style={{ marginTop: "1rem", background: "var(--gray-bg)", borderRadius: 10, padding: "12px 14px", fontSize: ".82rem", color: "var(--gray-text)" }}>
                📎 <strong>Files attached:</strong>{" "}
                {housePicture ? `House Picture (${housePicture.name})` : "No house picture"}
                {", "}
                {khatianCertificate ? `Khatian Certificate (${khatianCertificate.name})` : "No Khatian certificate"}
              </div>

              <div style={{
                background: "#fff8e1",
                border: "1px solid #ffe082",
                borderRadius: 8,
                padding: ".85rem 1rem",
                fontSize: ".82rem",
                color: "#795548",
                marginTop: "1rem",
                lineHeight: 1.6
              }}>
                ⏳ After submitting, an <strong>admin will review</strong> your registration.
                You will be able to log in with your Khatian Number and password once approved.
                {linkedKhatianNumber && " Reviews for this property will combine with your other linked property once it's approved."}
              </div>

              <div className="step-actions" style={{ marginTop: "1.4rem" }}>
                <button className="btn-submit secondary" onClick={prev}>← Edit</button>
                <button className="btn-submit" onClick={submit} disabled={loading}>
                  {loading ? "Uploading & Registering..." : "Submit for Admin Approval"}
                </button>
              </div>
            </div>
          )}

          <p className="auth-foot">
            Already approved?{" "}
            <button onClick={() => go("login")}>Login as Home Owner</button>
          </p>
          <p className="auth-foot">
            Want to register another property?{" "}
            <button onClick={() => { setStep(1); setShowLinkForm(true); }}>Register another property</button>
          </p>

        </div>
      </div>
    </div>
  );
}