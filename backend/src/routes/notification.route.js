import { Router } from "express";
import {
    sendNotification,
    getAllSentNotifications,
    getMyNotifications,
    markNotificationRead
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verifyAdminToken  } from "../middleware/admin.middleware.js";

const router = Router();

// user
router.route("/notifications/me").get(verifyJWT, getMyNotifications);
router.route("/notifications/:id/read").patch(verifyJWT, markNotificationRead);

// admin
router.route("/notifications").post(verifyAdminToken, sendNotification);
router.route("/notifications/admin/all").get(verifyAdminToken, getAllSentNotifications);

export default router;