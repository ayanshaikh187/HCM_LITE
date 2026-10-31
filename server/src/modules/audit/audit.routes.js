import { Router } from "express";

import { listAuditLogs } from "./audit.controller.js";

import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePasswordChanged } from "../../middleware/requirePasswordChanged.js";
import { requireRole } from "../../middleware/requireRole.js";

const router = Router();

router.use(
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin")
);

router.get("/", listAuditLogs);

export default router;