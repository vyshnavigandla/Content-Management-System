// routes/contentRoutes.js
// Additions over the original:
//  - DELETE /:id/attachments  -> deleteAttachment
//  - PUT    /:id/schedule     -> scheduleContent  (hod only)
//  - DELETE /archived/bulk    -> bulkDeleteArchived (hod only)

const express = require('express');
const router  = express.Router();

const {
  createContent,
  getMyContent,
  getContentById,
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
} = require('../controllers/contentController');

const { protect }    = require('../middleware/authMiddleware');
const { authorize }  = require('../middleware/roleMiddleware');
const upload         = require('../middleware/uploadMiddleware');

router.use(protect);

// ── Faculty / HOD ──────────────────────────────────────────────────────────

router.post(
  '/',
  authorize('faculty', 'hod'),
  upload.array('attachments', 5),
  createContent
);

router.get('/mine', authorize('faculty', 'hod'), getMyContent);

// ── Specific named routes (MUST come before /:id) ──────────────────────────

router.get('/published',       getPublishedContent);
router.get('/pending',         authorize('hod'), getPendingApprovals);

// NEW: bulk delete archived (before /:id so "archived" isn't treated as an id)
router.delete('/archived/bulk', authorize('hod'), bulkDeleteArchived);

// ── Workflow actions ────────────────────────────────────────────────────────

router.put('/:id/submit',    authorize('faculty', 'hod'), submitForApproval);
router.put('/:id/approve',   authorize('hod'),            approveContent);
router.put('/:id/reject',    authorize('hod'),            rejectContent);
router.put('/:id/archive',   authorize('hod'),            archiveContent);
router.put('/:id/download',  trackDownload);

// NEW: schedule a publish date (hod only)
router.put('/:id/schedule',  authorize('hod'),            scheduleContent);

// NEW: remove a single attachment (owner only, draft/rejected only)
router.delete('/:id/attachments', authorize('faculty', 'hod'), deleteAttachment);

// ── Generic CRUD ────────────────────────────────────────────────────────────

router
  .route('/:id')
  .get(getContentById)
  .put(authorize('faculty', 'hod'), upload.array('attachments', 5), updateContent)
  .delete(authorize('faculty', 'hod'), deleteContent);

module.exports = router;