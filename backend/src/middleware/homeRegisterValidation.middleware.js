import fs from "fs";

export const validateHomeRegister = (req, res, next) => {
    const { ownerFullName, phoneNumber, housePropertyName, houseAddress, latitude, longitude, khatianNumber, password } = req.body;
    const files = req.files || {};

    const housePictureFile = files.housePicture ? files.housePicture[0] : null;
    const khatianCertificateFile = files.khatianCertificate ? files.khatianCertificate[0] : null;

    const errors = [];

    // Check required text fields
    if (!ownerFullName?.trim()) errors.push("Owner full name is required");
    if (!phoneNumber?.trim()) errors.push("Phone number is required");
    if (!housePropertyName?.trim()) errors.push("House/Property name is required");
    if (!houseAddress?.trim()) errors.push("House address is required");
    if (!latitude || !longitude) errors.push("Coordinates (latitude and longitude) are required");
    
    // Validate credentials additions
    if (!khatianNumber?.trim()) errors.push("Khatian number is required");
    if (!password || password.length < 6) errors.push("Password must be at least 6 characters long");

    // Validate BD phone number
    const cleanPhone = phoneNumber ? phoneNumber.replace(/\s+/g, '').replace('+88', '') : '';
    const bdPhoneRegex = /^01[3-9]\d{8}$/; 
    if (phoneNumber && !bdPhoneRegex.test(cleanPhone)) {
        errors.push("Invalid Bangladesh phone number. Must be 11 digits.");
    }

    // Validate coordinate limits
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        errors.push("Invalid map coordinates.");
    }

    if (!housePictureFile) errors.push("House Picture file is required");
    if (!khatianCertificateFile) errors.push("Khatian Certificate file is required");

    if (errors.length > 0) {
        if (housePictureFile && fs.existsSync(housePictureFile.path)) fs.unlinkSync(housePictureFile.path);
        if (khatianCertificateFile && fs.existsSync(khatianCertificateFile.path)) fs.unlinkSync(khatianCertificateFile.path);

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    req.validatedData = {
        ownerFullName,
        phoneNumber: cleanPhone,
        housePropertyName,
        houseAddress,
        coordinates: [lng, lat], 
        housePictureLocalPath: housePictureFile.path,
        khatianCertificateLocalPath: khatianCertificateFile.path,
        khatianNumber,
        password
    };

    next();
};