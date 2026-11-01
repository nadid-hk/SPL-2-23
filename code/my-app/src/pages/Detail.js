import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import LocationMap from "../components/LocationMap";
import StayReviews from "../components/StayReviews";
import TenantPicker from "../components/TenantPicker";
// ─── CHAT FEATURE (Talha) ───
import MessageOwnerButton from "../components/MessageOwnerButton";
import { API_BASE } from "../config";
// ─── END CHAT FEATURE ───
// import { CiSaveDown2 } from "react-icons/ci";
import { IoCall } from "react-icons/io5";
import { FiArrowLeft, FiCheckCircle, FiZap, FiShield, FiClock, FiDroplet, FiBatteryCharging } from "react-icons/fi";
import { MdOutlineElevator, MdOutlineLocalFireDepartment, MdOutlineAdminPanelSettings } from "react-icons/md";
import { FaStar, FaBangladeshiTakaSign, FaHouseChimney } from "react-icons/fa6";
import { BsCircleFill } from "react-icons/bs";

export default function Detail({ go, user, house }) {
  // `house.registeredHouse` is the populated property document (the same
  // one `isThisOwner` below compares `.owner` against).
  const homeRegisterId = house?.registeredHouse?._id || house?.registeredHouse?.id || null;

  // The listing's real owner (HomeRegister.ownerFullName). `house.ownerName`
  // is NOT used for display: it was filled with the logged-in poster's
  // account name, which isn't necessarily the property owner.
  const [fetchedOwnerName, setFetchedOwnerName] = useState("");
  const [fetchedOwnerPhone, setFetchedOwnerPhone] = useState("");

  useEffect(() => {
    if (!homeRegisterId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/ownerinfo/${homeRegisterId}/owner-info`, { credentials: "include" });
        const data = await res.json();
        if (!cancelled && res.ok && data.success) {
          setFetchedOwnerName(data.data.ownerFullName || "");
          // Only present if the owner-info endpoint returns it; otherwise the
          // populated registeredHouse.phoneNumber is used.
          setFetchedOwnerPhone(data.data.phoneNumber || "");
        }
      } catch (err) {
        console.error("Failed to load owner info:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [homeRegisterId]);

  // Room review summary (count + overall), reported by <StayReviews> so the
  // rating chip under the title stays in sync after a tenant posts.
  const [flatSummary, setFlatSummary] = useState(null);
  const handleSummary = useCallback((stats) => setFlatSummary(stats), []);
  // ── FIX: `house` here IS the Post object, and Post.isRented is the real,
  // authoritative field (it already existed on the schema). The earlier
  // nested guesses (registeredHouse.isRented / homeRegister.isRented) were
  // wrong — that flag lives on the Post/listing itself, not on the
  // underlying HomeRegister document.
  const [isRented, setIsRented] = useState(house?.isRented || false);
  const [showRentedConfirm, setShowRentedConfirm] = useState(false);
  const [rentalUpdating, setRentalUpdating] = useState(false);

  const handleProfileClick = () => go("profile");

  // Determine role
  // ── FIX: profile.service.js's updateUserProfileService actually assigns
  // role: "owner" (not "homeowner") to homeowner accounts. This mismatch
  // meant isHomeOwner — and therefore isThisOwner — was ALWAYS false for
  // real owners, which is why they never saw the rent/available controls
  // and were incorrectly treated as students (including seeing the review
  // form, which should be student-only).
  const isHomeOwner = user?.role === "owner";
  const isAdmin     = user?.role === "admin";
  const isStudent   = !isHomeOwner && !isAdmin;

  // Resolve cross-compatible property names from database model safely
  const houseName = house?.name || house?.registeredHouse?.housePropertyName || "Property Listing";
  const fullAddressStr = house?.fullAddress || house?.location || "Address not provided";
  const displayOwnerName = fetchedOwnerName || house?.registeredHouse?.ownerFullName || "Verified Owner";
  // The homeowner's registered phone (HomeRegister), NOT the phone typed on
  // the post — a student poster's number must never be shown as the owner's.
  // Old posts without it fall back to the post's phone.
  const displayContactPhone =
    fetchedOwnerPhone || house?.registeredHouse?.phoneNumber || house?.contactPhone || "N/A";

  // Who created the listing: the homeowner themself, or a student.
  const postedByStudent = house?.postedAs === "student";
  const postedByLabel = postedByStudent
    ? `Posted by ${house?.posterName || "a student"}${house?.studentDepartment ? ` (${house.studentDepartment})` : ""}`
    : "Posted by the homeowner";
  const monthlyRentAmount = house?.monthlyRent || house?.rent || 0;

  // ── FIX: compare real database IDs instead of fragile name-matching.
  // `house.registeredHouse.owner` is the actual HomeRegister owner ObjectId
  // (now returned because post.service.js's populate select includes
  // `owner`). The old checks compared display names and a `user.ownedHouseId`
  // field that doesn't exist anywhere in the schema, so isThisOwner was
  // essentially always false — which is why the homeowner only ever saw the
  // student review UI instead of their own controls.
  const isThisOwner = isHomeOwner && Boolean(
    user?._id &&
    house?.registeredHouse?.owner &&
    String(user._id) === String(house.registeredHouse.owner)
  );

  const targetImages = house?.photos?.map(p => p.url) || [
    "/images/spacejoy-nEtpvJjnPVo-unsplash.jpg",
    "/images/minh-pham-OtXADkUh3-I-unsplash.jpg",
    "/images/pexels-quang-nguyen-vinh-222549-14021929.jpg"
  ];

  // Third gallery image: the house's exterior picture uploaded at
  // registration (HomeRegister.housePicture.url). It comes through
  // `house.registeredHouse` because post.service.js now includes
  // `housePicture` in the populate select. Falls back to the stock image
  // for older registrations that have no picture saved.
  const housePictureUrl =
    house?.registeredHouse?.housePicture?.url ||
    "/images/pexels-quang-nguyen-vinh-222549-14021929.jpg";

  // ── FIX: `house` IS the Post — use its own _id, and hit the post-based
  // endpoint (rental status lives on Post.isRented, not on HomeRegister).
  const postId = house?._id || house?.id;

  // `tenantId` names the student renting the room (null = someone not on
  // Khoj); the backend records the stay so that student can review later.
  const updateRentalStatusOnServer = async (nextIsRented, tenantId = null) => {
    if (!postId) {
      alert("Could not determine which property to update.");
      return false;
    }
    setRentalUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/rental-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isRented: nextIsRented, ...(tenantId ? { tenantId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update rental status.");
      }
      setIsRented(nextIsRented);
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    } finally {
      setRentalUpdating(false);
    }
  };

  const handleMarkRented = () => {
    setShowRentedConfirm(true);
  };

  const confirmMarkRented = async (tenantId) => {
    const success = await updateRentalStatusOnServer(true, tenantId);
    if (success) {
      setShowRentedConfirm(false);
      alert(tenantId
        ? "Marked as Rented. Your tenant can now review the room and you."
        : "Marked as Rented. Students will see it as unavailable.");
    }
  };

  const handleMarkAvailable = async () => {
    const success = await updateRentalStatusOnServer(false);
    if (success) {
      alert("Property marked as Available again.");
    }
  };

  // Helper utility scanner function to lookup utilities array structures from database
  const hasUtility = (utilityName) => {
    return Array.isArray(house?.utilities) && house.utilities.includes(utilityName);
  };

  const facilities = [
    { icon: <FiZap />, label: "Electricity",   sub: hasUtility("24/7 Electricity") ? "24/7 Available" : "Not 24/7" },
    { icon: <FiBatteryCharging />, label: "IPS",           sub: hasUtility("IPS") ? "IPS Available" : "No IPS" },
    { icon: <MdOutlineElevator />, label: "Lift/Elevator", sub: hasUtility("Lift") ? "Available" : "Not Available" },
    { icon: <FiShield />, label: "Security",      sub: hasUtility("Security Guard") ? "Security Guard" : "No Guard" },
    { icon: <FiClock />, label: "Gate Closes",   sub: house?.gateClosedTime || house?.gateCloseTime || "Not Specified" },
    { icon: <MdOutlineLocalFireDepartment />, label: "Gas",           sub: hasUtility("Gas") ? "Gas Available" : "No Gas (Cylinder)" },
    { icon: <FiDroplet />, label: "Water Bill",    sub: hasUtility("Water Bill Included") ? "Included in Rent" : "Not Included" },
    { icon: <FaBangladeshiTakaSign />, label: "Current Rent",  sub: `৳${monthlyRentAmount.toLocaleString()} / month` },
  ];

  // ── FIX: COORDINATE CONVERSION ──
  // `house` IS the Post, and Post.exactLocation.coordinates is the real
  // field (GeoJSON [longitude, latitude]) — it's now correctly populated at
  // post-creation time (see post.service.js fix) instead of always being
  // the hardcoded [90.404, 24.242]. Leaflet expects [latitude, longitude],
  // so we flip it. The other paths are kept only as defensive fallbacks.
  let leafletCoordinates = [23.9482, 90.3794]; // Fallback ONLY if truly nothing is saved anywhere

  const geoJsonCoordinates =
    house?.exactLocation?.coordinates ||
    house?.registeredHouse?.houseMap?.coordinates ||
    house?.homeRegister?.houseMap?.coordinates ||
    house?.houseMap?.coordinates;

  const plainCoordinates = house?.coordinates; // already [lat, lng], not GeoJSON

  if (Array.isArray(geoJsonCoordinates) && geoJsonCoordinates.length === 2) {
    // Flip [lng, lat] from DB into [lat, lng] for Leaflet
    leafletCoordinates = [geoJsonCoordinates[1], geoJsonCoordinates[0]];
  } else if (Array.isArray(plainCoordinates) && plainCoordinates.length === 2) {
    leafletCoordinates = plainCoordinates;
  }

  return (
    <div className="page">
      <Navbar page="detail" go={go} user={user} onProfileClick={handleProfileClick} />

      <div className="detail-content">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: ".25rem" }}>
          <button className="back-btn" onClick={() => go("dashboard")} style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: ".4rem" }}>
            <FiArrowLeft /> Back to Listings
          </button>

          {/* STATUS BADGE — visible to everyone */}
          <span className={`prop-status-badge ${isRented ? "rented" : "available"}`} style={{
            position: "static", fontSize: ".82rem", padding: ".3rem .85rem", borderRadius: 20,
            fontWeight: 700, display: "inline-flex", alignItems: "center", gap: ".35rem"
          }}>
            <BsCircleFill size={8} /> {isRented ? "Rented" : "Available"}
          </span>

          {/* OWNER / ADMIN CONTROLS */}
          {(isThisOwner || isAdmin) && (
            <div style={{ marginLeft: "auto", display: "flex", gap: ".6rem", alignItems: "center", flexWrap: "wrap" }}>
              {isAdmin && <span className="admin-chip"><MdOutlineAdminPanelSettings /> Admin View</span>}
              <button
                className={`status-btn ${isRented ? "to-available" : "to-rented"}`}
                onClick={isRented ? handleMarkAvailable : handleMarkRented}
              >
                {isRented ? <FiCheckCircle /> : <BsCircleFill size={8} />}
                {isRented ? "Mark as Available" : "Mark as Rented"}
              </button>
            </div>
          )}
        </div>

        {/* RENTED: ask who the tenant is */}
        {showRentedConfirm && (
          <TenantPicker
            postId={postId}
            busy={rentalUpdating}
            onConfirm={confirmMarkRented}
            onCancel={() => setShowRentedConfirm(false)}
          />
        )}

        {/* Rented banner for students */}
        {isRented && isStudent && (
          <div className="notice error">
            <BsCircleFill size={8} style={{ marginTop: 7 }} />
            <span><strong>This property is currently rented out.</strong> You can still view details and save for future reference.</span>
          </div>
        )}

        {/* GALLERY — one large main image on the left, two equal-height
            images stacked on the right, so all three are shown clearly.
            minHeight: 0 stops the images from stretching their grid rows. */}
        <div className="detail-gallery" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', height: '600px', marginBottom: '2rem' }}>
          <div className="gallery-main" style={{ width: '100%', height: '100%', minHeight: 0, overflow: 'hidden', borderRadius: '8px' }}>
            <img src={targetImages[0] || "/images/placeholder.jpg"}
              alt="Main Interior"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div className="gallery-sub" style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '10px', height: '100%', minHeight: 0 }}>
            <div style={{ minHeight: 0, overflow: 'hidden', borderRadius: '8px' }}>
              <img src={targetImages[1] || "/images/placeholder.jpg"} alt="Interior View 2" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ minHeight: 0, overflow: 'hidden', borderRadius: '8px' }}>
              <img src={housePictureUrl} alt="House exterior" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        </div>

        <div className="detail-grid">
          {/* LEFT COLUMN */}
          <div>
            <h1 className="detail-title">{houseName}</h1>
            <div className="rating-row">
              <span className="rating-chip">
                {flatSummary?.count > 0 ? <><FaStar aria-hidden="true" /> {flatSummary.overall.toFixed(1)}</> : "New"}
              </span>
              <span style={{ fontSize: ".85rem", color: "var(--gray-text)" }}>
                {flatSummary?.count || 0} tenant review{flatSummary?.count === 1 ? "" : "s"}
              </span>
              <span style={{ color: "var(--gray-mid)" }}>•</span>
              <span style={{ fontSize: ".85rem", color: "var(--gray-text)" }}>{fullAddressStr}</span>
            </div>

            {/* FACILITIES */}
            <div className="detail-section">
              <div className="detail-section-title">What This Place Offers</div>
              <div className="features-grid">
                {facilities.map((f, i) => (
                  <div className="feature-item" key={i}>
                    <div className="feature-icon">{f.icon}</div>
                    <div>
                      <div className="feature-label">{f.label}</div>
                      <div className="feature-sub">{f.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {house?.features && house.features.length > 0 && (
                <div style={{ marginTop: "1.25rem" }}>
                  <div className="detail-section-title" style={{ fontSize: ".9rem", marginBottom: ".6rem" }}>
                    Additional Amenities
                  </div>
                  <div className="chips-row">
                    {house.features.map(f => (
                      <span className="tag-chip" key={f}>{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {house?.reasonTenantLeft && (
                <div className="reason-box" style={{ marginTop: "1.25rem" }}>
                  <div className="reason-label">Why Previous Tenant Left</div>
                  <p>{house.reasonTenantLeft}</p>
                </div>
              )}
            </div>

            {/* LOCATION MAP — Using Swapped Latitude and Longitude */}
            <div className="detail-section">
              <div className="detail-section-title">Property Location</div>
              <div style={{ marginTop: "1rem" }}>
                <LocationMap
                  title={houseName}
                  description={`Located at ${fullAddressStr}`}
                  center={leafletCoordinates}
                  markerPosition={leafletCoordinates}
                  draggable={false}
                  zoom={16}
                  height={300}
                />
              </div>
            </div>

            {/* REVIEWS: room + owner. Only students can write, and the
                backend further limits it to the tenant the owner confirmed. */}
            <StayReviews
              postId={postId}
              user={user}
              canWrite={isStudent && Boolean(user?._id)}
              onSummary={handleSummary}
            />
          </div>

          {/* RIGHT COLUMN — CONTACT CARD */}
          <div>
            <div className="contact-card">
              <div className="contact-price-label">Starting from</div>
              <div className="contact-price">৳{monthlyRentAmount.toLocaleString()}</div>
              <div className="contact-price-sub">per month</div>

              <div className="contact-info-box">
                <div className="contact-info-label">Posted By</div>
                <div className="contact-info-value">{postedByLabel}</div>
              </div>
              <div className="contact-info-box">
                <div className="contact-info-label">Homeowner</div>
                <div className="contact-info-value">{displayOwnerName}</div>
              </div>
              <div className="contact-info-box">
                <div className="contact-info-label">Homeowner's Mobile</div>
                <div className="contact-info-value">{displayContactPhone}</div>
              </div>

              {isStudent && (
                <>
                  <p className="contact-note">Contact the owner directly via phone or WhatsApp.</p>
                  <div style={{
                          display: "flex",
                          gap: "12px",
                          width: "100%",
                          marginTop: "0.75rem"
                      }}><button
                          className="btn-primaryV2"
                          disabled={isRented}
                          style={{
                              opacity: isRented ? 0.5 : 1,
                              cursor: isRented ? "not-allowed" : "pointer"
                          }}
                          onClick={() =>
                              !isRented &&
                              alert(
                                  `Owner: ${displayOwnerName}\nPhone: ${displayContactPhone}\n\nPlease call or WhatsApp the owner directly.`
                              )
                          }
                      >
                          {isRented ? (
                              <><BsCircleFill size={8} /> Currently Rented</>
                          ) : (
                              <>
                                  <IoCall style={{ fontSize: "20px" }} />
                                  Contact Owner
                              </>
                          )}
                      </button>
                  </div>

                  {/* ─── CHAT FEATURE (Talha) ───
                      In-app alternative to the phone number above: opens a
                      real conversation with this listing's owner. The button
                      hides itself when there's no owner to message (or the
                      viewer is the owner), so no extra condition is needed
                      here. */}
                  <MessageOwnerButton go={go} user={user} house={house} />
                  {/* Roommate ads: the student who posted lives there, so
                      a would-be roommate can talk to them too. Hidden for
                      the poster themself (the button hides on self). */}
                  {postedByStudent && (
                    <MessageOwnerButton
                      go={go}
                      user={user}
                      house={house}
                      recipientId={house?.author?._id || house?.author}
                      label={`Message ${house?.posterName || "the student"}`}
                    />
                  )}
                  {/* ─── END CHAT FEATURE ─── */}
{/* need to look for it and waiting for the decision */}
                  <div className="contact-actions">
                    {/* <button className="btn-action" onClick={() => alert("Share link copied! (demo)")}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <FiShare2 style={{ fontSize: "18px", color: "var(--red)" }} /> <span>Share</span>
                    </button> */}
                   {/* <button className="btn-action"  onClick={() => alert("Saved to favourites! (demo)")}
                      style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          cursor: "pointer"
                      }}><CiSaveDown2
                          style={{
                              fontSize: "20px",
                              color: "var(--red)"
                          }}
                      />
                    <span>Save</span></button> */}
                  </div>
                </>
              )}

              {isThisOwner && (
                <div className="notice info" style={{ marginTop: "1rem" }}>
                  <FaHouseChimney />
                  <span><strong>Your Property</strong><br />
                  Use the <em>Mark as Rented / Available</em> button above to update status.
                  Students will see this change immediately.</span>
                </div>
              )}

              {isAdmin && (
                <div className="notice info" style={{ marginTop: "1rem" }}>
                  <MdOutlineAdminPanelSettings />
                  <span><strong>Admin View</strong><br />
                  You can toggle this property's availability from the controls above.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}