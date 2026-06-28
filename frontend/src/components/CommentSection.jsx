// components/CommentSection.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  ChatBubbleLeftIcon, 
  PaperAirplaneIcon, 
  UserCircleIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const COMMENT_TYPES = [
  { value: 'question', label: 'Question', icon: QuestionMarkCircleIcon },
  { value: 'feedback', label: 'Feedback', icon: LightBulbIcon },
  { value: 'suggestion', label: 'Suggestion', icon: ExclamationTriangleIcon },
];

export default function CommentSection({ contentId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('question');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [contentId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/content/${contentId}/comments`);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/content/${contentId}/comments`, {
        text: newComment,
        type: commentType,
      });
      setComments([res.data.data, ...comments]);
      setNewComment('');
      setCommentType('question');
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Get submit button text based on type
  const getSubmitButtonText = () => {
    switch (commentType) {
      case 'question':
        return 'Ask Question';
      case 'feedback':
        return 'Submit Feedback';
      case 'suggestion':
        return 'Submit Suggestion';
      default:
        return 'Post';
    }
  };

  // Get placeholder text based on type
  const getPlaceholderText = () => {
    switch (commentType) {
      case 'question':
        return 'Ask a question about this content...';
      case 'feedback':
        return 'Share your feedback about this content...';
      case 'suggestion':
        return 'Suggest an improvement...';
      default:
        return 'Write a comment...';
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'question':
        return 'bg-blue-100 text-blue-700';
      case 'feedback':
        return 'bg-green-100 text-green-700';
      case 'suggestion':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <ChatBubbleLeftIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Discussion</h3>
          <p className="text-sm text-gray-500">Ask questions about this content</p>
        </div>
      </div>

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="space-y-3">
            {/* Type Selector */}
            <div className="flex gap-2">
              {COMMENT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setCommentType(type.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      commentType === type.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {type.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder={getPlaceholderText()}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                {submitting ? 'Posting...' : getSubmitButtonText()}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No discussions yet</p>
            <p className="text-sm text-gray-400">Be the first to ask a question</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {comment.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {comment.user?.name || 'Anonymous'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(comment.type)}`}>
                      {comment.type || 'comment'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}