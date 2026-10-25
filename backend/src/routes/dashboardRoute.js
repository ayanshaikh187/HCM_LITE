const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly, hrOrAdmin } = require('../middleware/auth');
const { adminMetrics, hrMetrics, employeeMetrics, getAuditLogs, getAnnouncements, createAnnouncement } = require('../controller/dashboardController');

// Metrics - route based on req.baseUrl to support /api/admin/metrics, /api/hr/metrics, and /api/employee/metrics
router.get('/metrics', authMiddleware, (req, res, next) => {
  if (req.baseUrl.includes('admin')) {
    return adminOnly(req, res, () => adminMetrics(req, res, next));
  }
  if (req.baseUrl.includes('hr')) {
    return hrOrAdmin(req, res, () => hrMetrics(req, res, next));
  }
  return employeeMetrics(req, res, next);
});

// Admin audit logs
router.get('/audit-logs', authMiddleware, adminOnly, getAuditLogs);

// Announcements
router.get('/announcements', authMiddleware, getAnnouncements);
router.post('/announcements', authMiddleware, hrOrAdmin, createAnnouncement);

module.exports = router;