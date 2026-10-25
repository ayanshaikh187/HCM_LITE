const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  smartLeave,
  chat,
  policyQA,
  attendanceSummary
} = require('../controller/aiController');

router.post('/smart-leave', authMiddleware, smartLeave);
router.post('/chat', authMiddleware, chat);
router.post('/policy-qa', authMiddleware, policyQA);
router.post('/attendance-summary', authMiddleware, attendanceSummary); // bonus

module.exports = router;