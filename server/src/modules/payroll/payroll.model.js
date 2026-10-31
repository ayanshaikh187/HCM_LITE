
import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    currency: {
      type: String,
      default: "PKR",
      immutable: true,
    },
    basicSalary: { type: Number, required: true, min: 0 },
    hra: { type: Number, required: true, min: 0 },
    medicalAllowance: { type: Number, required: true, min: 0 },
    grossSalary: { type: Number, required: true, min: 0 },
    payableWorkingDays: { type: Number, required: true, min: 0 },
    absentDays: { type: Number, default: 0, min: 0 },
    halfDays: { type: Number, default: 0, min: 0 },
    unpaidLeaveDays: { type: Number, default: 0, min: 0 },
    absenceDeduction: { type: Number, default: 0, min: 0 },
    halfDayDeduction: { type: Number, default: 0, min: 0 },
    unpaidLeaveDeduction: { type: Number, default: 0, min: 0 },
    taxDeduction: { type: Number, default: 0, min: 0 },
    totalDeductions: { type: Number, required: true, min: 0 },
    netSalary: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Draft", "Finalized"],
      default: "Draft",
      index: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    finalizedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

payrollSchema.index(
  { organizationId: 1, employeeId: 1, year: 1, month: 1 },
  { unique: true }
);

payrollSchema.index({ organizationId: 1, year: 1, month: 1, status: 1 });

const Payroll = mongoose.model("Payroll", payrollSchema);

export default Payroll;
