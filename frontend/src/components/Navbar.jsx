// components/Navbar.jsx
// FIX: NotificationBell was rendered twice — once correctly in the desktop
// user-menu section, and once in a stray <div> that was pasted outside the
// conditional desktop nav block. The stray copy is removed.

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const linkClasses = (path) => `
    relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
    ${isActive(path)
      ? 'text-blue-700 bg-blue-50'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }
  `;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                <span className="text-white text-sm font-bold">D</span>
              </div>
              <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                Department CMS
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            <Link to="/dashboard" className={linkClasses('/dashboard')}>
              <span>Dashboard</span>
            </Link>

            <Link to="/content" className={linkClasses('/content')}>
              <span>Content</span>
            </Link>

            <Link to="/directory" className={linkClasses('/directory')}>
              <span>Faculty Directory</span>
            </Link>

            {user?.role === 'hod' && (
              <Link to="/approvals" className={linkClasses('/approvals')}>
                <span>Approvals</span>
              </Link>
            )}

            {(user?.role === 'faculty' || user?.role === 'hod') && (
              <Link to="/profile" className={linkClasses('/profile')}>
                <span>My Profile</span>
              </Link>
            )}

            {user?.role === 'hod' && (
              <Link to="/users" className={linkClasses('/users')}>
                <span>Manage Users</span>
              </Link>
            )}
          </div>

          {/* Desktop: notification bell + user info + logout (SINGLE block) */}
          <div className="hidden lg:flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
            {/* FIXED: NotificationBell appears exactly once, here */}
            <NotificationBell />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-700 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-400 uppercase leading-tight">{user?.role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <span className="text-xl font-bold">×</span>
              ) : (
                <span className="text-xl font-bold">≡</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-3 space-y-1 animate-fadeIn">
            {[
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/content',   label: 'Content' },
              { to: '/directory', label: 'Faculty Directory' },
              ...(user?.role === 'hod'
                ? [{ to: '/approvals', label: 'Approvals' }, { to: '/users', label: 'Manage Users' }]
                : []),
              ...(['faculty', 'hod'].includes(user?.role)
                ? [{ to: '/profile', label: 'My Profile' }]
                : []),
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={linkClasses(to) + ' block'}
              >
                {label}
              </Link>
            ))}

            <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-400 uppercase">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </nav>
  );
}