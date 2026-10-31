
import mongoose from "mongoose";
import User from "../auth/user.model.js";
import Employee from "../employee/employee.model.js";
import Attendance from "../attendance/attendance.model.js";
import Leave from "../leave/leave.model.js";
import Payroll from "../payroll/payroll.model.js";
import Organization from "../organization/organization.model.js";

// Get today's date according to organization timezone
const getToday = (timezone = "Asia/Karachi") => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

// Get organization and validate its timezone
const getOrganizationDetails = async (organizationId) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    const error = new Error("Invalid organization ID.");
    error.statusCode = 400;
    throw error;
  }

  const organization = await Organization.findById(organizationId)
    .select("timezone")
    .lean();

  if (!organization) {
    const error = new Error("Organization not found.");
    error.statusCode = 404;
    throw error;
  }

  const timezone = organization.timezone || "Asia/Karachi";

  // Validate timezone
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });
  } catch {
    const error = new Error("Organization timezone is invalid.");
    error.statusCode = 500;
    throw error;
  }

  return {
    timezone,
    today: getToday(timezone),
  };
};

// ADMIN DASHBOARD
export const getAdminDashboard = async (organizationId) => {
  const { today } = await getOrganizationDetails(organizationId);

  const [year, month] = today.split("-").map(Number);

  const [
    totalEmployees,
    activeEmployees,
    totalHR,
    todayAttendance,
    presentToday,
    lateToday,
    pendingLeaves,
    finalizedPayroll,
  ] = await Promise.all([
    // All employee profiles, including inactive and resigned
    Employee.countDocuments({ organizationId }),

    Employee.countDocuments({
      organizationId,
      employmentStatus: "Active",
    }),

    User.countDocuments({
      organizationId,
      role: "HR",
      isActive: true,
    }),

    Attendance.countDocuments({
      organizationId,
      date: today,
    }),

    Attendance.countDocuments({
      organizationId,
      date: today,
      status: { $in: ["Present", "Late", "HalfDay"] },
    }),

    Attendance.countDocuments({
      organizationId,
      date: today,
      status: "Late",
    }),

    Leave.countDocuments({
      organizationId,
      status: "Pending",
    }),

    // Current month's finalized payroll only
    Payroll.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          year,
          month,
          status: "Finalized",
        },
      },
      {
        $group: {
          _id: null,
          totalPayroll: { $sum: "$netSalary" },
          payslipCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    date: today,

    employees: {
      total: totalEmployees,
      active: activeEmployees,
    },

    totalHR,

    attendance: {
      markedToday: todayAttendance,
      presentToday,
      lateToday,
    },

    pendingLeaves,

    payroll: {
      year,
      month,
      finalizedPayslips: finalizedPayroll[0]?.payslipCount || 0,
      totalNetSalary: finalizedPayroll[0]?.totalPayroll || 0,
    },
  };
};

// HR DASHBOARD
export const getHRDashboard = async (organizationId) => {
  const { today } = await getOrganizationDetails(organizationId);

  const [
    activeEmployees,
    onLeaveEmployees,
    attendanceMarked,
    lateToday,
    pendingLeaves,
    recentLeaves,
  ] = await Promise.all([
    Employee.countDocuments({
      organizationId,
      employmentStatus: "Active",
    }),

    Employee.countDocuments({
      organizationId,
      employmentStatus: "OnLeave",
    }),

    Attendance.countDocuments({
      organizationId,
      date: today,
    }),

    Attendance.countDocuments({
      organizationId,
      date: today,
      status: "Late",
    }),

    Leave.countDocuments({
      organizationId,
      status: "Pending",
    }),

    Leave.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("employeeId", "employeeCode department designation")
      .lean(),
  ]);

  return {
    date: today,

    employees: {
      active: activeEmployees,
      onLeave: onLeaveEmployees,
    },

    attendance: {
      markedToday: attendanceMarked,
      lateToday,
    },

    pendingLeaves,
    recentLeaves,
  };
};

// EMPLOYEE DASHBOARD
export const getEmployeeDashboard = async (userId, organizationId) => {
  const employee = await Employee.findOne({
    userId,
    organizationId,
  }).lean();

  if (!employee) {
    const error = new Error("Employee profile not found.");
    error.statusCode = 404;
    throw error;
  }

  const { today } = await getOrganizationDetails(organizationId);

  const [
    todayAttendance,
    totalLeaveRequests,
    pendingLeaveRequests,
    recentLeaves,
    recentAttendance,
    recentPayslips,
  ] = await Promise.all([
    Attendance.findOne({
      employeeId: employee._id,
      organizationId,
      date: today,
    }).lean(),

    Leave.countDocuments({
      employeeId: employee._id,
      organizationId,
    }),

    Leave.countDocuments({
      employeeId: employee._id,
      organizationId,
      status: "Pending",
    }),

    Leave.find({
      employeeId: employee._id,
      organizationId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    Attendance.find({
      employeeId: employee._id,
      organizationId,
    })
      .sort({ date: -1 })
      .limit(7)
      .lean(),

    // Employees can only see finalized payslips
    Payroll.find({
      employeeId: employee._id,
      organizationId,
      status: "Finalized",
    })
      .sort({ year: -1, month: -1 })
      .limit(5)
      .select(
        "year month currency grossSalary totalDeductions netSalary status finalizedAt"
      )
      .lean(),
  ]);

  return {
    employee: {
      employeeCode: employee.employeeCode,
      department: employee.department,
      designation: employee.designation,
      employmentStatus: employee.employmentStatus,
    },

    todayAttendance,

    leaves: {
      totalRequests: totalLeaveRequests,
      pendingRequests: pendingLeaveRequests,
      recent: recentLeaves,
    },

    recentAttendance,
    recentPayslips,
  };
};
