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

router.put('/users/:id/status', authorize('hod'), updateUserStatus);
router.delete('/users/:id', authorize('hod'), deleteUser);

module.exports = router;