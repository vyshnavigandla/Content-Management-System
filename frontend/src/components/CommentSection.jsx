// components/CommentSection.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { 
  ChatBubbleLeftIcon, 
  TrashIcon, 
  ArrowPathIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

export default function CommentSection({ contentId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('question');
  const [isFacultyOnly, setIsFacultyOnly] = useState(false);
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');

  const isFaculty = user?.role === 'faculty' || user?.role === 'hod';

  useEffect(() => {
    fetchComments();
    
    if (window.socket) {
      const handleNewComment = (comment) => {
        if (comment.content === contentId) {
          setComments(prev => [comment, ...prev]);
        }
      };
      
      window.socket.on('new_comment', handleNewComment);
      return () => window.socket.off('new_comment', handleNewComment);
    }
  }, [contentId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/comments/content/${contentId}`);
      setComments(res.data.data.comments || []);
      setUserRole(res.data.data.userRole);
      setError('');
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e, parentId = null) => {
    e.preventDefault();
    const text = parentId ? replyText[parentId] : newComment;
    
    if (!text || !text.trim()) {
      setError('Please enter a comment');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/comments', {
        contentId,
        text: text.trim(),
        parentCommentId: parentId || null,
        type: parentId ? 'clarification' : commentType,
        isFacultyOnly: isFacultyOnly && !parentId && isFaculty
      });

      if (parentId) {
        setComments(prev => prev.map(comment => {
          if (comment._id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), res.data.data],
              replyCount: (comment.replyCount || 0) + 1
            };
          }
          return comment;
        }));
        setReplyText(prev => ({ ...prev, [parentId]: '' }));
        setReplyingTo(null);
      } else {
        setComments(prev => [res.data.data, ...prev]);
        setNewComment('');
        setCommentType('question');
        setIsFacultyOnly(false);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      setError(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveQuestion = async (commentId) => {
    try {
      const res = await api.put(`/comments/${commentId}/resolve`);
      setComments(prev => prev.map(c => 
        c._id === commentId ? { ...c, isResolved: res.data.data.isResolved } : c
      ));
    } catch (error) {
      console.error('Failed to resolve question:', error);
      setError('Failed to update question status');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setError('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-2 text-gray-500">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          <span>Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ChatBubbleLeftIcon className="h-5 w-5" />
            Discussion ({comments.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {userRole === 'student' ? 'Ask questions about this content' : 'Answer student questions and clarify doubts'}
          </p>
        </div>
        <button
          onClick={fetchComments}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* New Comment Form */}
      {user && (
        <form onSubmit={(e) => handleSubmitComment(e)} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <UserCircleIcon className="h-10 w-10 text-gray-400" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isFaculty ? "Reply to student questions or clarify doubts..." : "Ask a question about this content..."}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
                rows="2"
                maxLength="2000"
                disabled={submitting}
              />
              
              {/* Comment Options */}
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {!replyingTo && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Type:</label>
                      <select
                        value={commentType}
                        onChange={(e) => setCommentType(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        disabled={submitting}
                      >
                        <option value="question">Question</option>
                        <option value="feedback">Feedback</option>
                        <option value="clarification">Clarification</option>
                      </select>
                    </div>

                    {isFaculty && (
                      <label className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFacultyOnly}
                          onChange={(e) => setIsFacultyOnly(e.target.checked)}
                          className="rounded"
                          disabled={submitting}
                        />
                        <LockClosedIcon className="h-3 w-3" />
                        Faculty Only
                      </label>
                    )}
                  </>
                )}

                <div className="flex-1"></div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4" />
                      {isFaculty ? 'Reply' : 'Ask Question'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <ChatBubbleLeftIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">No discussion yet</p>
          <p className="text-sm">
            {userRole === 'student' 
              ? 'Ask a question about this content' 
              : 'Students will post their questions here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              user={user}
              isFaculty={isFaculty}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleSubmitComment={handleSubmitComment}
              handleDeleteComment={handleDeleteComment}
              handleResolveQuestion={handleResolveQuestion}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Separate component for each comment with enhanced features
function CommentItem({ 
  comment, 
  user, 
  isFaculty,
  replyingTo, 
  setReplyingTo,
  replyText,
  setReplyText,
  handleSubmitComment,
  handleDeleteComment,
  handleResolveQuestion,
  submitting
}) {
  const [showReplies, setShowReplies] = useState(true);
  
  // Don't show faculty-only comments to students
  if (comment.isFacultyOnly && user?.role === 'student') {
    return null;
  }

  const canDelete = user && (
    comment.author._id === user._id || 
    user.role === 'hod' ||
    (isFaculty && comment.author.role === 'student')
  );

  const canResolve = isFaculty && comment.type === 'question';

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border ${comment.isResolved ? 'border-green-200 bg-green-50/50' : 'border-gray-100'} hover:shadow-md transition-shadow`}>
      {/* Comment Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <UserCircleIcon className={`h-10 w-10 ${comment.author.role === 'faculty' ? 'text-blue-400' : 'text-gray-400'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-gray-900">{comment.author.name}</span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              comment.author.role === 'faculty' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {comment.author.role}
            </span>
            {comment.type && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                comment.type === 'question' ? 'bg-yellow-100 text-yellow-700' :
                comment.type === 'feedback' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {comment.type}
              </span>
            )}
            {comment.isFacultyOnly && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                <LockClosedIcon className="h-3 w-3" />
                Faculty Only
              </span>
            )}
            {comment.isResolved && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                <CheckCircleSolidIcon className="h-3 w-3" />
                Resolved
              </span>
            )}
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {canResolve && (
            <button
              onClick={() => handleResolveQuestion(comment._id)}
              className={`p-1 rounded transition-colors ${
                comment.isResolved 
                  ? 'text-green-600 hover:bg-green-100' 
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={comment.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
            >
              {comment.isResolved ? (
                <CheckCircleSolidIcon className="h-5 w-5" />
              ) : (
                <CheckCircleIcon className="h-5 w-5" />
              )}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeleteComment(comment._id)}
              className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
              title="Delete comment"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Comment Actions */}
      <div className="mt-2 flex items-center gap-4 ml-12">
        {user && (
          <button
            onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
          >
            <ChatBubbleLeftIcon className="h-4 w-4" />
            {isFaculty ? 'Reply (Faculty)' : 'Reply'}
            {comment.replyCount > 0 && ` (${comment.replyCount})`}
          </button>
        )}
        
        {comment.replyCount > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            {showReplies ? 'Hide' : 'Show'} replies
          </button>
        )}
      </div>

      {/* Reply Form */}
      {replyingTo === comment._id && user && (
        <form onSubmit={(e) => handleSubmitComment(e, comment._id)} className="mt-3 ml-12">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <textarea
                value={replyText[comment._id] || ''}
                onChange={(e) => setReplyText(prev => ({ ...prev, [comment._id]: e.target.value }))}
                placeholder={isFaculty ? "Reply to this question (students won't see faculty-only replies)" : "Follow-up question or clarification..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm transition-shadow"
                rows="2"
                maxLength="2000"
                disabled={submitting}
              />
              <div className="flex justify-end mt-1">
                <button
                  type="submit"
                  disabled={!replyText[comment._id]?.trim() || submitting}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1"
                >
                  {submitting ? (
                    <ArrowPathIcon className="h-3 w-3 animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="h-3 w-3" />
                  )}
                  {isFaculty ? 'Reply (Faculty)' : 'Reply'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && showReplies && (
        <div className="mt-3 ml-12 border-l-2 border-gray-200 pl-4 space-y-3">
          {comment.replies.map((reply) => {
            // Hide faculty-only replies from students
            if (reply.isFacultyOnly && user?.role === 'student') return null;

            const canDeleteReply = user && (
              reply.author._id === user._id || 
              user.role === 'hod' ||
              (isFaculty && reply.author.role === 'student')
            );

            return (
              <div key={reply._id} className={`bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors ${reply.isFacultyOnly ? 'border-l-2 border-red-300' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className={`h-8 w-8 ${reply.author.role === 'faculty' ? 'text-blue-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">{reply.author.name}</span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        reply.author.role === 'faculty' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {reply.author.role}
                      </span>
                      {reply.isFacultyOnly && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                          <LockClosedIcon className="h-3 w-3" />
                          Faculty Only
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.text}</p>
                  </div>
                  
                  {canDeleteReply && (
                    <button
                      onClick={() => handleDeleteComment(reply._id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                      title="Delete reply"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}