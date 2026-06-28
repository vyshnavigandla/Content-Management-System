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

  // Create the user - password gets hashed automatically by the
  // pre('save') hook we defined in the User model
  const user = await User.create({
    name,
    email,
    password,
    role,
    rollNumber: role === 'student' ? rollNumber : undefined,
    semester: role === 'student' ? semester : undefined,
    designation: role !== 'student' ? designation : undefined,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
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

  // .select('+password') is needed because the schema sets select:false on password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact the HOD.');
  }

  // Compare entered password with the hashed password using our model method
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
      token: generateToken(user._id, user.role),
    },
  });
});

// @desc    Get the currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private (any logged-in user)
const getMe = asyncHandler(async (req, res) => {
  // req.user was set by the "protect" middleware
  res.json({ success: true, data: req.user });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private (any logged-in user)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current password and new password are required');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  // Get user with password field (select: false by default)
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  // Update password (pre('save') hook will hash it)
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
  changePassword  // ← Added
};