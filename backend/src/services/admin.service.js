import { HomeRegister } from "../models/homeRegister.model.js";
import { Post } from "../models/post.model.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.util.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { removeLocalFile } from "../utils/removeLocalFile.util.js";
// Rank-based accounts (RankUser discriminator) are only allowed to keep
// editing their profile for ~6 months after registration — see
// rankUser.model.js `profileEditDeadline`. Past that date the account is
// eligible for admin cleanup.
const isRankAccountExpired = (user) =>
    user.authMethod === "RankUser" &&
    user.profileEditDeadline &&
    user.profileEditDeadline.getTime() < Date.now();

// ── Reads ──
export const getPendingHomeRegistrations = () =>
    HomeRegister.find({ status: "pending" }).sort({ createdAt: -1 });

export const getPendingPosts = () =>
    Post.find({ status: "pending" })
        .populate("registeredHouse", "housePropertyName houseAddress")
        .sort({ createdAt: -1 });

export const getApprovedHomeRegistrationsAdmin = () =>
    HomeRegister.find({ status: "approved" }).sort({ createdAt: -1 });

export const getApprovedPostsAdmin = () =>
    Post.find({ status: "approved" })
        .populate("registeredHouse", "housePropertyName houseAddress")
        .sort({ createdAt: -1 });

export const getAllUsersAdmin = () =>
    User.find().sort({ createdAt: -1 });

// Rank-based accounts whose 6-month profileEditDeadline has already passed.
// `authMethod` is the discriminatorKey set up in user.model.js, so this
// query only ever matches RankUser documents.
export const getExpiredRankUsers = () =>
    User.find({
        authMethod: "RankUser",
        profileEditDeadline: { $lt: new Date() }
    }).sort({ profileEditDeadline: 1 });

// ── Decisions ──
export const reviewHomeRegistration = async (id, decision, reason, adminId) => {
    const registration = await HomeRegister.findById(id);
    if (!registration) throw new ApiError(404, "Registration not found");
    if (registration.status !== "pending") {
        throw new ApiError(400, "This registration has already been reviewed");
    }

    if (decision === "approved") {
        // Upload FIRST. If Cloudinary fails we throw before changing anything,
        // so the registration stays pending, the temp files stay, and the admin can retry.
        const housePictureResult = await uploadOnCloudinary(registration.housePictureLocalPath);
        if (!housePictureResult) throw new ApiError(502, "House picture upload failed. Please try again.");

        const certificateResult = await uploadOnCloudinary(registration.khatianCertificateLocalPath);
        if (!certificateResult) throw new ApiError(502, "Khatian certificate upload failed. Please try again.");

        registration.housePicture = {
            url: housePictureResult.secure_url,
            publicId: housePictureResult.public_id
        };
        registration.khatianCertificate = {
            url: certificateResult.secure_url,
            publicId: certificateResult.public_id
        };
    }

    const housePath = registration.housePictureLocalPath;
    const certPath = registration.khatianCertificateLocalPath;

    registration.housePictureLocalPath = "";
    registration.khatianCertificateLocalPath = "";
    registration.status = decision;
    registration.rejectionReason = decision === "rejected" ? (reason || "Not specified") : "";
    registration.reviewedBy = adminId || null;
    registration.reviewedAt = new Date();
    await registration.save();

    // Approved -> now on Cloudinary; rejected -> never needed. Either way the temp copy goes.
    removeLocalFile(housePath);
    removeLocalFile(certPath);

    await Notification.create({
        user: registration.owner,
        type: decision === "approved" ? "home_register_approved" : "home_register_rejected",
        title: decision === "approved" ? "Home Registration Approved" : "Home Registration Rejected",
        message:
            decision === "approved"
                ? `Your property "${registration.housePropertyName}" has been approved. You can now log in as a home owner.`
                : `Your property "${registration.housePropertyName}" was rejected.${reason ? ` Reason: ${reason}` : ""}`
    });

    return registration;
};
export const reviewPost = async (id, decision, reason, adminId) => {
    const post = await Post.findById(id);
    if (!post) throw new ApiError(404, "Post not found");
    if (post.status !== "pending") {
        throw new ApiError(400, "This post has already been reviewed");
    }

    const localPaths = [...(post.photoLocalPaths || [])];

       if (decision === "approved" && localPaths.length > 0) {
        const uploadedPhotos = [];
        for (const localPath of localPaths) {
            const result = await uploadOnCloudinary(localPath);
            if (!result) throw new ApiError(502, "Photo upload failed. Please try again.");
            uploadedPhotos.push({ url: result.secure_url, publicId: result.public_id });
        }
        post.photos = uploadedPhotos;
    }

    post.photoLocalPaths = [];
    post.status = decision;
    post.rejectionReason = decision === "rejected" ? (reason || "Not specified") : "";
    post.reviewedBy = adminId || null;
    post.reviewedAt = new Date();
    await post.save();

    localPaths.forEach(removeLocalFile);

    await Notification.create({
        user: post.author,
        type: decision === "approved" ? "post_approved" : "post_rejected",
        title: decision === "approved" ? "Post Approved" : "Post Rejected",
        message:
            decision === "approved"
                ? `Your house rent post is now live on the dashboard.`
                : `Your house rent post was rejected.${reason ? ` Reason: ${reason}` : ""}`
    });

    return post;
};

// ── Account deletion (misconduct or expired rank-based registration) ──
//
// Two legitimate reasons an admin deletes a User account:
//   1. Misconduct — any user, any authMethod, but a `reason` is required
//      so there's always an audit trail for why the account was removed.
//   2. Expired rank-based registration — a RankUser account whose
//      profileEditDeadline (~6 months, set in rankUser.model.js) has
//      passed. No reason is required here since the expiry itself is
//      the justification, but one can still be supplied.
export const deleteUser = async (id, adminId, reason) => {
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, "User not found");

    const expired = isRankAccountExpired(user);
    if (!expired && !reason) {
        throw new ApiError(
            400,
            "A reason is required to delete an account that has not passed its rank profile-edit deadline"
        );
    }

    // Cascade cleanup so we don't leave orphaned documents referencing a
    // now-deleted user (HomeRegister.owner, Post.author, Notification.user
    // all have required refs to "User").
    const [deletedRegistrations, deletedPosts] = await Promise.all([
        HomeRegister.deleteMany({ owner: id }),
        Post.deleteMany({ author: id })
    ]);
    const [pendingRegs, pendingPosts] = await Promise.all([
        HomeRegister.find({ owner: id, status: "pending" }).select("housePictureLocalPath khatianCertificateLocalPath"),
        Post.find({ author: id, status: "pending" }).select("photoLocalPaths")
    ]);
    pendingRegs.forEach((r) => {
        removeLocalFile(r.housePictureLocalPath);
        removeLocalFile(r.khatianCertificateLocalPath);
    });
    pendingPosts.forEach((p) => (p.photoLocalPaths || []).forEach(removeLocalFile));

    await Notification.deleteMany({ user: id });

    await User.findByIdAndDelete(id);

    // TODO: once auth/adminId is wired up for real, log this deletion
    // (adminId, targetUserId, reason, expired) to an audit collection
    // instead of just returning it in the response.
    return {
        deletedUserId: id,
        name: user.name,
        authMethod: user.authMethod,
        reason: expired ? (reason || "Rank profile-edit deadline expired") : reason,
        deletedByAdmin: adminId || null,
        cascaded: {
            homeRegistrations: deletedRegistrations.deletedCount,
            posts: deletedPosts.deletedCount
        }
    };
};