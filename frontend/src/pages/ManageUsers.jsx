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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Users</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ New Account'}
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          {success}
        </div>
      )}

      {/* Create user form */}
      {showForm && (
        <form onSubmit={handleCreateUser} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleFormChange}
              required
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleFormChange}
              required
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="password"
              type="password"
              placeholder="Temporary Password"
              value={form.password}
              onChange={handleFormChange}
              required
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="role"
              value={form.role}
              onChange={handleFormChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="semester"
                  type="number"
                  placeholder="Semester"
                  value={form.semester}
                  onChange={handleFormChange}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}

            {form.role === 'faculty' && (
              <input
                name="designation"
                placeholder="Designation (e.g. Assistant Professor)"
                value={form.designation}
                onChange={handleFormChange}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      )}

      {/* Filters */}
      <form onSubmit={handleFilterSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="hod">HOD</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Search name/email</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="bg-gray-800 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-900">
          Apply
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Details</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-2 text-gray-600">{u.email}</td>
                  <td className="px-4 py-2 uppercase text-gray-500 text-xs">{u.role}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {u.role === 'student' && `Roll: ${u.rollNumber || '-'} · Sem ${u.semester || '-'}`}
                    {u.role !== 'student' && (u.designation || '-')}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {u.role !== 'hod' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="text-xs text-red-600 hover:underline"
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

          {users.length === 0 && (
            <p className="text-gray-400 text-sm p-4">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}