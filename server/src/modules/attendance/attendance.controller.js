import {
  checkInSchema,
  attendanceHistorySchema,
  attendanceBoardSchema,
} from "./attendance.validation.js";

import {
  checkInEmployee,
  checkOutEmployee,
  getMyAttendanceHistory,
  getAttendanceBoard,
} from "./attendance.service.js";

export async function checkIn(req, res, next) {
  try {
    const validation = checkInSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in data.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const attendance = await checkInEmployee({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      ...validation.data,
    });

    return res.status(201).json({
      success: true,
      message: "Check-in successful.",
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
}


export async function checkOut(req, res, next) {
  try {
    const attendance = await checkOutEmployee({
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Check-out successful.",
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
}


export async function getMyHistory(req, res, next) {
  try {
    const validation = attendanceHistorySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date range.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const attendance = await getMyAttendanceHistory({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      ...validation.data,
    });

    return res.status(200).json({
      success: true,
      message: "Attendance history retrieved successfully.",
      data: {
        count: attendance.length,
        attendance,
      },
    });
  } catch (error) {
    next(error);
  }
}


export async function getAttendanceBoardData(req, res, next) {
  try {
    const validation = attendanceBoardSchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance board filters.",
        errors: validation.error.issues,
      });
    }

    const { date, department } = validation.data;

    const attendance = await getAttendanceBoard({
      organizationId: req.user.organizationId,
      date,
      department,
    });

    return res.status(200).json({
      success: true,
      message: "Attendance board retrieved successfully.",
      data: {
        date,
        count: attendance.length,
        attendance,
      },
    });
  } catch (error) {
    next(error);
  }
}

