// controllers/contentController.js
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Content = require('../models/Content');
const logAction = require('../utils/auditLogger');
const { notifyContentStatusChange } = require('../utils/notificationHelper');

const removeFile = (filePath) => {
  try {
    const abs = path.join(__dirname, '..', filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (err) {
    console.error('File removal failed:', err.message);
  }
};

const generateSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const calculateReadingTime = (text) => {
  if (!text) return 0;
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

const getAttachmentsFromReq = (req) => {
  if (!req.files) return [];
  if (!Array.isArray(req.files)) {
    return (req.files['attachments'] || []).map((f) => `/uploads/${f.filename}`);
  }
  return req.files
    .filter((f) => f.fieldname !== 'featuredImage')
    .map((f) => `/uploads/${f.filename}`);
};

const getFeaturedImageFromReq = (req) => {
  if (!req.files) return null;
  if (!Array.isArray(req.files)) {
    const arr = req.files['featuredImage'];
    return arr && arr.length > 0 ? `/uploads/${arr[0].filename}` : null;
  }
  const f = req.files.find((f) => f.fieldname === 'featuredImage');
  return f ? `/uploads/${f.filename}` : null;
};

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
  content.scheduledPublishAt = null;
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
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      res.status(404);
      throw new Error('Content not found');
    }
    
    if (content.status !== 'published') {
      res.status(403);
      throw new Error('Cannot download unpublished content');
    }
    
    content.downloadCount += 1;
    await content.save();
    
    res.json({ 
      success: true, 
      downloadCount: content.downloadCount 
    });
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to track download'
    });
  }
});

const createContent = asyncHandler(async (req, res) => {
  const {
    title, body, type, subject, semester, tags, category,
    excerpt, metaTitle, metaDescription, metaKeywords, slug,
  } = req.body;

  if (!title || !body || !type) {
    res.status(400); throw new Error('Title, body, and type are required');
  }

  const attachments = getAttachmentsFromReq(req);
  const featuredImagePath = getFeaturedImageFromReq(req);
  const finalSlug = slug || generateSlug(title);
  const readingTime = calculateReadingTime(body);

  const seoData = {
    metaTitle: metaTitle || title,
    metaDescription: metaDescription || '',
    metaKeywords: metaKeywords
      ? metaKeywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [],
    slug: finalSlug,
  };

  const content = await Content.create({
    title, body, type,
    subject: type === 'study_material' ? subject : undefined,
    semester: type === 'study_material' ? semester : undefined,
    tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    category: category || 'general',
    attachments,
    featuredImage: featuredImagePath || '',
    excerpt: excerpt || '',
    seo: seoData,
    readingTime,
    status: 'draft',
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: content });
});

const getMyContent = asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const filter = { createdBy: req.user._id };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const content = await Content.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: content.length, data: content });
});

const getContentById = asyncHandler(async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('createdBy', 'name role designation')
      .populate('reviewedBy', 'name role');

    if (!content) {
      res.status(404);
      throw new Error('Content not found');
    }

    if (req.user.role === 'student' && content.status !== 'published') {
      res.status(403);
      throw new Error('This content is not published yet');
    }

    const isOwner = content.createdBy?._id?.toString() === req.user._id.toString();
    if (req.user.role === 'faculty' && content.status !== 'published' && !isOwner) {
      res.status(403);
      throw new Error('You can only view your own unpublished content');
    }

    if (content.status === 'published') {
      content.viewCount += 1;
      content.lastViewedAt = new Date();
      await content.save();
    }

    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch content'
    });
  }
});

const updateContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }
  if (content.createdBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('You can only edit your own content');
  }
  if (!['draft', 'rejected'].includes(content.status)) {
    res.status(400); throw new Error('Only draft or rejected content can be edited');
  }

  const {
    title, body, subject, semester, tags, category,
    excerpt, metaTitle, metaDescription, metaKeywords, slug,
  } = req.body;

  content.previousVersions.push({
    title: content.title,
    body: content.body,
    attachments: [...content.attachments],
    excerpt: content.excerpt || '',
    featuredImage: content.featuredImage || '',
    updatedBy: req.user._id,
  });
  content.version += 1;

  if (title !== undefined) content.title = title;
  if (body !== undefined) {
    content.body = body;
    content.readingTime = calculateReadingTime(body);
  }
  if (subject !== undefined) content.subject = subject;
  if (semester !== undefined) content.semester = semester;
  if (tags !== undefined) content.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
  if (category !== undefined) content.category = category;
  if (excerpt !== undefined) content.excerpt = excerpt;

  if (!content.seo) content.seo = {};
  if (metaTitle !== undefined) content.seo.metaTitle = metaTitle;
  if (metaDescription !== undefined) content.seo.metaDescription = metaDescription;
  if (metaKeywords !== undefined) {
    content.seo.metaKeywords = metaKeywords.split(',').map((k) => k.trim()).filter(Boolean);
  }
  if (slug !== undefined) content.seo.slug = slug || generateSlug(content.title);

  const newAttachments = getAttachmentsFromReq(req);
  if (newAttachments.length > 0) {
    content.attachments = [...content.attachments, ...newAttachments];
  }

  const newFeaturedImage = getFeaturedImageFromReq(req);
  if (newFeaturedImage) {
    if (content.featuredImage) removeFile(content.featuredImage);
    content.featuredImage = newFeaturedImage;
  }

  if (content.status === 'rejected') {
    content.status = 'draft';
    content.reviewRemarks = '';
  }

  await content.save();
  res.json({ success: true, data: content });
});

const deleteContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }

  const isOwner = content.createdBy.toString() === req.user._id.toString();
  const isHOD = req.user.role === 'hod';

  if (isOwner && ['draft', 'rejected'].includes(content.status)) {
    content.attachments.forEach(removeFile);
    if (content.featuredImage) removeFile(content.featuredImage);
    await content.deleteOne();
    await logAction({
      user: req.user._id, action: 'CONTENT_DELETED',
      targetId: req.params.id,
      remarks: `Draft "${content.title}" deleted by owner`,
    });
    return res.json({ success: true, message: 'Content deleted successfully' });
  }

  if (isHOD && content.status === 'archived') {
    content.attachments.forEach(removeFile);
    if (content.featuredImage) removeFile(content.featuredImage);
    await content.deleteOne();
    await logAction({
      user: req.user._id, action: 'CONTENT_DELETED',
      targetId: req.params.id,
      remarks: `Archived "${content.title}" deleted by HOD`,
    });
    return res.json({ success: true, message: 'Archived content deleted successfully' });
  }

  if (isHOD && content.status === 'published') {
    const confirmDelete = req.query.confirm === 'true';
    if (!confirmDelete) {
      res.status(400);
      throw new Error('To delete published content, add ?confirm=true to the URL');
    }
    content.attachments.forEach(removeFile);
    if (content.featuredImage) removeFile(content.featuredImage);
    await content.deleteOne();
    await logAction({
      user: req.user._id, action: 'PUBLISHED_CONTENT_DELETED',
      targetId: req.params.id,
      remarks: `Published "${content.title}" deleted by HOD`,
    });
    return res.json({ success: true, message: 'Published content deleted successfully' });
  }

  res.status(403);
  throw new Error('You are not authorized to delete this content in its current state');
});

const deleteAttachment = asyncHandler(async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) { res.status(400); throw new Error('filePath is required'); }

  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }

  if (content.createdBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('You can only modify your own content');
  }
  if (!['draft', 'rejected'].includes(content.status)) {
    res.status(400); throw new Error('Attachments can only be removed from draft or rejected content');
  }
  if (!content.attachments.includes(filePath)) {
    res.status(404); throw new Error('Attachment not found on this content item');
  }

  content.attachments = content.attachments.filter((a) => a !== filePath);
  await content.save();
  removeFile(filePath);

  await logAction({
    user: req.user._id, action: 'ATTACHMENT_DELETED',
    targetId: content._id,
    remarks: `Attachment "${filePath}" removed from "${content.title}"`,
  });

  res.json({ success: true, data: content });
});

const scheduleContent = asyncHandler(async (req, res) => {
  const { scheduledPublishAt } = req.body;

  const content = await Content.findById(req.params.id);
  if (!content) { res.status(404); throw new Error('Content not found'); }

  if (!['pending_approval', 'draft'].includes(content.status)) {
    res.status(400); throw new Error('Only pending or draft content can be scheduled');
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

const bulkDeleteArchived = asyncHandler(async (req, res) => {
  const filter = { status: 'archived' };
  if (req.query.type) filter.type = req.query.type;

  const items = await Content.find(filter);
  if (!items.length) {
    return res.json({ success: true, deleted: 0, message: 'No archived content found' });
  }

  items.forEach((item) => {
    item.attachments.forEach(removeFile);
    if (item.featuredImage) removeFile(item.featuredImage);
  });

  const ids = items.map((i) => i._id);
  await Content.deleteMany({ _id: { $in: ids } });

  await logAction({
    user: req.user._id, action: 'CONTENT_BULK_DELETED',
    targetId: req.user._id, targetType: 'user',
    remarks: `HOD bulk-deleted ${ids.length} archived item(s)`,
  });

  res.json({ success: true, deleted: ids.length });
});

const getContentBySlug = asyncHandler(async (req, res) => {
  try {
    const { slug } = req.params;
    const content = await Content.findOne({ 'seo.slug': slug })
      .populate('createdBy', 'name role designation')
      .populate('reviewedBy', 'name role');

    if (!content) {
      res.status(404);
      throw new Error('Content not found');
    }

    if (req.user.role === 'student' && content.status !== 'published') {
      res.status(403);
      throw new Error('This content is not published yet');
    }

    const isOwner = content.createdBy?._id?.toString() === req.user._id.toString();
    if (req.user.role === 'faculty' && content.status !== 'published' && !isOwner) {
      res.status(403);
      throw new Error('You can only view your own unpublished content');
    }

    if (content.status === 'published') {
      content.viewCount += 1;
      content.lastViewedAt = new Date();
      await content.save();
    }

    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content by slug:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch content'
    });
  }
});

const getPublicContentBySlug = asyncHandler(async (req, res) => {
  try {
    const { slug } = req.params;
    const content = await Content.findOne({ 'seo.slug': slug, status: 'published' })
      .populate('createdBy', 'name role designation')
      .populate('reviewedBy', 'name role');

    if (!content) {
      res.status(404);
      throw new Error('Content not found');
    }

    content.viewCount += 1;
    content.lastViewedAt = new Date();
    await content.save();

    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching public content:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch content'
    });
  }
});

// COMMENT CONTROLLERS
const getComments = asyncHandler(async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate({
        path: 'comments.user',
        select: 'name email role designation'
      });

    if (!content) {
      res.status(404);
      throw new Error('Content not found');
    }

    const comments = content.comments.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch comments'
    });
  }
});

const addComment = asyncHandler(async (req, res) => {
  try {
    const { text, type } = req.body;

    if (!text) {
      res.status(400);
      throw new Error('Comment text is required');
    }

    const content = await Content.findById(req.params.id);
    if (!content) {
      res.status(404);
      throw new Error('Content not found');
    }

    if (content.status !== 'published') {
      res.status(403);
      throw new Error('Comments can only be added to published content');
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      type: type || 'comment',
      createdAt: new Date()
    };

    content.comments.push(comment);
    content.commentCount = content.comments.length;
    await content.save();

    await content.populate({
      path: 'comments.user',
      select: 'name email role designation'
    });

    const newComment = content.comments[content.comments.length - 1];

    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add comment'
    });
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;

    const content = await Content.findOne({ 'comments._id': commentId });

    if (!content) {
      res.status(404);
      throw new Error('Comment not found');
    }

    const comment = content.comments.id(commentId);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isHOD = req.user.role === 'hod';

    if (!isOwner && !isAdmin && !isHOD) {
      res.status(403);
      throw new Error('Not authorized to delete this comment');
    }

    content.comments.pull(commentId);
    content.commentCount = content.comments.length;
    await content.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete comment'
    });
  }
});

module.exports = {
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
};