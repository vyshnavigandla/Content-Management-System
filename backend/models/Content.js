// models/Content.js
// One schema covers every content type in the department portal:
// notices, circulars, events, exam schedules, study material,
// placement updates, and achievements. The `type` field tells us
// which "flavor" a given document is, and `status` tracks where
// it is in the approval workflow (see Phase 5).

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

    // --- Workflow status (state machine - see Phase 5 diagram) ---
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
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Content', contentSchema);