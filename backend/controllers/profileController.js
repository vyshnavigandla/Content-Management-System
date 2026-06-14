// controllers/profileController.js
// Handles viewing/editing a faculty/HOD profile, and listing the
// department's faculty directory (visible to all logged-in users).

const asyncHandler = require('express-async-handler');
const FacultyProfile = require('../models/FacultyProfile');
const User = require('../models/User');

// @desc    Get the logged-in user's own profile (creates an empty one
//          on first access, so the frontend always gets a document back)
// @route   GET /api/profiles/me
// @access  Private (faculty, hod)
const getMyProfile = asyncHandler(async (req, res) => {
  let profile = await FacultyProfile.findOne({ user: req.user._id }).populate(
    'user',
    'name email role designation'
  );

  if (!profile) {
    // First time this user is accessing their profile - create a blank one
    profile = await FacultyProfile.create({ user: req.user._id });
    profile = await profile.populate('user', 'name email role designation');
  }

  res.json({ success: true, data: profile });
});

// @desc    Update the logged-in user's own profile
// @route   PUT /api/profiles/me
// @access  Private (faculty, hod)
const updateMyProfile = asyncHandler(async (req, res) => {
  const { qualifications, researchInterests, publications, bio } = req.body;

  let profile = await FacultyProfile.findOne({ user: req.user._id });

  if (!profile) {
    profile = new FacultyProfile({ user: req.user._id });
  }

  // Arrays may arrive as comma-separated strings from simple form inputs,
  // OR as actual arrays from a more advanced frontend - handle both.
  const toArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
    return undefined;
  };

  if (qualifications !== undefined) profile.qualifications = toArray(qualifications) || [];
  if (researchInterests !== undefined) profile.researchInterests = toArray(researchInterests) || [];
  if (publications !== undefined) profile.publications = toArray(publications) || [];
  if (bio !== undefined) profile.bio = bio;

  // If a new photo was uploaded via Multer, update the path
  if (req.file) {
    profile.photo = `/uploads/${req.file.filename}`;
  }

  await profile.save();
  await profile.populate('user', 'name email role designation');

  res.json({ success: true, data: profile });
});

// @desc    Get the full faculty directory (all faculty + HOD profiles)
// @route   GET /api/profiles/directory
// @access  Private (any logged-in user - faculty, hod, student)
const getFacultyDirectory = asyncHandler(async (req, res) => {
  const { search } = req.query;

  // Find all users with role faculty/hod, optionally filtered by name search
  const userFilter = { role: { $in: ['faculty', 'hod'] }, isActive: true };
  if (search) {
    userFilter.name = { $regex: search, $options: 'i' };
  }

  const users = await User.find(userFilter).select('name email role designation');
  const userIds = users.map((u) => u._id);

  const profiles = await FacultyProfile.find({ user: { $in: userIds } });

  // Merge user info + profile info into a single object per faculty member
  const directory = users.map((user) => {
    const profile = profiles.find((p) => p.user.toString() === user._id.toString());
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      photo: profile?.photo || '',
      qualifications: profile?.qualifications || [],
      researchInterests: profile?.researchInterests || [],
      publications: profile?.publications || [],
      bio: profile?.bio || '',
    };
  });

  res.json({ success: true, count: directory.length, data: directory });
});

module.exports = { getMyProfile, updateMyProfile, getFacultyDirectory };