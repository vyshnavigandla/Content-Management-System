// routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getContentComments,
  addComment,
  deleteComment,
  resolveComment
} = require('../controllers/commentController');

// All routes require authentication
router.use(protect);

// Public endpoints
router.get('/content/:contentId', getContentComments);

// Comment operations
router.post('/', addComment);
router.put('/:id/resolve', resolveComment);
router.delete('/:id', deleteComment);

module.exports = router;