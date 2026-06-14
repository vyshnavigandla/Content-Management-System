// pages/ApprovalQueue.jsx
// HOD-only page - lists all content with status 'pending_approval',
// with inline approve/reject actions.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ApprovalQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null); // disables buttons during a request
  const [remarksMap, setRemarksMap] = useState({}); // per-item remarks input

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

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Approval Queue</h1>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-gray-400 text-sm">No content is waiting for approval.</p>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item._id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-blue-600 uppercase">
                  {item.type.replace('_', ' ')}
                </span>
                <h3 className="text-base font-semibold text-gray-800">
                  <Link to={`/content/${item._id}`} className="hover:underline">
                    {item.title}
                  </Link>
                </h3>
                <p className="text-xs text-gray-400">
                  By {item.createdBy?.name} ({item.createdBy?.designation || item.createdBy?.role})
                  {' · '}
                  Submitted {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.body}</p>

            <div className="mt-3">
              <input
                type="text"
                placeholder="Remarks (required for rejection, optional for approval)"
                value={remarksMap[item._id] || ''}
                onChange={(e) => setRemarksMap({ ...remarksMap, [item._id]: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleApprove(item._id)}
                disabled={actingId === item._id}
                className="bg-green-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-60"
              >
                Approve & Publish
              </button>
              <button
                onClick={() => handleReject(item._id)}
                disabled={actingId === item._id}
                className="bg-red-50 text-red-600 text-sm px-4 py-1.5 rounded-md hover:bg-red-100 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}