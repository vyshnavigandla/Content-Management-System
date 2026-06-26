// models/Content.js
// FIX: viewCount, tags, isFeatured, expiresAt, scheduledPublishAt, version,
//      previousVersions were accidentally nested inside the timestamps options
//      object and were silently ignored. Moved into the main schema body.

const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Content body is required'],
    },
    type: {
      type: String,
      enum: [
        'notice',
        'circular',
        'event',
        'exam_schedule',
        'study_material',
        'placement_update',
        'achievement',
      ],
      required: true,
    },

    // Only relevant when type === 'study_material'
    subject: { type: String, trim: true },
    semester: { type: Number },

    // File paths saved by Multer (e.g. ['/uploads/notes-12345.pdf'])
    attachments: [{ type: String }],

    // --- Workflow status ---
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'published', 'rejected', 'archived'],
      default: 'draft',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewRemarks: {
      type: String,
      default: '',
    },

    downloadCount: { type: Number, default: 0 },
    publishedAt:   { type: Date,   default: null },

    // --- These were accidentally in the options object before (bug fix) ---
    viewCount:    { type: Number, default: 0 },
    lastViewedAt: { type: Date },
    commentCount: { type: Number, default: 0 },
    tags:         [{ type: String, trim: true }],
    category: {
      type: String,
      enum: ['academic', 'administrative', 'event', 'news', 'general'],
      default: 'general',
    },
    isFeatured: { type: Boolean, default: false },
    expiresAt:  { type: Date, default: null },

    // Content scheduling - processed by the scheduler job
    scheduledPublishAt: { type: Date, default: null },

    // Version tracking
    version: { type: Number, default: 1 },
    previousVersions: [
      {
        title:       String,
        body:        String,
        attachments: [String],
        updatedAt:   { type: Date, default: Date.now },
        updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  { timestamps: true }
);

contentSchema.index({ status: 1, type: 1 });
contentSchema.index({ createdBy: 1, status: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ publishedAt: -1 });
// Index used by the scheduler job
contentSchema.index({ scheduledPublishAt: 1, status: 1 });

module.exports = mongoose.model('Content', contentSchema);