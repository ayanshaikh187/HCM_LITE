
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";

import User from "./user.model.js";
import { env } from "../../config/env.js";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      ver: user.tokenVersion ?? 0,
      jti: randomUUID(),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      ver: user.tokenVersion ?? 0,
      jti: randomUUID(),
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId.toString(),
    mustChangePassword: user.mustChangePassword,
  };
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email }).select(
    "+passwordHash +tokenVersion"
  );

  if (!user || !user.isActive) {
    throw Object.assign(
      new Error("Invalid email or password"),
      { statusCode: 401 }
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw Object.assign(
      new Error("Invalid email or password"),
      { statusCode: 401 }
    );
  }

  const refreshToken = createRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(
    Date.now() + REFRESH_MAX_AGE_MS
  );

  await user.save();

  return {
    accessToken: createAccessToken(user),
    refreshToken,
    user: publicUser(user),
  };
}

export async function refreshUserSession(refreshToken) {
  if (!refreshToken) {
    throw Object.assign(new Error("Refresh session required"), {
      statusCode: 401,
    });
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error("Invalid or expired session"), {
      statusCode: 401,
    });
  }

  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.ver !== "number"
  ) {
    throw Object.assign(new Error("Invalid session"), {
      statusCode: 401,
    });
  }

  const oldHash = hashToken(refreshToken);
  const now = new Date();

  const user = await User.findOne({
    _id: payload.sub,
    isActive: true,
    tokenVersion: payload.ver,
    refreshTokenHash: oldHash,
    refreshTokenExpiresAt: { $gt: now },
  }).select("+tokenVersion");

  if (!user) {
    throw Object.assign(new Error("Invalid or expired session"), {
      statusCode: 401,
    });
  }

  const newRefreshToken = createRefreshToken(user);
  const newHash = hashToken(newRefreshToken);
  const newExpiry = new Date(Date.now() + REFRESH_MAX_AGE_MS);

  // Atomic rotation: old hash must still be present.
  const rotation = await User.updateOne(
    {
      _id: user._id,
      isActive: true,
      tokenVersion: payload.ver,
      refreshTokenHash: oldHash,
      refreshTokenExpiresAt: { $gt: new Date() },
    },
    {
      $set: {
        refreshTokenHash: newHash,
        refreshTokenExpiresAt: newExpiry,
      },
    }
  );

  if (rotation.modifiedCount !== 1) {
    throw Object.assign(new Error("Session already used or expired"), {
      statusCode: 401,
    });
  }

  return {
    accessToken: createAccessToken(user),
    refreshToken: newRefreshToken,
    user: publicUser(user),
  };
}

export async function logoutUser(userId) {
  await User.findByIdAndUpdate(userId, {
    $unset: {
      refreshTokenHash: 1,
      refreshTokenExpiresAt: 1,
    },
    $inc: { tokenVersion: 1 },
  });
}

export { REFRESH_MAX_AGE_MS };
