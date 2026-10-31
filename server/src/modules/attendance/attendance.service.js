
import Attendance from "./attendance.model.js";
import Employee from "../employee/employee.model.js";
import Organization from "../organization/organization.model.js";
import Leave from "../leave/leave.model.js";

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

export async function checkInEmployee({
    userId,
    organizationId,
    latitude,
    longitude,
}) {
    // 1. Employee ka active employment record dhoondo.
    const employee = await Employee.findOne({
        userId,
        organizationId,
        employmentStatus: "Active",
    }).select("_id");

    if (!employee) {
        throw createError("Active employee record not found.", 404);
    }

    // 2. Company ki attendance settings lo.
    const organization = await Organization.findById(organizationId)
        .select(
            "timezone officeStart graceMinutes officeLocation radiusMeters weekendDays holidays"
        );

    if (!organization) {
        throw createError("Organization not found.", 404);
    }

    // 3. Company timezone mein aaj ki date nikalo.
    const now = new Date();

    const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: organization.timezone || "Asia/Karachi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);

    // 4. Weekend par check-in rok do.
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const weekendDays = organization.weekendDays || [0, 6];

    if (weekendDays.includes(weekday)) {
        throw createError("Attendance is not available on weekends.", 422);
    }



    // 5. Company holiday par check-in rok do.
    const holidays = organization.holidays || [];

    const isHoliday = holidays.some((holiday) => {
        const holidayDate = new Date(holiday.date);

        const formattedHolidayDate = new Intl.DateTimeFormat("en-CA", {
            timeZone: organization.timezone || "Asia/Karachi",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(holidayDate);

        return formattedHolidayDate === date;
    });

    if (isHoliday) {
        throw createError(
            "Attendance is not available on company holidays.",
            422
        );
    }



    // 5. Check-in time ke mutabiq late status calculate karo.
    const [startHour, startMinute] = (
        organization.officeStart || "09:00"
    ).split(":").map(Number);

    const officeStartMinutes = startHour * 60 + startMinute;
    const graceMinutes = organization.graceMinutes ?? 15;

    const currentTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: organization.timezone || "Asia/Karachi",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).format(now);

    const [currentHour, currentMinute] = currentTime
        .split(":")
        .map(Number);

    const currentMinutes = currentHour * 60 + currentMinute;


    const isLate =
        currentMinutes > officeStartMinutes + graceMinutes;

    const status = isLate ? "Late" : "Present";


    // 6. Office location configure ho to coordinates verify karo.
    const office = organization.officeLocation;

    if (office?.latitude != null && office?.longitude != null) {
        if (latitude == null || longitude == null) {
            throw createError("Office location is required for check-in.", 422);
        }

        const distance = getDistanceMeters(
            latitude,
            longitude,
            office.latitude,
            office.longitude
        );

        if (distance > (organization.radiusMeters ?? 150)) {
            throw createError("You are outside the allowed office radius.", 422);
        }
    }

    // 7. Attendance create karo.
    // Unique database index duplicate check-in ko bhi rokega.
    try {

        return await Attendance.create({
            employeeId: employee._id,
            organizationId,
            date,
            checkIn: now,
            status,
            isLate,
        });

    } catch (error) {
        if (error.code === 11000) {
            throw createError("You have already checked in today.", 409);
        }

        throw error;
    }
}

// Do coordinates ke darmiyan distance meters mein.
function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const earthRadius = 6371000;

    const latitudeDifference = toRadians(lat2 - lat1);
    const longitudeDifference = toRadians(lon2 - lon1);

    const value =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(longitudeDifference / 2) ** 2;

    return (
        2 *
        earthRadius *
        Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
    );
}


export async function checkOutEmployee({ userId, organizationId }) {
    const now = new Date();
    // 1. Validate Active Employee
    const employee = await Employee.findOne({
        userId,
        organizationId,
        employmentStatus: "Active",
    }).select("_id");

    if (!employee) {
        throw createError("Active employee record not found.", 404);
    }

    // 2. Fetch Organization settings
    const organization = await Organization.findById(organizationId)
        .select("timezone halfDayUnderHours");

    if (!organization) {
        throw createError("Organization not found.", 404);
    }

    // 3. Find active attendance record (jiska checkOut abhi null ho)

    const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: organization.timezone || "Asia/Karachi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);

    const attendance = await Attendance.findOne({
        employeeId: employee._id,
        organizationId,
        date,
        checkOut: null,
        checkIn: { $ne: null },
    });

    if (!attendance) {
        throw createError("No active check-in found for this employee.", 404);
    }

    // 4. Calculate worked minutes
    if (now < attendance.checkIn) {
        throw createError("Checkout time cannot be before check-in.", 422);
    }
    const workedMinutes = Math.max(
        0,
        Math.floor((now.getTime() - attendance.checkIn.getTime()) / 60000)
    );

    const halfDayUnderHours = organization.halfDayUnderHours ?? 5;

    const status =
        workedMinutes < halfDayUnderHours * 60
            ? "HalfDay"
            : attendance.status;

    // 5. Update attendance record atomically
    const updated = await Attendance.findOneAndUpdate(
        {
            _id: attendance._id,
            organizationId,
            checkOut: null,
        },
        {
            $set: {
                checkOut: now,
                workedMinutes,
                status,
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!updated) {
        throw createError(
            "Checkout already completed or attendance record changed.",
            409
        );
    }

    return updated;
}


export async function getMyAttendanceHistory({
    userId,
    organizationId,
    from,
    to,
}) {
    const employee = await Employee.findOne({
        userId,
        organizationId,
    }).select("_id");

    if (!employee) {
        throw createError("Employee record not found.", 404);
    }

    const filter = {
        employeeId: employee._id,
        organizationId,
    };

    if (from || to) {
        filter.date = {};

        if (from) filter.date.$gte = from;
        if (to) filter.date.$lte = to;
    }

    return Attendance.find(filter)
        .sort({ date: -1 })
        .limit(100)
        .lean();
}


export async function getAttendanceBoard({
    organizationId,
    date,
    department,
}) {
    // 1. Organization settings
    const organization = await Organization.findById(organizationId)
        .select("timezone weekendDays holidays");

    if (!organization) {
        throw createError("Organization not found.", 404);
    }

    // 2. Active employees
    const employeeFilter = {
        organizationId,
        employmentStatus: "Active",
    };

    if (department) {
        employeeFilter.department = department;
    }

    const employees = await Employee.find(employeeFilter)
        .populate("userId", "name email isActive")
        .select("_id employeeCode department designation userId")
        .sort({ employeeCode: 1 })
        .lean();

    // Inactive or missing user accounts ko exclude karo
    const activeEmployees = employees.filter(
        (employee) => employee.userId?.isActive === true
    );

    const employeeIds = activeEmployees.map(
        (employee) => employee._id
    );

    if (employeeIds.length === 0) {
        return [];
    }

    // 3. Selected date ki attendance
    const attendanceRecords = await Attendance.find({
        organizationId,
        employeeId: { $in: employeeIds },
        date,
    }).lean();

    const attendanceByEmployeeId = new Map(
        attendanceRecords.map((record) => [
            record.employeeId.toString(),
            record,
        ])
    );

    // 4. Selected date par approved leaves
    const dateStart = new Date(`${date}T00:00:00.000Z`);
    const dateEnd = new Date(`${date}T23:59:59.999Z`);

    const approvedLeaves = await Leave.find({
        organizationId,
        employeeId: { $in: employeeIds },
        status: "Approved",
        startDate: { $lte: dateEnd },
        endDate: { $gte: dateStart },
    })
        .select("employeeId leaveType")
        .lean();

    const leaveByEmployeeId = new Map(
        approvedLeaves.map((leave) => [
            leave.employeeId.toString(),
            leave,
        ])
    );

    // 5. Weekend check
    const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay();
    const weekendDays = organization.weekendDays ?? [0, 6];

    const isWeekend = weekendDays.includes(weekday);

    // 6. Holiday check
    // Organization holiday dates are treated as calendar dates.
    const isHoliday = (organization.holidays ?? []).some(
        (holiday) =>
            new Date(holiday.date).toISOString().slice(0, 10) === date
    );

    // 7. Final attendance board
    return activeEmployees.map((employee) => {
        const employeeId = employee._id.toString();

        const attendance = attendanceByEmployeeId.get(employeeId);
        const approvedLeave = leaveByEmployeeId.get(employeeId);

        let derivedStatus = "Absent";

        if (attendance) {
            derivedStatus = attendance.status;
        } else if (isHoliday) {
            derivedStatus = "Holiday";
        } else if (isWeekend) {
            derivedStatus = "Weekend";
        } else if (approvedLeave) {
            derivedStatus = "OnLeave";
        }

        return {
            employeeId: employee._id,
            employeeCode: employee.employeeCode,
            name: employee.userId.name,
            email: employee.userId.email,
            department: employee.department,
            designation: employee.designation,

            attendance: attendance
                ? {
                    date: attendance.date,
                    checkIn: attendance.checkIn,
                    checkOut: attendance.checkOut,
                    workedMinutes: attendance.workedMinutes,
                    status: attendance.status,
                    isLate: attendance.isLate,
                    missingCheckout: Boolean(
                        attendance.checkIn && !attendance.checkOut
                    ),
                }
                : null,

            status: derivedStatus,

            leaveType: approvedLeave?.leaveType ?? null,
        };
    });
}
