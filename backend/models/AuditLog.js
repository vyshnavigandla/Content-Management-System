// models/AuditLog.js
// Records every important action taken on content (and later, users)
// so the HOD has a full audit trail - "who did what, and when".

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // who performed the action
    },
    action: {
      type: String,
      required: true,
      // e.g. 'CONTENT_SUBMITTED', 'CONTENT_APPROVED', 'CONTENT_REJECTED',
      //      'CONTENT_PUBLISHED', 'CONTENT_ARCHIVED'
    },
    targetType: {
      type: String,
      enum: ['content', 'user'],
      default: 'content',
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { timestamps: true } // createdAt = when the action happened
);

module.exports = mongoose.model('AuditLog', auditLogSchema);