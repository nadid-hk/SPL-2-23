import mongoose from "mongoose";
import { Post } from "../models/post.model.js";
import { Tenancy } from "../models/tenancy.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Notification } from "../models/notification.model.js";
import { ApiError } from "../utils/apiError.util.js";

// Student accounts are the two User discriminators; owner logins are plain
// User documents with no authMethod.
const STUDENT_AUTH_METHODS = ["EmailUser", "RankUser"];

const isStudentAccount = (user) => STUDENT_AUTH_METHODS.includes(user?.authMethod);

// Loads an approved listing together with its property and checks that the
// requesting user is that property's owner. Used by every tenancy action.
export const loadPostForOwner = async (postId, requestingUser) => {
    if (!mongoose.isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid listing id.");
    }

    const post = await Post.findById(postId).populate("registeredHouse", "owner ownerGroupId housePropertyName");
    if (!post) {
        throw new ApiError(404, "Post not found.");
    }
    if (post.status !== "approved") {
        throw new ApiError(400, "Only approved posts can have their rental status updated.");
    }

    const isOwner = String(post.registeredHouse?.owner) === String(requestingUser._id);
    if (!isOwner) {
        throw new ApiError(403, "Only the owner of this property can do that.");
    }

    return post;
};

// Students the owner can name as tenant: everyone who opened a chat about
// this listing. Talking first is the usual way a rental is agreed, and it
// keeps the owner from naming an arbitrary account.
export const getTenantCandidates = async (postId, requestingUser) => {
    const post = await loadPostForOwner(postId, requestingUser);

    const conversations = await Conversation.find({ post: post._id })
        .populate("participants", "name picture authMethod email")
        .sort({ updatedAt: -1 });

    const seen = new Set();
    const candidates = [];
    for (const conversation of conversations) {
        for (const participant of conversation.participants) {
            const id = String(participant._id);
            if (id === String(requestingUser._id) || seen.has(id) || !isStudentAccount(participant)) continue;
            seen.add(id);
            candidates.push({
                _id: participant._id,
                name: participant.name,
                picture: participant.picture || "",
                email: participant.email || "",
                lastMessageAt: conversation.lastMessage?.at || conversation.updatedAt
            });
        }
    }

    const active = await Tenancy.findOne({ post: post._id, status: "active" }).populate("student", "name");

    return {
        candidates,
        activeTenant: active ? { _id: active.student?._id, name: active.student?.name, startedAt: active.startedAt } : null
    };
};

// Starts a stay for `tenantId` on this listing and tells the student they can
// now review it. The tenant must be one of the chat candidates.
export const startTenancy = async (post, requestingUser, tenantId) => {
    const { candidates } = await getTenantCandidates(post._id, requestingUser);
    const tenant = candidates.find((c) => String(c._id) === String(tenantId));
    if (!tenant) {
        throw new ApiError(400, "The tenant must be a student who has messaged you about this listing.");
    }

    // A new tenant replaces any stay that was left open.
    await endActiveTenancy(post._id);

    const tenancy = await Tenancy.create({
        post: post._id,
        homeRegister: post.registeredHouse._id,
        ownerGroupId: post.registeredHouse.ownerGroupId || post.registeredHouse._id,
        student: tenant._id,
        confirmedBy: requestingUser._id
    });

    await Notification.create({
        user: tenant._id,
        sender: requestingUser._id,
        type: "tenancy_confirmed",
        title: "You're confirmed as tenant",
        message: `The owner of "${post.registeredHouse.housePropertyName}" confirmed you as the tenant. You can now review the room and the owner from the listing page.`
    });

    return tenancy;
};

export const endActiveTenancy = async (postId) => {
    await Tenancy.updateMany(
        { post: postId, status: "active" },
        { $set: { status: "ended", endedAt: new Date() } }
    );
};
