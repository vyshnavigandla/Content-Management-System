// routes/contentRoutes.js
// Combined Phase 4 + Phase 5 Routes

const express = require('express');
const router = express.Router();

const {
  createContent,
  getMyContent,
  getContentById,
  updateContent,
  deleteContent,
  submitForApproval,
  getPendingApprovals,
  approveContent,
  rejectContent,
  archiveContent,
  getPublishedContent,
  trackDownload,
} = require('../controllers/contentController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(protect);

// =========================
// Faculty / HOD Routes
// =========================

// Create content
router.post(
  '/',
  authorize('faculty', 'hod'),
  upload.array('attachments', 5),
  createContent
);

// Get my content
router.get(
  '/mine',
  authorize('faculty', 'hod'),
  getMyContent
);

// =========================
// Phase 5 Routes
// =========================

// Must be before '/:id'
router.put('/:id/download', trackDownload);
router.get('/published', getPublishedContent);

router.get(
  '/pending',
  authorize('hod'),
  getPendingApprovals
);

router.put(
  '/:id/submit',
  authorize('faculty', 'hod'),
  submitForApproval
);

router.put(
  '/:id/approve',
  authorize('hod'),
  approveContent
);

router.put(
  '/:id/reject',
  authorize('hod'),
  rejectContent
);

router.put(
  '/:id/archive',
  authorize('hod'),
  archiveContent
);

// =========================
// Generic Content Routes
// =========================

router
  .route('/:id')
  .get(getContentById)
  .put(
    authorize('faculty', 'hod'),
    upload.array('attachments', 5),
    updateContent
  )
  .delete(
    authorize('faculty', 'hod'),
    deleteContent
  );

module.exports = router;