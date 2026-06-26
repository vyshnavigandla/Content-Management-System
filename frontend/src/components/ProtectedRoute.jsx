// components/ProtectedRoute.jsx
// Wraps pages that require authentication. Optionally restricts by role.
//
// Usage:
//   <Route element={<ProtectedRoute />}>            -> any logged-in user
//   <Route element={<ProtectedRoute roles={['hod']} />}>  -> HOD only

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ roles }) {
  const { user, loading, isAuthenticated } = useAuth();

  // Wait until we've checked localStorage before deciding anything
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Authenticating...</p>
          <p className="mt-1 text-sm text-gray-400">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // Not logged in -> send to login page
  if (!user || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role -> send to their own dashboard
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Authorized -> render the nested route (via <Outlet />)
  return <Outlet />;
}