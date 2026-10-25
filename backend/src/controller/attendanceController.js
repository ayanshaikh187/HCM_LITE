const Attendance = require('../models/Attendance');
const User = require('../models/User');
const moment = require('moment');
const { logAudit } = require('../middleware/audit');

// ✅ RBAC: Only HR and Employee may log their own attendance.
// Admin manages the org system — they do not participate in the daily check-in board.
const requireAttendanceRole = (req, res) => {
  if (!['HR', 'Employee'].includes(req.user.role)) {
    res.status(403).json({
      message: 'Admin accounts are excluded from the attendance check-in workflow. Only HR Officers and Employees may check in/out.'
    });
    return false;
  }
  return true;
};

exports.checkIn = async (req, res) => {
  try {
    if (!requireAttendanceRole(req, res)) return;

    const today = moment().format('YYYY-MM-DD');
    const now = moment().format('HH:mm:ss');

    const existing = await Attendance.findOne({ employeeId: req.user.id, date: today });
    if (existing) return res.status(409).json({ message: 'Attendance already recorded for today.' });

    // Grace time: 9:15 AM marks transition from Present → Late
    const status = now > '09:15:00' ? 'Late' : 'Present';
    const attendance = await Attendance.create({
      employeeId: req.user.id,
      employeeName: req.user.name,
      date: today,
      checkIn: now,
      status
    });

    await User.findByIdAndUpdate(req.user.id, { isCheckedIn: true });
    await logAudit(req.user.email, 'Attendance check-in', `Date: ${today}; Time: ${now}; Status: ${status}`);
    return res.status(201).json({ message: 'Checked in successfully.', attendance });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Attendance already recorded for today.' });
    console.error('checkIn:', error);
    return res.status(500).json({ message: 'Unable to process check-in.' });
  }
};

exports.checkOut = async (req, res) => {
  try {
    if (!requireAttendanceRole(req, res)) return;

    const today = moment().format('YYYY-MM-DD');
    const now = moment().format('HH:mm:ss');

    const attendance = await Attendance.findOne({ employeeId: req.user.id, date: today });
    if (!attendance) return res.status(400).json({ message: 'You must check in before checking out.' });
    if (attendance.checkOut) return res.status(409).json({ message: 'Already checked out today.' });

    attendance.checkOut = now;
    await attendance.save();
    await User.findByIdAndUpdate(req.user.id, { isCheckedIn: false });
    await logAudit(req.user.email, 'Attendance check-out', `Date: ${today}; Time: ${now}`);
    return res.json({ message: 'Checked out successfully.', attendance });
  } catch (error) {
    console.error('checkOut:', error);
    return res.status(500).json({ message: 'Unable to process check-out.' });
  }
};

// GET /api/attendance
// ✅ Scope rules:
//   Employee  → own record only
//   HR/Admin  → full board for the requested date (Admin has global visibility per spec)
exports.getAttendance = async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const targetDate = req.query.date || today;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate) || !moment(targetDate, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).json({ message: 'date query parameter must be in YYYY-MM-DD format.' });
    }

    if (req.user.role === 'Employee') {
      const myRecord = await Attendance.findOne({ employeeId: req.user.id, date: targetDate }).lean();
      return res.json({ date: targetDate, records: myRecord ? [myRecord] : [], myRecord, todayStatus: myRecord });
    }

    // HR and Admin both get the full attendance board
    const records = await Attendance.find({ date: targetDate }).sort({ checkIn: 1 }).lean();
    const myRecord = await Attendance.findOne({ employeeId: req.user.id, date: targetDate }).lean();
    return res.json({ date: targetDate, records, myRecord, todayStatus: myRecord });
  } catch (error) {
    console.error('getAttendance:', error);
    return res.status(500).json({ message: 'Unable to fetch attendance records.' });
  }
};

// POST /api/attendance/correction
// ✅ RBAC: Any authenticated user can request a correction (for their own record).
// Admin cannot directly edit/override attendance records per spec —
// corrections require a logged request and HR review.
exports.correction = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).json({ message: 'A valid date (YYYY-MM-DD) is required.' });
    }
    if (!reason?.trim()) {
      return res.status(400).json({ message: 'A correction reason is required.' });
    }

    // ✅ Admin restriction: cannot directly correct attendance.
    // Admins can see audit logs but cannot alter individual records.
    if (req.user.role === 'Admin') {
      return res.status(403).json({
        message: 'Admin accounts cannot directly alter attendance records. Please contact HR to submit a correction on behalf of an employee.'
      });
    }

    const safeReason = String(reason).trim().slice(0, 500);
    await logAudit(
      req.user.email,
      'Attendance correction requested',
      `Date: ${date}; Reason: ${safeReason}`
    );

    return res.status(202).json({
      message: 'Correction request submitted and logged. HR will review and update your record.'
    });
  } catch (error) {
    console.error('correction:', error);
    return res.status(500).json({ message: 'Unable to submit correction request.' });
  }
};
