import { User } from "../models/user.model.js";
import { HomeRegister } from "../models/homeRegister.model.js";
import { RankUser } from "../models/rankUser.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.util.js";
import fs from "fs";

export const updateUserProfileService = async (userId, bodyData, file, cleanMobile) => {
    let pictureUrl = null;

    // Handle Cloudinary processing if an image file was supplied
    if (file) {
        const cloudinaryResult = await uploadOnCloudinary(file.path);
        if (cloudinaryResult) {
            pictureUrl = cloudinaryResult.secure_url;
        }
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    }

    const homeProfile = await HomeRegister.findOne({ owner: userId });

    if (homeProfile) {
        // Home owners can only change their profile picture from this
        // endpoint — name/phone/property details are intentionally never
        // touched here (see profile.middleware.js, which blocks any attempt
        // to send those fields for an owner).
        const baseUser = pictureUrl
            ? await User.findByIdAndUpdate(
                  userId,
                  { $set: { picture: pictureUrl } },
                  { new: true }
              ).select("-password -refreshToken").lean()
            : await User.findById(userId).select("-password -refreshToken").lean();

        return {
            ...baseUser,
            role: "owner",
            name: homeProfile.ownerFullName,
            phone: homeProfile.phoneNumber,
            homeRegister: homeProfile
        };
    }

    // Update Student / Baseline user records
    const studentUpdate = {};
    if (bodyData.name !== undefined) studentUpdate.name = bodyData.name;
    if (cleanMobile !== undefined) studentUpdate.phone = cleanMobile;
    if (bodyData.dept !== undefined) studentUpdate.dept = bodyData.dept;
    if (bodyData.batch !== undefined) studentUpdate.batch = bodyData.batch;
    if (bodyData.bio !== undefined) studentUpdate.bio = bodyData.bio;
    if (pictureUrl) studentUpdate.picture = pictureUrl;

    // Only RankUser accounts may change their email, and only before their
    // profileEditDeadline.
    if (bodyData.email !== undefined) {
        const currentUser = await User.findById(userId).select("email authMethod");

        if (bodyData.email !== currentUser.email) {
            if (currentUser.authMethod !== "RankUser") {
                throw new ApiError(403, "Email cannot be changed for this account type");
            }

            const rankUser = await RankUser.findById(userId);
            if (rankUser.profileEditDeadline && new Date() > new Date(rankUser.profileEditDeadline)) {
                throw new ApiError(403, "Profile edit deadline has passed; email can no longer be changed");
            }

            const existing = await User.findOne({ email: bodyData.email });
            if (existing) throw new ApiError(409, "Email already in use by another account");

            studentUpdate.email = bodyData.email;
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: studentUpdate },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return updatedUser;
};