// routes/profileRoutes.js
// /api/profiles endpoints

const express = require('express');
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  getFacultyDirectory,
} = require('../controllers/profileController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

// Directory is viewable by everyone (students included)
router.get('/directory', getFacultyDirectory);

// Profile management - faculty and hod only
router
  .route('/me')
  .get(authorize('faculty', 'hod'), getMyProfile)
  .put(authorize('faculty', 'hod'), upload.single('photo'), updateMyProfile);

module.exports = router;