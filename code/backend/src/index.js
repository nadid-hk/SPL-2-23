import dotenv from "dotenv"
import {connectDB} from "./db/index.db.js"
import { app } from './app.js'
// ─── CHAT FEATURE (Talha) ───
// Socket.IO has to attach to the underlying HTTP server, so chat is the
// reason this file now creates one explicitly instead of calling
// app.listen() directly. Everything else about startup is unchanged.
import http from "http"
import { Server } from "socket.io"
import { initChatSocket } from "./socket/chat.socket.js"
import { corsOptions } from "./utils/cors.util.js"
// ─── END CHAT FEATURE ───

dotenv.config({
    path: './.env'
})

// ─── CHAT FEATURE (Talha) ───
// app.listen() would create this same server internally; we just need a
// handle on it so the websocket can share the port with the REST API.
const server = http.createServer(app)

// Same CORS rules as the REST API in app.js — credentials must be allowed
// because the socket handshake authenticates with the accessToken cookie.
const io = new Server(server, {
    cors: corsOptions
})

initChatSocket(io)
// ─── END CHAT FEATURE ───

connectDB()
.then(() => {
    // ─── CHAT FEATURE (Talha) ─── was: app.listen(...)
    server.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
    // ─── END CHAT FEATURE ───
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err)
})
