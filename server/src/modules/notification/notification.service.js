
import mongoose from "mongoose";
import Notification from "./notification.model.js";
import User from "../auth/user.model.js";
import Employee from "../employee/employee.model.js";

// Common pagination validation
const validatePagination = (page, limit) => {
  page = Number(page);
  limit = Number(limit);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1
  ) {
    const error = new Error("Invalid pagination values.");
    error.statusCode = 400;
    throw error;
  }

  return {
    page,
    limit: Math.min(limit, 100),
  };
};

// CREATE NOTIFICATION
export async function createNotification({
  organizationId,
  recipientUserId,
  title,
  message,
  type = "System",
  relatedResourceType = null,
  relatedResourceId = null,
}) {
  try {
    if (
      !mongoose.isValidObjectId(organizationId) ||
      !mongoose.isValidObjectId(recipientUserId)
    ) {
      throw new Error("Invalid notification recipient or organization ID.");
    }

    // Do not notify inactive or cross-organization users
    const recipient = await User.findOne({
      _id: recipientUserId,
      organizationId,
      isActive: true,
    }).select("_id");

    if (!recipient) {
      return null;
    }

    return await Notification.create({
      organizationId,
      recipientUserId,
      title,
      message,
      type,
      relatedResourceType,
      relatedResourceId: relatedResourceId
        ? String(relatedResourceId)
        : null,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
}

// NOTIFY ORGANIZATION ROLES
export async function notifyOrganizationRoles({
  organizationId,
  roles,
  title,
  message,
  type = "System",
  relatedResourceType = null,
  relatedResourceId = null,
}) {
  const users = await User.find({
    organizationId,
    role: { $in: roles },
    isActive: true,
  }).select("_id");

  return Promise.all(
    users.map((user) =>
      createNotification({
        organizationId,
        recipientUserId: user._id,
        title,
        message,
        type,
        relatedResourceType,
        relatedResourceId,
      })
    )
  );
}

// NOTIFY LEAVE REQUESTER
export async function notifyLeaveRequester({
  leave,
  organizationId,
}) {
  const employee = await Employee.findOne({
    _id: leave.employeeId,
    organizationId,
  }).select("userId");

  if (!employee?.userId) return null;

  const approved = leave.status === "Approved";

  return createNotification({
    organizationId,
    recipientUserId: employee.userId,
    title: approved ? "Leave Approved" : "Leave Rejected",
    message: approved
      ? `Your ${leave.leaveType} leave request has been approved.`
      : `Your ${leave.leaveType} leave request has been rejected.`,
    type: "Leave",
    relatedResourceType: "Leave",
    relatedResourceId: leave._id,
  });
}

// GET MY NOTIFICATIONS
export async function getMyNotifications({
  userId,
  organizationId,
  page = 1,
  limit = 20,
  unreadOnly = false,
}) {
  const pagination = validatePagination(page, limit);

  const filter = {
    recipientUserId: userId,
    organizationId,
  };

  if (unreadOnly === true || unreadOnly === "true") {
    filter.readAt = null;
  }

  const skip = (pagination.page - 1) * pagination.limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pagination.limit)
      .lean(),

    Notification.countDocuments(filter),

    Notification.countDocuments({
      recipientUserId: userId,
      organizationId,
      readAt: null,
    }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

// MARK SINGLE NOTIFICATION AS READ
export async function markNotificationAsRead({
  notificationId,
  userId,
  organizationId,
}) {
  if (!mongoose.isValidObjectId(notificationId)) {
    const error = new Error("Invalid notification ID.");
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipientUserId: userId,
      organizationId,
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (notification) return notification;

  // Distinguish already-read notification from missing notification
  const existing = await Notification.findOne({
    _id: notificationId,
    recipientUserId: userId,
    organizationId,
  }).lean();

  if (!existing) {
    const error = new Error("Notification not found.");
    error.statusCode = 404;
    throw error;
  }

  return existing;
}

// MARK ALL NOTIFICATIONS AS READ
export async function markAllNotificationsAsRead({
  userId,
  organizationId,
}) {
  const result = await Notification.updateMany(
    {
      recipientUserId: userId,
      organizationId,
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    }
  );

  return {
    modifiedCount: result.modifiedCount,
  };
}
