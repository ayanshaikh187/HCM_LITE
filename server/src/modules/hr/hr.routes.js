import { Router } from "express";

import {
  createHR,
  listHR,
  deactivateHR,
} from "./hr.controller.js";

import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePasswordChanged } from "../../middleware/requirePasswordChanged.js";
import { requireRole } from "../../middleware/requireRole.js";

const router = Router();

router.use(
  requireAuth,
  requirePasswordChanged,
  requireRole("Admin")
);

// Create HR account
router.post("/", createHR);

// Get all HR accounts
router.get("/", listHR);

// Deactivate HR account
router.patch("/:id/deactivate", deactivateHR);

export default router;