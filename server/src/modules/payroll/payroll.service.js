
import mongoose from "mongoose";

import Payroll from "./payroll.model.js";
import Employee from "../employee/employee.model.js";
import Attendance from "../attendance/attendance.model.js";
import Leave from "../leave/leave.model.js";
import Organization from "../organization/organization.model.js";

// ------------------------------------------
// COMMON HELPERS
// ------------------------------------------

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeDate(date) {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

// ------------------------------------------
// ORGANIZATION DATE HELPERS
// ------------------------------------------

function getOrganizationYearMonth(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);

  return {
    year: Number(
      parts.find((part) => part.type === "year").value
    ),
    month: Number(
      parts.find((part) => part.type === "month").value
    ),
  };
}

function isPayrollPeriodCompleted(year, month, timezone) {
  const current = getOrganizationYearMonth(
    new Date(),
    timezone || "Asia/Karachi"
  );

  return (
    year < current.year ||
    (year === current.year && month < current.month)
  );
}

// ------------------------------------------
// WORKING DAY HELPERS
// ------------------------------------------

function isWorkingDay(date, organization) {
  const key = dateKey(date);
  const weekday = date.getUTCDay();

  const weekends = organization.weekendDays ?? [0, 6];

  const holidays = new Set(
    (organization.holidays ?? []).map((holiday) => {
      if (typeof holiday.date === "string") {
        return holiday.date.slice(0, 10);
      }

      return dateKey(new Date(holiday.date));
    })
  );

  return !weekends.includes(weekday) && !holidays.has(key);
}

function getMonthDates(year, month) {
  const start = new Date(
    Date.UTC(year, month - 1, 1)
  );

  const end = new Date(
    Date.UTC(year, month, 0, 23, 59, 59, 999)
  );

  return { start, end };
}

function countWorkingDays(start, end, organization) {
  let count = 0;

  const current = normalizeDate(start);
  const lastDate = normalizeDate(end);

  while (current <= lastDate) {
    if (isWorkingDay(current, organization)) {
      count++;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

// ------------------------------------------
// APPROVED LEAVE HELPERS
// ------------------------------------------

function getApprovedLeaveWorkingDates(
  leaves,
  organization,
  periodStart,
  periodEnd
) {
  const leaveDates = new Map();

  for (const leave of leaves) {
    const originalStart = normalizeDate(leave.startDate);
    const originalEnd = normalizeDate(leave.endDate);

    // Restrict leave dates to the payroll period.
    const current = new Date(
      Math.max(originalStart.getTime(), periodStart.getTime())
    );

    const end = new Date(
      Math.min(originalEnd.getTime(), periodEnd.getTime())
    );

    while (current <= end) {
      if (isWorkingDay(current, organization)) {
        const key = dateKey(current);
        const existing = leaveDates.get(key);

        // Unpaid leave takes precedence if conflicting
        // approved leave records somehow exist.
        if (!existing || leave.leaveType === "Unpaid") {
          leaveDates.set(key, leave.leaveType);
        }
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return leaveDates;
}

// ------------------------------------------
// EMPLOYEE PAYROLL CALCULATION
// ------------------------------------------

async function calculateEmployeePayroll({
  employee,
  organization,
  year,
  month,
  generatedBy,
  session,
}) {
  const { start, end } = getMonthDates(year, month);

  const joiningDate = normalizeDate(employee.joiningDate);

  const eligibleStart =
    joiningDate > start ? joiningDate : start;

  if (eligibleStart > end) {
    return null;
  }

  const totalMonthWorkingDays = countWorkingDays(
    start,
    end,
    organization
  );

  const payableWorkingDays = countWorkingDays(
    eligibleStart,
    end,
    organization
  );

  if (totalMonthWorkingDays === 0) {
    throw createError(
      "No working days found for this payroll period.",
      422
    );
  }

  // ----------------------------------------
  // SALARY COMPONENTS
  // ----------------------------------------

  const basicSalary = roundMoney(employee.basicSalary);

  const fullMonthHra = roundMoney(
    basicSalary * 0.4
  );

  const fullMonthMedical = roundMoney(
    basicSalary * 0.1
  );

  const fullMonthGross = roundMoney(
    basicSalary + fullMonthHra + fullMonthMedical
  );

  // Joining-date based salary proration.
  const monthlyProration =
    payableWorkingDays / totalMonthWorkingDays;

  const proratedBasic = roundMoney(
    basicSalary * monthlyProration
  );

  const hra = roundMoney(
    fullMonthHra * monthlyProration
  );

  const medicalAllowance = roundMoney(
    fullMonthMedical * monthlyProration
  );

  const grossSalary = roundMoney(
    proratedBasic + hra + medicalAllowance
  );

  // ----------------------------------------
  // ATTENDANCE AND LEAVE DATA
  // ----------------------------------------

  const attendanceStart = dateKey(eligibleStart);
  const attendanceEnd = dateKey(end);

  const [attendanceRecords, approvedLeaves] =
    await Promise.all([
      Attendance.find({
        employeeId: employee._id,
        organizationId: organization._id,
        date: {
          $gte: attendanceStart,
          $lte: attendanceEnd,
        },
      })
        .select("date status")
        .session(session),

      Leave.find({
        employeeId: employee._id,
        organizationId: organization._id,
        status: "Approved",
        startDate: { $lte: end },
        endDate: { $gte: eligibleStart },
      })
        .select("leaveType startDate endDate")
        .session(session),
    ]);

  const attendanceByDate = new Map(
    attendanceRecords.map((record) => [
      record.date,
      record.status,
    ])
  );

  const approvedLeaveDates =
    getApprovedLeaveWorkingDates(
      approvedLeaves,
      organization,
      eligibleStart,
      end
    );

  // ----------------------------------------
  // COUNT ABSENT, HALF-DAY AND UNPAID DAYS
  // ----------------------------------------

  let absentDays = 0;
  let halfDays = 0;
  let unpaidLeaveDays = 0;

  const current = normalizeDate(eligibleStart);
  const lastDate = normalizeDate(end);

  while (current <= lastDate) {
    if (isWorkingDay(current, organization)) {
      const key = dateKey(current);
      const leaveType = approvedLeaveDates.get(key);

      if (leaveType) {
        if (leaveType === "Unpaid") {
          unpaidLeaveDays++;
        }
      } else {
        const attendanceStatus =
          attendanceByDate.get(key);

        if (
          !attendanceStatus ||
          attendanceStatus === "Absent"
        ) {
          absentDays++;
        } else if (attendanceStatus === "HalfDay") {
          halfDays++;
        }
      }
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  // ----------------------------------------
  // DEDUCTION CALCULATIONS
  // ----------------------------------------

  // Daily rate uses full-month gross salary
  // divided by full-month working days.
  const perDayRate =
    fullMonthGross / totalMonthWorkingDays;

  const absenceDeduction = roundMoney(
    absentDays * perDayRate
  );

  const halfDayDeduction = roundMoney(
    halfDays * perDayRate * 0.5
  );

  const unpaidLeaveDeduction = roundMoney(
    unpaidLeaveDays * perDayRate
  );

  // TODO:
  // Implement verified annualized tax slabs.
  // Tax is temporarily zero until exact tax rules
  // are confirmed from the project requirements.
  const taxDeduction = 0;

  const totalDeductions = roundMoney(
    absenceDeduction +
      halfDayDeduction +
      unpaidLeaveDeduction +
      taxDeduction
  );

  // Do not silently hide deductions that exceed gross.
  if (totalDeductions > grossSalary) {
    throw createError(
      `Total deductions exceed gross salary for employee ${employee.employeeCode}. Review attendance and leave records.`,
      422
    );
  }

  const netSalary = roundMoney(
    grossSalary - totalDeductions
  );

  // ----------------------------------------
  // PAYROLL RECORD
  // ----------------------------------------

  return {
    organizationId: organization._id,
    employeeId: employee._id,

    year,
    month,
    currency: "PKR",

    basicSalary: proratedBasic,
    hra,
    medicalAllowance,
    grossSalary,

    payableWorkingDays,

    absentDays,
    halfDays,
    unpaidLeaveDays,

    absenceDeduction,
    halfDayDeduction,
    unpaidLeaveDeduction,
    taxDeduction,

    totalDeductions,
    netSalary,

    status: "Draft",
    generatedBy,
  };
}

// ------------------------------------------
// GENERATE MONTHLY PAYROLL
// ------------------------------------------

export async function generateMonthlyPayroll({
  organizationId,
  generatedBy,
  year,
  month,
}) {
  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw createError("Invalid payroll period.", 400);
  }

  const session = await mongoose.startSession();

  try {
    let createdPayrolls = [];

    await session.withTransaction(async () => {
      const organization = await Organization.findById(
        organizationId
      ).session(session);

      if (!organization) {
        throw createError("Organization not found.", 404);
      }

      // Only completed organization-local months.
      if (
        !isPayrollPeriodCompleted(
          year,
          month,
          organization.timezone || "Asia/Karachi"
        )
      ) {
        throw createError(
          "Payroll can only be generated for a completed month.",
          422
        );
      }

      const existingPayroll = await Payroll.findOne({
        organizationId,
        year,
        month,
      })
        .select("_id")
        .session(session);

      if (existingPayroll) {
        throw createError(
          "Payroll already exists for this month. Duplicate generation is blocked.",
          409
        );
      }

      const { end } = getMonthDates(year, month);

      // Employees who joined after the selected month
      // are excluded.
      //
      // Resigned/Terminated employees are not included
      // because lastWorkingDate is not currently confirmed
      // in the Employee model.
      const employees = await Employee.find({
        organizationId,
        employmentStatus: {
          $in: ["Active", "OnLeave"],
        },
        joiningDate: { $lte: end },
      }).session(session);

      const payrollEntries = [];

      for (const employee of employees) {
        const payrollData = await calculateEmployeePayroll({
          employee,
          organization,
          year,
          month,
          generatedBy,
          session,
        });

        if (payrollData) {
          payrollEntries.push(payrollData);
        }
      }

      if (payrollEntries.length === 0) {
        throw createError(
          "No eligible employees found for this payroll period.",
          422
        );
      }

      // All payroll records are inserted in the same
      // transaction. Either all succeed or none do.
      createdPayrolls = await Payroll.insertMany(
        payrollEntries,
        {
          ordered: true,
          session,
        }
      );
    });

    return createdPayrolls;
  } catch (error) {
    if (error.code === 11000) {
      throw createError(
        "Payroll already exists for this month. Duplicate generation is blocked.",
        409
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

// ------------------------------------------
// GET ORGANIZATION PAYROLL
// ------------------------------------------

export async function getOrganizationPayroll({
  organizationId,
  year,
  month,
  status,
}) {
  const filter = { organizationId };

  if (year !== undefined) {
    filter.year = year;
  }

  if (month !== undefined) {
    filter.month = month;
  }

  if (status) {
    filter.status = status;
  }

  return Payroll.find(filter)
    .sort({
      year: -1,
      month: -1,
      createdAt: -1,
    })
    .populate({
      path: "employeeId",
      select: "employeeCode department designation userId",
      populate: {
        path: "userId",
        select: "name email",
      },
    })
    .populate("generatedBy", "name email")
    .populate("finalizedBy", "name email");
}

// ------------------------------------------
// GET SINGLE PAYROLL
// ------------------------------------------

export async function getPayrollById({
  payrollId,
  organizationId,
}) {
  const payroll = await Payroll.findOne({
    _id: payrollId,
    organizationId,
  })
    .populate({
      path: "employeeId",
      select: "employeeCode department designation userId",
      populate: {
        path: "userId",
        select: "name email",
      },
    })
    .populate("generatedBy", "name email")
    .populate("finalizedBy", "name email");

  if (!payroll) {
    throw createError(
      "Payroll record not found.",
      404
    );
  }

  return payroll;
}

// ------------------------------------------
// GET EMPLOYEE OWN PAYSLIPS
// ------------------------------------------

export async function getMyPayslips({
  userId,
  organizationId,
}) {
  const employee = await Employee.findOne({
    userId,
    organizationId,
  }).select("_id");

  if (!employee) {
    throw createError(
      "Employee record not found.",
      404
    );
  }

  // Employees see finalized payslips only.
  return Payroll.find({
    employeeId: employee._id,
    organizationId,
    status: "Finalized",
  }).sort({
    year: -1,
    month: -1,
  });
}

// ------------------------------------------
// FINALIZE PAYROLL
// ------------------------------------------

export async function finalizePayroll({
  payrollId,
  organizationId,
  finalizedBy,
}) {
  // Atomic update:
  // Only a Draft payroll can be finalized.
  const payroll = await Payroll.findOneAndUpdate(
    {
      _id: payrollId,
      organizationId,
      status: "Draft",
    },
    {
      $set: {
        status: "Finalized",
        finalizedBy,
        finalizedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!payroll) {
    const existingPayroll = await Payroll.findOne({
      _id: payrollId,
      organizationId,
    }).select("_id status");

    if (!existingPayroll) {
      throw createError(
        "Payroll record not found.",
        404
      );
    }

    throw createError(
      "Only draft payroll can be finalized.",
      422
    );
  }

  return payroll;
}
