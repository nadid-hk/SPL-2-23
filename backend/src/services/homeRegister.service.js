import { HomeRegister } from "../models/homeRegister.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.util.js";
import fs from "fs";

// NEW: Given a khatianNumber the owner claims belongs to a property they
// registered before, this resolves the *authoritative* ownerGroupId for
// that property. This is deliberately re-derived server-side from the DB
// every time — the client never sends an ownerGroupId directly. That
// mirrors the existing fix in homeRegister.controller.js, where the server
// generates `owner` itself instead of trusting anything the client sends
// for identity.
//
// Throws if the previousKhatianNumber doesn't match any existing property,
// so the owner gets a clear error instead of silently starting a brand new
// unlinked group.
export const resolveOwnerGroupId = async (previousKhatianNumber) => {
    if (!previousKhatianNumber) return null;

    const previousProperty = await HomeRegister
        .findOne({ khatianNumber: previousKhatianNumber })
        .select("ownerGroupId");

    if (!previousProperty) {
        throw new ApiError(
            400,
            "No existing property found for the previous Khatian number provided. Double-check it, or leave it blank if this is your first property."
        );
    }

    return previousProperty.ownerGroupId;
};

// NEW: Public-safe lookup used by the "Register another property" autofill
// step. Only returns non-sensitive display info (name + phone + the
// previous property's name) — never the password, ownerGroupId, or any
// other internal id. Per product decision, this is intentionally NOT
// password-gated: knowing a Khatian number is treated as enough to prefill
// a form the owner can still review and edit before submitting.
export const findOwnerInfoByKhatianNumber = async (khatianNumber) => {
    const property = await HomeRegister
        .findOne({ khatianNumber })
        .select("ownerFullName phoneNumber housePropertyName status");

    if (!property) return null;

    return {
        ownerFullName: property.ownerFullName,
        phoneNumber: property.phoneNumber,
        previousPropertyName: property.housePropertyName,
        previousPropertyStatus: property.status
    };
};

export const createHomeRegistration = async (data, ownerId, ownerGroupId = null) => {
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
        const payload = {
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
        };

        // NEW: only set ownerGroupId explicitly when we resolved one from a
        // previousKhatianNumber. Otherwise leave the key out entirely so the
        // schema's default (= this document's own _id) kicks in, making it
        // the first property of a brand new group.
        if (ownerGroupId) {
            payload.ownerGroupId = ownerGroupId;
        }
        if (data.previousKhatianNumber) {
            payload.linkedViaKhatianNumber = data.previousKhatianNumber;
        }

        const newRegistration = await HomeRegister.create(payload);

        return newRegistration;
    } catch (error) {
        if (fs.existsSync(data.housePictureLocalPath)) fs.unlinkSync(data.housePictureLocalPath);
        if (fs.existsSync(data.khatianCertificateLocalPath)) fs.unlinkSync(data.khatianCertificateLocalPath);
        throw error;
    }
};

// Used to populate the "House / Property Name" <select> on the Post creation
// form — only properties an admin has approved should ever be selectable.
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