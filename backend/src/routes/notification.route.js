import { Router } from "express";
import { getUserNotifications, markNotificationRead } from "../controllers/notification.controller.js";

const router = Router();

router.route("/notifications/:userId").get(getUserNotifications);
router.route("/notifications/:id/read").patch(markNotificationRead);

export default router;