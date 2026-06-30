// pages/Notifications.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications', {
        params: { limit: 20, page }
      });
      setNotifications(res.data.data.notifications);
      setTotalPages(res.data.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      content_submitted: 'Submitted',
      content_approved: 'Approved',
      content_rejected: 'Rejected',
      content_published: 'Published',
      comment_added: 'Comment',
      mention: 'Mention',
      system: 'System'
    };
    return labels[type] || 'Notification';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={async () => {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-2">
        {notifications.map((notification) => (
          <Link
            key={notification._id}
            to={notification.link}
            onClick={() => markAsRead(notification._id)}
            className={`block p-4 rounded-lg border transition-colors ${
              notification.read
                ? 'bg-white border-gray-200 hover:bg-gray-50'
                : 'bg-blue-50/50 border-blue-200 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-sm font-semibold text-gray-500 min-w-[80px]">
                {getTypeLabel(notification.type)}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">{notification.title}</h3>
                <p className="text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notification.read && (
                <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></span>
              )}
            </div>
          </Link>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}