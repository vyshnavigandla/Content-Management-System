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

const STATUS_COLORS = {
  draft: 'from-gray-400 to-gray-500',
  pending_approval: 'from-yellow-400 to-orange-500',
  published: 'from-green-400 to-emerald-500',
  rejected: 'from-red-400 to-pink-500',
  archived: 'from-purple-400 to-indigo-500',
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 uppercase">
                {user.role}
              </span>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Faculty / HOD dashboard --- */}
      {user.role !== 'student' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <StatCard
              label="Total Users"
              value={data.totalUsers}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              label="Faculty"
              value={data.totalFaculty}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              gradient="from-purple-500 to-pink-500"
            />
            <StatCard
              label="Students"
              value={data.totalStudents}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              gradient="from-green-500 to-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Content status breakdown */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Content Overview</h2>
              </div>
              <div className="space-y-3">
                {Object.entries(data.contentCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors duration-150">
                    <StatusBadge status={status} />
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${STATUS_COLORS[status]} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${(count / Object.values(data.contentCounts).reduce((a, b) => a + b, 0)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-700 text-sm min-w-[2rem] text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
              {user.role === 'hod' && data.contentCounts.pending_approval > 0 && (
                <Link
                  to="/approvals"
                  className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25"
                >
                  Review {data.contentCounts.pending_approval} Pending Item{data.contentCounts.pending_approval !== 1 ? 's' : ''}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              )}
            </div>

            {/* Recent activity (audit log) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
              </div>
              {data.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400 text-sm">No recent activity</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((log) => (
                    <li key={log._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-150">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-600">
                          {log.user?.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">{log.user?.name}</span>
                          <span className="text-gray-500 ml-1">{log.remarks}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(log.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recently published */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Recently Published</h2>
            </div>
            {data.recentPublished.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-gray-400 text-sm">Nothing published yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentPublished.map((item) => (
                  <Link
                    key={item._id}
                    to={`/content/${item._id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
                      <span className="text-sm text-blue-600 group-hover:text-blue-700 font-medium truncate">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                      {new Date(item.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* --- Student dashboard --- */}
      {user.role === 'student' && (
        <>
          {/* Content Type Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            {Object.entries(STATUS_LABELS)
              .filter(([key]) => key === 'published')
              .map(() =>
                Object.entries(data.typeCounts).map(([type, count]) => {
                  const typeColors = {
                    notes: 'from-blue-500 to-cyan-500',
                    assignment: 'from-purple-500 to-pink-500',
                    question_paper: 'from-orange-500 to-red-500',
                    syllabus: 'from-green-500 to-emerald-500',
                    other: 'from-gray-500 to-slate-500',
                  };
                  return (
                    <StatCard
                      key={type}
                      label={type.replace('_', ' ')}
                      value={count}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      }
                      gradient={typeColors[type] || 'from-gray-500 to-slate-500'}
                    />
                  );
                })
              )}
          </div>

          {/* Recently Published */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Recently Published Content</h2>
            </div>
            {data.recentPublished.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No content yet</h3>
                <p className="text-gray-500 text-sm">Published content will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentPublished.map((item) => (
                  <Link
                    key={item._id}
                    to={`/content/${item._id}`}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-blue-50 transition-colors duration-150 group border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                          {item.type.replace('_', ' ')}
                        </span>
                        {item.subject && (
                          <span className="text-xs text-gray-400">{item.subject}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                      {new Date(item.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon, gradient }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">
            {value ?? 0}
          </p>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">{label}</p>
    </div>
  );
}