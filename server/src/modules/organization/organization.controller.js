
import { firstRunSetupSchema } from "../auth/auth.validation.js";

import {
  getSetupStatus,
  initializeOrganization,
  getOrganizationSettings,
  updateOrganizationSettings,
} from "./organization.service.js";

import {
  updateOrganizationSettingsSchema,
} from "./organization.validation.js";

// Check initial setup status
export async function setupStatusController(req, res, next) {
  try {
    const result = await getSetupStatus();

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// Initialize company and Admin account
export async function initializeSetupController(req, res, next) {
  try {
    const validation = firstRunSetupSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid setup details",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const result = await initializeOrganization(validation.data);

    return res.status(201).json({
      success: true,
      message: "Company and Admin account created successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
}

// Get organization settings
export async function getOrganizationSettingsController(
  req,
  res,
  next
) {
  try {
    const settings = await getOrganizationSettings(
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      data: {
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Update organization settings
export async function updateOrganizationSettingsController(
  req,
  res,
  next
) {
  try {
    const validation =
      updateOrganizationSettingsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization settings",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const settings = await updateOrganizationSettings(
      req.user.organizationId,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: "Organization settings updated successfully",
      data: {
        settings,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
}
