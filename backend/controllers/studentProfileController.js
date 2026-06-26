// controllers/studentProfileController.js
// Self-service student profile, project showcase, and peer/mentor matching.

const asyncHandler = require('express-async-handler');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const User = require('../models/User');
const { jaccardSimilarity } = require('../utils/similarity');

// @desc    Get the logged-in student's own profile (auto-creates if missing)
// @route   GET /api/student-profiles/me
// @access  Private (student)
const getMyProfile = asyncHandler(async (req, res) => {
  let profile = await StudentProfile.findOne({ user: req.user._id }).populate(
    'user',
    'name email role rollNumber semester'
  );

  if (!profile) {
    profile = await StudentProfile.create({ user: req.user._id });
    profile = await profile.populate('user', 'name email role rollNumber semester');
  }

  res.json({ success: true, data: profile });
});

// @desc    Update the logged-in student's own profile
// @route   PUT /api/student-profiles/me
// @access  Private (student)
const updateMyProfile = asyncHandler(async (req, res) => {
  const { bio, skills, interests, currentProject, pastProjects } = req.body;

  let profile = await StudentProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = new StudentProfile({ user: req.user._id });
  }

  // Helper: accept comma-separated strings OR arrays
  const toArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
    return undefined;
  };

  if (bio !== undefined) profile.bio = bio;
  if (skills !== undefined) profile.skills = toArray(skills) || [];
  if (interests !== undefined) profile.interests = toArray(interests) || [];
  if (pastProjects !== undefined) profile.pastProjects = toArray(pastProjects) || [];

  // currentProject arrives as a JSON string from FormData (since it's a nested object)
  if (currentProject !== undefined) {
    const cp = typeof currentProject === 'string' ? JSON.parse(currentProject) : currentProject;
    profile.currentProject = {
      title: cp.title || '',
      description: cp.description || '',
      status: cp.status || 'idea',
      lookingForTeammates: !!cp.lookingForTeammates,
      requiredSkills: toArray(cp.requiredSkills) || [],
    };
  }

  if (req.file) {
    profile.photo = `/uploads/${req.file.filename}`;
  }

  await profile.save();
  await profile.populate('user', 'name email role rollNumber semester');

  res.json({ success: true, data: profile });
});

// @desc    Browsable project showcase - all students with a non-empty current project
// @route   GET /api/student-profiles/showcase
// @access  Private (any logged-in user)
const getShowcase = asyncHandler(async (req, res) => {
  const { skill, status, lookingForTeammates } = req.query;

  const filter = { 'currentProject.title': { $ne: '' } };
  if (status) filter['currentProject.status'] = status;
  if (lookingForTeammates === 'true') filter['currentProject.lookingForTeammates'] = true;
  if (skill) {
    // Match if the skill appears in either the student's skills or requiredSkills
    filter.$or = [
      { skills: { $regex: skill, $options: 'i' } },
      { 'currentProject.requiredSkills': { $regex: skill, $options: 'i' } },
    ];
  }

  const profiles = await StudentProfile.find(filter)
    .populate('user', 'name rollNumber semester')
    .sort({ updatedAt: -1 });

  res.json({ success: true, count: profiles.length, data: profiles });
});

// @desc    Get matches for the logged-in student:
//           1. "Students like you" - peer matches by skills+interests overlap
//           2. "Teammates for your project" - students whose skills match
//              your currentProject.requiredSkills (only if lookingForTeammates)
//           3. "Mentors for you" - faculty/alumni whose researchInterests or
//              mentorshipAreas overlap with your interests
// @route   GET /api/student-profiles/matches
// @access  Private (student)
const getMatches = asyncHandler(async (req, res) => {
  const myProfile = await StudentProfile.findOne({ user: req.user._id });

  if (!myProfile) {
    res.status(404);
    throw new Error('Please complete your profile first to see matches');
  }

  const myTags = [...(myProfile.skills || []), ...(myProfile.interests || [])];

  // --- 1. Peer matches ---
  const otherProfiles = await StudentProfile.find({ user: { $ne: req.user._id } }).populate(
    'user',
    'name rollNumber semester'
  );

  const peerMatches = otherProfiles
    .map((p) => {
      const theirTags = [...(p.skills || []), ...(p.interests || [])];
      const score = jaccardSimilarity(myTags, theirTags);
      return { profile: p, score };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // --- 2. Teammate matches (only if currently looking) ---
  let teammateMatches = [];
  if (myProfile.currentProject?.lookingForTeammates && myProfile.currentProject.requiredSkills?.length) {
    teammateMatches = otherProfiles
      .map((p) => {
        const score = jaccardSimilarity(myProfile.currentProject.requiredSkills, p.skills || []);
        return { profile: p, score };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  // --- 3. Mentor matches (faculty/alumni) ---
  const facultyProfiles = await FacultyProfile.find({}).populate('user', 'name email role designation');

  const mentorMatches = facultyProfiles
    .map((p) => {
      const theirTags = [...(p.researchInterests || []), ...(p.mentorshipAreas || [])];
      const score = jaccardSimilarity(myTags, theirTags);
      return { profile: p, score };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      peerMatches: peerMatches.map((m) => ({
        student: m.profile.user,
        skills: m.profile.skills,
        interests: m.profile.interests,
        matchScore: Math.round(m.score * 100), // as a percentage
      })),
      teammateMatches: teammateMatches.map((m) => ({
        student: m.profile.user,
        skills: m.profile.skills,
        currentProject: m.profile.currentProject,
        matchScore: Math.round(m.score * 100),
      })),
      mentorMatches: mentorMatches.map((m) => ({
        mentor: m.profile.user,
        isAlumnus: m.profile.isAlumnus,
        alumniBatchYear: m.profile.alumniBatchYear,
        researchInterests: m.profile.researchInterests,
        mentorshipAreas: m.profile.mentorshipAreas,
        matchScore: Math.round(m.score * 100),
      })),
    },
  });
});

// @desc    Get a single student's public profile
// @route   GET /api/student-profiles/:id
// @access  Private (any logged-in user)
const getProfileById = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.params.id }).populate(
    'user',
    'name rollNumber semester'
  );

  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json({ success: true, data: profile });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getShowcase,
  getMatches,
  getProfileById,
};