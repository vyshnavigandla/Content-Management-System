// pages/ManageUsers.jsx
// HOD-only page: list all users, create new Faculty/Student accounts,
// activate/deactivate, and delete accounts.

import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ManageUsers() {
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
    rollNumber: '',
    semester: '',
    designation: '',
  });
  const [creating, setCreating] = useState(false);

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

  const handleToggleStatus = async (user) => {
    setError('');
    try {
      await api.put(`/admin/users/${user._id}/status`, { isActive: !user.isActive });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      );
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
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
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
            showForm
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25'
          }`}
        >
          {showForm ? 'Cancel' : 'New Account'}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-bold text-lg flex-shrink-0">✓</span>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-lg flex-shrink-0">!</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Create user form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-lg font-bold">+</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Create New Account</h2>
          </div>

          <form onSubmit={handleCreateUser}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                <input
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleFormChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input
                  name="password"
                  type="password"
                  placeholder="Temporary Password"
                  value={form.password}
                  onChange={handleFormChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R</span>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▼</span>
              </div>

              {form.role === 'student' && (
                <>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">#</span>
                    <input
                      name="rollNumber"
                      placeholder="Roll Number"
                      value={form.rollNumber}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S</span>
                    <input
                      name="semester"
                      type="number"
                      placeholder="Semester"
                      value={form.semester}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    />
                  </div>
                </>
              )}

              {form.role === 'faculty' && (
                <div className="relative sm:col-span-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">D</span>
                  <input
                    name="designation"
                    placeholder="Designation (e.g. Assistant Professor)"
                    value={form.designation}
                    onChange={handleFormChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-blue-500/25"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="hod">HOD</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="flex-[2] min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Name or Email
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
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
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        u.role === 'hod' 
                          ? 'bg-purple-100 text-purple-700'
                          : u.role === 'faculty'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {u.role === 'student' && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Roll:</span> {u.rollNumber || '-'}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Sem:</span> {u.semester || '-'}
                          </div>
                        </div>
                      )}
                      {u.role !== 'student' && (
                        <span>{u.designation || '-'}</span>
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
                      {u.role !== 'hod' && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                              u.isActive
                                ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
                                : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-400 text-2xl">U</span>
              </div>
              <p className="text-gray-400 text-lg font-medium">No users found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}