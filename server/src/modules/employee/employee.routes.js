
import { Router } from "express";

import {
  registerEmployee,
  listEmployees,
  getEmployeeDetails,
  updateEmployeeDetails,
  deactivateEmployeeAccount,
} from "./employee.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePasswordChanged } from "../../middleware/requirePasswordChanged.js";
import { requireRole } from "../../middleware/requireRole.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin", "HR"),
  registerEmployee
);
router.get(
  "/",
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin", "HR"),
  listEmployees
);
router.get(
  "/:id",
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin", "HR"),
  getEmployeeDetails
);
router.patch(
  "/:id",
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin", "HR"),
  updateEmployeeDetails
);
router.patch(
  "/:id/deactivate",
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin"),
  deactivateEmployeeAccount
);

export default router;
