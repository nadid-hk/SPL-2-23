import { Router } from "express";
import { handleProfileUpdate } from "../controllers/profile.controller.js";
import { validateProfileUpdate } from "../middleware/profile.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Endpoint mapped to PATCH /api/v1/users/profile matching standard route groupings
router.route("/profile").patch(
    verifyJWT,
    upload.single("profilePicture"),
    validateProfileUpdate,
    handleProfileUpdate
);

export default router;