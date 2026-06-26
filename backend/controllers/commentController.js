// controllers/commentController.js
const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');
const Content = require('../models/Content');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get comments for content with role-based visibility
// @route   GET /api/comments/content/:contentId
const getContentComments = asyncHandler(async (req, res) => {
  const { contentId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const user = req.user;
  
  // Check if content exists and is published
  const content = await Content.findById(contentId);
  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  // For drafts/pending, only faculty/hod can see comments
  if (content.status !== 'published' && !['faculty', 'hod'].includes(user.role)) {
    res.status(403);
    throw new Error('Content not available');
  }

  // Build query - filter faculty-only comments for students
  const query = { 
    content: contentId,
    parentComment: null 
  };
  
  if (user.role === 'student') {
    query.isFacultyOnly = false;
  }

  const comments = await Comment.find(query)
    .populate('author', 'name email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  // Get replies with visibility filter
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      let repliesQuery = { parentComment: comment._id };
      if (user.role === 'student') {
        repliesQuery.isFacultyOnly = false;
      }
      
      const replies = await Comment.find(repliesQuery)
        .populate('author', 'name email role')
        .sort({ createdAt: 1 });
      
      return {
        ...comment.toObject(),
        replies,
        replyCount: replies.length,
        likeCount: comment.likes.length,
        canModerate: ['faculty', 'hod'].includes(user.role) || 
                     comment.author._id.toString() === user._id.toString()
      };
    })
  );
  
  const total = await Comment.countDocuments(query);
  
  res.json({
    success: true,
    data: {
      comments: commentsWithReplies,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      userRole: user.role
    }
  });
});

// @desc    Add comment with type and visibility
// @route   POST /api/comments
const addComment = asyncHandler(async (req, res) => {
  const { 
    contentId, 
    text, 
    parentCommentId = null,
    type = 'question',
    isFacultyOnly = false,
    isResolved = false
  } = req.body;
  
  if (!contentId || !text) {
    res.status(400);
    throw new Error('Content ID and text are required');
  }

  // Check if user has permission to post faculty-only comments
  if (isFacultyOnly && !['faculty', 'hod'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Only faculty can post faculty-only comments');
  }

  // Verify content exists and is published (or user is faculty)
  const content = await Content.findById(contentId);
  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  // Students can only comment on published content
  if (req.user.role === 'student' && content.status !== 'published') {
    res.status(403);
    throw new Error('Cannot comment on unpublished content');
  }

  // Create comment
  const comment = await Comment.create({
    content: contentId,
    author: req.user._id,
    text,
    parentComment: parentCommentId || null,
    type,
    isFacultyOnly,
    isResolved: isResolved && ['faculty', 'hod'].includes(req.user.role)
  });

  // If reply, add to parent's replies array
  if (parentCommentId) {
    await Comment.findByIdAndUpdate(parentCommentId, {
      $push: { replies: comment._id }
    });
    
    // If student replies, it's a follow-up question
    if (req.user.role === 'student') {
      comment.type = 'clarification';
      await comment.save();
    }
  }

  await comment.populate('author', 'name email role');

  // Notify content author about new comment
  if (content.createdBy.toString() !== req.user._id.toString()) {
    const notificationType = req.user.role === 'student' ? 'question' : 'response';
    await createNotification({
      recipient: content.createdBy,
      sender: req.user._id,
      type: 'comment_added',
      title: `New ${notificationType} on "${content.title}"`,
      message: `${req.user.name} ${notificationType === 'question' ? 'asked a question' : 'responded'} on "${content.title}"`,
      link: `/content/${content._id}`,
      metadata: { 
        contentId: content._id, 
        commentId: comment._id,
        commentType: type
      }
    });
  }

  res.status(201).json({ 
    success: true, 
    data: comment,
    message: 'Comment added successfully'
  });
});

// @desc    Mark a question as resolved (faculty/HOD only)
// @route   PUT /api/comments/:id/resolve
const resolveComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Only faculty/HOD can mark as resolved
  if (!['faculty', 'hod'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Only faculty can mark questions as resolved');
  }

  comment.isResolved = !comment.isResolved;
  await comment.save();

  // Notify the student who asked the question
  await createNotification({
    recipient: comment.author,
    sender: req.user._id,
    type: 'system',
    title: comment.isResolved ? 'Question Resolved ✅' : 'Question Reopened 🔄',
    message: `Your question "${comment.text.substring(0, 50)}..." has been ${comment.isResolved ? 'marked as resolved' : 'reopened'}`,
    link: `/content/${comment.content}`,
    metadata: { commentId: comment._id }
  });

  res.json({
    success: true,
    data: comment,
    message: comment.isResolved ? 'Question marked as resolved' : 'Question reopened'
  });
});

module.exports = { 
  getContentComments, 
  addComment, 
  deleteComment: asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    // Allow deletion by: author, content owner, or HOD
    const content = await Content.findById(comment.content);
    if (comment.author.toString() !== req.user._id.toString() && 
        content.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'hod') {
      res.status(403);
      throw new Error('Not authorized to delete this comment');
    }

    // Delete all replies
    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();

    res.json({ success: true, message: 'Comment deleted' });
  }),
  resolveComment
};