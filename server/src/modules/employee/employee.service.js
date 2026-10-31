
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../auth/user.model.js";
import Employee from "./employee.model.js";

export async function createEmployee({
  name,
  email,
  temporaryPassword,
  employeeCode,
  phone,
  address,
  department,
  designation,
  joiningDate,
  basicSalary,
  organizationId,
}) {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  }).select("_id");

  if (existingUser) {
    const error = new Error("This email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const existingEmployee = await Employee.findOne({
    organizationId,
    employeeCode,
  }).select("_id");

  if (existingEmployee) {
    const error = new Error("Employee code already exists.");
    error.statusCode = 409;
    throw error;
  }

  const session = await mongoose.startSession();

  try {
    let createdEmployee;

    await session.withTransaction(async () => {
      const passwordHash = await bcrypt.hash(
        temporaryPassword,
        12
      );

      const [user] = await User.create(
        [{
          name,
          email: normalizedEmail,
          passwordHash,
          role: "Employee",
          organizationId,
          isActive: true,
          mustChangePassword: true,
        }],
        { session }
      );

      const [employee] = await Employee.create(
        [{
          userId: user._id,
          organizationId,
          employeeCode,
          phone,
          address,
          department,
          designation,
          joiningDate: new Date(`${joiningDate}T00:00:00.000Z`),
          basicSalary,
        }],
        { session }
      );

      createdEmployee = {
        id: employee._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeCode: employee.employeeCode,
        department: employee.department,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
        basicSalary: employee.basicSalary,
        mustChangePassword: user.mustChangePassword,
      };
    });

    return createdEmployee;
  
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || error.keyValue || {}
      )[0];

      console.error("Duplicate key details:", {
        collection: error.collection,
        index: error.index,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
      });

      const messages = {
        email: "This email is already registered.",
        employeeCode: "Employee code already exists.",
        organizationId: "Organization ID conflicts with a unique index.",
      };

      const conflict = new Error(
        messages[duplicateField] ||
          `Duplicate value detected for field: ${
            duplicateField || "unknown"
          }. Check the backend terminal for index details.`
      );

      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  } finally {
    await session.endSession();
  }
}
export async function getEmployees({ organizationId }) {
  const employees = await Employee.find({
    organizationId,
  })
    .populate("userId", "name email isActive")
    .sort({ createdAt: -1 })
    .lean();

  return employees.map((employee) => ({
    id: employee._id,
    employeeCode: employee.employeeCode,
    name: employee.userId?.name,
    email: employee.userId?.email,
    isActive: employee.userId?.isActive,
    phone: employee.phone,
    address: employee.address,
    department: employee.department,
    designation: employee.designation,
    joiningDate: employee.joiningDate,
    employmentStatus: employee.employmentStatus,
    basicSalary: employee.basicSalary,
  }));
}

export async function getEmployeeById({ employeeId, organizationId }) {
  const employee = await Employee.findOne({
    _id: employeeId,
    organizationId,
  })
    .populate("userId", "name email isActive")
    .lean();

  if (!employee) {
    const error = new Error("Employee not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: employee._id,
    employeeCode: employee.employeeCode,
    name: employee.userId?.name,
    email: employee.userId?.email,
    isActive: employee.userId?.isActive,
    phone: employee.phone,
    address: employee.address,
    department: employee.department,
    designation: employee.designation,
    joiningDate: employee.joiningDate,
    employmentStatus: employee.employmentStatus,
    basicSalary: employee.basicSalary,
  };
}

export async function updateEmployee({
  employeeId,
  organizationId,
  updates,
}) {
  const employee = await Employee.findOneAndUpdate(
    {
      _id: employeeId,
      organizationId,
    },
    {
      $set: updates,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("userId", "name email isActive")
    .lean();

  if (!employee) {
    const error = new Error("Employee not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: employee._id,
    employeeCode: employee.employeeCode,
    name: employee.userId?.name,
    email: employee.userId?.email,
    isActive: employee.userId?.isActive,
    phone: employee.phone,
    address: employee.address,
    department: employee.department,
    designation: employee.designation,
    joiningDate: employee.joiningDate,
    employmentStatus: employee.employmentStatus,
    basicSalary: employee.basicSalary,
  };
}

export async function deactivateEmployee({
  employeeId,
  organizationId,
}) {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const employee = await Employee.findOne({
        _id: employeeId,
        organizationId,
      }).session(session);

      if (!employee) {
        const error = new Error("Employee not found.");
        error.statusCode = 404;
        throw error;
      }

      const user = await User.findOneAndUpdate(
        {
          _id: employee.userId,
          organizationId,
          role: "Employee",
          isActive: true,
        },
        {
          $set: { isActive: false },
          $inc: { tokenVersion: 1 },
          $unset: {
            refreshTokenHash: 1,
            refreshTokenExpiresAt: 1,
          },
        },
        {
          new: true,
          session,
        }
      ).select("name email isActive");

      if (!user) {
        const error = new Error(
          "Employee login account not found or already inactive."
        );
        error.statusCode = 409;
        throw error;
      }

      employee.employmentStatus = "Inactive";
      await employee.save({ session });

      result = {
        employeeCode: employee.employeeCode,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        employmentStatus: employee.employmentStatus,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
}