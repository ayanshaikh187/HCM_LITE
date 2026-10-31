
import mongoose from "mongoose";
import Audit from "./audit.model.js";

const sensitiveKeyPattern =
  /password|token|secret|authorization|cookie|credential|api[-_]?key|private[-_]?key/i;

// Metadata sanitization
const sanitizeMetadata = (value, depth = 0, seen = new WeakSet()) => {
  if (depth > 5) return "[MAX_DEPTH]";

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value.slice(0, 500);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? "[INVALID_DATE]"
      : value.toISOString();
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[CIRCULAR_REFERENCE]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map((item) => sanitizeMetadata(item, depth + 1, seen));
  }

  const clean = {};

  for (const [key, item] of Object.entries(value)) {
    if (sensitiveKeyPattern.test(key)) {
      clean[key] = "[REDACTED]";
    } else {
      clean[key] = sanitizeMetadata(item, depth + 1, seen);
    }
  }

  return clean;
};

// CREATE AUDIT LOG
export const logAudit = async ({
  organizationId,
  actorId = null,
  actorName = "System",
  actorRole = "System",
  action,
  resourceType,
  resourceId = null,
  description,
  metadata = {},
  ipAddress = null,
  userAgent = null,
}) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw new Error("Invalid organization ID for audit log.");
  }

  if (
    actorId &&
    !mongoose.isValidObjectId(actorId)
  ) {
    throw new Error("Invalid audit actor ID.");
  }

  try {
    return await Audit.create({
      organizationId,
      actorId,
      actorName,
      actorRole,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : null,
      description,
      metadata: sanitizeMetadata(metadata),
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Audit log creation failed:", error.message);
    throw error;
  }
};

// GET AUDIT LOGS
export const getAuditLogs = async ({
  organizationId,
  page = 1,
  limit = 20,
  action,
  resourceType,
  actorId,
  from,
  to,
}) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    const error = new Error("Invalid organization ID.");
    error.statusCode = 400;
    throw error;
  }

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

  limit = Math.min(limit, 100);

  const filter = {
    organizationId,
  };

  if (action) filter.action = action;
  if (resourceType) filter.resourceType = resourceType;

  if (actorId) {
    if (!mongoose.isValidObjectId(actorId)) {
      const error = new Error("Invalid actor ID.");
      error.statusCode = 400;
      throw error;
    }

    filter.actorId = actorId;
  }

  if (from || to) {
    filter.createdAt = {};

    if (from) {
      const fromDate = new Date(from);

      if (Number.isNaN(fromDate.getTime())) {
        const error = new Error("Invalid start date.");
        error.statusCode = 400;
        throw error;
      }

      filter.createdAt.$gte = fromDate;
    }

    if (to) {
      const toDate = new Date(to);

      if (Number.isNaN(toDate.getTime())) {
        const error = new Error("Invalid end date.");
        error.statusCode = 400;
        throw error;
      }

      filter.createdAt.$lte = toDate;
    }

    if (
      filter.createdAt.$gte &&
      filter.createdAt.$lte &&
      filter.createdAt.$gte > filter.createdAt.$lte
    ) {
      const error = new Error("Start date cannot be after end date.");
      error.statusCode = 400;
      throw error;
    }
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    Audit.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Audit.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
