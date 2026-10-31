
import mongoose from "mongoose";
import { getAuditLogs } from "./audit.service.js";

export const listAuditLogs = async (req, res, next) => {
  try {
    const { page: rawPage, limit: rawLimit, action, resourceType, actorId, from, to } = req.query;

    const page = Number(rawPage ?? 1);
    const limit = Number(rawLimit ?? 20);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit. Limit must be between 1 and 100.",
      });
    }

    const stringFilters = { action, resourceType, actorId, from, to };

    for (const [key, value] of Object.entries(stringFilters)) {
      if (value !== undefined && typeof value !== "string") {
        return res.status(400).json({
          success: false,
          message: `Invalid ${key}. A string value is required.`,
        });
      }
    }

    if (actorId && !mongoose.isValidObjectId(actorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid actorId.",
      });
    }

    const isValidISODate = (value) =>
      /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().startsWith(
        value.length === 10 ? value : value
      );

    if (
      (from && !isValidISODate(from)) ||
      (to && !isValidISODate(to))
    ) {
      return res.status(400).json({
        success: false,
        message: "Dates must be valid ISO date values.",
      });
    }

    if (from && to && new Date(from) > new Date(to)) {
      return res.status(400).json({
        success: false,
        message: "'from' cannot be after 'to'.",
      });
    }

    const result = await getAuditLogs({
      organizationId: req.user.organizationId,
      page,
      limit,
      action,
      resourceType,
      actorId,
      from,
      to,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
