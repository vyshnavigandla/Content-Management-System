// components/NotificationBell.jsx
import { useState, useEffect, useRef } from 'react';
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications', {
        params: { limit: 10 }
      });
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationColor = (type) => {
    const colors = {
      content_submitted: 'border-yellow-400 bg-yellow-50',
      content_approved: 'border-green-400 bg-green-50',
      content_rejected: 'border-red-400 bg-red-50',
      content_published: 'border-blue-400 bg-blue-50',
      comment_added: 'border-purple-400 bg-purple-50',
      mention: 'border-indigo-400 bg-indigo-50',
      system: 'border-gray-400 bg-gray-50'
    };
    return colors[type] || 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2 ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[32rem] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-slideDown">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <CheckIcon className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-96">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <BellIcon className="h-12 w-12 mb-2" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    notification.read ? 'opacity-75' : 'bg-blue-50/50'
                  } ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-2 bg-gray-50">
              <button
                onClick={() => navigate('/notifications')}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}