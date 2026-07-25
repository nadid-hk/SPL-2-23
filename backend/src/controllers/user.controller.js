import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.util.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { EmailUser } from "../models/emailUser.model.js"
import { RankUser } from "../models/rankUser.model.js"
import { User } from "../models/user.model.js"
import { HomeRegister } from "../models/homeRegister.model.js" // Imported for home owner auth/profile handling
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
// LOGIN (email/password/khatianNumber)
// ----------------------------------------------------------------
const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password, rank, khatianNumber } = req.body

    if (!password || (!email && !rank && !khatianNumber)) {
        throw new ApiError(400, "Email/Rank/Khatian and password are required")
    }

    let user
    let homeProfileData = null

    // Check if authenticating via Home Owner credentials
    if (khatianNumber) {
        const homeOwnerRecord = await HomeRegister.findOne({ khatianNumber })
        if (!homeOwnerRecord) {
            throw new ApiError(404, "Invalid Khatian number or credentials.")
        }

        const isPasswordValid = await homeOwnerRecord.isPasswordCorrect(password)
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials")
        }

        // 🐛 REAL BUG (root cause of "two home owners share one profile
        // picture"): `homeOwnerRecord.owner` was frequently unset (null/
        // undefined) for registrations that hadn't logged in yet. Calling
        // `User.findById(undefined)` does NOT return null — Mongoose turns
        // it into `findOne({ _id: undefined })`, and the Mongo driver drops
        // keys with an undefined value before sending the query, so it
        // actually runs as `findOne({})` and returns the FIRST user in the
        // whole collection. Every home owner who hadn't been linked yet was
        // silently attached to that same one user document, so updating
        // one owner's picture (or anything else on User) instantly showed
        // up for every other still-unlinked owner too.
        //
        // Fix: only look the user up when we actually have an id, and when
        // we lazily create the user, let Mongo generate a fresh unique _id
        // and persist it back onto this specific HomeRegister document so
        // it's never ambiguous again.
        user = homeOwnerRecord.owner ? await User.findById(homeOwnerRecord.owner) : null

        if (!user) {
            user = await User.create({
                name: homeOwnerRecord.ownerFullName,
                phone: homeOwnerRecord.phoneNumber,
                password: homeOwnerRecord.password // Bypassed during khatian verification steps anyway
            })

            homeOwnerRecord.owner = user._id
            await homeOwnerRecord.save({ validateBeforeSave: false })
        }

        homeProfileData = homeOwnerRecord
    } else if (rank) {
        user = await RankUser.findOne({ rank })
    } else {
        user = await User.findOne({ email })
    }

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // Verify password for standard user schemas if not already verified via HomeRegister
    if (!khatianNumber) {
        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials")
        }
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken").lean()

    // Dynamically update payload for Home Owner credentials
    if (khatianNumber || homeProfileData) {
        if (!homeProfileData) homeProfileData = await HomeRegister.findOne({ owner: user._id })
        
        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(200, {
                user: {
                    ...loggedInUser,
                    role: "owner",
                    name: homeProfileData.ownerFullName,
                    phone: homeProfileData.phoneNumber,
                    homeRegister: homeProfileData
                },
                accessToken
            }, "Login successful"))
    }

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
        user = await EmailUser.create({
            name: name || email.split("@")[0],
            email,
            googleId,
            picture,
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
const logoutUser = asyncHandler(async (req, res, next) => {
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
const refreshAccessToken = asyncHandler(async (req, res, next) => {
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
const getCurrentUser = asyncHandler(async (req, res, next) => {
    const homeProfile = await HomeRegister.findOne({ owner: req.user._id }).lean()

    // If an owner profile model exists, send profile information extracted from it
    if (homeProfile) {
        return res
            .status(200)
            .json(new ApiResponse(200, {
                ...req.user.toObject(),
                role: "owner",
                name: homeProfile.ownerFullName,
                phone: homeProfile.phoneNumber,
                homeRegister: homeProfile
            }, "Current user fetched successfully"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

// NOTE: profile updates (name/mobile/dept/batch/bio/email + picture) are
// handled by profile.controller.js -> profile.service.js, which is the only
// place with multer + Cloudinary upload handling and the home-owner
// "picture only" restriction. A duplicate updateProfile used to live here
// and silently shadowed that logic for PATCH /profile — removed.
//
// If email-change-by-RankUser (with profileEditDeadline check) needs to stay
// reachable, port that block into profile.service.js's student branch rather
// than reintroducing a second /profile handler.

export {
    registerUser,
    loginUser,
    googleAuth,
    logoutUser,
    refreshAccessToken,
    getCurrentUser
}