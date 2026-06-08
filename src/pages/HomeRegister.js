import { useState } from "react";
import Navbar from "../components/Navbar";
import LocationMap from "../components/LocationMap";

export default function HomeRegister({ go }) {
  const [form, setForm] = useState({ owner: "", phone: "", houseName: "", houseNo: "" });
  const [mapPosition, setMapPosition] = useState([24.242, 90.404]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = e => {
    e.preventDefault();
    alert(`Property registered\nSelected location: ${mapPosition[0].toFixed(5)}, ${mapPosition[1].toFixed(5)}`);
    go("login");
  };

  return (
    <div className="page">
      <Navbar page="home-register" go={go} />
      <div className="auth-wrap">
        <div className="auth-box wide">
          <button className="back-btn" onClick={() => go("home")}>← Back to Home</button>
          <h2>Register Your <span>Property</span></h2>
          <p className="subtitle">List your house on KHOJ and connect with IUT students</p>

          <form onSubmit={submit}>
            <div className="fg">
              <label>Owner Full Name</label>
              <input type="text" placeholder="Your full name" value={form.owner} onChange={set("owner")} required />
            </div>
            <div className="fg">
              <label>Phone Number</label>
              <input type="tel" placeholder="+880 1X XX XXX XXXX" value={form.phone} onChange={set("phone")} required />
            </div>
            <div className="fg">
              <label>House / Property Name</label>
              <input type="text" placeholder="e.g. Green Valley Boarding" value={form.houseName} onChange={set("houseName")} required />
            </div>
            <div className="fg">
              <label>House Number / Address</label>
              <input type="text" placeholder="e.g. House 12, Road 5, BoardBazar" value={form.houseNo} onChange={set("houseNo")} required />
            </div>

            <div className="fg">
              <label>House Picture</label>
              <div className="uc-box">
                <div className="uc-icon"></div>
                <p>Photo upload feature</p>
                <span className="badge"> Under Construction</span>
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
                <span className="badge"> Under Construction</span>
              </div>
            </div>

            <button type="submit" className="btn-submit">Register My House</button>
          </form>

          <p className="auth-foot">
            Already registered?{" "}
            <button onClick={() => go("login")}>Login as Home Owner</button>
          </p>
        </div>
      </div>
    </div>
  );
}
