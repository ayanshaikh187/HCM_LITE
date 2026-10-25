const express = require('express');
const router = express.Router();
const { authMiddleware, hrOrAdmin, notAdmin } = require('../middleware/auth');
const { applyLeave, getLeaves, getPendingLeaves, updateLeaveStatus } = require('../controller/leaveController');

// GET /api/leaves — Employee sees own; HR/Admin see all (scoped in controller)
router.get('/', authMiddleware, getLeaves);

// POST /api/leaves — HR and Employee only.
// ✅ RBAC: notAdmin guard is a route-level defense.
//    The controller also enforces this independently (defence-in-depth).
router.post('/', authMiddleware, notAdmin, applyLeave);

// GET /api/hr/leaves/pending — HR and Admin only
router.get('/pending', authMiddleware, hrOrAdmin, getPendingLeaves);

// PATCH /api/hr/leaves/:id — HR and Admin only
router.patch('/:id', authMiddleware, hrOrAdmin, updateLeaveStatus);

module.exports = router;