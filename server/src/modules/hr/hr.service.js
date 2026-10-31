import bcrypt from "bcryptjs";
import User from "../auth/user.model.js";

export async function createHRUser({
  name,
  email,
  temporaryPassword,
  organizationId,
}) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  }).select("_id");

  if (existingUser) {
    const error = new Error(
      "An account with this email already exists."
    );
    error.statusCode = 409;
    throw error;
  }

  try {
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "HR",
      organizationId,
      isActive: true,
      mustChangePassword: true,
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    };
  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error(
        "An account with this email already exists."
      );
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
}

export async function getHRUsers({ organizationId }) {
  const hrUsers = await User.find({
    organizationId,
    role: "HR",
  })
    .select("name email role isActive mustChangePassword createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return hrUsers.map((user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
  }));
}

export async function deactivateHRUser({
  hrId,
  organizationId,
}) {
  const user = await User.findOneAndUpdate(
    {
      _id: hrId,
      organizationId,
      role: "HR",
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
      $inc: {
        tokenVersion: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("name email role isActive");

  if (!user) {
    const error = new Error(
      "HR account not found or already inactive."
    );
    error.statusCode = 404;
    throw error;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}