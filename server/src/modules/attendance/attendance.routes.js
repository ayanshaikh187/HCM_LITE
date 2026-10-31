import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePasswordChanged } from "../../middleware/requirePasswordChanged.js";
import { requireRole } from "../../middleware/requireRole.js";
import {
  checkIn,
  checkOut,
  getMyHistory,
  getAttendanceBoardData,
} from "./attendance.controller.js";

const router = Router();

router.post(
  "/check-in",
  requireAuth,
  requirePasswordChanged,
  requireRole("Employee"),
  checkIn
);
router.post(
  "/check-out",
  requireAuth,
  requirePasswordChanged,
  requireRole("Employee"),
  checkOut
);
router.get(
  "/my-history",
  requireAuth,
  requirePasswordChanged,
  requireRole("Employee"),
  getMyHistory
);

router.get(
  "/board",
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin", "HR"),
  getAttendanceBoardData
);


export default router;