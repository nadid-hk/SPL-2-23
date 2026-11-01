import fs from "fs";
import { HomeRegister } from "../models/homeRegister.model.js";

export const validateProfileUpdate = async (req, res, next) => {
    if (!req.body) {
        req.body = {};
    }
    const { name, mobile, housePropertyName, houseAddress } = req.body;
    const errors = [];

    // Identify if the active account represents a registered property owner
    const isOwner = await HomeRegister.exists({ owner: req.user._id });

    if (isOwner) {
        // Home owners are only allowed to change their profile picture from
        // this endpoint. Editing name/phone/property details is handled
        // through the property registration/approval flow instead.
        const attemptedFieldEdit =
            name !== undefined ||
            mobile !== undefined ||
            housePropertyName !== undefined ||
            houseAddress !== undefined;

        if (attemptedFieldEdit) {
            errors.push("Home owners can only update their profile picture here.");
        }

        if (!req.file && !attemptedFieldEdit) {
            errors.push("No profile picture was provided to update.");
        }
    } else {
        if (name !== undefined && !name.trim()) {
            errors.push("Full name cannot be left blank.");
        }

        if (mobile !== undefined && mobile.trim()) {
            const cleanPhone = mobile.replace(/\s+/g, '').replace('+88', '');
            const bdPhoneRegex = /^01[3-9]\d{8}$/;
            if (!bdPhoneRegex.test(cleanPhone)) {
                errors.push("Invalid Bangladesh phone number format. Must be 11 digits.");
            }
            req.cleanMobile = cleanPhone;
        }
    }

    if (errors.length > 0) {
        // Intercept and destroy local upload artifacts immediately on failure
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
            success: false,
            message: "Validation rules violated",
            errors
        });
    }

    next();
};