
import { z } from "zod";

const dateSchema = z.iso.date();

export const createLeaveSchema = z
  .object({
    leaveType: z.string().trim().min(1).max(50),
    startDate: dateSchema,
    endDate: dateSchema,
    reason: z.string().trim().min(5).max(1000),
  })
  .strict()
  .refine(
    (data) => data.startDate <= data.endDate,
    {
      message: "End date must be on or after start date.",
      path: ["endDate"],
    }
  );

export const reviewLeaveSchema = z
  .object({
    decision: z.enum(["Approved", "Rejected"]),
    reviewComment: z.string().trim().max(500).optional().default(""),
  })
  .strict();
