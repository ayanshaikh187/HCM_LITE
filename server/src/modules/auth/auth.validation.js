
import { z } from "zod";

export const firstRunSetupSchema = z
  .object({
    companyName: z.string().trim().min(2).max(120),
    adminName: z.string().trim().min(2).max(100),

    adminEmail: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),

    adminPassword: z
      .string()
      .min(12, "Password must contain at least 12 characters")
      .max(72, "Password is too long"),
  })
  .strict();
  
export const loginSchema = z
  .object({
    email: z.string().trim().email().max(254)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(1).max(72),
  })
  .strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(12).max(72),
}).strict();

