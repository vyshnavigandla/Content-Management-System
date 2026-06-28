// pages/ManageUsers.jsx
// HOD-only page: list all users, create new Faculty/Student accounts,
// promote/demote to HOD, activate/deactivate, and delete accounts.

import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create-user form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    rollNumber: '',
    semester: '',
    designation: '',
  });
  const [creating, setCreating] = useState(false);

  // Role change state
  const [changingRole, setChangingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/users', form);
      setSuccess(`Account created for ${form.email}`);
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
        rollNumber: '',
        semester: '',
        designation: '',
      });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setChangingRole(userId);
    setSelectedRole(newRole);
  };

  const confirmRoleChange = async (userId) => {
    if (!selectedRole) return;

    // Check if promoting to HOD
    if (selectedRole === 'hod') {
      const currentHOD = users.find(u => u.role === 'hod' && u.isActive);
      const targetUser = users.find(u => u._id === userId);
      if (currentHOD && currentHOD._id !== userId) {
        const confirm = window.confirm(
          `⚠️ ${currentHOD.name} is currently the HOD. Promoting ${targetUser?.name} will automatically demote ${currentHOD.name} to Faculty. Continue?`
        );
        if (!confirm) {
          setChangingRole(null);
          setSelectedRole('');
          return;
        }
      }
    }

    setUpdating(true);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: selectedRole });

      // Update local state
      setUsers(prev => prev.map(u => {
        if (u._id === userId) {
          return { ...u, role: selectedRole };
        }
        // If this user was the HOD and we promoted someone else, demote them
        if (selectedRole === 'hod' && u.role === 'hod' && u._id !== userId) {
          return { ...u, role: 'faculty' };
        }
        return u;
      }));

      setChangingRole(null);
      setSelectedRole('');
      setSuccess('✅ Role updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const cancelRoleChange = () => {
    setChangingRole(null);
    setSelectedRole('');
  };

  const handleToggleStatus = async (user) => {
    setError('');
    try {
      await api.put(`/admin/users/${user._id}/status`, { isActive: !user.isActive });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      );
      setSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete account for ${user.name} (${user.email})? This cannot be undone.`)) {
      return;
    }
    setError('');
    try {
      await api.delete(`/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setSuccess(`User ${user.name} deleted successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      hod: 'bg-purple-100 text-purple-700',
      faculty: 'bg-blue-100 text-blue-700',
      student: 'bg-green-100 text-green-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Manage Users</h1>
          <p className="text-gray-600">Create, manage, and monitor user accounts</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            showForm
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25'
          }`}
        >
          {showForm ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Account
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Create user form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Create New Account</h2>
          </div>

          <form onSubmit={handleCreateUser}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <input
                name="password"
                type="password"
                placeholder="Temporary Password"
                value={form.password}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <input
                name="department"
                placeholder="Department"
                value={form.department}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <select
                name="role"
                value={form.role}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>

              {form.role === 'student' && (
                <>
                  <input
                    name="rollNumber"
                    placeholder="Roll Number"
                    value={form.rollNumber}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                  <input
                    name="semester"
                    type="number"
                    placeholder="Semester"
                    value={form.semester}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </>
              )}

              {form.role === 'faculty' && (
                <input
                  name="designation"
                  placeholder="Designation (e.g. Assistant Professor)"
                  value={form.designation}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all"
            >
              {creating ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <option value="">All Roles</option>
              <option value="hod">HOD</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="flex-[2] min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search by Name or Email</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading users...</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isEditing = changingRole === u._id;
                  const isCurrentUser = u._id === currentUser?._id;

                  return (
                    <tr key={u._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-gray-600">{u.department || '-'}</td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={updating}
                            >
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="hod">HOD</option>
                            </select>
                            <button
                              onClick={() => confirmRoleChange(u._id)}
                              disabled={updating}
                              className="p-1 text-green-600 hover:text-green-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={cancelRoleChange}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadge(u.role)}`}>
                            {u.role.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          u.isActive
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isCurrentUser && (
                          <div className="flex items-center gap-2 justify-end">
                            {!isEditing && u.role !== 'student' && (
                              <button
                                onClick={() => handleRoleChange(u._id, u.role === 'hod' ? 'faculty' : 'hod')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all"
                                title={u.role === 'hod' ? 'Demote to Faculty' : 'Promote to HOD'}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                                {u.role === 'hod' ? 'Demote' : 'Promote'}
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                u.isActive
                                  ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
                                  : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs text-gray-400">(You)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg font-medium">No users found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}