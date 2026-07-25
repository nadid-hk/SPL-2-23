import fs from "fs";

export const validatePost = (req, res, next) => {
    const {
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
    if (!registeredHouse) errors.push("You must select one of your registered properties");
    if (!ownerName?.trim()) errors.push("Owner name is required");
    if (!contactPhone?.trim()) errors.push("Contact phone is required");
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
        registeredHouse,
        ownerName,
        contactPhone,
        monthlyRent: rent,
        gateClosedTime,
        utilities: normalizeToArray(utilities),
        features: normalizeToArray(features),
        reasonTenantLeft: reasonTenantLeft?.trim() || "Not specified",
        photoLocalPaths: photoFiles.map((f) => f.path)
    };

    next();
};