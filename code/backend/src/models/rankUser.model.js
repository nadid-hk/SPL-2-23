import mongoose from "mongoose"
import { User } from "./user.model.js"

const rankUserSchema = new mongoose.Schema({
    rank: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
        // no "required" and no IUT-domain match here
    },
    profileEditDeadline: {
        type: Date,
        default: () => new Date(+new Date() + 6 * 30 * 24 * 60 * 60 * 1000) // ~6 months from now
    }
})

export const RankUser = User.discriminator("RankUser", rankUserSchema)