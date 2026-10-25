const User = require('../models/User');
const { logAudit } = require('../middleware/audit');
const crypto = require('crypto');

// GET /api/employees
// Admin/HR can view the directory; Employee can only view their own profile.
exports.getEmployees = async (req, res) => {
  try {
    const { search, department, page = '1', limit = '20' } = req.query;
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));

    const filter = {};
    if (req.user.role === 'Employee') filter._id = req.user.id;
    if (department && req.user.role !== 'Employee') filter.department = department;
    if (search && req.user.role !== 'Employee') {
      const safeSearch = String(search).trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { department: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const projection = req.user.role === 'Employee'
      ? '-password -basicSalary'
      : '-password';

    const [employees, total] = await Promise.all([
      User.find(filter).select(projection).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean(),
      User.countDocuments(filter)
    ]);

    return res.json({ employees, results: employees, total, page: pageNumber, limit: pageSize, pages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('getEmployees:', error);
    return res.status(500).json({ message: 'Unable to fetch employees.' });
  }
};

// POST /api/employees
// HR may create Employee accounts only. Admin may create HR or Employee accounts, never another Admin here.
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, basicSalary } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const requestedRole = role || 'Employee';
    if (!['Employee', 'HR'].includes(requestedRole)) {
      return res.status(400).json({ message: 'Only Employee or HR roles can be created here.' });
    }
    if (req.user.role === 'HR' && requestedRole !== 'Employee') {
      return res.status(403).json({ message: 'HR can create Employee accounts only.' });
    }

    const salary = basicSalary === undefined || basicSalary === '' ? 0 : Number(basicSalary);
    if (!Number.isFinite(salary) || salary < 0) {
      return res.status(400).json({ message: 'basicSalary must be a valid non-negative number.' });
    }
    if (password && String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: normalizedEmail }).select('_id').lean();
    if (existing) return res.status(409).json({ message: 'Email already exists.' });

    // If no password is supplied, generate a one-time temporary password.
    const temporaryPassword = password || `${crypto.randomBytes(5).toString('hex')}!A7`;
    const employee = await User.create({
      name: name.trim().slice(0, 100),
      email: normalizedEmail,
      password: temporaryPassword,
      role: requestedRole,
      department: String(department || '').trim().slice(0, 100),
      designation: String(designation || '').trim().slice(0, 100),
      basicSalary: salary
    });

    await logAudit(req.user.email, 'Employee account created', `${requestedRole}: ${normalizedEmail}`);
    const response = employee.toObject();
    delete response.password;
    return res.status(201).json({ employee: response, temporaryPassword: password ? undefined : temporaryPassword, message: 'Account created.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email already exists.' });
    console.error('createEmployee:', error);
    return res.status(500).json({ message: 'Unable to create employee account.' });
  }
};
