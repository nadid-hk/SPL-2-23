import { Router } from "express"
import {
    registerUser,
    loginUser,
    googleAuth,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateProfile
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
router.route("/profile").patch(verifyJWT, updateProfile)

export default router