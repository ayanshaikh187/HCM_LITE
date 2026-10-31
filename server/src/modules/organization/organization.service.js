
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Organization from "./organization.model.js";
import User from "../auth/user.model.js";

// Check whether initial company setup is completed
export async function getSetupStatus() {
  const organization = await Organization.exists({
    systemKey: "primary",
  });

  return {
    setupRequired: !organization,
  };
}

// First-time company and Admin setup
export async function initializeOrganization(input) {
  const session = await mongoose.startSession();

  try {
    let createdOrganizationId;

    await session.withTransaction(async () => {
      const existingOrganization = await Organization.findOne({
        systemKey: "primary",
      }).session(session);

      if (existingOrganization) {
        const error = new Error("Company setup is already complete");
        error.statusCode = 409;
        throw error;
      }

      const passwordHash = await bcrypt.hash(
        input.adminPassword,
        12
      );

      const [organization] = await Organization.create(
        [
          {
            name: input.companyName,
            systemKey: "primary",
            setupCompletedAt: new Date(),
          },
        ],
        { session }
      );

      await User.create(
        [
          {
            name: input.adminName,
            email: input.adminEmail,
            passwordHash,
            role: "Admin",
            organizationId: organization._id,
          },
        ],
        { session }
      );

      createdOrganizationId = organization._id;
    });

    return {
      organizationId: createdOrganizationId,
      setupCompleted: true,
    };
  } catch (error) {
    if (error.code === 11000) {
      const existingOrganization = await Organization.exists({
        systemKey: "primary",
      });

      if (existingOrganization) {
        const conflict = new Error(
          "Company setup is already complete"
        );
        conflict.statusCode = 409;
        throw conflict;
      }

      const conflict = new Error(
        "An account with this email already exists"
      );
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

// Get organization settings
export async function getOrganizationSettings(organizationId) {
  const organization = await Organization.findOne({
    _id: organizationId,
    systemKey: "primary",
  }).select(
    "name timezone officeStart graceMinutes halfDayUnderHours weekendDays officeLocation leaveTypes holidays"
  );

  if (!organization) {
    const error = new Error("Organization not found");
    error.statusCode = 404;
    throw error;
  }

  return organization;
}

// Update organization settings
export async function updateOrganizationSettings(
  organizationId,
  input
) {
  if (Object.keys(input).length === 0) {
    const error = new Error("No settings provided for update");
    error.statusCode = 400;
    throw error;
  }

  const organization = await Organization.findOneAndUpdate(
    {
      _id: organizationId,
      systemKey: "primary",
    },
    {
      $set: input,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select(
    "name timezone officeStart graceMinutes halfDayUnderHours weekendDays officeLocation leaveTypes holidays"
  );

  if (!organization) {
    const error = new Error("Organization not found");
    error.statusCode = 404;
    throw error;
  }

  return organization;
}
