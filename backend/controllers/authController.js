// controllers/authController.js
// Handles registration, login, and fetching the logged-in user's profile.

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user (HOD, Faculty, or Student)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, rollNumber, semester, designation } = req.body;

  // Basic validation
  if (!name || !email || !password || !role || !department) {
    res.status(400);
    throw new Error('Name, email, password, role, and department are required');
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

  // Create the user - password gets hashed automatically by the pre('save') hook
  const user = await User.create({
    name,
    email,
    password,
    role,
    department,
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
      department: user.department,
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

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      profilePhoto: user.profilePhoto,
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

module.exports = { registerUser, loginUser, getMe };