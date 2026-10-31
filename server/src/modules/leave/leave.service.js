
import Leave from "./leave.model.js";
import Employee from "../employee/employee.model.js";
import Organization from "../organization/organization.model.js";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Count working days while excluding weekends and company holidays.
function getWorkingDays(startDate, endDate, organization) {
  const weekendDays = organization.weekendDays ?? [0, 6];

  const holidayDates = new Set(
    (organization.holidays ?? []).map((holiday) =>
      new Date(holiday.date).toISOString().slice(0, 10)
    )
  );

  let totalDays = 0;

  const current = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);

  while (current <= end) {
    const dateString = current.toISOString().slice(0, 10);
    const weekday = current.getUTCDay();

    const isWeekend = weekendDays.includes(weekday);
    const isHoliday = holidayDates.has(dateString);

    if (!isWeekend && !isHoliday) {
      totalDays++;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return totalDays;
}

// Find the active employee belonging to the authenticated user.
async function getEmployeeForUser(userId, organizationId) {
  const employee = await Employee.findOne({
    userId,
    organizationId,
    employmentStatus: "Active",
  }).select("_id employeeCode department joiningDate");

  if (!employee) {
    throw createError("Active employee record not found.", 404);
  }

  return employee;
}

// Calculate reserved leave usage and remaining annual balance.
async function getLeaveBalance(
  employeeId,
  organization,
  leaveType,
  year,
  excludeLeaveId = null
) {
  const leaveConfig = (organization.leaveTypes ?? []).find(
    (item) => item.name === leaveType
  );

  if (!leaveConfig) {
    throw createError(
      "Invalid leave type for this organization.",
      422
    );
  }

  if (leaveConfig.yearlyQuota === null) {
    return {
      leaveType,
      year,
      yearlyQuota: null,
      usedDays: 0,
      remainingDays: null,
    };
  }

  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  const reservedLeaves = await Leave.find({
    employeeId,
    organizationId: organization._id,
    status: { $in: ["Pending", "Approved"] },
    leaveType,

    ...(excludeLeaveId
      ? { _id: { $ne: excludeLeaveId } }
      : {}),

    // Find leave requests overlapping this calendar year.
    startDate: {
      $lte: new Date(`${endOfYear}T23:59:59.999Z`),
    },
    endDate: {
      $gte: new Date(`${startOfYear}T00:00:00.000Z`),
    },
  }).select("startDate endDate");

  let usedDays = 0;

  for (const leave of reservedLeaves) {
    const leaveStart = leave.startDate.toISOString().slice(0, 10);
    const leaveEnd = leave.endDate.toISOString().slice(0, 10);

    // Restrict the calculation to the requested calendar year.
    const clippedStart =
      leaveStart < startOfYear ? startOfYear : leaveStart;

    const clippedEnd =
      leaveEnd > endOfYear ? endOfYear : leaveEnd;

    usedDays += getWorkingDays(
      clippedStart,
      clippedEnd,
      organization
    );
  }

  return {
    leaveType,
    year,
    yearlyQuota: leaveConfig.yearlyQuota,
    usedDays,
    remainingDays: Math.max(
      0,
      leaveConfig.yearlyQuota - usedDays
    ),
  };
}

// Submit a leave request for the authenticated employee.
export async function createLeaveRequest({
  userId,
  organizationId,
  leaveType,
  startDate,
  endDate,
  reason,
}) {
  const employee = await getEmployeeForUser(
    userId,
    organizationId
  );

  const organization = await Organization.findById(organizationId);

  if (!organization) {
    throw createError("Organization not found.", 404);
  }

  if (
    new Date(`${startDate}T12:00:00.000Z`) <
    new Date(employee.joiningDate)
  ) {
    throw createError(
      "Leave cannot start before your joining date.",
      422
    );
  }

  const startYear = Number(startDate.slice(0, 4));
  const endYear = Number(endDate.slice(0, 4));

  if (startYear !== endYear) {
    throw createError(
      "Please submit separate leave requests for different calendar years.",
      422
    );
  }

  const totalDays = getWorkingDays(
    startDate,
    endDate,
    organization
  );

  if (totalDays < 1) {
    throw createError(
      "Leave period must include at least one working day.",
      422
    );
  }

  const overlappingLeave = await Leave.findOne({
    employeeId: employee._id,
    organizationId,
    status: { $in: ["Pending", "Approved"] },
    startDate: {
      $lte: new Date(`${endDate}T23:59:59.999Z`),
    },
    endDate: {
      $gte: new Date(`${startDate}T00:00:00.000Z`),
    },
  }).select("_id");

  if (overlappingLeave) {
    throw createError(
      "This leave period overlaps with an existing request.",
      422
    );
  }

  // Pass the calendar year, not a MongoDB query object.
  const balance = await getLeaveBalance(
    employee._id,
    organization,
    leaveType,
    startYear
  );

  if (
    balance.remainingDays !== null &&
    totalDays > balance.remainingDays
  ) {
    throw createError(
      `Insufficient ${leaveType} leave balance. Remaining: ${balance.remainingDays} day(s).`,
      422
    );
  }

  const leave = await Leave.create({
    employeeId: employee._id,
    organizationId,
    leaveType,
    startDate: new Date(`${startDate}T12:00:00.000Z`),
    endDate: new Date(`${endDate}T12:00:00.000Z`),
    totalDays,
    reason,
    status: "Pending",
  });

  return leave;
}

// Get only the authenticated employee's own leave requests.
export async function getMyLeaveRequests({
  userId,
  organizationId,
}) {
  const employee = await getEmployeeForUser(
    userId,
    organizationId
  );

  const leaves = await Leave.find({
    employeeId: employee._id,
    organizationId,
  })
    .sort({ createdAt: -1 })
    .select(
      "leaveType startDate endDate totalDays reason status reviewedBy reviewedAt reviewComment createdAt"
    )
    .populate("reviewedBy", "name email");

  return leaves;
}

// Get organization leave requests for authorized HR/Admin users.
export async function getOrganizationLeaveRequests({
  organizationId,
  status,
  department,
}) {
  const filter = { organizationId };

  if (status) {
    filter.status = status;
  }

  if (department) {
    const employees = await Employee.find({
      organizationId,
      department,
    }).select("_id");

    filter.employeeId = {
      $in: employees.map((employee) => employee._id),
    };
  }

  const leaves = await Leave.find(filter)
    .sort({ createdAt: -1 })
    .populate({
      path: "employeeId",
      select: "employeeCode department designation userId",
    })
    .populate("reviewedBy", "name email");

  return leaves;
}

// Approve or reject a pending leave request.
export async function reviewLeaveRequest({
  leaveId,
  organizationId,
  reviewerId,
  decision,
  reviewComment,
}) {
  const leave = await Leave.findOne({
  _id: leaveId,
  organizationId,
});

  if (!leave) {
    throw createError("Leave request not found.", 404);
  }

  if (leave.status !== "Pending") {
    throw createError(
      "Only pending leave requests can be reviewed.",
      422
    );
  }

  if (decision === "Approved") {
    const organization = await Organization.findById(
      organizationId
    );

    if (!organization) {
      throw createError("Organization not found.", 404);
    }

    const year = Number(
      leave.startDate.toISOString().slice(0, 4)
    );

    // Exclude this pending request when recalculating its balance.
    const balance = await getLeaveBalance(
      leave.employeeId,
      organization,
      leave.leaveType,
      year,
      leave._id
    );

    if (
      balance.remainingDays !== null &&
      leave.totalDays > balance.remainingDays
    ) {
      throw createError(
        "Insufficient leave balance to approve this request.",
        422
      );
    }
  }

  leave.status = decision;
  leave.reviewedBy = reviewerId;
  leave.reviewedAt = new Date();
  leave.reviewComment = reviewComment ?? "";

  await leave.save();

  return leave;
}
