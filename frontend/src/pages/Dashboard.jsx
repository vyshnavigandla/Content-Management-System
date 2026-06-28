// pages/Dashboard.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const STATUS_COLORS = {
  draft: 'from-gray-400 to-gray-500',
  pending_approval: 'from-yellow-400 to-orange-500',
  published: 'from-green-400 to-emerald-500',
  rejected: 'from-red-400 to-pink-500',
};

const TYPE_COLORS = {
  notice: 'from-blue-500 to-cyan-500',
  circular: 'from-purple-500 to-violet-500',
  event: 'from-pink-500 to-rose-500',
  exam_schedule: 'from-orange-500 to-amber-500',
  study_material: 'from-green-500 to-emerald-500',
  placement_update: 'from-indigo-500 to-blue-500',
  achievement: 'from-yellow-500 to-orange-500',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHODHistory, setShowHODHistory] = useState(false);

  useEffect(() => {
    const endpoint = user.role === 'student' ? '/admin/dashboard/student' : '/admin/dashboard';
    api.get(endpoint)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user.role]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <p className="text-sm text-red-700">{error}</p>
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
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Faculty / HOD dashboard */}
      {user.role !== 'student' && (
        <>
          {/* Stats — 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Users"
              value={data.totalUsers}
              gradient="from-blue-500 to-cyan-500"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <StatCard
              label="Faculty (incl. HODs)"
              value={data.totalFaculty}
              gradient="from-purple-500 to-pink-500"
              subtitle={`${data.totalHODs} HOD${data.totalHODs !== 1 ? 's' : ''} in history`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            />
            <StatCard
              label="HODs (All Time)"
              value={data.totalHODs}
              gradient="from-rose-500 to-orange-500"
              subtitle="Department leadership"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
            />
            <StatCard
              label="Students"
              value={data.totalStudents}
              gradient="from-green-500 to-emerald-500"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            />
          </div>

          {/* Current HOD + HOD History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Current HOD */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Current HOD</h2>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Active
                </span>
              </div>
              {data.activeHOD ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
                    {data.activeHOD.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900">{data.activeHOD.name}</h3>
                    <p className="text-sm text-gray-500">{data.activeHOD.designation || 'Head of Department'}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{data.activeHOD.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      In role since {new Date(data.activeHOD.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">No active HOD found</p>
                </div>
              )}
            </div>

            {/* HOD History */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">HOD History</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {data.allHODs?.length || 0} total
                  </span>
                </div>
                {data.allHODs?.length > 3 && (
                  <button
                    onClick={() => setShowHODHistory(!showHODHistory)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showHODHistory ? 'Show less' : `View all ${data.allHODs.length}`}
                  </button>
                )}
              </div>
              {!data.allHODs?.length ? (
                <p className="text-sm text-gray-400 text-center py-6">No HOD history found</p>
              ) : (
                <ul className="space-y-3">
                  {(showHODHistory ? data.allHODs : data.allHODs.slice(0, 3)).map((hod) => (
                    <li key={hod._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {hod.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{hod.name}</p>
                        <p className="text-xs text-gray-400">
                          {hod.designation || 'HOD'} · Joined {new Date(hod.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${hod.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hod.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {hod.isActive ? 'Current' : 'Past'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Content Overview + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                {Object.entries(data.contentCounts)
                  .filter(([status]) => status !== 'archived')
                  .map(([status, count]) => {
                    const total = Object.entries(data.contentCounts)
                      .filter(([s]) => s !== 'archived')
                      .reduce((a, [, v]) => a + v, 0);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <StatusBadge status={status} />
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`bg-gradient-to-r ${STATUS_COLORS[status] || 'from-gray-400 to-gray-500'} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-700 text-sm min-w-[2rem] text-right">{count}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {user.role === 'hod' && data.contentCounts.pending_approval > 0 && (
                <Link to="/approvals"
                  className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25">
                  Review {data.contentCounts.pending_approval} Pending Item{data.contentCounts.pending_approval !== 1 ? 's' : ''}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              )}
            </div>

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
                <p className="text-gray-400 text-sm text-center py-8">No recent activity</p>
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((log) => (
                    <li key={log._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-600">{log.user?.name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">{log.user?.name}</span>
                          <span className="text-gray-500 ml-1">{log.remarks}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recently Published */}
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
              <p className="text-gray-400 text-sm text-center py-8">Nothing published yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentPublished.map((item) => (
                  <Link key={item._id} to={`/content/${item._id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="text-sm text-blue-600 group-hover:text-blue-700 font-medium truncate">{item.title}</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                      {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Student dashboard */}
      {user.role === 'student' && (
        <>
          {/* Current HOD banner for students */}
          {data.activeHOD && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
                {data.activeHOD.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Current Head of Department</p>
                <h3 className="text-base font-bold text-gray-900">{data.activeHOD.name}</h3>
                <p className="text-sm text-gray-500">{data.activeHOD.designation || 'HOD'} · {data.activeHOD.email}</p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Active
              </span>
            </div>
          )}

          {/* Type counts */}
          {Object.keys(data.typeCounts).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              {Object.entries(data.typeCounts).map(([type, count]) => (
                <StatCard
                  key={type}
                  label={type.replace(/_/g, ' ')}
                  value={count}
                  gradient={TYPE_COLORS[type] || 'from-gray-500 to-slate-500'}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}
                />
              ))}
            </div>
          )}

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
                <h3 className="text-lg font-medium text-gray-900 mb-1">No content yet</h3>
                <p className="text-gray-500 text-sm">Published content will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentPublished.map((item) => (
                  <Link key={item._id} to={`/content/${item._id}`}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-blue-50 transition-colors group border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                          {item.type.replace(/_/g, ' ')}
                        </span>
                        {item.subject && <span className="text-xs text-gray-400">{item.subject}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                      {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, gradient, subtitle }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <p className="text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">
          {value ?? 0}
        </p>
      </div>
      <p className="text-sm font-medium text-gray-600 uppercase tracking-wider capitalize">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}