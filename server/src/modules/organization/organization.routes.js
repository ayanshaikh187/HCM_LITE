
import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  setupStatusController,
  initializeSetupController,
  getOrganizationSettingsController,
  updateOrganizationSettingsController,
} from "./organization.controller.js";

import  {requireAuth} from "../../middleware/requireAuth.js";
import  {requireRole} from "../../middleware/requireRole.js";
import  {requirePasswordChanged} from "../../middleware/requirePasswordChanged.js";

const router = Router();

// Public first-time setup routes
router.get("/status", setupStatusController);

const setupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many setup attempts. Try again later.",
  },
});

router.post("/initialize", setupLimiter, initializeSetupController);

// Admin-only organization settings
router.use(
  "/settings",
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin")
);

router.get("/settings", getOrganizationSettingsController);
router.patch("/settings", updateOrganizationSettingsController);

export default router;
