// Two-tier reviews for one listing: the room (six category scores, attached
// to this Post) and the owner (one score, combined across every property
// the owner has linked). Only a tenant the owner confirmed can write one;
// the backend enforces this, the UI just hides the form from everyone else.
import { useState, useEffect, useCallback } from "react";
import { FaStar } from "react-icons/fa6";
import { FiAlertTriangle, FiCheckCircle, FiEdit2 } from "react-icons/fi";
import { API_BASE } from "../config";

const MAX_COMMENT = 1000;

const formatMonth = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";

function StarRow({ value, size = "sm" }) {
  return (
    <span className={`sr-stars sr-stars-${size}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar key={i} className={i <= Math.round(value) ? "on" : ""} aria-hidden="true" />
      ))}
    </span>
  );
}

// Keyboard-friendly 1–5 star picker (a radio group of five buttons).
function StarInput({ label, value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="sr-input-row">
      <span className="sr-input-label" id={`sr-${label}`}>{label}</span>
      <div className="sr-input-stars" role="radiogroup" aria-labelledby={`sr-${label}`} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            className={i <= shown ? "on" : ""}
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange(i)}
          >
            <FaStar aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ name, picture, when, rating, comment, note }) {
  return (
    <article className="sr-card">
      <header className="sr-card-head">
        {picture ? (
          <img className="sr-avatar" src={picture} alt="" />
        ) : (
          <span className="sr-avatar" aria-hidden="true">{(name?.[0] || "?").toUpperCase()}</span>
        )}
        <div className="sr-card-who">
          <strong>{name || "Former tenant"}</strong>
          <span>{when}</span>
        </div>
        <span className="sr-card-score"><FaStar aria-hidden="true" /> {rating}</span>
      </header>
      {note && <p className="sr-card-note">{note}</p>}
      {comment ? <p className="sr-card-text">{comment}</p> : <p className="sr-card-text sr-muted">No written comment.</p>}
    </article>
  );
}

export default function StayReviews({ postId, user, canWrite, onSummary }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("room");
  const [me, setMe] = useState(null);

  const [editing, setEditing] = useState(false);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState("");
  const [ownerRating, setOwnerRating] = useState(0);
  const [ownerComment, setOwnerComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!postId) return;
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/reviews`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Reviews could not be loaded.");
      setData(json.data);
      setLoadError("");
      onSummary?.(json.data.flat.stats);
    } catch (err) {
      setLoadError(err.message);
    }
  }, [postId, onSummary]);

  const loadMine = useCallback(async () => {
    if (!postId || !canWrite || !user?._id) return;
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/reviews/me`, { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.success) setMe(json.data);
    } catch {
      // Not fatal: the form simply stays hidden.
    }
  }, [postId, canWrite, user?._id]);

  useEffect(() => { loadReviews(); }, [loadReviews]);
  useEffect(() => { loadMine(); }, [loadMine]);

  const startEditing = () => {
    setRatings({ ...(me?.flatReview?.ratings || {}) });
    setComment(me?.flatReview?.comment || "");
    setOwnerRating(me?.ownerReview?.rating || 0);
    setOwnerComment(me?.ownerReview?.comment || "");
    setFormError("");
    setSaved(false);
    setEditing(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const categories = data?.categories || [];
    const missing = categories.find(({ key }) => !ratings[key]);
    if (missing) { setFormError(`Rate ${missing.label} before posting.`); return; }
    if (!ownerRating) { setFormError("Rate the owner before posting."); return; }

    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/reviews/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ratings, comment, ownerRating, ownerComment })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Your review could not be saved.");
      setEditing(false);
      setSaved(true);
      await Promise.all([loadReviews(), loadMine()]);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="detail-section">
        <div className="detail-section-title">Reviews</div>
        <div className="notice error"><FiAlertTriangle /><span>{loadError}</span></div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="detail-section">
        <div className="detail-section-title">Reviews</div>
        <p className="sr-muted">Loading reviews…</p>
      </div>
    );
  }

  const { flat, owner, categories } = data;
  const hasReview = Boolean(me?.flatReview);
  const ownerFirst = (owner.name || "the owner").split(" ")[0];

  return (
    <div className="detail-section sr">
      <div className="detail-section-title">Reviews</div>

      <div className="sr-summary">
        <section className="sr-room" aria-labelledby="sr-room-title">
          <h3 id="sr-room-title" className="sr-heading">This room</h3>
          {flat.stats.count === 0 ? (
            <p className="sr-muted">No tenant has reviewed this room yet.</p>
          ) : (
            <>
              <div className="sr-overall">
                <span className="sr-overall-num">{flat.stats.overall.toFixed(1)}</span>
                <div>
                  <StarRow value={flat.stats.overall} size="md" />
                  <span className="sr-muted">{flat.stats.count} tenant review{flat.stats.count > 1 ? "s" : ""}</span>
                </div>
              </div>
              <dl className="sr-bars">
                {flat.stats.categories.map((c) => (
                  <div className="sr-bar" key={c.key}>
                    <dt>{c.label}</dt>
                    <dd>
                      <span className="sr-track"><span style={{ width: `${(c.average / 5) * 100}%` }} /></span>
                      <span className="sr-bar-num">{c.average.toFixed(1)}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        <section className="sr-owner" aria-labelledby="sr-owner-title">
          <h3 id="sr-owner-title" className="sr-heading">The owner</h3>
          <div className="sr-owner-id">
            <span className="sr-avatar sr-avatar-lg" aria-hidden="true">{(owner.name?.[0] || "O").toUpperCase()}</span>
            <strong>{owner.name || "Homeowner"}</strong>
          </div>
          {owner.stats.count === 0 ? (
            <p className="sr-muted">No ratings yet.</p>
          ) : (
            <>
              <div className="sr-owner-score">
                <span className="sr-overall-num sr-overall-sm">{owner.stats.average.toFixed(1)}</span>
                <StarRow value={owner.stats.average} />
              </div>
              <p className="sr-muted">
                From {owner.stats.count} tenant{owner.stats.count > 1 ? "s" : ""}
                {owner.stats.propertyCount > 1 ? ` across ${owner.stats.propertyCount} properties` : ""}
              </p>
            </>
          )}
        </section>
      </div>

      {(flat.reviews.length > 0 || owner.reviews.length > 0) && (
        <>
          <div className="sr-tabs" role="tablist" aria-label="Review lists">
            <button role="tab" aria-selected={tab === "room"} className={tab === "room" ? "on" : ""} onClick={() => setTab("room")}>
              Room reviews ({flat.reviews.length})
            </button>
            <button role="tab" aria-selected={tab === "owner"} className={tab === "owner" ? "on" : ""} onClick={() => setTab("owner")}>
              Owner reviews ({owner.reviews.length})
            </button>
          </div>

          <div role="tabpanel" className="sr-list">
            {tab === "room" &&
              flat.reviews.map((r) => (
                <ReviewCard
                  key={r._id}
                  name={r.student?.name}
                  picture={r.student?.picture}
                  when={`Tenant from ${formatMonth(r.tenancy?.startedAt || r.createdAt)}`}
                  rating={r.overall.toFixed(1)}
                  comment={r.comment}
                  note={categories.map(({ key, label }) => `${label} ${r.ratings?.[key]}`).join(", ")}
                />
              ))}
            {tab === "owner" &&
              owner.reviews.map((r) => (
                <ReviewCard
                  key={r._id}
                  name={r.student?.name}
                  picture={r.student?.picture}
                  when={`Rented ${r.homeRegister?.housePropertyName || "a room"} from ${formatMonth(r.tenancy?.startedAt || r.createdAt)}`}
                  rating={r.rating}
                  comment={r.comment}
                />
              ))}
            {tab === "room" && flat.reviews.length === 0 && <p className="sr-muted">No room reviews yet.</p>}
            {tab === "owner" && owner.reviews.length === 0 && <p className="sr-muted">No owner reviews yet.</p>}
          </div>
        </>
      )}

      {canWrite && me && (
        <div className="sr-write">
          {!me.canReview && (
            <p className="sr-muted sr-eligibility">
              Only tenants can review. If you rent this room, ask the owner to mark it as rented to you.
            </p>
          )}

          {me.canReview && !editing && (
            <div className="sr-cta">
              {saved && <span className="sr-saved"><FiCheckCircle /> Review saved</span>}
              <p>
                {hasReview
                  ? "You reviewed this stay. You can change it any time."
                  : `You rented this room. How was it, and how was ${ownerFirst} as an owner?`}
              </p>
              <button type="button" className="btn-post-review" onClick={startEditing}>
                {hasReview ? <><FiEdit2 /> Edit your review</> : "Review your stay"}
              </button>
            </div>
          )}

          {me.canReview && editing && (
            <form className="sr-form" onSubmit={submit} noValidate>
              <fieldset>
                <legend>The room</legend>
                {categories.map(({ key, label }) => (
                  <StarInput
                    key={key}
                    label={label}
                    value={ratings[key] || 0}
                    onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
                  />
                ))}
                <label className="sr-textarea">
                  <span>What should the next tenant know? (optional)</span>
                  <textarea
                    value={comment}
                    maxLength={MAX_COMMENT}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Water supply, noise, sunlight, the bathroom, the neighbourhood…"
                  />
                </label>
              </fieldset>

              <fieldset>
                <legend>The owner</legend>
                <StarInput label={`Rate ${ownerFirst}`} value={ownerRating} onChange={setOwnerRating} />
                <label className="sr-textarea">
                  <span>How was the owner to rent from? (optional)</span>
                  <textarea
                    value={ownerComment}
                    maxLength={MAX_COMMENT}
                    onChange={(e) => setOwnerComment(e.target.value)}
                    placeholder="Replies, repairs, rules, the advance and its refund…"
                  />
                </label>
              </fieldset>

              {formError && <div className="notice error"><FiAlertTriangle /><span>{formError}</span></div>}

              <div className="sr-form-actions">
                <button type="submit" className="btn-post-review" disabled={saving}>
                  {saving ? "Saving…" : hasReview ? "Save changes" : "Post review"}
                </button>
                <button type="button" className="sr-cancel" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
