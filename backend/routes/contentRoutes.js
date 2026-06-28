// routes/contentRoutes.js
const express = require('express');
const router = express.Router();

const {
  createContent,
  getMyContent,
  getContentById,
  getContentBySlug,
  getPublicContentBySlug,
  updateContent,
  deleteContent,
  deleteAttachment,
  submitForApproval,
  getPendingApprovals,
  approveContent,
  rejectContent,
  archiveContent,
  getPublishedContent,
  trackDownload,
  scheduleContent,
  bulkDeleteArchived,
  getComments,
  addComment,
  deleteComment,
} = require('../controllers/contentController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadContentFiles } = require('../middleware/uploadMiddleware');

router.use(protect);

// ── Faculty / HOD ──────────────────────────────────────────────────────────

router.post(
  '/',
  authorize('faculty', 'hod'),
  uploadContentFiles,
  createContent
);

router.get('/mine', authorize('faculty', 'hod'), getMyContent);

// ── Specific named routes ──────────────────────────────────────────────────

router.get('/published', getPublishedContent);
router.get('/pending', authorize('hod'), getPendingApprovals);
router.get('/slug/:slug', getContentBySlug);
router.get('/public/:slug', getPublicContentBySlug);
router.delete('/archived/bulk', authorize('hod'), bulkDeleteArchived);

// ── Workflow actions ────────────────────────────────────────────────────────

router.put('/:id/submit', authorize('faculty', 'hod'), submitForApproval);
router.put('/:id/approve', authorize('hod'), approveContent);
router.put('/:id/reject', authorize('hod'), rejectContent);
router.put('/:id/archive', authorize('hod'), archiveContent);
router.put('/:id/download', trackDownload);
router.put('/:id/schedule', authorize('hod'), scheduleContent);
router.delete('/:id/attachments', authorize('faculty', 'hod'), deleteAttachment);

// ── ✅ COMMENTS ROUTES ─────────────────────────────────────────────────────

router.get('/:id/comments', protect, getComments);
router.post('/:id/comments', protect, addComment);
router.delete('/comments/:commentId', protect, deleteComment);

// ── Generic CRUD (must be LAST) ────────────────────────────────────────────

router
  .route('/:id')
  .get(getContentById)
  .put(
    authorize('faculty', 'hod'),
    uploadContentFiles,
    updateContent
  )
  .delete(authorize('faculty', 'hod'), deleteContent);

module.exports = router;