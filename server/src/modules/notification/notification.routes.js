import { Router } from "express";

import {
  listNotifications,
  markAsRead,
  markAllAsRead,
} from "./notification.controller.js";

import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePasswordChanged } from "../../middleware/requirePasswordChanged.js";

const router = Router();

router.use(requireAuth, requirePasswordChanged);

router.get("/", listNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

export default router;