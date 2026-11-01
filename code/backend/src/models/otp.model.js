import mongoose from "mongoose";
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, expires: "5m", default: Date.now }
});
export const OTP = mongoose.model('OTP', otpSchema);
