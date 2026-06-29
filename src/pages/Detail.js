import { useState } from "react";
import Navbar from "../components/Navbar";
import LocationMap from "../components/LocationMap";

function Stars({ rating }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`star${i <= Math.round(rating) ? "" : " empty"}`}>★</span>
      ))}
    </div>
  );
}

export default function Detail({ go, user, house }) {
  const [reviews, setReviews]       = useState(house.reviews || []);
  const [reviewText, setReviewText] = useState("");
  const [selectedRating, setRating] = useState(null);
  // Homeowner can toggle rented status locally (in production this would hit the API)
  const [isRented, setIsRented]     = useState(house.status === "Rented");
  const [showRentedConfirm, setShowRentedConfirm] = useState(false);

  const handleProfileClick = () => go("profile");

  // Determine role
  const isHomeOwner = user?.role === "homeowner";
  const isAdmin     = user?.role === "admin";
  const isStudent   = !isHomeOwner && !isAdmin;

  // Is this the owner of THIS specific house?
  const isThisOwner = isHomeOwner && (
    user?.houseName === house.name ||
    user?.ownedHouseId === house.id
  );

  const targetImages = [
    "/images/spacejoy-nEtpvJjnPVo-unsplash.jpg",
    "/images/minh-pham-OtXADkUh3-I-unsplash.jpg",
    "/images/pexels-quang-nguyen-vinh-222549-14021929.jpg"
  ];

  const submitReview = () => {
    if (!reviewText.trim()) { alert("Please write your review first."); return; }
    if (!selectedRating)    { alert("Please select a star rating."); return; }
    alert(`✅ Review submitted!\n\nYour review: "${reviewText}"\nRating: ${selectedRating}★`);
    setReviews(prev => [
      ...prev,
      {
        id: Date.now(),
        author: user?.name || "Anonymous",
        initials: (user?.name?.[0] || "A").toUpperCase(),
        date: "Just now",
        text: reviewText,
        rating: selectedRating,
      },
    ]);
    setReviewText("");
    setRating(null);
  };

  const handleMarkRented = () => {
    setShowRentedConfirm(true);
  };

  const confirmMarkRented = () => {
    setIsRented(true);
    setShowRentedConfirm(false);
    // In production: PATCH /api/houses/:id { status: "Rented" }
    alert("✅ Property marked as Rented.\n\nStudents will see it as unavailable. This will sync to the database once connected.");
  };

  const handleMarkAvailable = () => {
    setIsRented(false);
    // In production: PATCH /api/houses/:id { status: "Available" }
    alert("✅ Property marked as Available again.");
  };

  const facilities = [
    { label: "Electricity",   sub: house.electricity24_7 ? "24/7 Available"      : "Not 24/7"         },
    { label: "IPS",           sub: house.ips             ? "IPS Available"        : "No IPS"           },
    { label: "Lift/Elevator", sub: house.lift            ? "Available"            : "Not Available"    },
    { label: "Security",      sub: house.security        ? "Security Guard"       : "No Guard"         },
    { label: "Gate Closes",   sub: house.gateCloseTime                                                 },
    { label: "Gas",           sub: house.gas             ? "Gas Available"        : "No Gas (Cylinder)"},
    { label: "Water Bill",    sub: house.waterBillIncluded ? "Included in Rent"   : "Not Included"     },
    { label: "Current Rent",  sub: `৳${house.rent.toLocaleString()} / month`                          },
  ];

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
                    background: "#e8f5e9",
                    color: "#2e7d32",
                    border: "1.5px solid #a5d6a7",
                    borderRadius: 8,
                    padding: ".45rem 1rem",
                    fontWeight: 600,
                    fontSize: ".82rem",
                    cursor: "pointer"
                  }}
                >
                  ✅ Mark as Available
                </button>
              ) : (
                <button
                  onClick={handleMarkRented}
                  style={{
                    background: "#fce4ec",
                    color: "#c62828",
                    border: "1.5px solid #ef9a9a",
                    borderRadius: 8,
                    padding: ".45rem 1rem",
                    fontWeight: 600,
                    fontSize: ".82rem",
                    cursor: "pointer"
                  }}
                >
                  🔴 Mark as Rented
                </button>
              )}
            </div>
          )}

          {/* ADMIN can also toggle on behalf of owner */}
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
                  borderRadius: 8,
                  padding: ".45rem 1rem",
                  fontWeight: 600,
                  fontSize: ".82rem",
                  cursor: "pointer"
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
            background: "#fff3e0",
            border: "1.5px solid #ffb74d",
            borderRadius: 12,
            padding: "1.1rem 1.25rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap"
          }}>
            <div style={{ flex: 1, fontSize: ".875rem", color: "#e65100" }}>
              <strong>Confirm:</strong> This will mark your property as <strong>Rented</strong>. 
              Students browsing the dashboard will see it as unavailable.
            </div>
            <div style={{ display: "flex", gap: ".6rem" }}>
              <button
                onClick={confirmMarkRented}
                style={{
                  background: "#c62828", color: "#fff",
                  border: "none", borderRadius: 8,
                  padding: ".45rem 1rem", fontWeight: 700,
                  fontSize: ".82rem", cursor: "pointer"
                }}
              >
                Yes, Mark Rented
              </button>
              <button
                onClick={() => setShowRentedConfirm(false)}
                style={{
                  background: "#eee", color: "#333",
                  border: "none", borderRadius: 8,
                  padding: ".45rem 1rem", fontWeight: 600,
                  fontSize: ".82rem", cursor: "pointer"
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
            background: "#fce4ec",
            border: "1.5px solid #ef9a9a",
            borderRadius: 10,
            padding: ".85rem 1.1rem",
            marginBottom: "1rem",
            fontSize: ".875rem",
            color: "#b71c1c",
            display: "flex",
            alignItems: "center",
            gap: ".6rem"
          }}>
            🔴 <strong>This property is currently rented out.</strong> You can still view details and save for future reference.
          </div>
        )}

        {/* GALLERY */}
        <div className="detail-gallery" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', height: '400px', marginBottom: '2rem' }}>
          <div className="gallery-main" style={{ width: '100%', height: '100%' }}>
            <img
              src={targetImages[0]}
              alt="Main Interior View"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>
          <div className="gallery-sub" style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '10px', height: '100%' }}>
            <img src={targetImages[1]} alt="Living Area" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
            <img src={targetImages[2]} alt="Room View"   style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          </div>
        </div>

        <div className="detail-grid">
          {/* ── LEFT COLUMN ── */}
          <div>
            <h1 className="detail-title">{house.name}</h1>
            <div className="rating-row">
              <span className="rating-chip">{house.rating}</span>
              <span style={{ fontSize: ".85rem", color: "var(--gray-text)" }}>{house.reviewCount} reviews</span>
              <span style={{ color: "var(--gray-mid)" }}>•</span>
              <span style={{ fontSize: ".85rem", color: "var(--gray-text)" }}>{house.location}</span>
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

              {house.features?.length > 0 && (
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

              {house.reasonToLeave && (
                <div className="reason-box">
                  <div className="reason-label">Why Previous Tenant Left</div>
                  <p>{house.reasonToLeave}</p>
                </div>
              )}
            </div>
            <div className="detail-section">
              <div className="detail-section-title">
                Property Location
              </div>

              <div className="uc-box">
                <div className="uc-icon">📍</div>

                <p>
                  Interactive map view will be available here to help students
                  locate the property easily.
                </p>

                <span className="badge"> Under Construction</span>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Property Location</div>
              <div style={{ marginTop: "1rem" }}>
                <LocationMap
                  title={house.name}
                  description={`Located in ${house.location}`}
                  center={house.coordinates || [23.9482, 90.3794]}
                  markerPosition={house.coordinates || [23.9482, 90.3794]}
                  draggable={false}
                  zoom={16}
                  height={300}
                />
              </div>
            </div>

            {/* REVIEWS — students and owners can both read/write */}
            <div className="detail-section">
              <div className="detail-section-title">Reviews ({house.rating})</div>

              {reviews.length === 0 && (
                <p style={{ fontSize: ".85rem", color: "var(--gray-text)", marginBottom: "1rem" }}>
                  No reviews yet. Be the first to review!
                </p>
              )}

              {reviews.map(r => (
                <div className="review-card" key={r.id}>
                  <div className="review-header">
                    <div className="review-avatar">{r.initials}</div>
                    <div>
                      <div className="review-author">{r.author}</div>
                      <div className="review-date">{r.date}</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <Stars rating={r.rating} />
                    </div>
                  </div>
                  <p className="review-text">"{r.text}"</p>
                </div>
              ))}

              {/* Students and admins can write reviews; owners typically don't review their own property */}
              {!isThisOwner && (
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
                  <button className="btn-post-review" onClick={submitReview}>Post Review</button>
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN — CONTACT CARD ── */}
          <div>
            <div className="contact-card">
              <div className="contact-price-label">Starting from</div>
              <div className="contact-price">৳{house.rent.toLocaleString()}</div>
              <div className="contact-price-sub">per month</div>

              <div className="contact-info-box">
                <div className="contact-info-label">Owner Name</div>
                <div className="contact-info-value">{house.owner.name}</div>
              </div>
              <div className="contact-info-box">
                <div className="contact-info-label">Mobile Number</div>
                <div className="contact-info-value">{house.owner.phone}</div>
              </div>

              {/* Students see contact button; owner/admin see management note */}
              {isStudent && (
                <>
                  <p className="contact-note">Contact the owner directly via phone or WhatsApp.</p>
                  <button
                    className="btn-contact"
                    disabled={isRented}
                    style={isRented ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                    onClick={() =>
                      !isRented && alert(`📞 Owner: ${house.owner.name}\nPhone: ${house.owner.phone}\n\nPlease call or WhatsApp the owner directly.`)
                    }
                  >
                    {isRented ? "🔴 Currently Rented" : "📞 Contact Home Owner"}
                  </button>

                  <div className="contact-actions">
                    <button className="btn-action" onClick={() => alert("Share link copied! (demo)")}>🔗 Share</button>
                    <button className="btn-action" onClick={() => alert("Saved to favourites! (demo)")}>❤️ Save</button>
                  </div>
                </>
              )}

              {isThisOwner && (
                <div style={{
                  marginTop: "1rem",
                  background: "#e3f2fd",
                  borderRadius: 10,
                  padding: ".85rem 1rem",
                  fontSize: ".82rem",
                  color: "#1565c0",
                  lineHeight: 1.55
                }}>
                  🏠 <strong>Your Property</strong><br />
                  Use the <em>Mark as Rented / Available</em> button above to update status.
                  Students will see this change immediately.
                </div>
              )}

              {isAdmin && (
                <div style={{
                  marginTop: "1rem",
                  background: "#f3e5f5",
                  borderRadius: 10,
                  padding: ".85rem 1rem",
                  fontSize: ".82rem",
                  color: "#6a1b9a",
                  lineHeight: 1.55
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