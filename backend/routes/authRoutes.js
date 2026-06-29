// routes/authRoutes.js
// Defines the /api/auth endpoints and which middleware protects each one.

const express = require('express');
const router = express.Router();

const { 
  registerUser, 
  loginUser, 
  getMe,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require valid JWT)
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);

module.exports = router;