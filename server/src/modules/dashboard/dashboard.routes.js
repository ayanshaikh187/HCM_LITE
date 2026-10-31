import { Router } from "express";

import {
  adminDashboard,
  hrDashboard,
  employeeDashboard,
} from "./dashboard.controller.js";

import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePasswordChanged } from "../../middleware/requirePasswordChanged.js";
import { requireRole } from "../../middleware/requireRole.js";

const router = Router();

router.use(requireAuth, requirePasswordChanged);

router.get(
  "/admin",
  requireRole("Admin"),
  adminDashboard
);

router.get(
  "/hr",
  requireRole("Admin", "HR"),
  hrDashboard
);

router.get(
  "/employee",
  requireRole("Employee"),
  employeeDashboard
);

export default router;