
import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePasswordChanged } from "../../middleware/requirePasswordChanged.js";
import { requireRole } from "../../middleware/requireRole.js";

import {
  submitLeaveRequest,
  getMyLeaveHistory,
  getOrganizationLeaves,
  reviewLeave,
} from "./leave.controller.js";


const router = Router();

router.post(
  "/",
  requireAuth,
  requirePasswordChanged,
  requireRole("Employee"),
  submitLeaveRequest
);
router.get(
  "/my-history",
  requireAuth,
  requirePasswordChanged,
  requireRole("Employee"),
  getMyLeaveHistory
);

router.get(
  "/",
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin", "HR"),
  getOrganizationLeaves
);
router.patch(
  "/:id/review",
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin", "HR"),
  reviewLeave
);


export default router;
