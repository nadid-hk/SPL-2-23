// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. The "Message Owner" button shown on a listing's Detail page —
// the entry point into chat.
//
// Self-contained so Detail.js only needs a single line to render it: it
// works out the owner itself, opens (or reuses) the thread, and navigates to
// the chat page with that conversation already selected.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { chatApi } from "../chatApi";

export default function MessageOwnerButton({ go, user, house }) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // The listing owner's real User id — the same field Detail.js compares
  // against user._id to decide whether the viewer owns this property.
  const ownerId = house?.registeredHouse?.owner;
  const postId = house?._id || house?.id;

  // Hide the button when there's nobody to message: logged out, no owner
  // linked to the property yet, or the viewer IS the owner.
  if (!user?._id || !ownerId) return null;
  if (String(user._id) === String(ownerId)) return null;

  const openChat = async () => {
    setStarting(true);
    setError("");

    try {
      // Reuses the existing thread if there already is one, so clicking this
      // twice doesn't leave the owner with two identical conversations.
      const conversation = await chatApi.startConversation(ownerId, postId);
      go("chat", conversation._id || conversation.id);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  };

  return (
    <>
      <button
        className="btn-primary"
        onClick={openChat}
        disabled={starting}
        style={{ width: "100%", marginTop: "0.75rem" }}
      >
        {starting ? "Opening chat..." : "💬 Message Owner"}
      </button>

      {error && (
        <div style={{ color: "#c62828", fontSize: "0.8rem", marginTop: "0.5rem" }}>
          ⚠️ {error}
        </div>
      )}
    </>
  );
}
