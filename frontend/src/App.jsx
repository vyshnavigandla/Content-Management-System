// App.jsx
// FIX: /content/new must be declared BEFORE /content/:id, otherwise React
// Router matches the literal string "new" as a dynamic :id param and renders
// ContentDetail (which then 404s when it tries to fetch content with id="new").
// Moved the new-content route outside the role-restricted group so it sits
// above the /:id catch-all, then added the role restriction inline.
// ✅ ADDED: Slug-based routing for SEO-friendly URLs
// ✅ FIX: ContentDetail now handles both ID and slug detection

import { Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

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
    <HelmetProvider>
      <AuthProvider>
        <NotificationToast />
        <Routes>
          {/* ── Public Routes ────────────────────────────────────────────── */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Protected Routes ─────────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Main Pages */}
              <Route path="/dashboard"      element={<Dashboard />} />
              <Route path="/directory"      element={<FacultyDirectory />} />
              <Route path="/notifications"  element={<Notifications />} />

              {/* Content List */}
              <Route path="/content" element={<ContentList />} />

              {/* ── Faculty/HOD Only Routes ──────────────────────────────── */}
              <Route element={<ProtectedRoute roles={['faculty', 'hod']} />}>
                {/* ⚠️ IMPORTANT: These routes MUST be declared before /:slug and /:id */}
                <Route path="/content/new"      element={<ContentEditor />} />
                <Route path="/content/:id/edit" element={<ContentEditor />} />
                <Route path="/profile"          element={<Profile />} />
              </Route>

              {/* ── Content Detail Routes ────────────────────────────────── */}
              {/* ✅ SEO-Friendly: Slug-based routing (clean URLs) */}
              <Route path="/content/:slug" element={<ContentDetail />} />
              
              {/* ✅ Fallback: ID-based routing (backward compatibility) */}
              <Route path="/content/id/:id" element={<ContentDetail />} />

              {/* ── HOD Only Routes ───────────────────────────────────────── */}
              <Route element={<ProtectedRoute roles={['hod']} />}>
                <Route path="/approvals" element={<ApprovalQueue />} />
                <Route path="/users"     element={<ManageUsers />} />
              </Route>

              {/* ── 404 Fallback ───────────────────────────────────────────── */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          {/* ── Redirects ─────────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </HelmetProvider>
  );
}