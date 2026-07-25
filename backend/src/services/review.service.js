import mongoose from "mongoose";
import { Review } from "../models/review.model.js";
import { HomeRegister } from "../models/homeRegister.model.js";
import { ApiError } from "../utils/apiError.util.js";

// Creates a review against a specific property. A property must exist and
// be admin-approved before it can be reviewed — a pending/rejected
// registration isn't a real, live listing yet.
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

// Returns { averageRating, reviewCount } for ONE property. Deliberately
// scoped to a single homeRegister id (not to an owner across all their
// properties) — a new property registration does not inherit the rating
// history of an owner's other properties.
export const getReviewStatsForProperty = async (homeRegisterId) => {
    const stats = await Review.aggregate([
        { $match: { homeRegister: new mongoose.Types.ObjectId(homeRegisterId) } },
        {
            $group: {
                _id: "$homeRegister",
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

export const getReviewsForProperty = async (homeRegisterId) => {
    return Review.find({ homeRegister: homeRegisterId }).sort({ createdAt: -1 });
};