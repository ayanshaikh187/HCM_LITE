
import { loginSchema } from "./auth.validation.js";
import {
  loginUser,
  refreshUserSession,
  logoutUser,
  REFRESH_MAX_AGE_MS,
} from "./auth.service.js";
import { changePasswordSchema } from "./auth.validation.js";
import { changeUserPassword } from "./password.service.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/api/auth",
};

function setRefreshCookie(res, token) {
  res.cookie("hcm_refresh", token, {
    ...cookieOptions,
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("hcm_refresh", cookieOptions);
}

function sendAuthResponse(res, session) {
  setRefreshCookie(res, session.refreshToken);

  return res.status(200).json({
    success: true,
    data: {
      accessToken: session.accessToken,
      user: session.user,
    },
  });
}

export async function loginController(req, res, next) {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login details",
      });
    }

    const session = await loginUser(
      result.data.email,
      result.data.password
    );

    return sendAuthResponse(res, session);
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    next(error);
  }
}

export async function refreshController(req, res, next) {
  try {
    const session = await refreshUserSession(
      req.cookies?.hcm_refresh
    );

    return sendAuthResponse(res, session);
  } catch (error) {
    if (error.statusCode === 401) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    next(error);
  }
}

export async function logoutController(req, res, next) {
  try {
    await logoutUser(req.user.id);
    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}


export async function changePassword(req, res, next) {
  try {
    const result = changePasswordSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid password input.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { currentPassword, newPassword } = result.data;

    const data = await changeUserPassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}



