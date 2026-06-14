// controllers/contentController.js
// Phase 4 covers: create draft, list my content, get one, update draft,
// delete draft. The "submit for approval" / "approve" / "reject" /
// "publish" actions are added in Phase 5.

const asyncHandler = require('express-async-handler');
const Content = require('../models/Content');
// --- Add this import at the top of contentController.js ---
const logAction = require('../utils/auditLogger');


// @desc    Faculty submits a draft for HOD approval
// @route   PUT /api/content/:id/submit
// @access  Private (faculty, hod - owner only)
const submitForApproval = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);

  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  if (content.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only submit your own content');
  }

  if (!['draft', 'rejected'].includes(content.status)) {
    res.status(400);
    throw new Error('Only draft or rejected content can be submitted for approval');
  }

  content.status = 'pending_approval';
  content.reviewRemarks = ''; // clear any previous rejection remarks
  await content.save();

  await logAction({
    user: req.user._id,
    action: 'CONTENT_SUBMITTED',
    targetId: content._id,
    remarks: `"${content.title}" submitted for approval`,
  });

  res.json({ success: true, data: content });
});


// @desc    Get all content waiting for HOD approval
// @route   GET /api/content/pending
// @access  Private (hod)
const getPendingApprovals = asyncHandler(async (req, res) => {
  const content = await Content.find({ status: 'pending_approval' })
    .populate('createdBy', 'name role designation')
    .sort({ createdAt: 1 }); // oldest first - first in, first reviewed

  res.json({ success: true, count: content.length, data: content });
});


// @desc    HOD approves content -> it becomes published immediately
// @route   PUT /api/content/:id/approve
// @access  Private (hod)
const approveContent = asyncHandler(async (req, res) => {
  const { remarks } = req.body;

  const content = await Content.findById(req.params.id);

  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  if (content.status !== 'pending_approval') {
    res.status(400);
    throw new Error('Only content that is pending approval can be approved');
  }

  content.status = 'published';
  content.reviewedBy = req.user._id;
  content.reviewRemarks = remarks || '';
  content.publishedAt = new Date();
  await content.save();

  await logAction({
    user: req.user._id,
    action: 'CONTENT_APPROVED',
    targetId: content._id,
    remarks: `"${content.title}" approved and published`,
  });

  res.json({ success: true, data: content });
});


// @desc    HOD rejects content -> sent back to the author with remarks
// @route   PUT /api/content/:id/reject
// @access  Private (hod)
const rejectContent = asyncHandler(async (req, res) => {
  const { remarks } = req.body;

  if (!remarks) {
    res.status(400);
    throw new Error('Remarks are required when rejecting content');
  }

  const content = await Content.findById(req.params.id);

  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  if (content.status !== 'pending_approval') {
    res.status(400);
    throw new Error('Only content that is pending approval can be rejected');
  }

  content.status = 'rejected';
  content.reviewedBy = req.user._id;
  content.reviewRemarks = remarks;
  await content.save();

  await logAction({
    user: req.user._id,
    action: 'CONTENT_REJECTED',
    targetId: content._id,
    remarks: `"${content.title}" rejected: ${remarks}`,
  });

  res.json({ success: true, data: content });
});


// @desc    HOD archives published content (removes it from student view
//          but keeps it for record-keeping)
// @route   PUT /api/content/:id/archive
// @access  Private (hod)
const archiveContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);

  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  if (content.status !== 'published') {
    res.status(400);
    throw new Error('Only published content can be archived');
  }

  content.status = 'archived';
  await content.save();

  await logAction({
    user: req.user._id,
    action: 'CONTENT_ARCHIVED',
    targetId: content._id,
    remarks: `"${content.title}" archived`,
  });

  res.json({ success: true, data: content });
});


// @desc    Get all published content (for Students - with search/filter)
// @route   GET /api/content/published
// @access  Private (any logged-in user)
const getPublishedContent = asyncHandler(async (req, res) => {
  const { type, subject, semester, search } = req.query;

  const filter = { status: 'published' };
  if (type) filter.type = type;
  if (subject) filter.subject = subject;
  if (semester) filter.semester = semester;
  if (search) {
    // Case-insensitive search on title (basic full-text style search)
    filter.title = { $regex: search, $options: 'i' };
  }

  const content = await Content.find(filter)
    .populate('createdBy', 'name role designation')
    .sort({ publishedAt: -1 }); // most recently published first

  res.json({ success: true, count: content.length, data: content });
});

// @desc    Increment download count and return the file path
//          (called when a student/faculty clicks an attachment link)
// @route   PUT /api/content/:id/download
// @access  Private (any logged-in user)
const trackDownload = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);

  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  // Only published content's downloads should be tracked
  if (content.status !== 'published') {
    res.status(403);
    throw new Error('Cannot download unpublished content');
  }

  content.downloadCount += 1;
  await content.save();

  res.json({ success: true, downloadCount: content.downloadCount });
});
// --- Update module.exports at the bottom of the file to include the new functions ---

// @desc    Create a new content item as a DRAFT
// @route   POST /api/content
// @access  Private (faculty, hod)
const createContent = asyncHandler(async (req, res) => {
  const { title, body, type, subject, semester } = req.body;

  if (!title || !body || !type) {
    res.status(400);
    throw new Error('Title, body, and type are required');
  }

  // req.files is populated by Multer (see routes - upload.array('attachments'))
  const attachments = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

  const content = await Content.create({
    title,
    body,
    type,
    subject: type === 'study_material' ? subject : undefined,
    semester: type === 'study_material' ? semester : undefined,
    attachments,
    status: 'draft', // every new item starts as a draft
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: content });
});

// @desc    Get content created by the logged-in user (their drafts + submissions)
// @route   GET /api/content/mine
// @access  Private (faculty, hod)
const getMyContent = asyncHandler(async (req, res) => {
  const { status, type } = req.query;

  const filter = { createdBy: req.user._id };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const content = await Content.find(filter).sort({ createdAt: -1 });

  res.json({ success: true, count: content.length, data: content });
});

// @desc    Get a single content item by ID
// @route   GET /api/content/:id
// @access  Private
const getContentById = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id)
    .populate('createdBy', 'name role designation')
    .populate('reviewedBy', 'name role');

  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  // Students can only view PUBLISHED content
  if (req.user.role === 'student' && content.status !== 'published') {
    res.status(403);
    throw new Error('This content is not published yet');
  }

  // Faculty can only view their OWN drafts/rejected items (but can view
  // anything published). HOD can view everything.
  const isOwner = content.createdBy._id.toString() === req.user._id.toString();
  if (
    req.user.role === 'faculty' &&
    content.status !== 'published' &&
    !isOwner
  ) {
    res.status(403);
    throw new Error('You can only view your own unpublished content');
  }

  res.json({ success: true, data: content });
});

// @desc    Update a content item (only allowed while in 'draft' or 'rejected' status)
// @route   PUT /api/content/:id
// @access  Private (owner only)
const updateContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);

  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  // Only the creator can edit their own content
  if (content.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only edit your own content');
  }

  // Once submitted/published, content is locked from direct edits
  if (!['draft', 'rejected'].includes(content.status)) {
    res.status(400);
    throw new Error('Only draft or rejected content can be edited');
  }

  const { title, body, subject, semester } = req.body;

  if (title) content.title = title;
  if (body) content.body = body;
  if (subject !== undefined) content.subject = subject;
  if (semester !== undefined) content.semester = semester;

  // If new files were uploaded, ADD them to the existing attachments
  if (req.files && req.files.length > 0) {
    const newFiles = req.files.map((file) => `/uploads/${file.filename}`);
    content.attachments = [...content.attachments, ...newFiles];
  }

  // Editing a rejected item moves it back to draft so it can be resubmitted
  if (content.status === 'rejected') {
    content.status = 'draft';
    content.reviewRemarks = '';
  }

  await content.save();

  res.json({ success: true, data: content });
});

// @desc    Delete a content item (only allowed while still a 'draft')
// @route   DELETE /api/content/:id
// @access  Private (owner only)
const deleteContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);

  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  if (content.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only delete your own content');
  }

  if (content.status !== 'draft') {
    res.status(400);
    throw new Error('Only draft content can be deleted');
  }

  await content.deleteOne();

  res.json({ success: true, message: 'Draft deleted successfully' });
});
module.exports = {
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
};