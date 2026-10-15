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




// Only for admin login 
import jwt from "jsonwebtoken"

router.post("/admin/login", (req, res) => {
    const { adminKey } = req.body;

    if (!adminKey) {
        return res.status(400).json({ message: "Admin key is required." });
    }
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "Invalid admin key." });
    }

    const adminToken = jwt.sign(
        { role: "admin" },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
    );

    return res
        .status(200)
        .cookie("adminToken", adminToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000
        })
        .json({ message: "Admin login successful.", adminToken });
});
export default router