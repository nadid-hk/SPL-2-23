// Shown to the property owner when they mark a listing Rented: who is the
// tenant? Picking a student who chatted about the listing records the stay,
// which is what lets that student review the room and the owner later.
import { useState, useEffect } from "react";
import { FiUserCheck, FiAlertTriangle } from "react-icons/fi";
import { API_BASE } from "../config";

const NOT_ON_KHOJ = "none";

export default function TenantPicker({ postId, onConfirm, onCancel, busy }) {
  const [candidates, setCandidates] = useState(null);
  const [error, setError] = useState("");
  const [choice, setChoice] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/posts/${postId}/tenant-candidates`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Could not load students.");
        if (!cancelled) setCandidates(json.data.candidates);
      } catch (err) {
        if (!cancelled) { setError(err.message); setCandidates([]); }
      }
    })();
    return () => { cancelled = true; };
  }, [postId]);

  const confirm = () => onConfirm(choice === NOT_ON_KHOJ ? null : choice);

  return (
    <div className="tp" role="dialog" aria-labelledby="tp-title">
      <div className="tp-head">
        <FiUserCheck aria-hidden="true" />
        <div>
          <h3 id="tp-title">Who is renting this room?</h3>
          <p>Students will see the listing as rented. The tenant you pick can review the room and you.</p>
        </div>
      </div>

      {error && <div className="notice error"><FiAlertTriangle /><span>{error}</span></div>}
      {candidates === null && <p className="sr-muted">Loading students who messaged you…</p>}

      {candidates !== null && (
        <div className="tp-options" role="radiogroup" aria-labelledby="tp-title">
          {candidates.length === 0 && (
            <p className="sr-muted">No students have messaged you about this listing yet.</p>
          )}
          {candidates.map((c) => (
            <label key={c._id} className={`tp-option${choice === String(c._id) ? " on" : ""}`}>
              <input
                type="radio"
                name="tenant"
                value={c._id}
                checked={choice === String(c._id)}
                onChange={() => setChoice(String(c._id))}
              />
              <span className="sr-avatar" aria-hidden="true">{(c.name?.[0] || "?").toUpperCase()}</span>
              <span className="tp-who">
                <strong>{c.name}</strong>
                {c.email && <span>{c.email}</span>}
              </span>
            </label>
          ))}
          <label className={`tp-option${choice === NOT_ON_KHOJ ? " on" : ""}`}>
            <input
              type="radio"
              name="tenant"
              value={NOT_ON_KHOJ}
              checked={choice === NOT_ON_KHOJ}
              onChange={() => setChoice(NOT_ON_KHOJ)}
            />
            <span className="sr-avatar tp-avatar-none" aria-hidden="true">–</span>
            <span className="tp-who">
              <strong>Someone not on Khoj</strong>
              <span>No review will be possible for this stay.</span>
            </span>
          </label>
        </div>
      )}

      <div className="tp-actions">
        <button type="button" className="btn-post-review" disabled={!choice || busy} onClick={confirm}>
          {busy ? "Saving…" : "Mark as Rented"}
        </button>
        <button type="button" className="sr-cancel" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}
