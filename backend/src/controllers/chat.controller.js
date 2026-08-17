// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. REST surface for chat. Real-time delivery goes over Socket.IO
// (src/socket/chat.socket.js), but every operation is also reachable over
// plain HTTP so the page still works if the websocket can't connect.
// ─────────────────────────────────────────────────────────────────────────
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
    findOrCreateConversation,
    getConversationsForUser,
    getConversationMessages,
    createMessage
} from "../services/chat.service.js";

// POST /api/chat/conversations   Body: { recipientId, postId? }
// Used by the "Message Owner" button — opens the existing thread if there
// already is one, so the button is safe to click repeatedly.
export const startConversation = asyncHandler(async (req, res) => {
    const { recipientId, postId } = req.body;

    const conversation = await findOrCreateConversation(req.user._id, recipientId, postId);

    return res
        .status(201)
        .json(new ApiResponse(201, conversation, "Conversation ready"));
});

// GET /api/chat/conversations
export const getMyConversations = asyncHandler(async (req, res) => {
    const conversations = await getConversationsForUser(req.user._id);

    return res
        .status(200)
        .json(new ApiResponse(200, conversations, "Conversations fetched"));
});

// GET /api/chat/conversations/:conversationId/messages
export const getMessages = asyncHandler(async (req, res) => {
    const { conversation, messages } = await getConversationMessages(
        req.params.conversationId,
        req.user._id
    );

    return res
        .status(200)
        .json(new ApiResponse(200, { conversation, messages }, "Messages fetched"));
});

// POST /api/chat/conversations/:conversationId/messages   Body: { text }
// HTTP fallback for sending. The socket path is preferred (it also pushes to
// the recipient in real time); this exists so a message is never lost just
// because the websocket dropped.
export const sendMessage = asyncHandler(async (req, res) => {
    const { message } = await createMessage({
        conversationId: req.params.conversationId,
        senderId: req.user._id,
        text: req.body.text
    });

    return res
        .status(201)
        .json(new ApiResponse(201, message, "Message sent"));
});
