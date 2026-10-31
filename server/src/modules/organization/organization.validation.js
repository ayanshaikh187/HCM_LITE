
import { z } from "zod";

export const updateOrganizationSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),

  timezone: z
  .string()
  .trim()
  .min(1)
  .refine(isValidTimezone, {
    message: "Invalid IANA timezone.",
  })
  .optional(),

  officeStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),

  graceMinutes: z.number().int().min(0).max(180).optional(),

  halfDayUnderHours: z.number().min(0).max(24).optional(),

  weekendDays: z
    .array(z.number().int().min(0).max(6))
    .max(7)
    .refine((days) => new Set(days).size === days.length, {
      message: "Weekend days cannot contain duplicates",
    })
    .optional(),

  officeLocation: z
    .object({
      latitude: z.number().min(-90).max(90).nullable(),
      longitude: z.number().min(-180).max(180).nullable(),
      radiusMeters: z.number().min(1).max(10000),
    })
    .optional(),

leaveTypes: z
  .array(
    z.object({
      name: z.enum(["Annual", "Sick", "Casual", "Unpaid"]),
      yearlyQuota: z.number().min(0).nullable(),
    }).strict()
  )
  .min(1)
  .max(4)
  .refine(
    (types) => new Set(types.map((item) => item.name)).size === types.length,
    { message: "Duplicate leave types are not allowed." }
  )
  .optional(),

holidays: z
  .array(
    z.object({
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.")
        .refine((value) => {
          const date = new Date(`${value}T00:00:00.000Z`);
          return !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value;
        }, "Invalid calendar date."),
      name: z.string().trim().min(1).max(120),
    }).strict()
  )
  .optional(),
}).strict();

function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });
    return true;
  } catch {
    return false;
  }
}
