import jwt from "jsonwebtoken"
import { ApiError } from "../utils/apiError.util.js"
export const verifyAdminToken = (req, res, next) => {
    const token =
        req.cookies?.adminToken ||
        req.header("Authorization")?.replace("Bearer ", "")

    if (!token) throw new ApiError(401, "Unauthorized request")

    let decoded
    try {
        decoded = jwt.verify(token,  process.env.ACCESS_TOKEN_SECRET)
    } catch (err) {
        throw new ApiError(401, "Invalid or expired admin token")
    }

    if (decoded.role !== "admin") throw new ApiError(403, "Admin access required")

    req.user = { role: "admin", isAdmin: true }
    next()
}

export const verifyAdmin = (req, res, next) => {
    const u = req.user
    const isAdmin =
        u?.role?.toLowerCase() === "admin" ||
        u?.isAdmin === true ||
        u?.userType?.toLowerCase() === "admin"

    if (!isAdmin) throw new ApiError(403, "Admin access required")
    next()
}