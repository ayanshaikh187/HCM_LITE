
import { Router } from "express";
import { chatWithAssistant } from "./ai-assistant.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePasswordChanged } from "../../middleware/requirePasswordChanged.js";

const router = Router();

router.use(requireAuth, requirePasswordChanged);

router.post("/chat", chatWithAssistant);

export default router;
