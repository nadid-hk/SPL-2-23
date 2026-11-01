import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.util.js";
import crypto from "crypto";
import {OTP} from "../models/otp.model.js"
import nodemailer from "nodemailer";

const ANY_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS = 5;      
const RESEND_COOLDOWN_MS = 60 * 1000;
 
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
 
let transporter;
const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
        
            },
        });
    }
    return transporter;
};
 

const checkOtp = async (rawEmail, otp, { consume }) => {
    const email = normalizeEmail(rawEmail);
    if (!ANY_EMAIL.test(email) || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }
 
    const record = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!record) {
        throw new ApiError(400, "OTP expired or not requested. Please request a new one.");
    }
 
    if (record.attempts >= MAX_ATTEMPTS) {
        await OTP.deleteMany({ email });
        throw new ApiError(429, "Too many wrong attempts. Please request a new OTP.");
    }
 
    if (record.otp !== String(otp).trim()) {
        record.attempts += 1;
        await record.save();
        throw new ApiError(400, "Invalid OTP");
    }
 
    if (consume) await OTP.deleteMany({ email });
};
 
// POST /api/otp/generate-otp   { email }
export const generateOtp = asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    if (!ANY_EMAIL.test(email)) {
        throw new ApiError(400, "A valid email is required");
    }
 
    // simple resend throttle
    const latest = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
        throw new ApiError(429, "Please wait a minute before requesting another OTP");
    }
 
    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
 
    await OTP.deleteMany({ email });          // only one live code per email
    await OTP.create({ email, otp });
 
    try {
        await getTransporter().sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "KHOJ - your verification code",
            text: `Your KHOJ verification code is: ${otp}\n\nIt expires in 5 minutes. If you didn't request it, ignore this email.`,
        });
    } catch (error) {
        console.error("OTP email failed:", error);
        await OTP.deleteMany({ email });
        throw new ApiError(500, "Could not send the OTP email. Please try again.");
    }
 
    return res.status(200).json({ success: true, message: "OTP sent successfully" });
});
 
// POST /api/otp/verify-otp   { email, otp }
// Only checks the code (used by the signup UI). Does NOT delete it, so the
// register endpoint can still confirm it with assertOtpValid().
export const verifyOtp = asyncHandler(async (req, res) => {
    await checkOtp(req.body.email, req.body.otp, { consume: false });
    return res.status(200).json({ success: true, message: "OTP verified" });
});
 
// Call this inside your register controller (see notes) so the OTP can't be
// skipped by calling /register directly. Consumes the code on success.
export const assertOtpValid = (email, otp) => checkOtp(email, otp, { consume: true });
 

