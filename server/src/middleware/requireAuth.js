
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../modules/auth/user.model.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.ver !== "number"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    const user = await User.findById(payload.sub).select(
      "+tokenVersion"
    );

    if (
      !user ||
      !user.isActive ||
      user.tokenVersion !== payload.ver
    ) {
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
      mustChangePassword: user.mustChangePassword,
    };
    if (!user.organizationId) {
      return res.status(401).json({
        success: false,
        message: "User organization is not configured.",
      });
    }

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
    }

    return next(error);
  }
}
