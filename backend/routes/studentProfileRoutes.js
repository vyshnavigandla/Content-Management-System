// routes/studentProfileRoutes.js
// /api/student-profiles endpoints

const express = require('express');
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  getShowcase,
  getMatches,
  getProfileById,
} = require('../controllers/studentProfileController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware'); // Changed: use destructuring

router.use(protect);

// Specific routes BEFORE '/:id' (same ordering rule as Phase 5)
router.get('/showcase', getShowcase);                          // everyone can browse
router.get('/matches', authorize('student'), getMatches);       // students only

router
  .route('/me')
  .get(authorize('student'), getMyProfile)
  .put(authorize('student'), upload.single('photo'), updateMyProfile); // Now works

router.get('/:id', getProfileById); // public profile view

module.exports = router;