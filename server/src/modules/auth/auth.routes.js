
import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  loginController,
  refreshController,
  logoutController,
  changePassword,
} from "./auth.controller.js";

import { requireAuth } from "../../middleware/requireAuth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

router.post("/login", loginLimiter, loginController);
router.post("/refresh", refreshController);
router.post("/logout", requireAuth, logoutController);
router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});
router.patch(
  "/change-password",
  requireAuth,
  changePassword
);

export default router;
