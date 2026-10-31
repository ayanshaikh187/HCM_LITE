
import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z.string().trim().email().max(254).toLowerCase(),

  temporaryPassword: z.string().min(12).max(72),

  employeeCode: z.string().trim().min(2).max(30),

  phone: z.string().trim().max(25).optional().default(""),

  address: z.string().trim().max(300).optional().default(""),

  department: z.string().trim().min(2).max(100),

  designation: z.string().trim().min(2).max(100),

  joiningDate: z.iso.date(),

  basicSalary: z.number().finite().gt(0).max(100000000),
}).strict();

export const updateEmployeeSchema = z.object({
  phone: z.string().trim().max(25).optional(),
  address: z.string().trim().max(300).optional(),
  department: z.string().trim().min(2).max(100).optional(),
  designation: z.string().trim().min(2).max(100).optional(),
  employmentStatus: z
    .enum(["Active", "OnLeave", "Resigned", "Terminated"])
    .optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update." }
);

