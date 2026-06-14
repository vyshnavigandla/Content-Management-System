// routes/authRoutes.js
// Defines the /api/auth endpoints and which middleware protects each one.

const express = require('express');
const router = express.Router();

const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);  // Public - anyone can register
router.post('/login', loginUser);        // Public - anyone can log in
router.get('/me', protect, getMe);        // Private - requires valid JWT

module.exports = router;