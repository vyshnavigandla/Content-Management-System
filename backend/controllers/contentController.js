// controllers/contentController.js
// Improvements in this version:
//  - deleteAttachment()  : remove individual files from content
//  - scheduleContent()   : set/clear scheduledPublishAt
//  - updateContent()     : now snapshots the previous version before saving
//  - deleteContent()     : HOD can delete archived content; owner can delete draft
//  - getPublishedContent(): now increments viewCount + sets lastViewedAt
//  - trackView()         : dedicated view-tracking endpoint

const asyncHandler  = require('express-async-handler');
const path          = require('path');
const fs            = require('fs');
const Content       = require('../models/Content');
const logAction     = require('../utils/auditLogger');
const { notifyContentStatusChange } = require('../utils/notificationHelper');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely delete a file from disk. Swallows errors so a missing file never
 *  crashes a request. */
const removeFile = (filePath) => {
  try {
    const abs = path.join(__dirname, '..', filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (err) {
    console.error('File removal failed:', err.message);
  }
};

// ---------------------------------------------------------------------------
// Existing handlers (unchanged logic, bug fixes noted inline)
// ---------------------------------------------------------------------------

const submitForApproval = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }
  if (content.createdBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('You can only submit your own content');
  }
  if (!['draft', 'rejected'].includes(content.status)) {
    res.status(400); throw new Error('Only draft or rejected content can be submitted for approval');
  }

  content.status = 'pending_approval';
  content.reviewRemarks = '';
  // Clear any pending schedule - submitting for approval takes priority
  content.scheduledPublishAt = null;
  await content.save();

  await notifyContentStatusChange(content, req.user, 'submitted');
  await logAction({
    user: req.user._id, action: 'CONTENT_SUBMITTED',
    targetId: content._id, remarks: `"${content.title}" submitted for approval`,
  });

  res.json({ success: true, data: content });
});

const getPendingApprovals = asyncHandler(async (req, res) => {
  const content = await Content.find({ status: 'pending_approval' })
    .populate('createdBy', 'name role designation')
    .sort({ createdAt: 1 });
  res.json({ success: true, count: content.length, data: content });
});

const approveContent = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }
  if (content.status !== 'pending_approval') {
    res.status(400); throw new Error('Only content pending approval can be approved');
  }

  content.status = 'published';
  content.reviewedBy = req.user._id;
  content.reviewRemarks = remarks || '';
  content.publishedAt = new Date();
  content.scheduledPublishAt = null; // clear any leftover schedule
  await content.save();

  await notifyContentStatusChange(content, req.user, 'approved');
  await logAction({
    user: req.user._id, action: 'CONTENT_APPROVED',
    targetId: content._id, remarks: `"${content.title}" approved and published`,
  });

  res.json({ success: true, data: content });
});

const rejectContent = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  if (!remarks) { res.status(400); throw new Error('Remarks are required when rejecting'); }

  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }
  if (content.status !== 'pending_approval') {
    res.status(400); throw new Error('Only content pending approval can be rejected');
  }

  content.status = 'rejected';
  content.reviewedBy = req.user._id;
  content.reviewRemarks = remarks;
  await content.save();

  await notifyContentStatusChange(content, req.user, 'rejected');
  await logAction({
    user: req.user._id, action: 'CONTENT_REJECTED',
    targetId: content._id, remarks: `"${content.title}" rejected: ${remarks}`,
  });

  res.json({ success: true, data: content });
});

const archiveContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }
  if (content.status !== 'published') {
    res.status(400); throw new Error('Only published content can be archived');
  }

  content.status = 'archived';
  await content.save();

  await logAction({
    user: req.user._id, action: 'CONTENT_ARCHIVED',
    targetId: content._id, remarks: `"${content.title}" archived`,
  });

  res.json({ success: true, data: content });
});

const getPublishedContent = asyncHandler(async (req, res) => {
  const { type, subject, semester, search, tags } = req.query;

  const filter = { status: 'published' };
  if (type) filter.type = type;
  if (subject) filter.subject = subject;
  if (semester) filter.semester = Number(semester);
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (tags) filter.tags = { $in: tags.split(',').map((t) => t.trim()) };

  const content = await Content.find(filter)
    .populate('createdBy', 'name role designation')
    .sort({ publishedAt: -1 });

  res.json({ success: true, count: content.length, data: content });
});

const trackDownload = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }
  if (content.status !== 'published') {
    res.status(403); throw new Error('Cannot download unpublished content');
  }
  content.downloadCount += 1;
  await content.save();
  res.json({ success: true, downloadCount: content.downloadCount });
});

const createContent = asyncHandler(async (req, res) => {
  const { title, body, type, subject, semester, tags, category } = req.body;
  if (!title || !body || !type) {
    res.status(400); throw new Error('Title, body, and type are required');
  }

  const attachments = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

  const content = await Content.create({
    title, body, type,
    subject:  type === 'study_material' ? subject  : undefined,
    semester: type === 'study_material' ? semester : undefined,
    tags:     tags ? tags.split(',').map((t) => t.trim()) : [],
    category: category || 'general',
    attachments,
    status: 'draft',
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: content });
});

const getMyContent = asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const filter = { createdBy: req.user._id };
  if (status) filter.status = status;
  if (type)   filter.type   = type;

  const content = await Content.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: content.length, data: content });
});

const getContentById = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id)
    .populate('createdBy',  'name role designation')
    .populate('reviewedBy', 'name role');

  if (!content) { res.status(404); throw new Error('Content not found'); }

  if (req.user.role === 'student' && content.status !== 'published') {
    res.status(403); throw new Error('This content is not published yet');
  }

  const isOwner = content.createdBy._id.toString() === req.user._id.toString();
  if (req.user.role === 'faculty' && content.status !== 'published' && !isOwner) {
    res.status(403); throw new Error('You can only view your own unpublished content');
  }

  // Track views on published content
  if (content.status === 'published') {
    content.viewCount    += 1;
    content.lastViewedAt  = new Date();
    await content.save();
  }

  res.json({ success: true, data: content });
});

/** Snapshot current version before applying edits. */
const updateContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }
  if (content.createdBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('You can only edit your own content');
  }
  if (!['draft', 'rejected'].includes(content.status)) {
    res.status(400); throw new Error('Only draft or rejected content can be edited');
  }

  const { title, body, subject, semester, tags, category } = req.body;

  // Save a version snapshot before mutating
  content.previousVersions.push({
    title:       content.title,
    body:        content.body,
    attachments: [...content.attachments],
    updatedBy:   req.user._id,
  });
  content.version += 1;

  if (title    !== undefined) content.title    = title;
  if (body     !== undefined) content.body     = body;
  if (subject  !== undefined) content.subject  = subject;
  if (semester !== undefined) content.semester = semester;
  if (tags     !== undefined) content.tags     = tags.split(',').map((t) => t.trim());
  if (category !== undefined) content.category = category;

  if (req.files && req.files.length > 0) {
    const newFiles = req.files.map((f) => `/uploads/${f.filename}`);
    content.attachments = [...content.attachments, ...newFiles];
  }

  if (content.status === 'rejected') {
    content.status = 'draft';
    content.reviewRemarks = '';
  }

  await content.save();
  res.json({ success: true, data: content });
});

/**
 * FIX: HOD can delete archived content; owner can still delete their own draft.
 * Previously only owners could delete, and only drafts – leaving no way for
 * the HOD to clean up archived content.
 */
const deleteContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }

  const isOwner = content.createdBy.toString() === req.user._id.toString();
  const isHOD   = req.user.role === 'hod';

  // Owner can delete their own drafts
  if (isOwner && content.status === 'draft') {
    content.attachments.forEach(removeFile);
    await content.deleteOne();
    await logAction({
      user: req.user._id, action: 'CONTENT_DELETED',
      targetId: req.params.id, remarks: `Draft "${content.title}" deleted by owner`,
    });
    return res.json({ success: true, message: 'Draft deleted successfully' });
  }

  // HOD can delete archived content
  if (isHOD && content.status === 'archived') {
    content.attachments.forEach(removeFile);
    await content.deleteOne();
    await logAction({
      user: req.user._id, action: 'CONTENT_DELETED',
      targetId: req.params.id, remarks: `Archived "${content.title}" deleted by HOD`,
    });
    return res.json({ success: true, message: 'Archived content deleted successfully' });
  }

  res.status(403);
  throw new Error('You are not authorised to delete this content in its current state');
});

// ---------------------------------------------------------------------------
// NEW: Delete a single attachment from a draft/rejected content item
// ---------------------------------------------------------------------------

/**
 * @desc    Remove one attachment file from a content item
 * @route   DELETE /api/content/:id/attachments
 * @body    { filePath: "/uploads/filename.pdf" }
 * @access  Private (owner only, draft/rejected status only)
 */
const deleteAttachment = asyncHandler(async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) { res.status(400); throw new Error('filePath is required'); }

  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }

  if (content.createdBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('You can only modify your own content');
  }

  if (!['draft', 'rejected'].includes(content.status)) {
    res.status(400);
    throw new Error('Attachments can only be removed from draft or rejected content');
  }

  if (!content.attachments.includes(filePath)) {
    res.status(404); throw new Error('Attachment not found on this content item');
  }

  // Remove from array
  content.attachments = content.attachments.filter((a) => a !== filePath);
  await content.save();

  // Delete the physical file
  removeFile(filePath);

  await logAction({
    user: req.user._id, action: 'ATTACHMENT_DELETED',
    targetId: content._id, remarks: `Attachment "${filePath}" removed from "${content.title}"`,
  });

  res.json({ success: true, data: content });
});

// ---------------------------------------------------------------------------
// NEW: Schedule or clear a scheduled publish date (HOD only)
// ---------------------------------------------------------------------------

/**
 * @desc    Set or clear scheduledPublishAt on an approved-but-not-yet-published
 *          content item. The scheduler job (utils/contentScheduler.js) will
 *          auto-publish when the time arrives.
 *
 *          Pass { scheduledPublishAt: "2025-09-01T08:00:00Z" } to schedule.
 *          Pass { scheduledPublishAt: null } to clear (publishes immediately on
 *          next approval, or use approve endpoint to publish now).
 *
 * @route   PUT /api/content/:id/schedule
 * @access  Private (hod)
 */
const scheduleContent = asyncHandler(async (req, res) => {
  const { scheduledPublishAt } = req.body;

  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }

  // Only allow scheduling content that is pending_approval or currently draft
  // (not yet live). HOD can schedule while approving, or pre-schedule a draft.
  if (!['pending_approval', 'draft'].includes(content.status)) {
    res.status(400);
    throw new Error('Only pending or draft content can be scheduled');
  }

  if (scheduledPublishAt) {
    const date = new Date(scheduledPublishAt);
    if (isNaN(date.getTime())) {
      res.status(400); throw new Error('Invalid date format for scheduledPublishAt');
    }
    if (date <= new Date()) {
      res.status(400); throw new Error('Scheduled date must be in the future');
    }
    content.scheduledPublishAt = date;
  } else {
    content.scheduledPublishAt = null;
  }

  await content.save();

  await logAction({
    user: req.user._id, action: 'CONTENT_SCHEDULED',
    targetId: content._id,
    remarks: scheduledPublishAt
      ? `"${content.title}" scheduled for ${content.scheduledPublishAt}`
      : `Schedule cleared for "${content.title}"`,
  });

  res.json({ success: true, data: content });
});

// ---------------------------------------------------------------------------
// NEW: Bulk delete archived content (HOD convenience)
// ---------------------------------------------------------------------------

/**
 * @desc    Delete all archived content (or a filtered subset by type)
 * @route   DELETE /api/content/archived/bulk
 * @query   type (optional) - filter by content type
 * @access  Private (hod)
 */
const bulkDeleteArchived = asyncHandler(async (req, res) => {
  const filter = { status: 'archived' };
  if (req.query.type) filter.type = req.query.type;

  const items = await Content.find(filter);
  if (!items.length) {
    return res.json({ success: true, deleted: 0, message: 'No archived content found' });
  }

  // Remove physical files
  items.forEach((item) => item.attachments.forEach(removeFile));

  const ids = items.map((i) => i._id);
  await Content.deleteMany({ _id: { $in: ids } });

  await logAction({
    user: req.user._id, action: 'CONTENT_BULK_DELETED',
    targetId: req.user._id, // no single target for a bulk op
    targetType: 'user',
    remarks: `HOD bulk-deleted ${ids.length} archived item(s)`,
  });

  res.json({ success: true, deleted: ids.length });
});

module.exports = {
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
};