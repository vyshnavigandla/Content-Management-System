// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getContentAnalytics,
  getUserAnalytics
} = require('../controllers/analyticsController');

// All analytics routes require HOD role
router.use(protect);
router.use(authorize('hod'));

router.get('/content', getContentAnalytics);
router.get('/users', getUserAnalytics);

module.exports = router;