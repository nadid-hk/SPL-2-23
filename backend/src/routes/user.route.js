import { Router } from "express"
import {
    registerUser,
    loginUser,
    googleAuth,
    logoutUser,
    refreshAccessToken,
    getCurrentUser
} from "../controllers/user.controller.js"
import  {verifyJWT}  from "../middleware/auth.middleware.js"

const router = Router()

// Public routes
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/google").post(googleAuth)
router.route("/refresh-token").post(refreshAccessToken)

// Protected routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/me").get(verifyJWT, getCurrentUser)
// NOTE: profile updates (including picture) are handled by profile.route.js,
// which is mounted alongside this router and includes multer + Cloudinary
// upload handling and the home-owner "picture only" restriction. Do not
// re-add a PATCH /profile route here — a duplicate silently shadows it.

export default router