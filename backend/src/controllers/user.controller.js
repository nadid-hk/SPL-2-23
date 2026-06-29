import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.util.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { EmailUser } from "../models/emailUser.model.js"
import { RankUser } from "../models/rankUser.model.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
}

const generateAccessAndRefreshTokens = async (userId) => {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken, user }
}

// ----------------------------------------------------------------
// REGISTER
// ----------------------------------------------------------------
const registerUser = asyncHandler(async (req, res, next) => {
    const { method, name, email, password, rank, phone } = req.body

    if (!name || !password) {
        throw new ApiError(400, "Name and password are required")
    }

    let user

    if (method === "rank") {
        if (!rank) throw new ApiError(400, "Rank is required")

        const existingRank = await RankUser.findOne({ rank })
        if (existingRank) throw new ApiError(409, "An account with this rank already exists")

        if (email) {
            const existingEmail = await User.findOne({ email })
            if (existingEmail) throw new ApiError(409, "An account with this email already exists")
        }

        user = await RankUser.create({ name, password, rank, phone, email })
    } else {
        if (!email) throw new ApiError(400, "Email is required")

        const existingEmail = await EmailUser.findOne({ email })
        if (existingEmail) throw new ApiError(409, "An account with this email already exists")

        user = await EmailUser.create({ name, password, email })
    }

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User registered successfully"))
})

// ----------------------------------------------------------------
// LOGIN (email/password)
// ----------------------------------------------------------------
const loginUser = asyncHandler(async (req, res,next) => {
    const { email, password, rank } = req.body

    if (!password || (!email && !rank)) {
        throw new ApiError(400, "Email/Rank and password are required")
    }

    let user
    if (rank) {
        user = await RankUser.findOne({ rank })
    } else {
        user = await User.findOne({ email })
    }

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken }, "Login successful"))
})

// ----------------------------------------------------------------
// GOOGLE LOGIN
// One-step login-or-register using a verified Google email/ID
// ----------------------------------------------------------------
const googleAuth = asyncHandler(async (req, res, next) => {
    const { email, name, googleId, picture } = req.body

    if (!email || !googleId) {
        throw new ApiError(400, "Google email and ID are required")
    }

    let user = await User.findOne({ $or: [{ email }, { googleId }] })

    if (!user) {
        // Create a new EmailUser account using Google identity
        user = await EmailUser.create({
            name: name || email.split("@")[0],
            email,
            googleId,
            picture,
            // random password since Google users won't use password login
            password: `google_${googleId}_${Date.now()}`
        })
    } else if (!user.googleId) {
        user.googleId = googleId
        if (picture) user.picture = picture
        await user.save({ validateBeforeSave: false })
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken }, "Google login successful"))
})

// ----------------------------------------------------------------
// LOGOUT
// ----------------------------------------------------------------
const logoutUser = asyncHandler(async (req, res,next) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    )

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logged out successfully"))
})

// ----------------------------------------------------------------
// REFRESH ACCESS TOKEN
// ----------------------------------------------------------------
const refreshAccessToken = asyncHandler(async (req, res,next) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decoded._id)
        if (!user) throw new ApiError(401, "Invalid refresh token")

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(200, { accessToken }, "Access token refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

// ----------------------------------------------------------------
// GET CURRENT USER / PROFILE
// ----------------------------------------------------------------
const getCurrentUser = asyncHandler(async (req, res,next) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

// ----------------------------------------------------------------
// UPDATE PROFILE
// ----------------------------------------------------------------
const updateProfile = asyncHandler(async (req, res,next) => {
    const { name, mobile, dept, batch, bio, email } = req.body

    const updateFields = {}
    if (name !== undefined) updateFields.name = name
    if (mobile !== undefined) updateFields.phone = mobile
    if (dept !== undefined) updateFields.dept = dept
    if (batch !== undefined) updateFields.batch = batch
    if (bio !== undefined) updateFields.bio = bio

    // Only RankUser accounts may update their email, and only before the deadline
    if (email !== undefined && email !== req.user.email) {
        if (req.user.authMethod !== "RankUser") {
            throw new ApiError(403, "Email cannot be changed for this account type")
        }

        const rankUser = await RankUser.findById(req.user._id)
        if (rankUser.profileEditDeadline && new Date() > new Date(rankUser.profileEditDeadline)) {
            throw new ApiError(403, "Profile edit deadline has passed; email can no longer be changed")
        }

        const existing = await User.findOne({ email })
        if (existing) throw new ApiError(409, "Email already in use by another account")

        updateFields.email = email
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Profile updated successfully"))
})

export {
    registerUser,
    loginUser,
    googleAuth,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateProfile
}