// App.jsx
// FIX: /content/new must be declared BEFORE /content/:id, otherwise React
// Router matches the literal string "new" as a dynamic :id param and renders
// ContentDetail (which then 404s when it tries to fetch content with id="new").
// Moved the new-content route outside the role-restricted group so it sits
// above the /:id catch-all, then added the role restriction inline.

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import NotificationToast from './components/NotificationToast';

import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import ContentList    from './pages/ContentList';
import ContentEditor  from './pages/ContentEditor';
import ContentDetail  from './pages/ContentDetail';
import ApprovalQueue  from './pages/ApprovalQueue';
import FacultyDirectory from './pages/FacultyDirectory';
import Profile        from './pages/Profile';
import ManageUsers    from './pages/ManageUsers';
import Notifications  from './pages/Notifications';
import NotFound       from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <NotificationToast />
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* All authenticated routes share the Layout (Navbar + main wrapper) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/directory"   element={<FacultyDirectory />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Content routes - ORDER MATTERS:
                /content/new and /content/pending must come before /content/:id
                so React Router doesn't treat "new"/"pending" as an :id value */}
            <Route path="/content" element={<ContentList />} />

            <Route element={<ProtectedRoute roles={['faculty', 'hod']} />}>
              {/* FIXED: declared before /:id */}
              <Route path="/content/new"      element={<ContentEditor />} />
              <Route path="/content/:id/edit" element={<ContentEditor />} />
              <Route path="/profile"          element={<Profile />} />
            </Route>

            {/* Generic detail view — after all specific /content/* paths */}
            <Route path="/content/:id" element={<ContentDetail />} />

            <Route element={<ProtectedRoute roles={['hod']} />}>
              <Route path="/approvals" element={<ApprovalQueue />} />
              <Route path="/users"     element={<ManageUsers />} />
            </Route>
          </Route>
        </Route>

        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}