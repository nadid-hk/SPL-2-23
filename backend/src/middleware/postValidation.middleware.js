import fs from "fs";
import { DEPARTMENTS } from "../models/post.model.js";

export const validatePost = (req, res, next) => {
    const {
        postedAs,
        khatianNumber,
        studentDepartment,
        registeredHouse,
        ownerName,
        contactPhone,
        monthlyRent,
        gateClosedTime,
        utilities,
        features,
        reasonTenantLeft
    } = req.body;

    const files = req.files || {};
    const photoFiles = files.photos || [];

    const errors = [];

    // 1. Required fields (Removed fullAddress, latitude, and longitude checks)
    // Owners: the property is resolved server-side from the Khatian number.
    // Students: must pick a property. ownerName is no longer required from the
    // client — the service always takes it from HomeRegister.
    if (postedAs === "student" && !registeredHouse) {
        errors.push("You must select a registered property");
    }

    // Poster role. Owners are verified by Khatian number (their phone comes
    // from HomeRegister, so it isn't required from the client); students
    // must give a department and their own 11-digit phone.
    if (!["owner", "student"].includes(postedAs)) {
        errors.push("Please specify whether you are posting as an owner or a student");
    } else if (postedAs === "owner") {
        if (!khatianNumber?.trim()) errors.push("Khatian number is required to post as an owner");
    } else {
        if (!DEPARTMENTS.includes(studentDepartment)) {
            errors.push(`Department must be one of: ${DEPARTMENTS.join(", ")}`);
        }
        if (!/^\d{11}$/.test(contactPhone?.trim() || "")) {
            errors.push("A valid 11-digit contact phone is required");
        }
    }
    if (!monthlyRent) errors.push("Monthly rent is required");
    if (!gateClosedTime?.trim()) errors.push("Gate closing time is required");

    // 2. Rent must be a valid non-negative number
    const rent = parseFloat(monthlyRent);
    if (monthlyRent && (isNaN(rent) || rent < 0)) {
        errors.push("Monthly rent must be a valid, non-negative number");
    }

    // 3. Exactly 2 photos required
    if (photoFiles.length !== 2) {
        errors.push(`Exactly 2 photos are required (received ${photoFiles.length})`);
    }

    // If validation fails, clean up any temp uploads immediately
    if (errors.length > 0) {
        photoFiles.forEach((f) => {
            if (f?.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    const normalizeToArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [val];
        } catch {
            return [val];
        }
    };

    req.validatedData = {
        postedAs,
        khatianNumber: khatianNumber?.trim() || "",
        studentDepartment: studentDepartment?.trim() || "",
        registeredHouse,
        ownerName,
        contactPhone: contactPhone?.trim() || "",
        monthlyRent: rent,
        gateClosedTime,
        utilities: normalizeToArray(utilities),
        features: normalizeToArray(features),
        reasonTenantLeft: reasonTenantLeft?.trim() || "Not specified",
        photoLocalPaths: photoFiles.map((f) => f.path)
    };

    next();
};