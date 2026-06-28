// pages/ApprovalQueue.jsx
// HOD-only page - lists all content with status 'pending_approval',
// with inline approve/reject actions and content preview.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import DOMPurify from 'dompurify';

export default function ApprovalQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);
  const [remarksMap, setRemarksMap] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/content/pending');
      setItems(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    setActingId(id);
    try {
      await api.put(`/content/${id}/approve`, { remarks: remarksMap[id] || '' });
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id) => {
    const remarks = remarksMap[id];
    if (!remarks) {
      setError('Please enter remarks before rejecting.');
      return;
    }
    setActingId(id);
    try {
      await api.put(`/content/${id}/reject`, { remarks });
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to get plain text from HTML
  const getPlainText = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
          <p className="text-sm text-gray-500">Review and manage pending content submissions</p>
        </div>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          {items.length} pending
        </span>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h3>
          <p className="text-gray-500">No content is waiting for approval.</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const isExpanded = expandedItems[item._id];
          const plainTextBody = getPlainText(item.body);
          
          return (
            <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                        {item.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        Submitted {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      <Link to={`/content/${item._id}`} className="hover:text-blue-600 transition-colors">
                        {item.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      By {item.createdBy?.name} ({item.createdBy?.designation || item.createdBy?.role})
                    </p>
                  </div>
                  <button
                    onClick={() => toggleExpand(item._id)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body Preview */}
              <div className="p-4">
                <div 
                  className={`text-sm text-gray-600 ${!isExpanded ? 'line-clamp-3' : ''}`}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.body) }}
                />
                {!isExpanded && plainTextBody.length > 200 && (
                  <button
                    onClick={() => toggleExpand(item._id)}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Read more →
                  </button>
                )}
              </div>

              {/* Attachments Preview */}
              {item.attachments && item.attachments.length > 0 && (
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span>{item.attachments.length} attachment{item.attachments.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1">
                  {item.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Remarks (required for rejection, optional for approval)"
                      value={remarksMap[item._id] || ''}
                      onChange={(e) => setRemarksMap({ ...remarksMap, [item._id]: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(item._id)}
                      disabled={actingId === item._id}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center gap-1"
                    >
                      {actingId === item._id ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleReject(item._id)}
                      disabled={actingId === item._id}
                      className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 disabled:opacity-60 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}