import mongoose from "mongoose";
import { createLeaveSchema } from "./leave.validation.js";

import {
  createLeaveRequest,
  getMyLeaveRequests,
  getOrganizationLeaveRequests,
  reviewLeaveRequest,
} from "./leave.service.js";
import { reviewLeaveSchema } from "./leave.validation.js";
import { logAudit } from "../audit/audit.service.js";
import {
  notifyOrganizationRoles,
  notifyLeaveRequester,
} from "../notification/notification.service.js";


export async function submitLeaveRequest(req, res, next) {
  try {
    const validation = createLeaveSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave request data.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const leave = await createLeaveRequest({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      ...validation.data,
    });
    await notifyOrganizationRoles({
      organizationId: req.user.organizationId,
      roles: ["Admin", "HR"],
      title: "New Leave Request",
      message: `${req.user.name} submitted a ${leave.leaveType} leave request.`,
      type: "Leave",
      relatedResourceType: "Leave",
      relatedResourceId: leave._id,
    });
    await logAudit({
      organizationId: req.user.organizationId,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: "LEAVE_SUBMITTED",
      resourceType: "Leave",
      resourceId: leave._id,
      description: "Leave request submitted successfully",
      metadata: {
        leaveType: leave.leaveType,
        totalDays: leave.totalDays,
        status: leave.status,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully.",
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyLeaveHistory(req, res, next) {
  try {
    const leaves = await getMyLeaveRequests({
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: { leaves },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrganizationLeaves(req, res, next) {
  try {
    const { status, department } = req.query;

    const allowedStatuses = [
      "Pending",
      "Approved",
      "Rejected",
      "Cancelled",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave status.",
      });
    }

    const leaves = await getOrganizationLeaveRequests({
      organizationId: req.user.organizationId,
      status,
      department,
    });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: { leaves },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewLeave(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave request ID.",
      });
    }
    const validation = reviewLeaveSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave review data.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const leave = await reviewLeaveRequest({
      leaveId: req.params.id,
      organizationId: req.user.organizationId,
      reviewerId: req.user.id,
      ...validation.data,
    });

    // Record the successful leave review.
    await logAudit({
      organizationId: req.user.organizationId,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action:
        leave.status === "Approved"
          ? "LEAVE_APPROVED"
          : "LEAVE_REJECTED",
      resourceType: "Leave",
      resourceId: leave._id,
      description: `Leave request ${leave.status.toLowerCase()} successfully`,
      metadata: {
        leaveType: leave.leaveType,
        status: leave.status,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    await notifyLeaveRequester({
      leave,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      message: `Leave request ${leave.status.toLowerCase()} successfully.`,
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
}

