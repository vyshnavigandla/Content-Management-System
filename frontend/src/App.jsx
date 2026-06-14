// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ContentList from './pages/ContentList';
import ContentEditor from './pages/ContentEditor';
import ContentDetail from './pages/ContentDetail';
import ApprovalQueue from './pages/ApprovalQueue';
import FacultyDirectory from './pages/FacultyDirectory';
import Profile from './pages/Profile';
import ManageUsers from './pages/ManageUsers';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/content" element={<ContentList />} />
            <Route path="/content/:id" element={<ContentDetail />} />
            <Route path="/directory" element={<FacultyDirectory />} />

            <Route element={<ProtectedRoute roles={['faculty', 'hod']} />}>
              <Route path="/content/new" element={<ContentEditor />} />
              <Route path="/content/:id/edit" element={<ContentEditor />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route element={<ProtectedRoute roles={['hod']} />}>
              <Route path="/approvals" element={<ApprovalQueue />} />
              <Route path="/users" element={<ManageUsers />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}