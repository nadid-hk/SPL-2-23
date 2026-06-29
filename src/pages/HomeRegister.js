import { useState } from "react";
import Navbar from "../components/Navbar";
import LocationMap from "../components/LocationMap";

export default function HomeRegister({ go }) {
  const [form, setForm] = useState({
    owner: "",
    phone: "",
    houseName: "",
    houseNo: "",
  });
  const [mapPosition, setMapPosition] = useState([23.9482, 90.3794]);
  const [submitted, setSubmitted] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = e => {
    e.preventDefault();
    setSubmitted(true);
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
              Your property registration for <strong>{form.houseName}</strong> is pending admin review.
              Once approved, you'll be able to log in and manage your listing.
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
              <div>👤 {form.owner}</div>
              <div>📞 {form.phone}</div>
              <div>🏠 {form.houseName}</div>
              <div>📍 {form.houseNo}</div>
              <div>🗺️ {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}</div>
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
            Fill in your details and pin your property on the map. An admin will verify and approve your registration.
          </p>

          <div className="auth-divider"><span>owner &amp; property details</span></div>

          <form onSubmit={submit}>
            <div className="fg">
              <label>Owner Full Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={form.owner}
                onChange={set("owner")}
                required
              />
            </div>

            <div className="fg">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+880 1X XX XXX XXXX"
                value={form.phone}
                onChange={set("phone")}
                required
              />
            </div>

            <div className="fg">
              <label>House / Property Name</label>
              <input
                type="text"
                placeholder="e.g. Green Valley Boarding"
                value={form.houseName}
                onChange={set("houseName")}
                required
              />
            </div>

            <div className="fg">
              <label>House Number / Address</label>
              <input
                type="text"
                placeholder="e.g. House 12, Road 5, BoardBazar"
                value={form.houseNo}
                onChange={set("houseNo")}
                required
              />
            </div>

            <div className="fg">
              <label>House Picture</label>
              <div className="uc-box">
                <div className="uc-icon"></div>
                <p>Photo upload feature</p>
                <span className="badge">Under Construction</span>
              </div>
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
              <label>Khatian Certificate</label>
              <div className="uc-box">
                <div className="uc-icon"></div>
                <p>For authentication</p>
                <span className="badge">Under Construction</span>
              </div>
            </div>

            <div style={{
              background: "#fff8e1",
              border: "1px solid #ffe082",
              borderRadius: 8,
              padding: ".85rem 1rem",
              fontSize: ".82rem",
              color: "#795548",
              marginBottom: "1.2rem",
              lineHeight: 1.6
            }}>
              ⏳ After submitting, an <strong>admin will review</strong> your registration and all the details above.
              You'll get access to log in once confirmed.
            </div>

            <button type="submit" className="btn-submit">Submit for Admin Approval</button>
          </form>

          <p className="auth-foot">
            Already approved?{" "}
            <button onClick={() => go("login")}>Login as Home Owner</button>
          </p>
        </div>
      </div>
    </div>
  );
}