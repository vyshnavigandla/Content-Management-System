// pages/ContentList.jsx
// Shows content depending on role:
//  - Students: published content with search/filter
//  - Faculty/HOD: their own content (drafts, pending, published, rejected)
//    with a link to create new content

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ContentCard from '../components/ContentCard';

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'notice', label: 'Notice' },
  { value: 'circular', label: 'Circular' },
  { value: 'event', label: 'Event' },
  { value: 'exam_schedule', label: 'Exam Schedule' },
  { value: 'study_material', label: 'Study Material' },
  { value: 'placement_update', label: 'Placement Update' },
  { value: 'achievement', label: 'Achievement' },
];

export default function ContentList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [semester, setSemester] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // faculty/hod only

  const isStaff = user.role === 'faculty' || user.role === 'hod';

  const fetchItems = async () => {
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
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isStaff ? 'My Content' : 'Department Content'}
        </h1>
        {isStaff && (
          <Link
            to="/content/new"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + New Content
          </Link>
        )}
      </div>

      {/* Filters */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end"
      >
        {!isStaff && (
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1">Search title</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {!isStaff && (
          <div className="min-w-[120px]">
            <label className="block text-xs text-gray-500 mb-1">Semester</label>
            <input
              type="number"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g. 5"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {isStaff && (
          <div className="min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          className="bg-gray-800 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-900"
        >
          Apply
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-gray-400 text-sm">No content found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <ContentCard
            key={item._id}
            content={item}
            actions={
              isStaff && ['draft', 'rejected'].includes(item.status) ? (
                <Link
                  to={`/content/${item._id}/edit`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit
                </Link>
              ) : null
            }
          />
        ))}
      </div>
    </div>
  );
}