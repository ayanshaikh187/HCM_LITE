
const Leave = require('../model/Leave');

// POST /api/leaves
// Employee apni leave apply kar sakta hai; HR bhi apply kar sakta hai.
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({
        message: 'Leave type, start date, end date and reason are required.',
      });
    }

    const allowedTypes = ['Casual', 'Sick', 'Annual', 'Unpaid'];

    if (!allowedTypes.includes(leaveType)) {
      return res.status(400).json({
        message: 'Invalid leave type.',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        message: 'Please provide valid leave dates.',
      });
    }

    if (start > end) {
      return res.status(400).json({
        message: 'End date must be on or after start date.',
      });
    }

    const employeeId = req.user.id || req.user._id;

    if (!employeeId) {
      return res.status(401).json({
        message: 'Authenticated user ID not found.',
      });
    }

    const employeeName =
      req.user.name || req.user.fullName || req.user.email;

    if (!employeeName) {
      return res.status(400).json({
        message: 'Employee name is missing from the authenticated user.',
      });
    }

    const leave = await Leave.create({
      employeeId,
      employeeName,
      leaveType,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
    });

    return res.status(201).json({
      message: 'Leave application submitted successfully.',
      leave,
    });
  } catch (error) {
    console.error('Apply leave error:', error);

    return res.status(500).json({
      message: 'Failed to submit leave application.',
    });
  }
};


// GET /api/leaves
// Employee sirf apni leaves dekhega; HR/Admin sab dekh sakte hain.
exports.getLeaves = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'Employee') {
      filter.employeeId = req.user.id || req.user._id;
    }

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      leaves,
      total: leaves.length,
    });
  } catch (error) {
    console.error('Get leaves error:', error);

    return res.status(500).json({
      message: 'Failed to fetch leave applications.',
    });
  }
};


// GET /api/leaves/pending
// Route middleware HR/Admin ko authorize karta hai.
exports.getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'Pending' })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      leaves,
      total: leaves.length,
    });
  } catch (error) {
    console.error('Get pending leaves error:', error);

    return res.status(500).json({
      message: 'Failed to fetch pending leave applications.',
    });
  }
};


// PATCH /api/leaves/:id
// HR/Admin leave approve ya reject kar sakte hain.
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be Approved or Rejected.',
      });
    }

    if (!require('mongoose').isValidObjectId(id)) {
      return res.status(400).json({
        message: 'Invalid leave ID.',
      });
    }

    const leave = await Leave.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!leave) {
      return res.status(404).json({
        message: 'Leave application not found.',
      });
    }

    return res.status(200).json({
      message: `Leave ${status.toLowerCase()} successfully.`,
      leave,
    });
  } catch (error) {
    console.error('Update leave status error:', error);

    return res.status(500).json({
      message: 'Failed to update leave status.',
    });
  }
};
