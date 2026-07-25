import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { createReview, getReviewStatsForProperty, getReviewsForProperty } from "../services/review.service.js";

// POST /api/reviews
export const addReview = asyncHandler(async (req, res) => {
    const { homeRegisterId, reviewerName, rating, comment } = req.validatedReview;

    const review = await createReview(homeRegisterId, { reviewerName, rating, comment });

    return res
        .status(201)
        .json(new ApiResponse(201, review, "Review submitted successfully."));
});

// GET /api/reviews/:homeRegisterId
// Returns the average rating + review count + full list for ONE property.
export const getPropertyReviews = asyncHandler(async (req, res) => {
    const { homeRegisterId } = req.params;

    const [stats, reviews] = await Promise.all([
        getReviewStatsForProperty(homeRegisterId),
        getReviewsForProperty(homeRegisterId)
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, { ...stats, reviews }, "Reviews fetched"));
});