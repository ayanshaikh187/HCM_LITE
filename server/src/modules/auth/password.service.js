
import bcrypt from "bcryptjs";
import User from "./user.model.js";


export async function changeUserPassword(
  userId,
  currentPassword,
  newPassword
) {
  const user = await User.findOne({
    _id: userId,
    isActive: true,
  }).select("+passwordHash +tokenVersion");

  if (!user) {
    const error = new Error("User account not found.");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isPasswordCorrect) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 400;
    throw error;
  }

  const isSamePassword = await bcrypt.compare(
    newPassword,
    user.passwordHash
  );

  if (isSamePassword) {
    const error = new Error(
      "New password must be different from the current password."
    );
    error.statusCode = 400;
    throw error;
  }

  const oldPasswordHash = user.passwordHash;
  const oldTokenVersion = user.tokenVersion ?? 0;
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  const result = await User.updateOne(
    {
      _id: user._id,
      isActive: true,
      passwordHash: oldPasswordHash,
      tokenVersion: oldTokenVersion,
    },
    {
      $set: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
      $inc: {
        tokenVersion: 1,
      },
      $unset: {
        refreshTokenHash: 1,
        refreshTokenExpiresAt: 1,
      },
    }
  );

  if (result.modifiedCount !== 1) {
    const error = new Error(
      "Password was changed by another request. Please log in again."
    );
    error.statusCode = 409;
    throw error;
  }

  return {
    message: "Password changed successfully. Please log in again.",
  };
}

