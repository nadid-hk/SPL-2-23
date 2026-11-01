// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. A Conversation is a persistent 1:1 thread — in practice a
// student and a home owner talking about one listing. Threads are keyed on
// the pair of participants (+ the post, when the chat was opened from a
// listing), so re-clicking "Message Owner" reopens the same thread instead
// of spawning a new one every time.
// ─────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],
        // Optional: the listing the conversation started from. Kept so the
        // thread header can show "about <property>" and so a student can hold
        // separate threads with the same owner about two different houses.
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },
        // Denormalised copy of the newest message. The conversation list
        // needs a preview line for every thread — without this it would take
        // one extra Message query per conversation just to render the list.
        lastMessage: {
            text: {
                type: String,
                trim: true
            },
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            at: {
                type: Date
            }
        }
    },
    { timestamps: true }
);

// Serves the only conversation query we run: "all threads for user X,
// newest activity first".
conversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
