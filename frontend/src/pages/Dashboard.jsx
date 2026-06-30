// pages/Dashboard.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const STATUS_COLORS = {
  draft:            'from-gray-400 to-gray-500',
  pending_approval: 'from-yellow-400 to-orange-500',
  published:        'from-green-400 to-emerald-500',
  rejected:         'from-red-400 to-pink-500',
};

const TYPE_COLORS = {
  notice:           'from-blue-500 to-cyan-500',
  circular:         'from-purple-500 to-violet-500',
  event:            'from-pink-500 to-rose-500',
  exam_schedule:    'from-orange-500 to-amber-500',
  study_material:   'from-green-500 to-emerald-500',
  placement_update: 'from-indigo-500 to-blue-500',
  achievement:      'from-yellow-500 to-orange-500',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const endpoint =
      user.role === 'student' ? '/admin/dashboard/student' : '/admin/dashboard';
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
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
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

      {user.role !== 'student' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <StatCard
              label="Total Users"
              value={data.totalUsers}
              gradient="from-blue-500 to-cyan-500"
              icon={<span className="text-white text-xl font-bold">U</span>}
            />
            <StatCard
              label="Faculty (incl. HOD)"
              value={data.totalFaculty}
              gradient="from-purple-500 to-pink-500"
              icon={<span className="text-white text-xl font-bold">F</span>}
            />
            <StatCard
              label="Students"
              value={data.totalStudents}
              gradient="from-green-500 to-emerald-500"
              icon={<span className="text-white text-xl font-bold">S</span>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-lg font-bold">C</span>
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
                  <span className="text-base">→</span>
                </Link>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 text-lg font-bold">A</span>
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

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-lg font-bold">P</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Recently Published</h2>
            </div>
            {!data.recentPublished || data.recentPublished.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nothing published yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentPublished.map((item) => (
                  <Link key={item._id} to={`/content/${item._id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.type === 'study_material' ? 'bg-green-500' : 'bg-blue-400'
                      }`} />
                      <span className="text-sm text-blue-600 group-hover:text-blue-700 font-medium truncate">
                        {item.title}
                      </span>
                      {item.type === 'study_material' && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                          Study
                        </span>
                      )}
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

      {user.role === 'student' && (
        <>
          {data.typeCounts && Object.keys(data.typeCounts).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              {Object.entries(data.typeCounts).map(([type, count]) => (
                <StatCard
                  key={type}
                  label={type.replace(/_/g, ' ')}
                  value={count}
                  gradient={TYPE_COLORS[type] || 'from-gray-500 to-slate-500'}
                  icon={<span className="text-white text-xl font-bold">T</span>}
                />
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-lg font-bold">P</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Recently Published Content</h2>
            </div>
            {!data.recentPublished || data.recentPublished.length === 0 ? (
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
                      <p className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 truncate">
                        {item.title}
                        {item.type === 'study_material' && (
                          <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            Study
                          </span>
                        )}
                      </p>
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