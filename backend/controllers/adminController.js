// controllers/adminController.js

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Content = require('../models/Content');
const AuditLog = require('../models/AuditLog');

const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, count: users.length, total, pages: Math.ceil(total / limit), data: users });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, rollNumber, semester, designation } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400); throw new Error('Name, email, password, and role are required');
  }
  if (!['faculty', 'student'].includes(role)) {
    res.status(400); throw new Error('HOD can only create faculty or student accounts');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) { res.status(400); throw new Error('A user with this email already exists'); }

  const user = await User.create({
    name, email, password, role,
    rollNumber:  role === 'student' ? rollNumber  : undefined,
    semester:    role === 'student' ? semester    : undefined,
    designation: role === 'faculty' ? designation : undefined,
  });

  await AuditLog.create({
    user: req.user._id, action: 'USER_CREATED',
    targetType: 'user', targetId: user._id,
    remarks: `${role} account created for ${email}`,
  });

  res.status(201).json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// ✅ Update user role (Promote/Demote HOD)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  if (targetUser._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change your own role');
  }

  if (!['hod', 'faculty', 'student'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }

  if (role === 'hod') {
    const currentHOD = await User.findOne({
      role: 'hod',
      department: targetUser.department,
      isActive: true,
    });

    if (currentHOD && currentHOD._id.toString() !== targetUser._id.toString()) {
      currentHOD.role = 'faculty';
      currentHOD.hodPromotedAt = null;
      currentHOD.previousRole = null;
      await currentHOD.save();

      await AuditLog.create({
        user: req.user._id,
        action: 'HOD_DEMOTED',
        targetType: 'user',
        targetId: currentHOD._id,
        remarks: `${currentHOD.email} demoted from HOD to Faculty`,
      });
    }

    targetUser.previousRole = targetUser.role;
    targetUser.hodPromotedAt = new Date();
  } else {
    if (targetUser.role === 'hod') {
      targetUser.hodPromotedAt = null;
      targetUser.previousRole = null;
    }
  }

  targetUser.role = role;
  await targetUser.save();

  await AuditLog.create({
    user: req.user._id,
    action: 'ROLE_CHANGED',
    targetType: 'user',
    targetId: targetUser._id,
    remarks: `${targetUser.email} role changed to: ${role}`,
  });

  res.json({
    success: true,
    message: `User role updated to ${role}`,
    data: {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
    },
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    res.status(400); throw new Error('isActive must be true or false');
  }

  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400); throw new Error('You cannot change your own account status');
  }

  if (user.role === 'hod' && !isActive) {
    user.role = 'faculty';
    user.hodPromotedAt = null;
    user.previousRole = null;
  }

  user.isActive = isActive;
  await user.save();

  await AuditLog.create({
    user: req.user._id,
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    targetType: 'user', targetId: user._id,
    remarks: `${user.email} ${isActive ? 'activated' : 'deactivated'}`,
  });

  res.json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400); throw new Error('You cannot delete your own account');
  }

  await user.deleteOne();

  await AuditLog.create({
    user: req.user._id, action: 'USER_DELETED',
    targetType: 'user', targetId: req.params.id,
    remarks: `${user.email} deleted`,
  });

  res.json({ success: true, message: 'User deleted successfully' });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalFaculty,
    totalHODs,
    activeHOD,
    totalStudents,
    contentCounts,
    recentPublished,
    recentLogs,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: { $in: ['faculty', 'hod'] } }),
    User.countDocuments({ role: 'hod' }),
    User.findOne({ role: 'hod', isActive: true })
        .select('name email designation createdAt')
        .lean(),
    User.countDocuments({ role: 'student' }),
    Content.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Content.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(10)
      .select('title type publishedAt createdBy')
      .populate('createdBy', 'name'),
    AuditLog.find({})
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const allHODs = await User.find({ role: 'hod' })
    .select('name email designation isActive createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const statusCounts = {
    draft: 0, pending_approval: 0, published: 0, rejected: 0, archived: 0,
  };
  contentCounts.forEach((item) => { statusCounts[item._id] = item.count; });

  res.json({
    success: true,
    data: {
      totalUsers,
      totalFaculty,
      totalHODs,
      activeHOD,
      allHODs,
      totalStudents,
      contentCounts: statusCounts,
      recentPublished,
      recentActivity: recentLogs,
    },
  });
});

const getStudentDashboard = asyncHandler(async (req, res) => {
  const recentPublished = await Content.find({ status: 'published' })
    .sort({ publishedAt: -1 }).limit(8)
    .populate('createdBy', 'name role')
    .select('title type subject semester publishedAt');

  const counts = await Content.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  const typeCounts = {};
  counts.forEach((item) => { typeCounts[item._id] = item.count; });

  const activeHOD = await User.findOne({ role: 'hod', isActive: true })
    .select('name email designation').lean();

  res.json({ success: true, data: { recentPublished, typeCounts, activeHOD } });
});

module.exports = {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getStudentDashboard,
};