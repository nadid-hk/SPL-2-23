// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. All chat database work lives here so the REST controller and the
// Socket.IO handler share exactly one code path — a message sent over the
// socket and a message sent over HTTP must persist identically, otherwise
// the two transports drift apart (different lastMessage, different readBy).
// ─────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.util.js";

// Only ever expose these fields of the other person to the client — never
// password/refreshToken, which `User.find` would otherwise return.
const PARTICIPANT_FIELDS = "name picture";

// Throws unless the user is actually in the thread. Every read and write
// goes through this — a conversation id is guessable, so membership must be
// checked server-side on each call, not just when the thread is opened.
export const assertParticipant = (conversation, userId) => {
    const isMember = conversation.participants.some(
        (participant) => String(participant._id || participant) === String(userId)
    );

    if (!isMember) {
        throw new ApiError(403, "You are not part of this conversation.");
    }
};

// Reopens the existing thread between two users (about the same post, when
// one was given) or starts a fresh one. `$size: 2` keeps this strictly 1:1 —
// without it, `$all` would also match a bigger group thread containing both.
export const findOrCreateConversation = async (currentUserId, recipientId, postId) => {
    if (!recipientId) {
        throw new ApiError(400, "recipientId is required");
    }

    if (!mongoose.isValidObjectId(recipientId)) {
        throw new ApiError(400, "Invalid recipientId");
    }

    if (String(recipientId) === String(currentUserId)) {
        throw new ApiError(400, "You cannot message yourself");
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
        throw new ApiError(404, "Recipient not found");
    }

    const participants = [currentUserId, recipientId].map(
        (id) => new mongoose.Types.ObjectId(String(id))
    );

    let conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 },
        ...(postId ? { post: postId } : {})
    });

    if (!conversation) {
        conversation = await Conversation.create({ participants, post: postId });
    }

    await conversation.populate("participants", PARTICIPANT_FIELDS);
    return conversation;
};

// Every thread the user is in, newest activity first, each carrying the
// number of messages they haven't read yet (drives the bold preview row and
// the navbar badge).
export const getConversationsForUser = async (userId) => {
    const conversations = await Conversation.find({ participants: userId })
        .populate("participants", PARTICIPANT_FIELDS)
        .populate({
            path: "post",
            select: "registeredHouse",
            populate: { path: "registeredHouse", select: "housePropertyName" }
        })
        .sort({ updatedAt: -1 });

    if (conversations.length === 0) {
        return [];
    }

    // One aggregate for every thread at once — counting per conversation in a
    // loop would be N round trips for a list that is rendered on every page
    // load of the chat screen.
    const unreadCounts = await Message.aggregate([
        {
            $match: {
                conversation: { $in: conversations.map((c) => c._id) },
                sender: { $ne: new mongoose.Types.ObjectId(String(userId)) },
                readBy: { $ne: new mongoose.Types.ObjectId(String(userId)) }
            }
        },
        { $group: { _id: "$conversation", count: { $sum: 1 } } }
    ]);

    const unreadByConversation = new Map(
        unreadCounts.map((row) => [String(row._id), row.count])
    );

    return conversations.map((conversation) => ({
        ...conversation.toObject(),
        unreadCount: unreadByConversation.get(String(conversation._id)) || 0
    }));
};

// Marks every message the user hasn't seen in this thread as read.
// `$addToSet` makes this safe to call repeatedly (opening the thread, then
// receiving a message while it's still open).
export const markConversationRead = async (conversationId, userId) => {
    await Message.updateMany(
        {
            conversation: conversationId,
            sender: { $ne: userId },
            readBy: { $ne: userId }
        },
        { $addToSet: { readBy: userId } }
    );
};

// Full thread history. Opening a thread is what marks it read — the client
// doesn't need a second call for that.
export const getConversationMessages = async (conversationId, userId) => {
    if (!mongoose.isValidObjectId(conversationId)) {
        throw new ApiError(400, "Invalid conversation id");
    }

    const conversation = await Conversation.findById(conversationId).populate(
        "participants",
        PARTICIPANT_FIELDS
    );

    if (!conversation) {
        throw new ApiError(404, "Conversation not found");
    }

    assertParticipant(conversation, userId);

    const messages = await Message.find({ conversation: conversation._id })
        .populate("sender", PARTICIPANT_FIELDS)
        .sort({ createdAt: 1 });

    await markConversationRead(conversation._id, userId);

    return { conversation, messages };
};

// Persists a message and refreshes the thread's preview. Returns the
// conversation too, because the socket layer needs the participant list to
// know who to push the message to.
export const createMessage = async ({ conversationId, senderId, text }) => {
    const body = (text || "").trim();

    if (!body) {
        throw new ApiError(400, "Message text is required");
    }

    if (!mongoose.isValidObjectId(conversationId)) {
        throw new ApiError(400, "Invalid conversation id");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new ApiError(404, "Conversation not found");
    }

    assertParticipant(conversation, senderId);

    const message = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        text: body,
        readBy: [senderId] // you've read what you just sent
    });

    conversation.lastMessage = { text: body, sender: senderId, at: message.createdAt };
    await conversation.save();

    // Replying to a thread means you've read what was already in it. Without
    // this, the sender's own unread badge keeps counting messages they have
    // demonstrably seen — it only cleared if the client happened to call the
    // "open thread" endpoint first, which isn't guaranteed (reconnects, a
    // second tab, or sending straight from a notification).
    await markConversationRead(conversation._id, senderId);

    await message.populate("sender", PARTICIPANT_FIELDS);

    return { message, conversation };
};
