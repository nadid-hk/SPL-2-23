import { useState } from "react";
import Navbar from "../components/Navbar";

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
  const [reviews, setReviews]         = useState(house.reviews || []);
  const [reviewText, setReviewText]   = useState("");
  const [selectedRating, setRating]   = useState(null);
  const handleProfileClick = () => go("profile");

  const submitReview = () => {
    if (!reviewText.trim()) { alert("Please write your review first."); return; }
    if (!selectedRating)    { alert("Please select a star rating."); return; }
    alert(`✅ Review submitted!\n\nYour review: "${reviewText}"\nRating: ${selectedRating}★\n\n(Saved in local state — database not connected yet)`);
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

  const facilities = [
    { label: "Electricity",   sub: house.electricity24_7 ? "24/7 Available"      : "Not 24/7"         },
    { label: "IPS",           sub: house.ips             ? "IPS Available"        : "No IPS"           },
    { label: "Lift/Elevator", sub: house.lift            ? "Available"           : "Not Available"     },
    { label: "Security",      sub: house.security        ? "Security Guard"      : "No Guard"          },
    { label: "Gate Closes",   sub: house.gateCloseTime                                                 },
    { label: "Gas",           sub: house.gas             ? "Gas Available"       : "No Gas (Cylinder)" },
    { label: "Water Bill",    sub: house.waterBillIncluded ? "Included in Rent"  : "Not Included"      },
    { label: "Current Rent",  sub: `৳${house.rent.toLocaleString()} / month`                          },
  ];

  return (
    <div className="page">
      <Navbar page="detail" go={go} user={user} onProfileClick={handleProfileClick} />

      <div className="detail-content">
        <button className="back-btn" onClick={() => go("dashboard")}>← Back to Listings</button>

        {/* ── GALLERY (all same height, under construction) ── */}
        <div className="detail-gallery">
          <div className="gallery-main">
            <span className="gallery-uc-icon"></span>
            <span className="gallery-uc-label">Under Construction</span>
            <span className="gallery-uc-sub">Photos will be updated later</span>
          </div>
          <div className="gallery-sub">
            {[1, 2].map(n => (
              <div className="gallery-sub-item" key={n}>
                <span className="gallery-uc-icon" style={{ fontSize: "2rem" }}></span>
                <span className="gallery-uc-label">🚧 Under Construction</span>
              </div>
            ))}
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

              {/* Amenities */}
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

              {/* Reason to leave */}
              {house.reasonToLeave && (
                <div className="reason-box">
                  <div className="reason-label">Why Previous Tenant Left</div>
                  <p>{house.reasonToLeave}</p>
                </div>
              )}
            </div>

            {/* REVIEWS */}
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

              {/* WRITE A REVIEW */}
              <div className="divider" />
              <div className="detail-section-title" style={{ fontSize: ".9rem", marginBottom: ".75rem" }}>
                Write a Review
              </div>

              {/* Rating checkboxes */}
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
            </div>
          </div>

          {/* ── RIGHT COLUMN — CONTACT CARD ── */}
          <div>
            <div className="contact-card">
              <div className="contact-price-label">Starting from</div>
              <div className="contact-price">৳{house.rent.toLocaleString()}</div>
              <div className="contact-price-sub">per month</div>

              {/* Owner info — no chat, just name + number */}
              <div className="contact-info-box">
                <div className="contact-info-label">Owner Name</div>
                <div className="contact-info-value">{house.owner.name}</div>
              </div>
              <div className="contact-info-box">
                <div className="contact-info-label">Mobile Number</div>
                <div className="contact-info-value">{house.owner.phone}</div>
              </div>

              <p className="contact-note">
                Contact the owner directly via phone or WhatsApp.
              </p>

              <button
                className="btn-contact"
                onClick={() =>
                  alert(`📞 Owner: ${house.owner.name}\nPhone: ${house.owner.phone}\n\nPlease call or WhatsApp the owner directly.`)
                }
              >
                📞 Contact Home Owner
              </button>

              <div className="contact-actions">
                <button className="btn-action" onClick={() => alert("Share link copied! (demo)")}>🔗 Share</button>
                <button className="btn-action" onClick={() => alert("Saved to favourites! (demo)")}>❤️ Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
