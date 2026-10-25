const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { initSetup, login, getMe } = require('../controller/authController');

router.post('/setup/init', initSetup);
router.post('/setup', initSetup);

router.post('/auth/login', login);
router.post('/login', login);

router.get('/auth/me', authMiddleware, getMe);
router.get('/me', authMiddleware, getMe);

module.exports = router;