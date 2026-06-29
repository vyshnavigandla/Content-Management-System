// routes/adminRoutes.js
// /api/admin endpoints - user management (HOD only) + dashboards

const express = require('express');
const router = express.Router();

const {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getStudentDashboard,
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// ──────────────────────────────────────────────────────────────
//  All routes require authentication
// ──────────────────────────────────────────────────────────────
router.use(protect);

// ──────────────────────────────────────────────────────────────
//  Dashboards
// ──────────────────────────────────────────────────────────────

// Faculty/HOD dashboard
router.get('/dashboard', authorize('faculty', 'hod'), getDashboardStats);

// Student dashboard
router.get('/dashboard/student', authorize('student'), getStudentDashboard);

// ──────────────────────────────────────────────────────────────
//  Faculty Directory (Public - accessible to all authenticated users)
// ──────────────────────────────────────────────────────────────

router.get('/faculty', async (req, res) => {
  try {
    const faculty = await User.find({ 
      role: { $in: ['faculty', 'hod'] },
      isActive: true
    })
    .select('-password')
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

// Get all users with filters (role, search)
router.get('/users', authorize('hod'), getUsers);

// Create new user (faculty or student only)
router.post('/users', authorize('hod'), createUser);

// Update user role (Promote/Demote to/from HOD)
router.put('/users/:id/role', authorize('hod'), updateUserRole);

// Activate or deactivate user account
router.put('/users/:id/status', authorize('hod'), updateUserStatus);

// Delete user account
router.delete('/users/:id', authorize('hod'), deleteUser);

module.exports = router;