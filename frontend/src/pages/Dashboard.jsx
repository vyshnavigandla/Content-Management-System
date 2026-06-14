// pages/Dashboard.jsx
// Real dashboard - shows different widgets depending on role.
// Faculty/HOD: user counts, content status breakdown, recent activity.
// Student: recently published content, content type breakdown.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const STATUS_LABELS = {
  draft: 'Drafts',
  pending_approval: 'Pending Approval',
  published: 'Published',
  rejected: 'Rejected',
  archived: 'Archived',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const endpoint = user.role === 'student' ? '/admin/dashboard/student' : '/admin/dashboard';

    api
      .get(endpoint)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user.role]);

  if (loading) return <p className="text-gray-500">Loading dashboard...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Welcome, {user.name}</h1>
      <p className="text-gray-500 mb-6">
        Logged in as <span className="uppercase font-medium">{user.role}</span>
      </p>

      {/* --- Faculty / HOD dashboard --- */}
      {user.role !== 'student' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Total Users" value={data.totalUsers} />
            <StatCard label="Faculty" value={data.totalFaculty} />
            <StatCard label="Students" value={data.totalStudents} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content status breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Content Overview</h2>
              <div className="space-y-2">
                {Object.entries(data.contentCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <StatusBadge status={status} />
                    <span className="font-medium text-gray-700">{count}</span>
                  </div>
                ))}
              </div>
              {user.role === 'hod' && data.contentCounts.pending_approval > 0 && (
                <Link
                  to="/approvals"
                  className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                >
                  Review {data.contentCounts.pending_approval} pending item(s) &rarr;
                </Link>
              )}
            </div>

            {/* Recent activity (audit log) */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                {data.recentActivity.length === 0 && <p className="text-gray-400">No activity yet.</p>}
                {data.recentActivity.map((log) => (
                  <li key={log._id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-gray-700">{log.user?.name}</span>{' '}
                    <span className="text-gray-500">{log.remarks}</span>
                    <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recently published */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Recently Published</h2>
            {data.recentPublished.length === 0 && <p className="text-gray-400 text-sm">Nothing published yet.</p>}
            <ul className="space-y-2 text-sm">
              {data.recentPublished.map((item) => (
                <li key={item._id}>
                  <Link to={`/content/${item._id}`} className="text-blue-600 hover:underline">
                    {item.title}
                  </Link>
                  <span className="text-gray-400 text-xs ml-2">
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* --- Student dashboard --- */}
      {user.role === 'student' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {Object.entries(STATUS_LABELS)
              .filter(([key]) => key === 'published')
              .map(() =>
                Object.entries(data.typeCounts).map(([type, count]) => (
                  <StatCard key={type} label={type.replace('_', ' ')} value={count} />
                ))
              )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Recently Published</h2>
            {data.recentPublished.length === 0 && (
              <p className="text-gray-400 text-sm">No content published yet.</p>
            )}
            <ul className="space-y-2 text-sm">
              {data.recentPublished.map((item) => (
                <li key={item._id} className="border-b border-gray-100 pb-2 last:border-0">
                  <Link to={`/content/${item._id}`} className="text-blue-600 hover:underline font-medium">
                    {item.title}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {item.type.replace('_', ' ')}
                    {item.subject ? ` · ${item.subject}` : ''}
                    {' · '}
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
    </div>
  );
}