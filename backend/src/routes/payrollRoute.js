const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly, hrOrAdmin } = require('../middleware/auth');
const { getPayroll, generatePayroll, finalizePayroll, downloadPayslip } = require('../controller/payrollController');

router.get('/', authMiddleware, getPayroll);
// HR creates/reviews draft payroll; only Admin can finalize and lock a month.
router.post('/generate', authMiddleware, hrOrAdmin, generatePayroll);
router.post('/finalize', authMiddleware, adminOnly, finalizePayroll);
router.get('/payslip/:id', authMiddleware, downloadPayslip);

module.exports = router;
