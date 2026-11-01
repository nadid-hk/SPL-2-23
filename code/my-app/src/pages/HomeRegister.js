import { useState } from "react";
import Navbar from "../components/Navbar";
import Login from "../pages/Login";
import LocationMap from "../components/LocationMap";
import { API_BASE } from "../config";
import {
  IoHomeOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoKeyOutline,
  IoLockClosedOutline,
  IoLocationOutline,
  IoMapOutline,
  IoImageOutline,
  IoDocumentTextOutline,
  IoCloudUploadOutline,
  IoCheckmark,
  IoCheckmarkCircle,
  IoWarningOutline,
  IoLinkOutline,
  IoTimeOutline,
  IoArrowForward,
  IoArrowBack,
  IoEyeOutline,
  IoEyeOffOutline,
  IoBusinessOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";

const STEPS = [
  { label: "Owner", icon: IoPersonOutline },
  { label: "Property", icon: IoBusinessOutline },
  { label: "Review", icon: IoCheckmarkCircle },
];

/* ── Small inline-styled helpers (all colors come from your theme variables,
      so light & dark mode work automatically) ── */

const iconInputWrap = { position: "relative" };
const iconLeft = {
  position: "absolute",
  left: 13,
  top: "50%",
  transform: "translateY(-50%)",
  color: "var(--gray-text)",
  fontSize: "1.05rem",
  pointerEvents: "none",
};
const inputWithIcon = { paddingLeft: "2.5rem" };

const noteBox = (accent) => ({
  display: "flex",
  gap: ".7rem",
  alignItems: "flex-start",
  background: "var(--gray-bg)",
  border: "1px solid var(--gray-mid)",
  borderLeft: `4px solid ${accent}`,
  borderRadius: 12,
  padding: ".85rem 1rem",
  fontSize: ".82rem",
  lineHeight: 1.6,
  color: "var(--gray-text)",
});

function Field({ label, icon: Icon, children }) {
  return (
    <div className="fg">
      <label>{label}</label>
      <div style={iconInputWrap}>
        {Icon && <Icon style={iconLeft} />}
        {children}
      </div>
    </div>
  );
}

function FileDrop({ label, icon: Icon, accept, file, onChange, hint }) {
  const has = !!file;
  return (
    <div className="fg">
      <label>{label}</label>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: ".85rem",
          padding: ".9rem 1rem",
          borderRadius: 12,
          cursor: "pointer",
          border: `2px dashed ${has ? "var(--success)" : "var(--gray-mid)"}`,
          background: has ? "var(--gray-bg)" : "transparent",
          transition: "border-color .2s, background .2s",
          marginBottom: 0,
          fontWeight: 500,
        }}
      >
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            background: has ? "var(--success)" : "var(--red-hover)",
            color: has ? "#fff" : "var(--red)",
          }}
        >
          {has ? <IoCheckmark /> : <Icon />}
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: "block",
              fontSize: ".88rem",
              fontWeight: 600,
              color: "var(--dark)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {has ? file.name : "Click to upload"}
          </span>
          <span style={{ display: "block", fontSize: ".75rem", color: "var(--gray-text)" }}>
            {has ? "Click to replace" : hint}
          </span>
        </span>
        {!has && <IoCloudUploadOutline style={{ color: "var(--gray-text)", fontSize: "1.2rem" }} />}
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files[0] || null)}
          style={{ display: "none" }}
        />
      </label>
    </div>
  );
}

export default function HomeRegister({ go, user }) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    ownerFullName: "",
    phoneNumber: "",
    email: "",         // where the admin's rejection reason is sent
    khatianNumber: "", // Khatian number for THIS property (own login)
    password: "",      // password for THIS property (own login)
    housePropertyName: "",
    houseAddress: "",
  });

  const [housePicture, setHousePicture] = useState(null);
  const [khatianCertificate, setKhatianCertificate] = useState(null);

  const [mapPosition, setMapPosition] = useState([23.9482, 90.3794]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── "Register another property" linking state ──
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [prevKhatianInput, setPrevKhatianInput] = useState("");
  const [linkedKhatianNumber, setLinkedKhatianNumber] = useState("");
  const [linkedPropertyName, setLinkedPropertyName] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const next = () => { setErrorMessage(""); setStep((s) => s + 1); };
  const prev = () => { setErrorMessage(""); setStep((s) => s - 1); };

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
        setForm((f) => ({
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

  const validateStep1 = () => {
    if (!form.ownerFullName.trim() || !form.phoneNumber.trim() || !form.khatianNumber.trim() || !form.password.trim()) {
      setErrorMessage("Please fill in your name, phone number, Khatian Number and password to continue.");
      return;
    }
    if (linkedKhatianNumber && form.khatianNumber.trim() === linkedKhatianNumber) {
      setErrorMessage("This property needs its own new Khatian Number, different from the one you linked.");
      return;
    }
    if(form.phoneNumber.length<11){
      setErrorMessage("Please enter a valid 11-digit phone number.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    next();
  };

  const validateStep2 = () => {
    if (!form.housePropertyName.trim() || !form.houseAddress.trim() || !housePicture || !khatianCertificate) {
      setErrorMessage("Please add the property name and address, and upload both the house picture and Khatian certificate.");
      return;
    }
    next();
  };

  const submit = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();

      const temporaryOwnerId = user?.id || "65f1abc234def56789012345";
      formData.append("ownerId", temporaryOwnerId);

      formData.append("ownerFullName", form.ownerFullName);
      formData.append("phoneNumber", form.phoneNumber);
      formData.append("email", form.email.trim());
      formData.append("khatianNumber", form.khatianNumber);
      formData.append("password", form.password);
      formData.append("housePropertyName", form.housePropertyName);
      formData.append("houseAddress", form.houseAddress);
      formData.append("latitude", mapPosition[0]);
      formData.append("longitude", mapPosition[1]);

      // Only sent when the owner successfully looked up a previous property.
      // The server re-verifies it and links the new property to the owner group.
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

  /* ───────────────────────── SUCCESS SCREEN ───────────────────────── */
  if (submitted) {
    const rows = [
      [IoPersonOutline, form.ownerFullName],
      [IoCallOutline, form.phoneNumber],
      [IoMailOutline, form.email],
      [IoKeyOutline, `Khatian No: ${form.khatianNumber}`],
      [IoHomeOutline, form.housePropertyName],
      [IoLocationOutline, form.houseAddress],
      [IoMapOutline, `${mapPosition[0].toFixed(5)}, ${mapPosition[1].toFixed(5)}`],
      ...(linkedKhatianNumber
        ? [[IoLinkOutline, `Linked to: ${linkedPropertyName || linkedKhatianNumber}`]]
        : []),
    ];

    return (
      <div className="page">
        <Navbar page="home-register" go={go} />
        <div className="auth-wrap">
          <div className="auth-box" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                margin: "0 auto 1.1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.4rem",
                background: "var(--red-hover)",
                color: "var(--red)",
              }}
            >
              <IoCheckmarkCircle />
            </div>
            <h2>Registration <span>Submitted!</span></h2>
            <p style={{ color: "var(--gray-text)", margin: ".75rem 0 1.5rem", lineHeight: 1.6, fontSize: ".9rem" }}>
              <strong style={{ color: "var(--dark)" }}>{form.housePropertyName}</strong> is now pending admin review.
              Once approved, log in with your Khatian Number to manage your listing.
            </p>

            <div
              style={{
                background: "var(--gray-bg)",
                border: "1px solid var(--gray-mid)",
                borderRadius: 14,
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: ".6rem",
              }}
            >
              {rows.map(([Icon, text], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: ".65rem", fontSize: ".87rem" }}>
                  <Icon style={{ color: "var(--red)", fontSize: "1.05rem", flexShrink: 0 }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <button className="btn-submit" onClick={() => go("home")}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: ".45rem", justifyContent: "center" }}>
                <IoHomeOutline /> Back to Home
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────────────── FORM ───────────────────────── */
  const btnInner = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: ".45rem" };

  return (
    <div className="page">
      <Navbar page="home-register" go={go} />
      <div className="auth-wrap">
        <div className="auth-box wide">
          <button className="back-btn" onClick={() => go("home")}>
            <IoHomeOutline/> Back to Home
          </button>
          <h2>Register Your <span>Property</span></h2>
          <p className="subtitle">
            Add your details, pin the location, and send it for approval.
          </p>

          {/* ── Stepper ── */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "1.75rem" }}>
            {STEPS.map((s, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              const Icon = s.icon;
              return (
                <div key={n} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.15rem",
                        transition: "all .25s",
                        background: active ? "var(--red)" : done ? "var(--success)" : "var(--gray-bg)",
                        color: active || done ? "#fff" : "var(--gray-text)",
                        border: `2px solid ${active ? "var(--red)" : done ? "var(--success)" : "var(--gray-mid)"}`,
                        boxShadow: active ? "var(--shadow)" : "none",
                      }}
                    >
                      {done ? <IoCheckmark /> : <Icon />}
                    </div>
                    <span
                      style={{
                        fontSize: ".72rem",
                        fontWeight: active ? 700 : 600,
                        color: active ? "var(--red)" : "var(--gray-text)",
                        fontFamily: "'Sora', sans-serif",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        margin: "0 .6rem 1.2rem",
                        borderRadius: 2,
                        background: done ? "var(--success)" : "var(--gray-mid)",
                        transition: "background .25s",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {errorMessage && (
            <div
              style={{
                ...noteBox("var(--red)"),
                alignItems: "center",
                color: "var(--red)",
                fontWeight: 600,
                marginBottom: "1.1rem",
              }}
            >
              <IoWarningOutline style={{ fontSize: "1.2rem", flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── STEP 1 — OWNER & LOGIN ── */}
          {step === 1 && (
            <div>
              {!showLinkForm && !linkedKhatianNumber && (
                <button
                  type="button"
                  className="btn-submit secondary"
                  style={{ marginTop: 0, marginBottom: "1.25rem", fontSize: ".85rem" }}
                  onClick={() => setShowLinkForm(true)}
                >
                  <span style={btnInner}><IoLinkOutline /> Already registered a property? Link it</span>
                </button>
              )}

              {showLinkForm && !linkedKhatianNumber && (
                <div
                  style={{
                    background: "var(--gray-bg)",
                    border: "1px solid var(--gray-mid)",
                    borderRadius: 14,
                    padding: "1rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div style={{ fontWeight: 700, fontFamily: "'Sora', sans-serif", fontSize: ".92rem", marginBottom: ".35rem" }}>
                    Link a previous property
                  </div>
                  <p style={{ fontSize: ".8rem", color: "var(--gray-text)", marginBottom: ".8rem", lineHeight: 1.55 }}>
                    Enter a Khatian Number you registered before. We'll autofill your name and phone,
                    and show your reviews together.
                  </p>

                  {lookupError && (
                    <div style={{ color: "var(--red)", fontSize: ".8rem", fontWeight: 600, marginBottom: ".6rem", display: "flex", gap: 6, alignItems: "center" }}>
                      <IoWarningOutline /> {lookupError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: ".5rem", alignItems: "stretch" }}>
                    <div className="fg" style={{ flex: 1, marginBottom: 0 }}>
                      <div style={iconInputWrap}>
                        <IoKeyOutline style={iconLeft} />
                        <input
                          type="text"
                          placeholder="Previous Khatian Number"
                          value={prevKhatianInput}
                          onChange={(e) => setPrevKhatianInput(e.target.value)}
                          style={inputWithIcon}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-submit"
                      style={{ width: "auto", marginTop: 0, padding: "0 1.1rem", fontSize: ".85rem" }}
                      onClick={fetchPreviousOwnerInfo}
                      disabled={lookupLoading}
                    >
                      {lookupLoading ? "Looking..." : "Fetch"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setShowLinkForm(false); setLookupError(""); }}
                    style={{ marginTop: ".7rem", fontSize: ".8rem", background: "none", border: "none", color: "var(--gray-text)", textDecoration: "underline" }}
                  >
                    This is my first property
                  </button>
                </div>
              )}

              {linkedKhatianNumber && (
                <div style={{ ...noteBox("var(--success)"), marginBottom: "1.25rem" }}>
                  <IoCheckmarkCircle style={{ color: "var(--success)", fontSize: "1.3rem", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ color: "var(--dark)", fontWeight: 700, marginBottom: 2 }}>
                      Linked to {linkedPropertyName ? `"${linkedPropertyName}"` : "your previous property"}
                    </div>
                    Khatian No: {linkedKhatianNumber}. Your details were autofilled (still editable).
                    This property keeps its own Khatian Number and password.
                    <div>
                      <button
                        type="button"
                        onClick={clearLink}
                        style={{ marginTop: ".4rem", fontSize: ".8rem", background: "none", border: "none", color: "var(--red)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <IoCloseCircleOutline /> Unlink
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <Field label="Owner Full Name" icon={IoPersonOutline}>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.ownerFullName}
                  onChange={set("ownerFullName")}
                  style={inputWithIcon}
                />
              </Field>

              <Field label="Phone Number" icon={IoCallOutline}>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={form.phoneNumber}
                  maxLength={11}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (/^\d*$/.test(value)) {
                      set("phoneNumber")(e);
                    }
                  }}
                  pattern="[0-9]{11}"
                  title="Phone number must contain exactly 11 digits"
                  required
                  style={inputWithIcon}
                />
              </Field>

              <Field label="Email (admin messages will be sent here)" icon={IoMailOutline}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set("email")}
                  style={inputWithIcon}
                />
              </Field>

              {/* <div className="auth-divider" style={{ marginTop: "1.4rem" }}>
                <span>Login for this property</span>
              </div> */}

              <Field label="Khatian Number (Require for login)" icon={IoKeyOutline}>
                <input
                  type="text"
                  placeholder="This property's unique Khatian Number"
                  value={form.khatianNumber}
                  onChange={set("khatianNumber")}
                  style={inputWithIcon}
                />
              </Field>

              <Field label="Password (Require for login)" icon={IoLockClosedOutline}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={form.password}
                  onChange={set("password")}
                  style={{ ...inputWithIcon, paddingRight: "2.6rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--gray-text)",
                    fontSize: "1.1rem",
                    display: "flex",
                    padding: 4,
                  }}
                >
                  {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </button>
              </Field>

              <div className="step-actions">
                <button className="btn-submit" onClick={validateStep1}>
                  <span style={btnInner}>Continue <IoArrowForward /></span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 — PROPERTY & FILES ── */}
          {step === 2 && (
            <div>
              <Field label="Property Name" icon={IoHomeOutline}>
                <input
                  type="text"
                  placeholder="e.g. Green Valley Boarding"
                  value={form.housePropertyName}
                  onChange={set("housePropertyName")}
                  style={inputWithIcon}
                />
              </Field>

              <Field label="House Number / Address" icon={IoLocationOutline}>
                <input
                  type="text"
                  placeholder="e.g. House 12, Road 5, BoardBazar"
                  value={form.houseAddress}
                  onChange={set("houseAddress")}
                  style={inputWithIcon}
                />
              </Field>

              <div className="fg">
                <label>Location on Map</label>
                <LocationMap
                  title="Choose Property Location"
                  description="Drag the pin to match the exact property entrance."
                  center={mapPosition}
                  markerPosition={mapPosition}
                  draggable
                  zoom={16}
                  height={300}
                  onPositionChange={setMapPosition}
                />
                <div className="map-coordinates" style={{ marginTop: ".5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <IoMapOutline /> {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
                </div>
              </div>

              <FileDrop
                label="House Picture"
                icon={IoImageOutline}
                accept="image/*"
                file={housePicture}
                onChange={setHousePicture}
                hint="PNG or JPG"
              />

              <FileDrop
                label="Khatian Certificate"
                icon={IoDocumentTextOutline}
                accept="image/*,application/pdf"
                file={khatianCertificate}
                onChange={setKhatianCertificate}
                hint="Image or PDF"
              />

              <div className="step-actions">
                <button className="btn-submit secondary" onClick={prev}>
                  <span style={btnInner}><IoArrowBack /> Back</span>
                </button>
                <button className="btn-submit" onClick={validateStep2}>
                  <span style={btnInner}>Review <IoArrowForward /></span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — REVIEW & SUBMIT ── */}
          {step === 3 && (
            <div>
              <div
                style={{
                  border: "1.5px solid var(--gray-mid)",
                  borderRadius: 14,
                  padding: ".35rem 1.1rem",
                  background: "var(--gray-bg)",
                }}
              >
                {[
                  [IoPersonOutline, "Owner", form.ownerFullName || "—"],
                  [IoCallOutline, "Phone", form.phoneNumber || "—"],
                  [IoMailOutline, "Email", form.email || "—"],
                  [IoKeyOutline, "Khatian No.", form.khatianNumber || "—"],
                  [IoLockClosedOutline, "Password", form.password ? "•".repeat(form.password.length) : "—"],
                  [IoHomeOutline, "Property", form.housePropertyName || "—"],
                  [IoLocationOutline, "Address", form.houseAddress || "—"],
                  [IoMapOutline, "Coordinates", `${mapPosition[0].toFixed(5)}, ${mapPosition[1].toFixed(5)}`],
                  ...(linkedKhatianNumber
                    ? [[IoLinkOutline, "Linked to", linkedPropertyName || linkedKhatianNumber]]
                    : []),
                ].map(([Icon, k, v]) => (
                  <div className="summary-row" key={k} style={{ gap: "1rem" }}>
                    <span className="summary-key" style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                      <Icon style={{ color: "var(--red)", fontSize: "1.05rem" }} /> {k}
                    </span>
                    <span className="summary-value" style={{ textAlign: "right", wordBreak: "break-word" }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginTop: ".9rem" }}>
                {[
                  [IoImageOutline, housePicture],
                  [IoDocumentTextOutline, khatianCertificate],
                ].map(([Icon, file], i) => (
                  <span
                    key={i}
                    className="tag-chip"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%" }}
                  >
                    <Icon />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file ? file.name : "Missing file"}
                    </span>
                  </span>
                ))}
              </div>

              <div style={{ ...noteBox("var(--red)"), marginTop: "1.1rem" }}>
                <IoTimeOutline style={{ color: "var(--red)", fontSize: "1.25rem", flexShrink: 0, marginTop: 1 }} />
                <span>
                  An <strong style={{ color: "var(--dark)" }}>admin will review</strong> your registration.
                  You can log in with your Khatian Number and password once approved.
                  {linkedKhatianNumber && " Reviews will combine with your linked property after approval."}
                </span>
              </div>

              <div className="step-actions" style={{ marginTop: "1.4rem" }}>
                <button className="btn-submit secondary" onClick={prev} disabled={loading}>
                  <span style={btnInner}><IoArrowBack /> Edit</span>
                </button>
                <button className="btn-submit" onClick={submit} disabled={loading}>
                  {loading ? "Registering..." : "Submit for Approval"}
                </button>
              </div>
            </div>
          )}

          <p className="auth-foot">
            Already approved?{" "}
            <button onClick={() => go("login")}>Login as Home Owner</button>
          </p>
          <p className="auth-foot">
            Have more properties?{" "}
            <button onClick={() => { setStep(1); setShowLinkForm(true); }}>Register another property</button>
          </p>
        </div>
      </div>
    </div>
  );
}