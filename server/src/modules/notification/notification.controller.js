import mongoose from "mongoose";

import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notification.service.js";

export async function listNotifications(req, res, next) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values.",
      });
    }

    if (
      req.query.unreadOnly !== undefined &&
      !["true", "false"].includes(req.query.unreadOnly)
    ) {
      return res.status(400).json({
        success: false,
        message: "unreadOnly must be true or false.",
      });
    }

    const data = await getMyNotifications({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      page,
      limit,
      unreadOnly: req.query.unreadOnly === "true",
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await markNotificationAsRead({
      notificationId: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const result = await markAllNotificationsAsRead({
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Notifications marked as read.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}