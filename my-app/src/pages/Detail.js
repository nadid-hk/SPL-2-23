import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import LocationMap from "../components/LocationMap";
// ─── CHAT FEATURE (Talha) ───
import MessageOwnerButton from "../components/MessageOwnerButton";
// ─── END CHAT FEATURE ───

// Turns a Review document's timestamp into the short relative label the
// review cards expect ("Just now" for anything from this session, a plain
// date otherwise).
function formatReviewDate(createdAt) {
  if (!createdAt) return "Just now";
  return new Date(createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Stars({ rating }) {
  const currentRating = rating || 0;
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`star${i <= Math.round(currentRating) ? "" : " empty"}`}>★</span>
      ))}
    </div>
  );
}

export default function Detail({ go, user, house }) {
  // The review system is keyed on the underlying HomeRegister property, not
  // the Post — `house.registeredHouse` is that populated document (the same
  // one `isThisOwner` below compares `.owner` against).
  const homeRegisterId = house?.registeredHouse?._id || house?.registeredHouse?.id || null;

  const [reviews, setReviews]           = useState([]);
  const [reviewStats, setReviewStats]   = useState({ averageRating: 0, reviewCount: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewText, setReviewText]     = useState("");
  const [selectedRating, setRating]     = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  // ── FIX: `house` here IS the Post object, and Post.isRented is the real,
  // authoritative field (it already existed on the schema). The earlier
  // nested guesses (registeredHouse.isRented / homeRegister.isRented) were
  // wrong — that flag lives on the Post/listing itself, not on the
  // underlying HomeRegister document.
  const [isRented, setIsRented] = useState(house?.isRented || false);
  const [showRentedConfirm, setShowRentedConfirm] = useState(false);
  const [rentalUpdateError, setRentalUpdateError] = useState("");

  const loadReviews = async () => {
    if (!homeRegisterId) return;

    setReviewsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/reviews/${homeRegisterId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewStats({ averageRating: data.data.averageRating, reviewCount: data.data.reviewCount });
        setReviews(data.data.reviews || []);
      }
    } catch (err) {
      // Non-fatal — the page still works, it just shows no reviews yet.
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeRegisterId]);

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
  const displayOwnerName = house?.ownerName || house?.owner?.name || "Verified Owner";
  const displayContactPhone = house?.contactPhone || house?.owner?.phone || "N/A";
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

  const submitReview = async () => {
    if (!reviewText.trim()) { alert("Please write your review first."); return; }
    if (!selectedRating)    { alert("Please select a star rating."); return; }
    if (!homeRegisterId) {
      setReviewSubmitError("Couldn't determine which property to review — please refresh and try again.");
      return;
    }

    setSubmittingReview(true);
    setReviewSubmitError("");

    try {
      const res = await fetch("http://localhost:8000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          homeRegisterId,
          reviewerName: user?.name || "Anonymous",
          rating: selectedRating,
          comment: reviewText,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.errors?.join(", ") || data?.message || "Failed to submit review.");
      }

      setReviewText("");
      setRating(null);
      // Re-fetch so the list and the average rating both reflect the new
      // review exactly as the server computed it.
      await loadReviews();
    } catch (err) {
      setReviewSubmitError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── FIX: `house` IS the Post — use its own _id, and hit the post-based
  // endpoint (rental status lives on Post.isRented, not on HomeRegister).
  const postId = house?._id || house?.id;

  const updateRentalStatusOnServer = async (nextIsRented) => {
    if (!postId) {
      setRentalUpdateError("Could not determine which property to update.");
      return false;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/posts/${postId}/rental-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isRented: nextIsRented }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update rental status.");
      }
      setIsRented(nextIsRented);
      setRentalUpdateError("");
      return true;
    } catch (err) {
      setRentalUpdateError(err.message);
      alert(`❌ ${err.message}`);
      return false;
    }
  };

  const handleMarkRented = () => {
    setShowRentedConfirm(true);
  };

  const confirmMarkRented = async () => {
    const success = await updateRentalStatusOnServer(true);
    setShowRentedConfirm(false);
    if (success) {
      alert("✅ Property marked as Rented.\n\nStudents will see it as unavailable.");
    }
  };

  const handleMarkAvailable = async () => {
    const success = await updateRentalStatusOnServer(false);
    if (success) {
      alert("✅ Property marked as Available again.");
    }
  };

  // Helper utility scanner function to lookup utilities array structures from database
  const hasUtility = (utilityName) => {
    return Array.isArray(house?.utilities) && house.utilities.includes(utilityName);
  };

  const facilities = [
    { label: "Electricity",   sub: hasUtility("24/7 Electricity") ? "24/7 Available" : "Not 24/7" },
    { label: "IPS",           sub: hasUtility("IPS") ? "IPS Available" : "No IPS" },
    { label: "Lift/Elevator", sub: hasUtility("Lift") ? "Available" : "Not Available" },
    { label: "Security",      sub: hasUtility("Security Guard") ? "Security Guard" : "No Guard" },
    { label: "Gate Closes",   sub: house?.gateClosedTime || house?.gateCloseTime || "Not Specified" },
    { label: "Gas",           sub: hasUtility("Gas") ? "Gas Available" : "No Gas (Cylinder)" },
    { label: "Water Bill",    sub: hasUtility("Water Bill Included") ? "Included in Rent" : "Not Included" },
    { label: "Current Rent",  sub: `৳${monthlyRentAmount.toLocaleString()} / month` },
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
          <button className="back-btn" onClick={() => go("dashboard")} style={{ margin: 0 }}>
            ← Back to Listings
          </button>

          {/* STATUS BADGE — visible to everyone */}
          <span className={`prop-status-badge ${isRented ? "rented" : "available"}`} style={{
            fontSize: ".82rem",
            padding: ".3rem .85rem",
            borderRadius: 20,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: ".35rem"
          }}>
            {isRented ? "🔴 Rented" : "🟢 Available"}
          </span>

          {/* OWNER-ONLY CONTROLS */}
          {isThisOwner && (
            <div style={{ marginLeft: "auto", display: "flex", gap: ".6rem" }}>
              {isRented ? (
                <button
                  className="btn-action"
                  onClick={handleMarkAvailable}
                  style={{
                    background: "#e8f5e9", color: "#2e7d32", border: "1.5px solid #a5d6a7",
                    borderRadius: 8, padding: ".45rem 1rem", fontWeight: 600, fontSize: ".82rem", cursor: "pointer"
                  }}
                >
                  ✅ Mark as Available
                </button>
              ) : (
                <button
                  onClick={handleMarkRented}
                  style={{
                    background: "#fce4ec", color: "#c62828", border: "1.5px solid #ef9a9a",
                    borderRadius: 8, padding: ".45rem 1rem", fontWeight: 600, fontSize: ".82rem", cursor: "pointer"
                  }}
                >
                  🔴 Mark as Rented
                </button>
              )}
            </div>
          )}

          {/* ADMIN VIEW CONTROLS */}
          {isAdmin && (
            <div style={{ marginLeft: "auto", display: "flex", gap: ".6rem", alignItems: "center" }}>
              <span style={{ fontSize: ".75rem", color: "var(--gray-text)", background: "#f3e5f5", padding: ".2rem .6rem", borderRadius: 6, border: "1px solid #ce93d8" }}>
                👑 Admin View
              </span>
              <button
                onClick={() => isRented ? handleMarkAvailable() : handleMarkRented()}
                style={{
                  background: isRented ? "#e8f5e9" : "#fce4ec",
                  color: isRented ? "#2e7d32" : "#c62828",
                  border: `1.5px solid ${isRented ? "#a5d6a7" : "#ef9a9a"}`,
                  borderRadius: 8, padding: ".45rem 1rem", fontWeight: 600, fontSize: ".82rem", cursor: "pointer"
                }}
              >
                {isRented ? "✅ Mark Available" : "🔴 Mark Rented"}
              </button>
            </div>
          )}
        </div>

        {/* RENTED CONFIRMATION DIALOG */}
        {showRentedConfirm && (
          <div style={{
            background: "#fff3e0", border: "1.5px solid #ffb74d", borderRadius: 12,
            padding: "1.1rem 1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap"
          }}>
            <div style={{ flex: 1, fontSize: ".875rem", color: "#e65100" }}>
              <strong>Confirm:</strong> This will mark your property as <strong>Rented</strong>. 
              Students browsing the dashboard will see it as unavailable.
            </div>
            <div style={{ display: "flex", gap: ".6rem" }}>
              <button
                onClick={confirmMarkRented}
                style={{
                  background: "#c62828", color: "#fff", border: "none", borderRadius: 8,
                  padding: ".45rem 1rem", fontWeight: 700, fontSize: ".82rem", cursor: "pointer"
                }}
              >
                Yes, Mark Rented
              </button>
              <button
                onClick={() => setShowRentedConfirm(false)}
                style={{
                  background: "#eee", color: "#333", border: "none", borderRadius: 8,
                  padding: ".45rem 1rem", fontWeight: 600, fontSize: ".82rem", cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rented banner for students */}
        {isRented && isStudent && (
          <div style={{
            background: "#fce4ec", border: "1.5px solid #ef9a9a", borderRadius: 10,
            padding: ".85rem 1.1rem", marginBottom: "1rem", fontSize: ".875rem", color: "#b71c1c",
            display: "flex", alignItems: "center", gap: ".6rem"
          }}>
            🔴 <strong>This property is currently rented out.</strong> You can still view details and save for future reference.
          </div>
        )}

        {/* GALLERY */}
        <div className="detail-gallery" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', height: '400px', marginBottom: '2rem' }}>
          <div className="gallery-main" style={{ width: '100%', height: '100%' }}>
            <img
              src={targetImages[0] || "/images/placeholder.jpg"}
              alt="Main Interior"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>
          <div className="gallery-sub" style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '10px', height: '100%' }}>
            <img src={targetImages[1] || "/images/placeholder.jpg"} alt="Interior View 2" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
            <img src={targetImages[2] || "/images/placeholder.jpg"} alt="Interior View 3" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          </div>
        </div>

        <div className="detail-grid">
          {/* LEFT COLUMN */}
          <div>
            <h1 className="detail-title">{houseName}</h1>
            <div className="rating-row">
              <span className="rating-chip">{reviewStats.reviewCount > 0 ? reviewStats.averageRating : "New"}</span>
              <span style={{ fontSize: ".85rem", color: "var(--gray-text)" }}>{reviewStats.reviewCount} reviews</span>
              <span style={{ color: "var(--gray-mid)" }}>•</span>
              <span style={{ fontSize: ".85rem", color: "var(--gray-text)" }}>{fullAddressStr}</span>
            </div>

            {/* FACILITIES */}
            <div className="detail-section">
              <div className="detail-section-title">What This Place Offers</div>
              <div className="features-grid">
                {facilities.map((f, i) => (
                  <div className="feature-item" key={i}>
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

            {/* REVIEWS */}
            <div className="detail-section">
              <div className="detail-section-title">
                Reviews {reviewStats.reviewCount > 0 ? `(${reviewStats.averageRating} / 5)` : ""}
              </div>

              {reviewsLoading && (
                <p style={{ fontSize: ".85rem", color: "var(--gray-text)", marginBottom: "1rem" }}>
                  Loading reviews...
                </p>
              )}

              {!reviewsLoading && reviews.length === 0 && (
                <p style={{ fontSize: ".85rem", color: "var(--gray-text)", marginBottom: "1rem" }}>
                  No reviews yet. Be the first to review!
                </p>
              )}

              {reviews.map(r => (
                <div className="review-card" key={r._id || r.id}>
                  <div className="review-header">
                    <div className="review-avatar">{(r.reviewerName?.[0] || "A").toUpperCase()}</div>
                    <div>
                      <div className="review-author">{r.reviewerName}</div>
                      <div className="review-date">{formatReviewDate(r.createdAt)}</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <Stars rating={r.rating} />
                    </div>
                  </div>
                  <p className="review-text">"{r.comment}"</p>
                </div>
              ))}

              {/* FIX: reviews are a tenant/student feature. The old check
                  (`!isThisOwner`) only hid the form from the owner of THIS
                  specific listing — any homeowner browsing someone else's
                  property (or an admin) still saw the review form. Gate on
                  `isStudent` instead so no owner account, and no admin
                  account, can ever submit a review. */}
              {isStudent && (
                <>
                  <div className="divider" />
                  <div className="detail-section-title" style={{ fontSize: ".9rem", marginBottom: ".75rem" }}>
                    Write a Review
                  </div>

                  <div style={{ marginBottom: ".75rem" }}>
                    <div style={{ fontSize: ".8rem", fontWeight: 600, marginBottom: ".5rem" }}>Select Rating:</div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button
                          key={r}
                          className={`rating-opt${selectedRating === r ? " selected" : ""}`}
                          onClick={() => setRating(r)}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fg">
                    <textarea
                      placeholder="Share your experience about this property..."
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                    />
                  </div>

                  {reviewSubmitError && (
                    <div style={{ color: "#c62828", fontSize: ".82rem", marginBottom: ".6rem" }}>
                      ⚠️ {reviewSubmitError}
                    </div>
                  )}

                  <button className="btn-post-review" onClick={submitReview} disabled={submittingReview}>
                    {submittingReview ? "Posting..." : "Post Review"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — CONTACT CARD */}
          <div>
            <div className="contact-card">
              <div className="contact-price-label">Starting from</div>
              <div className="contact-price">৳{monthlyRentAmount.toLocaleString()}</div>
              <div className="contact-price-sub">per month</div>

              <div className="contact-info-box">
                <div className="contact-info-label">Owner Name</div>
                <div className="contact-info-value">{displayOwnerName}</div>
              </div>
              <div className="contact-info-box">
                <div className="contact-info-label">Mobile Number</div>
                <div className="contact-info-value">{displayContactPhone}</div>
              </div>

              {isStudent && (
                <>
                  <p className="contact-note">Contact the owner directly via phone or WhatsApp.</p>
                  <button
                    className="btn-contact"
                    disabled={isRented}
                    style={isRented ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                    onClick={() =>
                      !isRented && alert(`📞 Owner: ${displayOwnerName}\nPhone: ${displayContactPhone}\n\nPlease call or WhatsApp the owner directly.`)
                    }
                  >
                    {isRented ? "🔴 Currently Rented" : "📞 Contact Home Owner"}
                  </button>

                  {/* ─── CHAT FEATURE (Talha) ───
                      In-app alternative to the phone number above: opens a
                      real conversation with this listing's owner. The button
                      hides itself when there's no owner to message (or the
                      viewer is the owner), so no extra condition is needed
                      here. */}
                  <MessageOwnerButton go={go} user={user} house={house} />
                  {/* ─── END CHAT FEATURE ─── */}

                  <div className="contact-actions">
                    <button className="btn-action" onClick={() => alert("Share link copied! (demo)")}>🔗 Share</button>
                    <button className="btn-action" onClick={() => alert("Saved to favourites! (demo)")}>❤️ Save</button>
                  </div>
                </>
              )}

              {isThisOwner && (
                <div style={{
                  marginTop: "1rem", background: "#e3f2fd", borderRadius: 10,
                  padding: ".85rem 1rem", fontSize: ".82rem", color: "#1565c0", lineHeight: 1.55
                }}>
                  🏠 <strong>Your Property</strong><br />
                  Use the <em>Mark as Rented / Available</em> button above to update status.
                  Students will see this change immediately.
                </div>
              )}

              {isAdmin && (
                <div style={{
                  marginTop: "1rem", background: "#f3e5f5", borderRadius: 10,
                  padding: ".85rem 1rem", fontSize: ".82rem", color: "#6a1b9a", lineHeight: 1.55
                }}>
                  👑 <strong>Admin View</strong><br />
                  You can toggle this property's availability from the controls above.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}