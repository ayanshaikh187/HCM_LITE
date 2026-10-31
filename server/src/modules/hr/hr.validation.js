
import { z } from "zod";

export const createHRSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).toLowerCase(),
  temporaryPassword: z.string().min(12).max(72),
}).strict();
