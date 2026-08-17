// ─── CHAT FEATURE (Talha) ────────────────────────────────────────────────
// New file. Mounted in app.js as app.use("/api", chatRouter), matching the
// other feature routers. Every chat route is private — there is no such
// thing as an anonymous conversation, so verifyJWT guards the whole router
// rather than being repeated per route.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import {
    startConversation,
    getMyConversations,
    getMessages,
    sendMessage
} from "../controllers/chat.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use("/chat", verifyJWT);

router.route("/chat/conversations").post(startConversation).get(getMyConversations);
router
    .route("/chat/conversations/:conversationId/messages")
    .get(getMessages)
    .post(sendMessage);

export default router;
