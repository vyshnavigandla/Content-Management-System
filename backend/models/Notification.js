// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['content_submitted', 'content_approved', 'content_rejected', 
           'content_published', 'comment_added', 'mention', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: '#'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);