// components/Navbar.jsx
// Top navigation bar - shows the app name, the logged-in user's name/role,
// and a logout button. Links shown depend on the user's role.

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/dashboard" className="text-lg font-semibold text-gray-800">
        Department CMS
      </Link>

      <div className="flex items-center gap-4 text-sm">
        <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
          Dashboard
        </Link>
        <Link to="/content" className="text-gray-600 hover:text-gray-900">
          Content
        </Link>
        <Link to="/directory" className="text-gray-600 hover:text-gray-900">
          Faculty Directory
        </Link>

        {user?.role === 'hod' && (
          <Link to="/approvals" className="text-gray-600 hover:text-gray-900">
            Approvals
          </Link>
        )}

        {(user?.role === 'faculty' || user?.role === 'hod') && (
          <Link to="/profile" className="text-gray-600 hover:text-gray-900">
            My Profile
          </Link>
        )}

        {user?.role === 'hod' && (
          <Link to="/users" className="text-gray-600 hover:text-gray-900">
            Manage Users
          </Link>
        )}

        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
          <span className="text-gray-700">
            {user?.name}{' '}
            <span className="text-xs uppercase text-gray-400">({user?.role})</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}