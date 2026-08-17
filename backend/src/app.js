import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.route.js"
import profileRouter from "./routes/profile.route.js" // ── FIX: Import your new profile router
import homeRegisterRouter from "./routes/homeRegister.route.js"
import reviewRouter from "./routes/review.route.js"
import postRouter from "./routes/post.route.js"
import adminRouter from "./routes/admin.route.js"
import notificationRouter from "./routes/notification.route.js"
// ─── CHAT FEATURE (Talha) ─── chat router import
import chatRouter from "./routes/chat.route.js"
// ─── END CHAT FEATURE ───

const app = express()

app.use(cors({
    origin: "http://localhost:3000", 
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Mounted base endpoints
app.use("/api/v1/users", profileRouter)
app.use("/api/v1/users", userRouter)

app.use("/api", homeRegisterRouter)   // /api/home-register, /api/home-register/approved, /api/home-register/lookup/:khatianNumber
app.use("/api", reviewRouter)         // /api/reviews, /api/reviews/:homeRegisterId
app.use("/api", postRouter)           // /api/posts, /api/posts/approved
app.use("/api", adminRouter)          // /api/admin/...
app.use("/api", notificationRouter)   // /api/notifications/...

// ─── CHAT FEATURE (Talha) ───
// /api/chat/conversations, /api/chat/conversations/:conversationId/messages
// Real-time delivery is handled separately by Socket.IO — see
// src/socket/chat.socket.js, wired up in src/index.js.
app.use("/api", chatRouter)
// ─── END CHAT FEATURE ───

// Global error handler — must be LAST
app.use((err, req, res, next) => {
    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    })
})

export { app }