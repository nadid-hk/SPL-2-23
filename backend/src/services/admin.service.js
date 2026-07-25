import { HomeRegister } from "../models/homeRegister.model.js";
import { Post } from "../models/post.model.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.util.js";

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

    registration.status = decision; // "approved" | "rejected"
    registration.rejectionReason = decision === "rejected" ? (reason || "Not specified") : "";
    registration.reviewedBy = adminId || null;
    registration.reviewedAt = new Date();
    await registration.save();

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

    post.status = decision;
    post.rejectionReason = decision === "rejected" ? (reason || "Not specified") : "";
    post.reviewedBy = adminId || null;
    post.reviewedAt = new Date();
    await post.save();

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