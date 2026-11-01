import mongoose from "mongoose"
import { User } from "./user.model.js"

const emailUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[a-zA-Z0-9._%+-]+@iut-dhaka\.edu$/
    }
})

export const EmailUser = User.discriminator("EmailUser", emailUserSchema)