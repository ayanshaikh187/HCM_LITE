
import mongoose from "mongoose"
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "./employee.validation.js";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee,
} from "./employee.service.js";


function validateEmployeeId(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({
      success: false,
      message: "Invalid employee ID.",
    });

    return false;
  }

  return true;
}

export async function registerEmployee(req, res, next) {
  try {
    const result = createEmployeeSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee details.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const employee = await createEmployee({
      ...result.data,

      // Company ID authenticated HR ke account se aayegi.
      organizationId: req.user.organizationId,
    });

    return res.status(201).json({
      success: true,
      message: "Employee registered successfully.",
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
}

export async function listEmployees(req, res, next) {
  try {
    const employees = await getEmployees({
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: { employees },
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeeDetails(req, res, next) {
  try {
    if (!validateEmployeeId(req, res)) return;
    const employee = await getEmployeeById({
      employeeId: req.params.id,
      organizationId: req.user.organizationId,
    });
    return res.status(200).json({
      success: true,
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeDetails(req, res, next) {
  try {
    const result = updateEmployeeSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee update details.",
        errors: result.error.flatten().fieldErrors,
      });
    }
    if (!validateEmployeeId(req, res)) return;
    const employee = await updateEmployee({
      employeeId: req.params.id,
      organizationId: req.user.organizationId,
      updates: result.data,
    });
    return res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateEmployeeAccount(req, res, next) {
  try {
    if (!validateEmployeeId(req, res)) return;
    const employee = await deactivateEmployee({
      employeeId: req.params.id,
      organizationId: req.user.organizationId,
    });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee account deactivated successfully.",
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
}

