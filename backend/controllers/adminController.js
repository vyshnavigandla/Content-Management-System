// controllers/adminController.js
// HOD-only user management + dashboard analytics aggregation.
// "Admin" here refers to the HOD's administrative capabilities
// within their department (we don't have a separate global admin role).

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Content = require('../models/Content');
const AuditLog = require('../models/AuditLog');
const generateToken = require('../utils/generateToken');

// @desc    Get all users in the department (filterable by role, search by name/email)
// @route   GET /api/admin/users
// @access  Private (hod)
const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Exclude the HOD's own account from the list by default isn't necessary,
  // but we never return passwords (schema already has select: false on it).
  const users = await User.find(filter).sort({ createdAt: -1 });

  res.json({ success: true, count: users.length, data: users });
});

// @desc    HOD creates a new Faculty or Student account directly
// @route   POST /api/admin/users
// @access  Private (hod)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, rollNumber, semester, designation } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Name, email, password, and role are required');
  }

  // HOD can create faculty or student accounts (not another HOD, to keep
  // the department single-HOD for simplicity)
  if (!['faculty', 'student'].includes(role)) {
    res.status(400);
    throw new Error('HOD can only create faculty or student accounts');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    rollNumber: role === 'student' ? rollNumber : undefined,
    semester: role === 'student' ? semester : undefined,
    designation: role === 'faculty' ? designation : undefined,
  });

  await AuditLog.create({
    user: req.user._id,
    action: 'USER_CREATED',
    targetType: 'user',
    targetId: user._id,
    remarks: `${role} account created for ${email}`,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Activate or deactivate a user account
// @route   PUT /api/admin/users/:id/status
// @access  Private (hod)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    res.status(400);
    throw new Error('isActive must be true or false');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent the HOD from deactivating their own account (would lock them out)
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change the status of your own account');
  }

  user.isActive = isActive;
  await user.save();

  await AuditLog.create({
    user: req.user._id,
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    targetType: 'user',
    targetId: user._id,
    remarks: `${user.email} ${isActive ? 'activated' : 'deactivated'}`,
  });

  res.json({ success: true, data: user });
});

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Private (hod)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  await user.deleteOne();

  await AuditLog.create({
    user: req.user._id,
    action: 'USER_DELETED',
    targetType: 'user',
    targetId: req.params.id,
    remarks: `${user.email} deleted`,
  });

  res.json({ success: true, message: 'User deleted successfully' });
});

// @desc    Dashboard summary - counts, recent uploads, recent activity
// @route   GET /api/admin/dashboard
// @access  Private (faculty, hod)
//          Note: students get a lighter version via getStudentDashboard below
const getDashboardStats = asyncHandler(async (req, res) => {
  // Run independent queries in parallel for speed
  const [
    totalUsers,
    totalFaculty,
    totalStudents,
    contentCounts,
    recentPublished,
    recentLogs,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'faculty' }),
    User.countDocuments({ role: 'student' }),

    // Count content grouped by status, e.g. { draft: 3, pending_approval: 2, published: 10 }
    Content.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Content.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(5)
      .select('title type publishedAt'),

    AuditLog.find({})
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  // Convert the aggregation result into a simple { draft: x, published: y, ... } object
  const statusCounts = { draft: 0, pending_approval: 0, published: 0, rejected: 0, archived: 0 };
  contentCounts.forEach((item) => {
    statusCounts[item._id] = item.count;
  });

  res.json({
    success: true,
    data: {
      totalUsers,
      totalFaculty,
      totalStudents,
      contentCounts: statusCounts,
      recentPublished,
      recentActivity: recentLogs,
    },
  });
});

// @desc    Lightweight dashboard for Students - just recent published content
// @route   GET /api/admin/dashboard/student
// @access  Private (student)
const getStudentDashboard = asyncHandler(async (req, res) => {
  const recentPublished = await Content.find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .limit(8)
    .populate('createdBy', 'name role')
    .select('title type subject semester publishedAt');

  const counts = await Content.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  const typeCounts = {};
  counts.forEach((item) => {
    typeCounts[item._id] = item.count;
  });

  res.json({
    success: true,
    data: {
      recentPublished,
      typeCounts,
    },
  });
});

module.exports = {
  getUsers,
  createUser,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getStudentDashboard,
};