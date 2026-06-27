// controllers/mediaController.js
const asyncHandler = require('express-async-handler');
const Media = require('../models/Media');
const fs = require('fs');
const path = require('path');

// @desc    Upload media
// @route   POST /api/media
// @access  Private
const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const file = req.file;
  const mimeType = file.mimetype;
  
  let type = 'other';
  if (mimeType.startsWith('image/')) type = 'image';
  else if (mimeType.startsWith('video/')) type = 'video';
  else if (mimeType.startsWith('application/')) type = 'document';

  const media = await Media.create({
    filename: file.filename,
    originalName: file.originalname,
    path: `/uploads/${file.filename}`,
    mimeType: file.mimetype,
    size: file.size,
    type,
    uploadedBy: req.user._id
  });

  res.status(201).json({ success: true, data: media });
});

// @desc    Get all media
// @route   GET /api/media
// @access  Private
const getMedia = asyncHandler(async (req, res) => {
  const { type, search, limit = 50 } = req.query;
  
  const filter = {};
  if (type) filter.type = type;
  if (search) {
    filter.$or = [
      { originalName: { $regex: search, $options: 'i' } },
      { tags: { $in: [search] } }
    ];
  }

  const media = await Media.find(filter)
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({ success: true, data: media });
});

// @desc    Delete media
// @route   DELETE /api/media/:id
// @access  Private
const deleteMedia = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);
  
  if (!media) {
    res.status(404);
    throw new Error('Media not found');
  }

  // Check if user is owner or admin
  if (media.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'hod') {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Delete physical file
  const filePath = path.join(__dirname, '..', media.path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await media.deleteOne();

  res.json({ success: true, message: 'Media deleted' });
});

module.exports = { uploadMedia, getMedia, deleteMedia };