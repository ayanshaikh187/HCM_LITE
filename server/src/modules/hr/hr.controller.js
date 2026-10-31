import mongoose from "mongoose";

import { createHRSchema } from "./hr.validation.js";

import {
  createHRUser,
  getHRUsers,
  deactivateHRUser,
} from "./hr.service.js";

// Create HR account
export async function createHR(req, res, next) {
  try {
    const result = createHRSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid HR account details.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const user = await createHRUser({
      ...result.data,
      organizationId: req.user.organizationId,
    });

    return res.status(201).json({
      success: true,
      message: "HR account created successfully.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

// Get all HR accounts
export async function listHR(req, res, next) {
  try {
    const users = await getHRUsers({
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      data: {
        users,
        total: users.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Deactivate HR account
export async function deactivateHR(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid HR account ID.",
      });
    }

    const user = await deactivateHRUser({
      hrId: id,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "HR account deactivated successfully.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}