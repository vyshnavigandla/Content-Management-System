// controllers/authController.js
// Handles registration, login, fetching profile, and password change.

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user (HOD, Faculty, or Student)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, rollNumber, semester, designation } = req.body;

  // Basic validation
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Name, email, password, and role are required');
  }

  if (!['hod', 'faculty', 'student'].includes(role)) {
    res.status(400);
    throw new Error('Role must be one of: hod, faculty, student');
  }

  // Check if a user with this email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  // ✅ NEW: If registering as HOD, check if there's an active HOD
  let isActive = true;
  let statusMessage = '';

  if (role === 'hod') {
    const activeHOD = await User.findOne({ 
      role: 'hod', 
      isActive: true 
    });

    if (activeHOD) {
      // If HOD exists, new HOD becomes INACTIVE by default
      isActive = false;
      statusMessage = `⚠️ Account created but INACTIVE. Current HOD (${activeHOD.name}) must deactivate their account first.`;
    } else {
      // No active HOD, new HOD becomes active
      isActive = true;
      statusMessage = '✅ Account created as ACTIVE HOD.';
    }
  }

  // Create the user
  const user = await User.create({
    name,
    email,
    password,
    role,
    rollNumber: role === 'student' ? rollNumber : undefined,
    semester: role === 'student' ? semester : undefined,
    designation: role !== 'student' ? designation : undefined,
    isActive: isActive, // ✅ New HOD is INACTIVE if HOD exists
    hodPromotedAt: role === 'hod' && isActive ? new Date() : null,
    previousRole: null,
  });

  // Log registration
  if (role === 'hod') {
    console.log(`👑 New HOD registered: ${email} (${isActive ? 'ACTIVE' : 'INACTIVE'})`);
    if (!isActive) {
      const activeHOD = await User.findOne({ role: 'hod', isActive: true });
      console.log(`📌 Note: Existing active HOD (${activeHOD?.name}) must deactivate first`);
    }
  }

  res.status(201).json({
    success: true,
    message: statusMessage || 'Account created successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      token: generateToken(user._id, user.role),
    },
  });
});

// @desc    Authenticate a user and return a token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // ✅ Check if account is active
  if (!user.isActive) {
    res.status(403);
    throw new Error('⚠️ Your account is INACTIVE. Please contact the HOD to activate your account.');
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      token: generateToken(user._id, user.role),
    },
  });
});

// @desc    Get the currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private (any logged-in user)
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private (any logged-in user)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current password and new password are required');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = { 
  registerUser, 
  loginUser, 
  getMe,
  changePassword
};