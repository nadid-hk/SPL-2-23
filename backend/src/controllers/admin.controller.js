import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.util.js";
import * as adminService from "../services/admin.service.js";

export const getPendingRegistrations = asyncHandler(async (req, res) => {
    const data = await adminService.getPendingHomeRegistrations();
    res.status(200).json(new ApiResponse(200, data, "Pending home registrations fetched"));
});

export const getPendingPostsHandler = asyncHandler(async (req, res) => {
    const data = await adminService.getPendingPosts();
    res.status(200).json(new ApiResponse(200, data, "Pending posts fetched"));
});

export const getApprovedRegistrationsHandler = asyncHandler(async (req, res) => {
    const data = await adminService.getApprovedHomeRegistrationsAdmin();
    res.status(200).json(new ApiResponse(200, data, "Approved home registrations fetched"));
});

export const getListingsHandler = asyncHandler(async (req, res) => {
    const data = await adminService.getApprovedPostsAdmin();
    res.status(200).json(new ApiResponse(200, data, "Approved listings fetched"));
});

export const getAllUsersHandler = asyncHandler(async (req, res) => {
    const data = await adminService.getAllUsersAdmin();
    res.status(200).json(new ApiResponse(200, data, "Users fetched"));
});

// Rank-based (RankUser) accounts whose 6-month profile-edit deadline has passed
export const getExpiredRankUsersHandler = asyncHandler(async (req, res) => {
    const data = await adminService.getExpiredRankUsers();
    res.status(200).json(new ApiResponse(200, data, "Expired rank-based accounts fetched"));
});

// DELETE /api/admin/users/:id   body: { reason?, adminId? }
// `reason` is required unless the target is a RankUser past its
// profileEditDeadline — the service enforces that.
export const deleteUserHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, adminId } = req.body;

    // TODO: once auth middleware exists, prefer req.user._id over req.body.adminId
    const result = await adminService.deleteUser(id, adminId, reason);
    res.status(200).json(new ApiResponse(200, result, "User account deleted"));
});

// PATCH /api/admin/registrations/:id/review   body: { decision: "approved"|"rejected", reason?, adminId? }
export const reviewRegistration = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { decision, reason, adminId } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
        throw new ApiError(400, "decision must be either 'approved' or 'rejected'");
    }

    // TODO: once auth middleware exists, prefer req.user._id over req.body.adminId
    const result = await adminService.reviewHomeRegistration(id, decision, reason, adminId);
    res.status(200).json(new ApiResponse(200, result, `Registration ${decision}`));
});

// PATCH /api/admin/posts/:id/review   body: { decision: "approved"|"rejected", reason?, adminId? }
export const reviewPostHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { decision, reason, adminId } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
        throw new ApiError(400, "decision must be either 'approved' or 'rejected'");
    }

    const result = await adminService.reviewPost(id, decision, reason, adminId);
    res.status(200).json(new ApiResponse(200, result, `Post ${decision}`));
});