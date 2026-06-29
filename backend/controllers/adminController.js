// controllers/adminController.js

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Content = require('../models/Content');
const AuditLog = require('../models/AuditLog');

// @desc    Get all users (filterable by role, search by name/email)
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

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

// @desc    HOD creates a new Faculty or Student account
// @route   POST /api/admin/users
// @access  Private (hod)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, rollNumber, semester, designation } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Name, email, password, and role are required');
  }

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
    semester:   role === 'student' ? semester   : undefined,
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
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
});

// @desc    Update user role (Promote/Demote HOD)
// @route   PUT /api/admin/users/:id/role
// @access  Private (hod)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent self role change
  if (targetUser._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change your own role');
  }

  // Validate role
  if (!['hod', 'faculty', 'student'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }

  // If promoting to HOD, demote current HOD
  if (role === 'hod') {
    // Find current HOD in the same department
    const currentHOD = await User.findOne({
      role: 'hod',
      department: targetUser.department,
      isActive: true,
    });

    if (currentHOD && currentHOD._id.toString() !== targetUser._id.toString()) {
      // Demote current HOD back to faculty
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

    // Store previous role and promotion date
    targetUser.previousRole = targetUser.role;
    targetUser.hodPromotedAt = new Date();
  } else {
    // If demoting from HOD, clear HOD metadata
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
  if (!user) { res.status(404); throw new Error('User not found'); }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change the status of your own account');
  }

  // ✅ If activating a HOD, check if another HOD is active
  if (user.role === 'hod' && isActive) {
    const activeHOD = await User.findOne({
      role: 'hod',
      isActive: true,
      _id: { $ne: user._id } // Exclude the user being activated
    });

    if (activeHOD) {
      // Demote current active HOD to faculty
      activeHOD.role = 'faculty';
      activeHOD.hodPromotedAt = null;
      activeHOD.previousRole = null;
      await activeHOD.save();

      await AuditLog.create({
        user: req.user._id,
        action: 'HOD_DEMOTED',
        targetType: 'user',
        targetId: activeHOD._id,
        remarks: `${activeHOD.email} demoted from HOD to Faculty for new HOD`,
      });

      console.log(`📌 Demoted ${activeHOD.email} from HOD to Faculty`);
    }
  }

  // ✅ If deactivating a HOD, demote them to faculty
  if (user.role === 'hod' && !isActive) {
    user.role = 'faculty';
    user.hodPromotedAt = null;
    user.previousRole = null;
    
    await AuditLog.create({
      user: req.user._id,
      action: 'HOD_DEMOTED',
      targetType: 'user',
      targetId: user._id,
      remarks: `${user.email} deactivated and demoted from HOD to Faculty`,
    });
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

  res.json({ 
    success: true, 
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: user 
  });
});

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Private (hod)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

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

// @desc    Dashboard summary
// @route   GET /api/admin/dashboard
// @access  Private (faculty, hod)
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
      .limit(5)
      .select('title type publishedAt'),
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

// @desc    Lightweight dashboard for Students
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
  counts.forEach((item) => { typeCounts[item._id] = item.count; });

  const activeHOD = await User.findOne({ role: 'hod', isActive: true })
    .select('name email designation')
    .lean();

  res.json({
    success: true,
    data: { recentPublished, typeCounts, activeHOD },
  });
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