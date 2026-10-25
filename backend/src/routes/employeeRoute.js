const express = require('express');
const router = express.Router();
const { authMiddleware, hrOrAdmin } = require('../middleware/auth');
const { getEmployees, createEmployee } = require('../controller/employeeController');

router.get('/', authMiddleware, getEmployees);
router.post('/', authMiddleware, hrOrAdmin, createEmployee);

module.exports = router;