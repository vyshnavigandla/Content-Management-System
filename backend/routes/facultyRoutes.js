// backend/routes/facultyRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET all faculty members
router.get('/', protect, async (req, res) => {
  try {
    // Find all users with role 'faculty' or 'hod'
    const faculty = await User.find({ 
      role: { $in: ['faculty', 'hod'] } 
    })
    .select('-password')
    .populate('facultyProfile')
    .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: faculty.length,
      data: faculty
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty members',
      error: error.message
    });
  }
});

// GET single faculty member by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id)
      .select('-password')
      .populate('facultyProfile');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    // Check if user is faculty or HOD
    if (!['faculty', 'hod'].includes(faculty.role)) {
      return res.status(400).json({
        success: false,
        message: 'User is not a faculty member'
      });
    }

    res.status(200).json({
      success: true,
      data: faculty
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty member'
    });
  }
});

// UPDATE faculty profile
router.put('/:id', protect, authorize('faculty', 'hod'), async (req, res) => {
  try {
    const faculty = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: faculty
    });
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update faculty member'
    });
  }
});

module.exports = router;