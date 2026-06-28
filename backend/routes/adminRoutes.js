// routes/adminRoutes.js
// /api/admin endpoints - user management (HOD only) + dashboards

const express = require('express');
const router = express.Router();

const {
  getUsers,
  createUser,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getStudentDashboard,
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// --- Dashboards ---
router.get('/dashboard', authorize('faculty', 'hod'), getDashboardStats);
router.get('/dashboard/student', authorize('student'), getStudentDashboard);

// --- User management (HOD only) ---
router.route('/users').get(authorize('hod'), getUsers).post(authorize('hod'), createUser);
// backend/routes/adminRoutes.js

// Add this route
router.get('/faculty', protect, authorize('admin', 'hod'), async (req, res) => {
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

router.put('/users/:id/status', authorize('hod'), updateUserStatus);
router.delete('/users/:id', authorize('hod'), deleteUser);

module.exports = router;