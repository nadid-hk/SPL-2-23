import { HomeRegister } from "../models/homeRegister.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.util.js";
import fs from "fs";

export const createHomeRegistration = async (data, ownerId) => {
    let housePictureResult = null;
    let khatianCertificateResult = null;

    try {
        // 1. Upload House Picture asset to Cloudinary
        housePictureResult = await uploadOnCloudinary(data.housePictureLocalPath);
        if (!housePictureResult) throw new Error("House Picture upload execution failed.");

        // 2. Upload Khatian Certificate asset to Cloudinary
        khatianCertificateResult = await uploadOnCloudinary(data.khatianCertificateLocalPath);
        if (!khatianCertificateResult) throw new Error("Khatian Certificate upload execution failed.");

        // Double check safety execution block: Delete temporary local files explicitly
        if (fs.existsSync(data.housePictureLocalPath)) fs.unlinkSync(data.housePictureLocalPath);
        if (fs.existsSync(data.khatianCertificateLocalPath)) fs.unlinkSync(data.khatianCertificateLocalPath);

        // 3. Assemble components & write database document into MongoDB.
        // NOTE: `status` is NOT set here — it always comes in as the schema's
        // default "pending". This registration is not usable/live until an
        // admin explicitly approves it via the admin review endpoints.
        const newRegistration = await HomeRegister.create({
            owner: ownerId,
            ownerFullName: data.ownerFullName,
            phoneNumber: data.phoneNumber,
            khatianNumber: data.khatianNumber, // Save credentials securely
            password: data.password,           // Hashed automatically via pre-save hook
            housePropertyName: data.housePropertyName,
            houseAddress: data.houseAddress,
            housePicture: {
                url: housePictureResult.secure_url,
                publicId: housePictureResult.public_id
            },
            houseMap: {
                type: "Point",
                coordinates: data.coordinates 
            },
            khatianCertificate: {
                url: khatianCertificateResult.secure_url,
                publicId: khatianCertificateResult.public_id
            }
        });

        return newRegistration;
    } catch (error) {
        if (fs.existsSync(data.housePictureLocalPath)) fs.unlinkSync(data.housePictureLocalPath);
        if (fs.existsSync(data.khatianCertificateLocalPath)) fs.unlinkSync(data.khatianCertificateLocalPath);
        throw error;
    }
};

// Used to populate the "House / Property Name" <select> on the Post creation
// form — only properties an admin has approved should ever be selectable.
// ── FIX: also select houseMap (real coordinates) and owner, so post
// creation and any downstream ownership checks have real data instead of
// relying on hardcoded fallback values.
export const getApprovedHomeRegistrations = async () => {
    return HomeRegister.find({ status: "approved" })
        .select("housePropertyName houseAddress houseMap housePicture owner")
        .sort({ housePropertyName: 1 });
};

// NOTE: rental status toggling (setRentalStatus) has been moved to
// post.service.js as setPostRentalStatus, since Post.isRented is the real,
// authoritative field for "is this listing currently rented" — not
// anything on HomeRegister. See post.service.js / post.controller.js /
// post.route.js for the updated implementation.