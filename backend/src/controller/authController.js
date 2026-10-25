const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../middleware/audit');

// POST /api/setup/init - First run setup
exports.initSetup = async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Setup already completed' });
    }

    const name = req.body.name || req.body.adminName;
    const email = (req.body.email || req.body.adminEmail || '').trim().toLowerCase();
    const password = req.body.password || req.body.adminPassword;
    const companyName = req.body.companyName || 'HCM Lite Org';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'Admin',
      department: 'Management',
      designation: 'Administrator'
    });

    await logAudit(email, 'System initialized', `Company: ${companyName}`);

    res.status(201).json({ message: 'Setup complete', userId: admin._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'hcm_lite_jwt_secret_key';
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      secret,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        isCheckedIn: user.isCheckedIn || false
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        isCheckedIn: user.isCheckedIn || false
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};