
import { getAssistantReply } from "./ai-assistant.service.js";

export async function chatWithAssistant(req, res, next) {
  try {
    const { message } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a message.",
      });
    }

    const cleanMessage = message.trim();

    if (cleanMessage.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 2000 characters.",
      });
    }

    const result = await getAssistantReply(cleanMessage);

    return res.status(200).json({
      success: true,
      data: {
        reply: result.reply,
        mode: result.mode,
      },
    });
  } catch (error) {
    next(error);
  }
}
