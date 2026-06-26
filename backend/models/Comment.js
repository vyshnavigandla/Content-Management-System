// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: 2000
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  // Track if this is a doubt/question or answer
  type: {
    type: String,
    enum: ['question', 'answer', 'clarification', 'feedback'],
    default: 'question'
  },
  // For tracking if the question was resolved
  isResolved: {
    type: Boolean,
    default: false
  },
  // For faculty-only visibility
  isFacultyOnly: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date
}, { timestamps: true });

// Indexes
commentSchema.index({ content: 1, createdAt: -1 });
commentSchema.index({ content: 1, type: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ isResolved: 1 });

// Virtual for number of replies
commentSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

// Method to check if user can see this comment
commentSchema.methods.isVisibleToUser = function(user) {
  if (!this.isFacultyOnly) return true;
  return user && (user.role === 'faculty' || user.role === 'hod');
};

module.exports = mongoose.model('Comment', commentSchema);