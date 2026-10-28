import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const options = { discriminatorKey: "authMethod", timestamps: true }

const baseUserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            trim: true
        },
        isPhoneVerified: {
            type: Boolean,
            default: false
        },
        // Fields used by Profile.js
        dept: {
            type: String,
            trim: true,
            default: ""
        },
        batch: {
            type: String,
            trim: true,
            default: ""
        },
        bio: {
            type: String,
            trim: true,
            default: ""
        },
        // Google OAuth fields
        googleId: {
            type: String,
            default: null
        },
        picture: {
            type: String,
            default: ""
        },
        refreshToken: {
            type: String
        }
    },
    options
)

// Hash password before saving
baseUserSchema.pre("save", async function () {
    if (!this.isModified("password")) return
    this.password = await bcrypt.hash(this.password, 10)
})

baseUserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

baseUserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            authMethod: this.authMethod
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    )
}

baseUserSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
    )
}

export const User = mongoose.model("User", baseUserSchema)