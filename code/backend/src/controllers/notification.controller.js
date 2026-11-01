import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.util.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";

// POST /api/notifications  (admin) — send to one or many users
export const sendNotification = asyncHandler(async (req, res) => {
    const { userId, userIds, title, message, type } = req.body;

    const recipients = [...new Set([...(userIds || []), ...(userId ? [userId] : [])])];
    if (!recipients.length) throw new ApiError(400, "At least one recipient is required");
    if (!title?.trim() || !message?.trim()) throw new ApiError(400, "Title and message are required");

    const found = await User.countDocuments({ _id: { $in: recipients } });
    if (found !== recipients.length) throw new ApiError(404, "One or more recipients do not exist");

    const docs = recipients.map(user => ({
        user,
        sender: req.user._id,
        title,
        message,
        ...(type && { type })
    }));
    const created = await Notification.insertMany(docs);

    res.status(201).json(new ApiResponse(201, created, "Notification sent"));
});

// GET /api/notifications/admin/all  (admin) — everything sent to all users
export const getAllSentNotifications = asyncHandler(async (req, res) => {
    const { userId } = req.query;                       // optional filter
    const page  = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const filter = userId ? { user: userId } : {};
    const [items, total] = await Promise.all([
        Notification.find(filter)
            .populate("user", "name email")
            .populate("sender", "name")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Notification.countDocuments(filter)
    ]);

    res.status(200).json(new ApiResponse(200, { items, total, page, limit }, "All notifications fetched"));
});

// GET /api/notifications/me  (user) — only their own
export const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched"));
});

// PATCH /api/notifications/:id/read  (recipient only)
export const markNotificationRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },     // ownership enforced here
        { isRead: true },
        { new: true }
    );
    if (!notification) throw new ApiError(404, "Notification not found");

    res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
});

