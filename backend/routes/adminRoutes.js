// routes/adminRoutes.js
// /api/admin endpoints - user management (HOD only) + dashboards

const express = require('express');
const router = express.Router();

const {
  getUsers,
  createUser,
  updateUserRole,        // ✅ Added
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getStudentDashboard,
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// ──────────────────────────────────────────────────────────────
//  Dashboards
// ──────────────────────────────────────────────────────────────

router.get('/dashboard', authorize('faculty', 'hod'), getDashboardStats);
router.get('/dashboard/student', authorize('student'), getStudentDashboard);

// ──────────────────────────────────────────────────────────────
//  Faculty Directory (Public)
// ──────────────────────────────────────────────────────────────

// ✅ Get faculty members (including HODs)
router.get('/faculty', protect, async (req, res) => {
  try {
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
      message: 'Failed to fetch faculty members'
    });
  }
});

// ──────────────────────────────────────────────────────────────
//  User Management (HOD only)
// ──────────────────────────────────────────────────────────────

// Get all users with filters
router.get('/users', authorize('hod'), getUsers);

// Create new user (faculty or student only)
router.post('/users', authorize('hod'), createUser);

// ✅ Update user role (Promote/Demote HOD)
router.put('/users/:id/role', authorize('hod'), updateUserRole);

// Activate or deactivate user
router.put('/users/:id/status', authorize('hod'), updateUserStatus);

// Delete user
router.delete('/users/:id', authorize('hod'), deleteUser);

module.exports = router;