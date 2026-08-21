import mongoose from "mongoose";
import { Review } from "../models/review.model.js";
import { HomeRegister } from "../models/homeRegister.model.js";
import { ApiError } from "../utils/apiError.util.js";

// Creates a review against a specific property. A property must exist and
// be admin-approved before it can be reviewed — a pending/rejected
// registration isn't a real, live listing yet.
//
// NOTE: reviews are still WRITTEN against the single specific property
// (homeRegisterId) the reviewer is looking at — that part is unchanged.
// Combining happens only on the READ side, in getReviewsForProperty /
// getReviewStatsForProperty below.
export const createReview = async (homeRegisterId, { reviewerName, rating, comment }) => {
    const property = await HomeRegister.findById(homeRegisterId);

    if (!property) {
        throw new ApiError(404, "Property not found.");
    }

    if (property.status !== "approved") {
        throw new ApiError(400, "Only approved properties can receive reviews.");
    }

    return Review.create({
        homeRegister: homeRegisterId,
        reviewerName,
        rating,
        comment
    });
};

// NEW: resolves every HomeRegister id that shares the same ownerGroupId as
// the given property — i.e. every property (old and new) belonging to the
// same real-world owner, per the "Register another property" linking flow
// in homeRegister.service.js. If the property doesn't exist, or somehow
// has no group (shouldn't happen given the schema default), we fall back
// to just the single id so callers degrade gracefully instead of throwing.
const getSiblingHomeRegisterIds = async (homeRegisterId) => {
    const property = await HomeRegister.findById(homeRegisterId).select("ownerGroupId");

    if (!property?.ownerGroupId) {
        return [new mongoose.Types.ObjectId(homeRegisterId)];
    }

    const siblings = await HomeRegister
        .find({ ownerGroupId: property.ownerGroupId })
        .select("_id");

    return siblings.map(s => s._id);
};

// Returns { averageRating, reviewCount } combined across every property the
// same owner has registered (their whole ownerGroupId), not just this one
// property. This is a deliberate product decision: an owner's second
// property should show their combined track record, not start from zero.
export const getReviewStatsForProperty = async (homeRegisterId) => {
    const homeRegisterIds = await getSiblingHomeRegisterIds(homeRegisterId);

    const stats = await Review.aggregate([
        { $match: { homeRegister: { $in: homeRegisterIds } } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    if (stats.length === 0) {
        return { averageRating: 0, reviewCount: 0 };
    }

    return {
        averageRating: Math.round(stats[0].averageRating * 10) / 10, // one decimal place
        reviewCount: stats[0].reviewCount
    };
};

// Combined review list across every property in the same ownerGroupId,
// newest first.
export const getReviewsForProperty = async (homeRegisterId) => {
    const homeRegisterIds = await getSiblingHomeRegisterIds(homeRegisterId);

    return Review.find({ homeRegister: { $in: homeRegisterIds } })
        .populate("homeRegister", "housePropertyName")
        .sort({ createdAt: -1 });
};