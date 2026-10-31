
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  CLIENT_URL: z.string().url(),

  MONGODB_URI: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).max(72).optional(),

  AI_API_KEY: z.string().min(1).optional(),
}).superRefine((data, ctx) => {
  const hasAdminEmail = Boolean(data.ADMIN_EMAIL);
  const hasAdminPassword = Boolean(data.ADMIN_PASSWORD);

  if (hasAdminEmail !== hasAdminPassword) {
    ctx.addIssue({
      code: "custom",
      message: "ADMIN_EMAIL and ADMIN_PASSWORD must be provided together.",
      path: ["ADMIN_EMAIL"],
    });
  }
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");

  console.error(
    result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }))
  );

  process.exit(1);
}

export const env = result.data;
