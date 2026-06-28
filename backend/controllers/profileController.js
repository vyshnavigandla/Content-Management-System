// controllers/profileController.js
// Handles viewing/editing a faculty/HOD profile, and listing the
// department's faculty directory (visible to all logged-in users).

const asyncHandler = require('express-async-handler');
const FacultyProfile = require('../models/FacultyProfile');
const User = require('../models/User');

// @desc    Get the logged-in user's own profile
// @route   GET /api/profiles/me
// @access  Private (faculty, hod)
const getMyProfile = asyncHandler(async (req, res) => {
  let profile = await FacultyProfile.findOne({
    user: req.user._id,
  }).populate('user', 'name email role designation');

  if (!profile) {
    profile = await FacultyProfile.create({
      user: req.user._id,
    });

    profile = await profile.populate(
      'user',
      'name email role designation'
    );
  }

  res.json({
    success: true,
    data: profile,
  });
});

// @desc    Update the logged-in user's own profile
// @route   PUT /api/profiles/me
// @access  Private (faculty, hod)
const updateMyProfile = asyncHandler(async (req, res) => {
  const {
    name, // ✅ Added name field
    qualifications,
    researchInterests,
    publications,
    bio,
  } = req.body;

  // ✅ Update User's name if provided
  if (name) {
    await User.findByIdAndUpdate(req.user._id, { name });
  }

  let profile = await FacultyProfile.findOne({
    user: req.user._id,
  });

  if (!profile) {
    profile = new FacultyProfile({
      user: req.user._id,
    });
  }

  // Convert comma-separated string → array
  const toArray = (val) => {
    if (Array.isArray(val)) return val;

    if (typeof val === 'string') {
      return val
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return undefined;
  };

  // Existing fields
  if (qualifications !== undefined) {
    profile.qualifications = toArray(qualifications) || [];
  }

  if (researchInterests !== undefined) {
    profile.researchInterests = toArray(researchInterests) || [];
  }

  if (publications !== undefined) {
    profile.publications = toArray(publications) || [];
  }

  if (bio !== undefined) {
    profile.bio = bio;
  }

  // Phase 11 Additions
  if (req.body.isAlumnus !== undefined) {
    profile.isAlumnus =
      req.body.isAlumnus === true ||
      req.body.isAlumnus === 'true';
  }

  if (
    req.body.alumniBatchYear !== undefined &&
    req.body.alumniBatchYear !== ''
  ) {
    profile.alumniBatchYear = Number(
      req.body.alumniBatchYear
    );
  }

  if (req.body.mentorshipAreas !== undefined) {
    profile.mentorshipAreas =
      toArray(req.body.mentorshipAreas) || [];
  }

  // Update photo if uploaded
  if (req.file) {
    profile.photo = `/uploads/${req.file.filename}`;
  }

  await profile.save();

  // ✅ Populate with updated user data
  await profile.populate(
    'user',
    'name email role designation'
  );

  res.json({
    success: true,
    data: profile,
  });
});

// @desc    Get faculty directory
// @route   GET /api/profiles/directory
// @access  Private (faculty, hod, student)
const getFacultyDirectory = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const userFilter = {
    role: { $in: ['faculty', 'hod'] },
    isActive: true,
  };

  if (search) {
    userFilter.name = {
      $regex: search,
      $options: 'i',
    };
  }

  const users = await User.find(userFilter)
    .select('name email role designation');

  const userIds = users.map((u) => u._id);

  const profiles = await FacultyProfile.find({
    user: { $in: userIds },
  });

  const directory = users.map((user) => {
    const profile = profiles.find(
      (p) => p.user.toString() === user._id.toString()
    );

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,

      photo: profile?.photo || '',

      qualifications:
        profile?.qualifications || [],

      researchInterests:
        profile?.researchInterests || [],

      publications:
        profile?.publications || [],

      bio: profile?.bio || '',

      // Phase 11 fields
      isAlumnus:
        profile?.isAlumnus || false,

      alumniBatchYear:
        profile?.alumniBatchYear || null,

      mentorshipAreas:
        profile?.mentorshipAreas || [],
    };
  });

  res.json({
    success: true,
    count: directory.length,
    data: directory,
  });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getFacultyDirectory,
};