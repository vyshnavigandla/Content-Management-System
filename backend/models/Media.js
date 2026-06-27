// models/Media.js
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'document', 'video', 'other'],
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  altText: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  },
  tags: [String],
  usedIn: [{
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    contentType: String
  }]
}, { timestamps: true });

// Indexes
mediaSchema.index({ type: 1, createdAt: -1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ tags: 1 });

module.exports = mongoose.model('Media', mediaSchema);