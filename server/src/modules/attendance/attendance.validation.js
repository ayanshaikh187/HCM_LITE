
import { z } from "zod";

// Employee check-in request
export const checkInSchema = z
  .object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .strict()
  .refine(
    (data) =>
      (data.latitude === undefined && data.longitude === undefined) ||
      (data.latitude !== undefined && data.longitude !== undefined),
    {
      message: "Latitude and longitude must be provided together.",
      path: ["latitude"],
    }
  ).strict();

// Employee check-out request
export const checkOutSchema = z.object({}).strict();


const dateSchema = z.iso.date();

export const attendanceHistorySchema = z
  .object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .strict()
  .refine(
    (data) => !data.from || !data.to || data.from <= data.to,
    {
      message: "'from' date must be before or equal to 'to' date.",
      path: ["from"],
    }
  );

export const attendanceBoardSchema = z.object({
  date: dateSchema,
  department: z.string().trim().min(1).max(100).optional(),
}).strict();

