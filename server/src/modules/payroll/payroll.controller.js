import mongoose from "mongoose";
import {
  generatePayrollSchema,
  payrollListSchema,
} from "./payroll.validation.js";

import {
  generateMonthlyPayroll,
  getOrganizationPayroll,
  getPayrollById,
  getMyPayslips,
  finalizePayroll,
} from "./payroll.service.js";

function isValidPayrollId(id, res) {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      success: false,
      message: "Invalid payroll ID.",
    });

    return false;
  }

  return true;
}

export async function generatePayroll(req, res, next) {
  try {
    const validation = generatePayrollSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll period.",
        errors: validation.error.issues,
      });
    }

    const payrolls = await generateMonthlyPayroll({
      organizationId: req.user.organizationId,
      generatedBy: req.user.id,
      ...validation.data,
    });

    return res.status(201).json({
      success: true,
      message: "Monthly payroll generated successfully.",
      count: payrolls.length,
      data: { payrolls },
    });
  } catch (error) {
    next(error);
  }
}

export async function listPayroll(req, res, next) {
  try {
    const validation = payrollListSchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll filters.",
        errors: validation.error.issues,
      });
    }

    const payrolls = await getOrganizationPayroll({
      organizationId: req.user.organizationId,
      ...validation.data,
    });

    return res.status(200).json({
      success: true,
      count: payrolls.length,
      data: { payrolls },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPayrollDetails(req, res, next) {
  try {
    if (!isValidPayrollId(req.params.id, res)) return;
    const payroll = await getPayrollById({
      payrollId: req.params.id,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      data: { payroll },
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeePayslips(req, res, next) {
  try {
    const payslips = await getMyPayslips({
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      count: payslips.length,
      data: { payslips },
    });
  } catch (error) {
    next(error);
  }
}

export async function finalizePayrollRecord(req, res, next) {
  try {
    if (!isValidPayrollId(req.params.id, res)) return;
    const payroll = await finalizePayroll({
      payrollId: req.params.id,
      organizationId: req.user.organizationId,
      finalizedBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll finalized and locked successfully.",
      data: { payroll },
    });
  } catch (error) {
    next(error);
  }
}
