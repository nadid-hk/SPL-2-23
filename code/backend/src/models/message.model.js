// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. One chat message inside a Conversation.
//
// `readBy` holds the ids of everyone who has seen the message (the sender is
// added on create, since you've obviously read what you just sent). Unread
// counts are then simply "messages in this thread not sent by me and not yet
// in my readBy" — no separate per-user counter to keep in sync.
// ─────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            required: [true, "Message text is required"],
            trim: true,
            maxlength: [2000, "A message cannot be longer than 2000 characters"]
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    { timestamps: true }
);

// Messages are always read as "this thread, oldest first".
messageSchema.index({ conversation: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
