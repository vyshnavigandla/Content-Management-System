// components/ProtectedRoute.jsx
// Wraps pages that require authentication. Optionally restricts by role.
//
// Usage:
//   <Route element={<ProtectedRoute />}>            -> any logged-in user
//   <Route element={<ProtectedRoute roles={['hod']} />}>  -> HOD only

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();

  // Wait until we've checked localStorage before deciding anything
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  // Not logged in -> send to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role -> send to their own dashboard
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Authorized -> render the nested route (via <Outlet />)
  return <Outlet />;
}