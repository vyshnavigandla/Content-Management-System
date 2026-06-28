// routes/authRoutes.js
// Defines the /api/auth endpoints and which middleware protects each one.

const express = require('express');
const router = express.Router();

const { 
  registerUser, 
  loginUser, 
  getMe,
  changePassword  // ← Added
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);  // Public - anyone can register
router.post('/login', loginUser);        // Public - anyone can log in

// Protected routes (require valid JWT)
router.get('/me', protect, getMe);              // Get own profile
router.put('/password', protect, changePassword); // Change password

module.exports = router;