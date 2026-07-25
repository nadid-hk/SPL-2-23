import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Notification } from "../models/notification.model.js";

// GET /api/notifications/:userId
export const getUserNotifications = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched"));
});

// PATCH /api/notifications/:id/read
export const markNotificationRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
});