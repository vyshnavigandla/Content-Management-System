// pages/ContentList.jsx
// FIX: filters previously only applied on form submit. Changing the
// status or type dropdown felt broken because nothing happened visually.
// Now any filter change triggers a re-fetch immediately via useEffect.
// The Apply Filters button is kept for the search text field (avoids
// firing on every keystroke) but dropdowns are instant.

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ContentCard from '../components/ContentCard';

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'notice',           label: '📢 Notice' },
  { value: 'circular',         label: '📋 Circular' },
  { value: 'event',            label: '🎉 Event' },
  { value: 'exam_schedule',    label: '📅 Exam Schedule' },
  { value: 'study_material',   label: '📚 Study Material' },
  { value: 'placement_update', label: '💼 Placement Update' },
  { value: 'achievement',      label: '🏆 Achievement' },
];

const STATUSES = [
  { value: '',                  label: 'All Statuses' },
  { value: 'draft',             label: '📝 Draft' },
  { value: 'pending_approval',  label: '⏳ Pending Approval' },
  { value: 'published',         label: '✅ Published' },
  { value: 'rejected',          label: '❌ Rejected' },
  { value: 'archived',          label: '📦 Archived' },
];

export default function ContentList() {
  const { user } = useAuth();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Filter state
  const [search, setSearch]           = useState('');
  const [type, setType]               = useState('');
  const [semester, setSemester]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isStaff = user.role === 'faculty' || user.role === 'hod';

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (isStaff) {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (type)         params.type   = type;
        res = await api.get('/content/mine', { params });
      } else {
        const params = {};
        if (search)   params.search   = search;
        if (type)     params.type     = type;
        if (semester) params.semester = semester;
        res = await api.get('/content/published', { params });
      }
      setItems(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [isStaff, type, statusFilter, semester, search]);

  // FIX: re-fetch whenever dropdown values change (instant feedback)
  useEffect(() => {
    fetchItems();
  }, [type, statusFilter]);           // dropdowns: instant

  // Initial load
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search & semester still require explicit submit to avoid firing per keystroke
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {isStaff ? 'My Content' : 'Department Content'}
          </h1>
          <p className="text-gray-600">
            {isStaff
              ? 'Manage and track your published content'
              : 'Browse department publications and updates'}
          </p>
        </div>
        {isStaff && (
          <Link
            to="/content/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Content
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex flex-wrap gap-4 items-end">

            {/* Search (text - submit to apply) */}
            {!isStaff && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Title</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search content..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
                />
              </div>
            )}

            {/* Type dropdown (instant) */}
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Semester (students) */}
            {!isStaff && (
              <div className="min-w-[130px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <input
                  type="number"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
                />
              </div>
            )}

            {/* Status dropdown (staff, instant) */}
            {isStaff && (
              <div className="min-w-[180px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit applies search/semester text fields */}
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>

            {/* Clear all */}
            {(search || type || semester || statusFilter) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setType(''); setSemester(''); setStatusFilter(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-500 text-lg">Loading content...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-500 mb-6">
            {isStaff ? 'Start creating content to see it here' : 'No published content matches your criteria'}
          </p>
          {isStaff && (
            <Link
              to="/content/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Content
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ContentCard
                key={item._id}
                content={item}
                actions={
                  isStaff && ['draft', 'rejected'].includes(item.status) ? (
                    <Link
                      to={`/content/${item._id}/edit`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                  ) : null
                }
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            Showing {items.length} result{items.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  );
}