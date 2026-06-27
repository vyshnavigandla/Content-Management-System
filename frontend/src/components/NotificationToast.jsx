// components/NotificationToast.jsx
// FIX: auto-dismiss timer now captures toastId correctly in closure
import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.socket) return;

    const handleNewNotification = (notification) => {
      const toastId = Date.now(); // FIX: capture id in local variable
      setToasts((prev) => [...prev, { ...notification, id: toastId }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5000);
    };

    window.socket.on('new_notification', handleNewNotification);
    return () => window.socket.off('new_notification', handleNewNotification);
  }, []);

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleClick = (toast) => {
    if (toast.link) { navigate(toast.link); dismissToast(toast.id); }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div key={toast.id} onClick={() => handleClick(toast)}
          className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 cursor-pointer hover:shadow-xl transition-shadow"
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm">{toast.title}</h4>
              <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">{toast.message}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}