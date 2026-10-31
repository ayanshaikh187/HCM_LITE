
import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePasswordChanged } from "../../middleware/requirePasswordChanged.js";
import { requireRole } from "../../middleware/requireRole.js";

import {
  generatePayroll,
  listPayroll,
  getPayrollDetails,
  getEmployeePayslips,
  finalizePayrollRecord,
} from "./payroll.controller.js";

const router = Router();

router.use(requireAuth, requirePasswordChanged);

// Employees can only access their own finalized payslips.
router.get(
  "/my-payslips",
  requireRole("Employee"),
  getEmployeePayslips
);

// Admin/HR can view organization payroll records.
router.get(
  "/",
  requireRole("Admin", "HR"),
  listPayroll
);

// Admin only: generate payroll.
router.post(
  "/generate",
  requireRole("Admin"),
  generatePayroll
);

// Admin/HR can inspect records within their organization.
router.get(
  "/:id",
  requireRole("Admin", "HR"),
  getPayrollDetails
);

// Admin only: finalize and lock a draft.
router.patch(
  "/:id/finalize",
  requireRole("Admin"),
  finalizePayrollRecord
);

export default router;
