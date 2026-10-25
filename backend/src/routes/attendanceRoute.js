const express = require('express');
const router = express.Router();
const { authMiddleware, hrOrAdmin, notAdmin } = require('../middleware/auth');
const { checkIn, checkOut, getAttendance, correction } = require('../controller/attendanceController');

// POST /api/attendance/check-in  — HR and Employee only (notAdmin = route-level guard)
// Controller also enforces this via requireAttendanceRole() for defence-in-depth.
router.post('/check-in', authMiddleware, notAdmin, checkIn);
router.post('/checkin', authMiddleware, notAdmin, checkIn); // alias

// POST /api/attendance/check-out  — HR and Employee only
router.post('/check-out', authMiddleware, notAdmin, checkOut);
router.post('/checkout', authMiddleware, notAdmin, checkOut); // alias

// GET /api/attendance  — All authenticated users (scoped in controller by role)
// Admin gets the full board; Employee gets only their own record.
router.get('/', authMiddleware, getAttendance);

// POST /api/attendance/correction  — HR and Employee only.
// Admin cannot directly alter attendance records (they must contact HR per spec).
router.post('/correction', authMiddleware, notAdmin, correction);

module.exports = router;