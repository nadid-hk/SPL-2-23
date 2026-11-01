import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { API_BASE } from "../config";
import { FaCameraRetro } from "react-icons/fa";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { FaHouseChimney } from "react-icons/fa6";
import { VscSymbolProperty } from "react-icons/vsc";
import { IoHomeOutline } from "react-icons/io5";
import { FiImage, FiFileText, FiList, FiSend, FiCheck, FiArrowLeft, FiArrowRight, FiAlertTriangle, FiInfo, FiCheckCircle, FiUser, FiPhone, FiClock, FiZap, FiShield, FiDroplet, FiBatteryCharging, FiClipboard } from "react-icons/fi";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { MdOutlineElevator, MdOutlineLocalFireDepartment } from "react-icons/md";

const AMENITIES = [
  "Oven", "Fridge", "Washing Machine", "AC",
  "Balcony", "Attached Bath", "Shared Kitchen",
  "Wi-Fi", "Rooftop Access", "Generator",
];

const DEPARTMENTS = ["CSE", "EEE", "MPE", "CIVIL", "BTM"];

const GATE_TIMES = [
  "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM",
  "11:00 PM", "11:30 PM", "12:00 AM", "No Gate / 24hr Open",
];

const UTILITY_OPTIONS = [
  { key: "electricity24_7",   label: "24/7 Electricity (Backup available)", value: "24/7 Electricity" },
  { key: "ips",               label: "IPS Available",                       value: "IPS" },
  { key: "lift",               label: "Lift / Elevator",                     value: "Lift" },
  { key: "security",          label: "Security Guard",                      value: "Security Guard" },
  { key: "gas",               label: "Gas Available",                       value: "Gas" },
  { key: "waterBillIncluded", label: "Water Bill Included in Rent",         value: "Water Bill Included" },
];

const STEPS = [
  { label: "Photos",        icon: <FiImage /> },
  { label: "Details",       icon: <FaHouseChimney /> },
  { label: "Facilities",    icon: <FiList /> },
  { label: "Preview & Post", icon: <FiFileText /> },
];
export default function Post({ go, user }) {
  const handleProfileClick = () => go("profile");

  // Step 0 = "Are you posting as an owner or a student?"
  const [step, setStep] = useState(0);

  const [houses, setHouses] = useState([]);
  const [housesLoading, setHousesLoading] = useState(true);
  const [housesError, setHousesError] = useState("");

  const [form, setForm] = useState({
    postedAs:          "",   // "owner" | "student"
    khatianNumber:     "",   // owner only — re-entered to look up HomeRegister
    studentDepartment: "",   // student only
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
  // const [photo3, setPhoto3] = useState(null);


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

  const isOwner = form.postedAs === "owner";
  const isStudent = form.postedAs === "student";

  // Students pick from the approved-properties list. Owners never need it:
  // their property is resolved from the Khatian number they enter first.
  useEffect(() => {
    if (!isStudent) return;
    const fetchApprovedHouses = async () => {
      setHousesLoading(true);
      setHousesError("");
      try {
        const response = await fetch(`${API_BASE}/home-register/approved`);
        const result = await response.json();
        if (response.ok && result.success) {
          setHouses(result.data || []);
        } else {
          throw new Error(result.message || "Could not load approved properties.");
        }
      } catch (err) {
        setHousesError(err.message);
      } finally {
        setHousesLoading(false);
      }
    };
    fetchApprovedHouses();
  }, [isStudent]);

  // ── Owner gate: the Khatian number is looked up in HomeRegister and the
  // property, address, owner name and phone all come back from there.
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const selectedHouse = isOwner
    ? (ownerInfo
        ? {
            _id: ownerInfo.registeredHouse,
            housePropertyName: ownerInfo.housePropertyName,
            ownerFullName: ownerInfo.ownerFullName,
          }
        : undefined)
    : houses.find(h => h._id === form.registeredHouse);

  // Real owner of the selected property (HomeRegister.ownerFullName) for the
  // student flow — NOT the logged-in user's account name.
  const [ownerName, setOwnerName] = useState("");
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState("");

  useEffect(() => {
    if (!isStudent || !form.registeredHouse) { setOwnerName(""); setOwnerError(""); return; }
    let cancelled = false;
    setOwnerLoading(true);
    setOwnerError("");
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/ownerinfo/${form.registeredHouse}/owner-info`, { credentials: "include" });
        const data = await res.json();
        // Accept either { data: { ownerFullName } } or { ownerFullName }
        const name = data?.data?.ownerFullName || data?.ownerFullName || "";
        if (cancelled) return;
        if (res.ok && name) {
          setOwnerName(name);
        } else {
          setOwnerName("");
          setOwnerError(data?.message || `Could not load owner (status ${res.status})`);
        }
      } catch (err) {
        if (!cancelled) { setOwnerName(""); setOwnerError(err.message); }
      } finally {
        if (!cancelled) setOwnerLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [form.registeredHouse, isStudent]);

  // Owner: from HomeRegister via the Khatian lookup.
  // Student: the selected property's owner.
  const displayOwnerName = isOwner
    ? (ownerInfo?.ownerFullName || "")
    : (ownerName || selectedHouse?.ownerFullName || "");

  // Editing the Khatian number invalidates a previous verification and
  // clears everything that was auto-filled from it.
  useEffect(() => {
    setOwnerVerified(false);
    setOwnerInfo(null);
    setVerifyError("");
    setForm(f => (f.postedAs === "owner" ? { ...f, registeredHouse: "", contactPhone: "" } : f));
  }, [form.khatianNumber]);

  const chooseRole = (role) => {
    setForm(f => ({
      ...f,
      postedAs: role,
      khatianNumber: "",
      registeredHouse: "",
      studentDepartment: "",
      // owner phone comes from HomeRegister after the Khatian lookup;
      // student phone is typed (prefilled from the account if known).
      contactPhone: role === "student" ? (user?.phone || user?.mobile || "") : "",
    }));
    setOwnerVerified(false);
    setOwnerInfo(null);
    setVerifyError("");
    setErrorMessage("");
    // Students go straight on. Owners must pass the Khatian gate first.
    if (role === "student") setStep(1);
  };

  const resetRole = () => {
    setForm(f => ({ ...f, postedAs: "", khatianNumber: "", registeredHouse: "", contactPhone: "" }));
    setOwnerVerified(false);
    setOwnerInfo(null);
    setVerifyError("");
  };

  const verifyOwner = async () => {
    if (!form.khatianNumber.trim()) { setVerifyError("Enter your Khatian number."); return; }
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch(`${API_BASE}/posts/verify-owner`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ khatianNumber: form.khatianNumber.trim() }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setOwnerInfo(result.data);
        setForm(f => ({
          ...f,
          registeredHouse: result.data.registeredHouse,
          contactPhone: result.data.phoneNumber || "",
        }));
        setOwnerVerified(true);
      } else {
        throw new Error(result.message || "Could not verify Khatian number.");
      }
    } catch (err) {
      setOwnerVerified(false);
      setOwnerInfo(null);
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  };

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

      // Owners: the server re-resolves the property from the Khatian number and
      // ignores registeredHouse; students: the property they selected.
      formData.append("registeredHouse", form.registeredHouse);
      formData.append("ownerName", displayOwnerName); // property owner, not the logged-in account
      formData.append("contactPhone", form.contactPhone); // owner: from HomeRegister; student: typed
      formData.append("postedAs", form.postedAs);
      if (isOwner) formData.append("khatianNumber", form.khatianNumber.trim());
      if (isStudent) formData.append("studentDepartment", form.studentDepartment.trim());
      formData.append("monthlyRent", form.rent);
      formData.append("gateClosedTime", form.gateCloseTime);

      const utilities = UTILITY_OPTIONS.filter(u => form[u.key]).map(u => u.value);
      formData.append("utilities", JSON.stringify(utilities));
      formData.append("features", JSON.stringify(form.amenities));
      formData.append("reasonTenantLeft", form.reasonToLeave);

      if (photo1) formData.append("photos", photo1);
      if (photo2) formData.append("photos", photo2);
      // if (photo3) formData.append("photos", photo3);

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
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem", color: "var(--success)", display: "flex", justifyContent: "center" }}><FiCheckCircle /></div>
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
        <button className="back-btn" onClick={() => go("dashboard")}><IoHomeOutline /> Back to Home</button>
        <h2 className="post-title">Post Your <span>Rentable House</span></h2>
        <p className="post-sub">Complete the steps below to submit your listing. Admin will approve before it goes live.</p>

        {errorMessage && (
          <div className="notice error"><FiAlertTriangle /> <span>{errorMessage}</span></div>
        )}

        {step >= 1 && (
          <div className="step-bar">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const cls = step === n ? "active" : step > n ? "done" : "";
              return <div key={n} className={`step-item ${cls}`}>{step > n ? <FiCheck /> : s.icon}<span>{s.label}</span></div>;
            })}
          </div>
        )}

        {/* ── STEP 0 — WHO ARE YOU POSTING AS? (owners pass the Khatian gate here) ── */}
        {step === 0 && (
          <div className="profile-section">
            {!isOwner && (
              <>
                <div className="profile-section-title">Who is posting?</div>
                <p style={{ fontSize: ".85rem", color: "var(--gray-text)", marginBottom: "1rem" }}>
                  Owners confirm their Khatian number first, and their property details are filled in automatically.
                  Students enter their department and their own phone number.
                </p>
                <div className="photo-grid">
                  <button type="button" className="photo-slot" style={{ cursor: "pointer" }} onClick={() => chooseRole("owner")}>
                    <span className="slot-icon"><FaHouseChimney /></span>
                    <span className="slot-label">I'm the property owner</span>
                  </button>
                  <button type="button" className="photo-slot" style={{ cursor: "pointer" }} onClick={() => chooseRole("student")}>
                    <span className="slot-icon"><FiUser /></span>
                    <span className="slot-label">I'm a student</span>
                  </button>
                </div>
              </>
            )}

            {isOwner && (
              <>
                <div className="profile-section-title">Confirm you're the owner</div>
                <p style={{ fontSize: ".85rem", color: "var(--gray-text)", marginBottom: "1rem" }}>
                  Enter the Khatian number you used when registering your property. We'll load your property details from your registration.
                </p>

               <div className="fg">
                <label>Khatian Number</label>
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                  <input
                    type="text"
                    placeholder="Enter your Khatian number"
                    value={form.khatianNumber}
                    onChange={set("khatianNumber")}
                    onKeyDown={(e) => { if (e.key === "Enter" && !ownerVerified && !verifying) verifyOwner(); }}
                    style={{ width: "100%" }}
                  />
                  <button 
                    type="button" 
                    onClick={verifyOwner} 
                    disabled={verifying || ownerVerified}
                    className="btn-submit secondary btn-icon"
                    style={{ width: "auto", margin: 0, padding: ".75rem 2.25rem", color: "var(--red)", border: "1.5px solid var(--gray-mid)", fontSize: ".92rem" }}
                  >
                    {verifying ? "Checking..." : ownerVerified ? "Verified" : "Verify"}
                  </button>
                </div>
                {verifyError && (
                  <div className="notice error" style={{ marginTop: ".5rem" }}><FiAlertTriangle /> <span>{verifyError}</span></div>
                )}
              </div>
                {ownerVerified && ownerInfo && (
                  <>
                    <div className="notice" style={{ marginBottom: ".75rem" }}>
                      <FiCheckCircle /> <span>Verified. These details come from your registration and will be filled in on your post.</span>
                    </div>
                    {[
                      [<FaHouseChimney />, "House Name", ownerInfo.housePropertyName],
                      [<FiUser />, "Property Owner", ownerInfo.ownerFullName],
                      [<FiPhone />, "Contact Phone", ownerInfo.phoneNumber],
                      [<IoHomeOutline />, "Address", ownerInfo.houseAddress],
                    ].map(([icon, k, v]) => (
                      <div className="summary-row" key={k}>
                        <span className="summary-key" style={{ display: "inline-flex", alignItems: "center", gap: ".5rem" }}><span style={{ color: "var(--red)", display: "flex" }}>{icon}</span>{k}</span>
                        <span className="summary-value">{v || "—"}</span>
                      </div>
                    ))}
                  </>
                )}

                <div className="step-actions" style={{ marginTop: "1.2rem" }}>
                  <button className="btn-submit secondary btn-icon" onClick={resetRole}><FiArrowLeft /> Back</button>
                  <button
                    className="btn-submit btn-icon"
                    onClick={() => { setErrorMessage(""); next(); }}
                    disabled={!ownerVerified}
                  >
                    Continue <FiArrowRight />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 1 — PHOTOS ── */}
        {step === 1 && (
          <div className="profile-section">
            <div className="profile-section-title">Upload 2 House Photos</div>
            <p style={{ fontSize: ".85rem", color: "var(--gray-text)", marginBottom: "1rem" }}>
              All photos are required and will be uploaded when you submit for review.
            </p>

            <div className="photo-grid">
              {[
                { n: 1, file: photo1, setFile: setPhoto1 },
                { n: 2, file: photo2, setFile: setPhoto2 },
                // { n: 3, file: photo3, setFile: setPhoto3 },
                // { n: 3, file: photo3, setFile: setPhoto2 },
              ].map(({ n, file, setFile }) => (
                <label key={n} className={`photo-slot${file ? " selected" : ""}`} style={{ cursor: "pointer" }}>
                  <span className="slot-icon">{file ? <IoIosCheckmarkCircle style={{
                    color:"green",
                    fontSize:"18px"
                  }}/>: <FaCameraRetro />}</span>
                  <span className="slot-label">{file  ? file.name : n === 1  ? `Room picture ${n}` : `Washroom picture ${n}`}</span>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0] || null)} />
                </label>
              ))}
            </div>

            <div className="step-actions">
              <button className="btn-submit secondary btn-icon" onClick={prev}><FiArrowLeft /> Back</button>
              <button className="btn-submit btn-icon" onClick={() => {
                // ||!photo3
                if (!photo1 || !photo2 ) {
                  alert("Please select all photo slots to continue.");
                  return;
                }
                next();
              }}>
                Continue <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 — PROPERTY DETAILS ── */}
        {step === 2 && (
          <div className="profile-section">
            <div className="profile-section-title"> <span style={{ display: "flex", alignItems: "center" ,gap:"8px"}}><FaHouseChimney style={{fontSize:"15px",alignContent:"center"}}/>House Details </span></div>

            <div className="fg">
              <label>House Name</label>
              {isOwner ? (
                <input type="text" value={ownerInfo?.housePropertyName || ""} readOnly style={{ background: "var(--gray-bg)", color: "var(--dark)", fontWeight: 600, cursor: "not-allowed" }} />
              ) : housesLoading ? (
                <div style={{ fontSize: ".85rem", color: "var(--gray-text)" }}>Loading your approved properties...</div>
              ) : housesError ? (
                <div className="notice error" style={{ marginBottom: 0 }}><FiAlertTriangle /> <span>{housesError}</span></div>
              ) : houses.length === 0 ? (
                <div className="notice warn" style={{ marginBottom: 0 }}>
                  <FiInfo /> <span>You don't have any admin-approved properties yet. Register a property first, and once an admin approves it, it will show up here.</span>
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
              <label>Property Owner</label>
              <input type="text" value={
                  displayOwnerName ||
                  (!form.registeredHouse ? "Select a property first"
                    : ownerLoading ? "Loading..."
                    : ownerError ? "Owner not found" : "—")
                } readOnly style={{ background: "var(--gray-bg)", color: "var(--dark)", fontWeight: 600, cursor: "not-allowed" }} />
            </div>

            {isOwner && (
              <div className="fg">
                <label>House Address</label>
                <input type="text" value={ownerInfo?.houseAddress || ""} readOnly style={{ background: "var(--gray-bg)", color: "var(--dark)", cursor: "not-allowed" }} />
              </div>
            )}

            {isStudent && (
              <div className="fg">
                <label>Your Department</label>
                <select value={form.studentDepartment} onChange={set("studentDepartment")}>
                  <option value="">— Select your department —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            <div className="fg">
              <label>Contact Phone{isOwner ? " (from your registration)" : ""}</label>
              <input
                type="text"
                placeholder="01XXXXXXXXX"
                value={form.contactPhone}
                maxLength={11}
                readOnly={isOwner}
                style={isOwner ? { background: "var(--gray-bg)", cursor: "not-allowed" } : undefined}
                onChange={(e) => {
                  if (isOwner) return;
                  if (/^\d*$/.test(e.target.value)) set("contactPhone")(e);
                }}
                title="Phone number must contain exactly 11 digits"
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
              <button className="btn-submit secondary btn-icon" onClick={prev}><FiArrowLeft /> Back</button>
              <button className="btn-submit btn-icon" onClick={() => {
                if (!form.registeredHouse || !form.rent) {
                  alert("Please select a property and fill in the rent.");
                  return;
                }
                if (isOwner && !ownerVerified) {
                  setErrorMessage("Please go back and confirm your Khatian number first.");
                  return;
                }
                if (isStudent && !form.studentDepartment) {
                  setErrorMessage("Please select your department.");
                  return;
                }
                if (!form.contactPhone.trim() || form.contactPhone.length < 11) {
                  setErrorMessage("Please enter a valid 11-digit phone number.");
                  return;
                }
                next();
              }}>
                Continue <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — FACILITIES ── */}
        {step === 3 && (
          <div className="profile-section">
            <div className="profile-section-title"><span style={{ display: "flex", alignItems: "center" ,gap:"8px"}}><VscSymbolProperty style={{fontSize:"15px",alignContent:"center"}}/> Facilities & Details</span></div>

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
                  {form.amenities.includes(a) && <FiCheck style={{ marginRight: 4, verticalAlign: "-2px" }} />}{a}
                </button>
              ))}
            </div>

            <div className="fg" style={{ marginTop: "1rem" }}>
              <label>Reason Previous Tenant Left (optional)</label>
              <textarea placeholder="e.g. Graduated, moved to campus dorm..." value={form.reasonToLeave} onChange={set("reasonToLeave")} />
            </div>

            <div className="step-actions">
              <button className="btn-submit secondary btn-icon" onClick={prev}><FiArrowLeft /> Back</button>
              <button className="btn-submit btn-icon" onClick={next}>Review Post <FiArrowRight /></button>
            </div>
          </div>
        )}

        {/* ── STEP 4 — REVIEW & SUBMIT ── */}
        {step === 4 && (
          <div className="profile-section">
            <div className="profile-section-title"><IoIosCheckmarkCircle style={{
                    color:"green",
                    fontSize:"18px"
                  }}/> Review Your Post</div>

            {[
              [<FaHouseChimney />, "House Name",       selectedHouse?.housePropertyName || "—"],
              [<FiUser />, "Property Owner",      displayOwnerName || "—"],
              [<FiUser />, "Posting As",        isOwner ? "Property Owner" : "Student"],
              ...(isStudent ? [[<FiClipboard />, "Department", form.studentDepartment || "—"]] : []),
              [<FiPhone />, "Contact Phone",    form.contactPhone || "—"],
              [<FaBangladeshiTakaSign />, "Monthly Rent",    `৳${form.rent}`],
              [<FiClock />, "Gate Closes",      form.gateCloseTime || "Not specified"],
              [<FiZap />, "24/7 Electricity", form.electricity24_7 ? "Yes" : "No"],
              [<FiBatteryCharging />, "IPS",              form.ips       ? "Yes" : "No"],
              [<MdOutlineElevator />, "Lift",             form.lift      ? "Yes" : "No"],
              [<FiShield />, "Security",         form.security  ? "Yes" : "No"],
              [<MdOutlineLocalFireDepartment />, "Gas",              form.gas       ? "Yes" : "No"],
              [<FiDroplet />, "Water Bill",       form.waterBillIncluded ? "Included" : "Not included"],
             ].map(([icon, k, v]) => (
              <div className="summary-row" key={k}>
                <span className="summary-key" style={{ display: "inline-flex", alignItems: "center", gap: ".5rem" }}><span style={{ color: "var(--red)", display: "flex" }}>{icon}</span>{k}</span>
                <span className="summary-value">{v}</span>
              </div>
            ))}

            {/* 👉 Removed Redundant Address Rows and Location Map Review layout boxes completely from preview view layer parameters */}

            {form.amenities.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 700, marginBottom: ".45rem", color: "var(--gray-text)" }}>Amenities</div>
                <div className="chips-row">
                  {form.amenities.map(a => <span className="tag-chip" key={a}><IoIosCheckmarkCircle style={{
                    color:"green",
                    fontSize:"18px"
                  }}/> {a}</span>)}
                </div>
              </div>
            )}

            {form.reasonToLeave && (
              <div className="reason-box" style={{ marginTop: "1rem" }}>
                <div className="reason-label" style={{ display: "flex", alignItems: "center", gap: ".4rem" }}><FiClipboard /> Reason Tenant Left</div>
                <p>{form.reasonToLeave}</p>
              </div>
            )}

            <div style={{ marginTop: "1rem", background: "var(--gray-bg)", borderRadius: 10, padding: "12px 14px", fontSize: ".82rem", color: "var(--gray-text)" }}>
               <strong>{[photo1, photo2].filter(Boolean).length} of 2 photos selected</strong> — {photo1?.name}{photo1 && photo2  ? ", " : ""}{photo2?.name}
            </div>

            <div className="notice warn" style={{ marginTop: "1rem" }}>
              <FiInfo /> <span><strong>Admin Review Required</strong> — your post will be visible on the dashboard only after an admin approves it.</span>
            </div>

            <div className="step-actions" style={{ marginTop: "1.4rem" }}>
              <button className="btn-submit secondary btn-icon" onClick={prev}><FiArrowLeft /> Edit</button>
              <button className="btn-submit btn-icon" onClick={submitPost} disabled={loading}>
                {loading ? "Uploading & Submitting..." : <><FiSend /> Submit for Review</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}