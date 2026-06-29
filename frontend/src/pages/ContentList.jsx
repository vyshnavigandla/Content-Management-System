// pages/ContentList.jsx
// FIX: removed duplicate useEffect that caused double fetch on mount;
// added onDelete prop to ContentCard so deleted items disappear immediately.
// FIX: HOD can now delete any content regardless of status or owner
// FIX: Added Auto-Published badge for study materials
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ContentCard from '../components/ContentCard';

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'notice', label: '📢 Notice' },
  { value: 'circular', label: '📋 Circular' },
  { value: 'event', label: '🎉 Event' },
  { value: 'exam_schedule', label: '📅 Exam Schedule' },
  { value: 'study_material', label: '📚 Study Material' },
  { value: 'placement_update', label: '💼 Placement Update' },
  { value: 'achievement', label: '🏆 Achievement' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: '📝 Draft' },
  { value: 'pending_approval', label: '⏳ Pending Approval' },
  { value: 'published', label: '✅ Published' },
  { value: 'rejected', label: '❌ Rejected' },
  { value: 'archived', label: '📦 Archived' },
];

export default function ContentList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [semester, setSemester] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isStaff = user.role === 'faculty' || user.role === 'hod';
  const isHOD = user.role === 'hod';

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (isStaff) {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (type) params.type = type;
        res = await api.get('/content/mine', { params });
      } else {
        const params = {};
        if (search) params.search = search;
        if (type) params.type = type;
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

  useEffect(() => {
    fetchItems();
  }, [type, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchItems(); };
  const handleDelete = (deletedId) => setItems((prev) => prev.filter((item) => item._id !== deletedId));

  // ✅ Helper to check if content is auto-published (study materials)
  const isAutoPublished = (item) => {
    return item.type === 'study_material' && item.status === 'published';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{isStaff ? 'My Content' : 'Department Content'}</h1>
          <p className="text-gray-600">
            {isStaff ? 'Manage and track your published content' : 'Browse department publications and updates'}
            {isStaff && (
              <span className="block text-sm text-green-600 mt-1">
                📚 Study materials are auto-published immediately
              </span>
            )}
          </p>
        </div>
        {isStaff && (
          <Link to="/content/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
            + New Content
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex flex-wrap gap-4 items-end">
            {!isStaff && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Title</label>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
            )}
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {!isStaff && (
              <div className="min-w-[130px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <input type="number" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. 5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
            )}
            {isStaff && (
              <div className="min-w-[180px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-lg">
              Search
            </button>
            {(search || type || semester || statusFilter) && (
              <button type="button" onClick={() => { setSearch(''); setType(''); setSemester(''); setStatusFilter(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 underline">
                Clear filters
              </button>
            )}
          </div>
        </form>
      </div>

      {loading && <div className="flex items-center justify-center py-20"><p className="text-gray-500">Loading content...</p></div>}
      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg"><p className="text-sm text-red-700">{error}</p></div>}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-500 mb-6">{isStaff ? 'Start creating content to see it here' : 'No published content matches your criteria'}</p>
          {isStaff && (
            <Link to="/content/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold">
              Create Your First Content
            </Link>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ContentCard
                key={item._id}
                content={item}
                onDelete={handleDelete}
               isAutoPublished={item.type === 'study_material' && item.status === 'published'}
                actions={
                  isHOD ? null : (
                    isStaff && ['draft', 'rejected'].includes(item.status) ? (
                      <Link to={`/content/${item._id}/edit`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-200">
                        Edit
                      </Link>
                    ) : null
                  )
                }
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">Showing {items.length} result{items.length !== 1 ? 's' : ''}</p>
        </>
      )}
    </div>
  );
}