import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getListingReviews, getMyReviewState, saveMyReview } from "../services/stayReview.service.js";
import { getTenantCandidates } from "../services/tenancy.service.js";

// GET /api/posts/:id/reviews — public
export const getReviewsForListing = asyncHandler(async (req, res) => {
    const data = await getListingReviews(req.params.id);
    return res.status(200).json(new ApiResponse(200, data, "Reviews fetched"));
});

// GET /api/posts/:id/reviews/me — signed-in student
export const getMyReview = asyncHandler(async (req, res) => {
    const data = await getMyReviewState(req.params.id, req.user);
    return res.status(200).json(new ApiResponse(200, data, "Review state fetched"));
});

// PUT /api/posts/:id/reviews/me — confirmed tenant
export const putMyReview = asyncHandler(async (req, res) => {
    const data = await saveMyReview(req.params.id, req.user, req.validatedReview);
    return res.status(200).json(new ApiResponse(200, data, "Review saved"));
});

// GET /api/posts/:id/tenant-candidates — property owner
export const listTenantCandidates = asyncHandler(async (req, res) => {
    const data = await getTenantCandidates(req.params.id, req.user);
    return res.status(200).json(new ApiResponse(200, data, "Tenant candidates fetched"));
});
