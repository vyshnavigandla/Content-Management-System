// components/ContentCard.jsx
// A card representing one content item. Shows different action buttons
// depending on the user's role and the item's status.

import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const TYPE_LABELS = {
  notice: 'Notice',
  circular: 'Circular',
  event: 'Event',
  exam_schedule: 'Exam Schedule',
  study_material: 'Study Material',
  placement_update: 'Placement Update',
  achievement: 'Achievement',
};

const TYPE_COLORS = {
  notice: 'from-blue-500 to-cyan-500 text-blue-700 bg-blue-100',
  circular: 'from-purple-500 to-pink-500 text-purple-700 bg-purple-100',
  event: 'from-orange-500 to-red-500 text-orange-700 bg-orange-100',
  exam_schedule: 'from-yellow-500 to-amber-500 text-yellow-700 bg-yellow-100',
  study_material: 'from-green-500 to-emerald-500 text-green-700 bg-green-100',
  placement_update: 'from-indigo-500 to-blue-500 text-indigo-700 bg-indigo-100',
  achievement: 'from-pink-500 to-rose-500 text-pink-700 bg-pink-100',
};

const TYPE_ICONS = {
  notice: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  circular: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  event: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  exam_schedule: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  study_material: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  placement_update: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  achievement: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
};

export default function ContentCard({ content, showStatus = true, actions = null }) {
  const typeColor = TYPE_COLORS[content.type] || 'from-gray-500 to-slate-500 text-gray-700 bg-gray-100';
  const typeIcon = TYPE_ICONS[content.type] || null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-gradient-to-r ${typeColor.split(' ').slice(0, 2).join(' ')} bg-opacity-10`}>
            <span className="text-current opacity-75">{typeIcon}</span>
            {TYPE_LABELS[content.type] || content.type}
          </span>
          <h3 className="text-base font-semibold text-gray-900 mt-2 leading-snug">
            <Link 
              to={`/content/${content._id}`} 
              className="hover:text-blue-600 transition-colors duration-200 line-clamp-2"
            >
              {content.title}
            </Link>
          </h3>
        </div>
        {showStatus && <StatusBadge status={content.status} size="xs" />}
      </div>

      {/* Study Material Details */}
      {content.type === 'study_material' && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {content.subject && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {content.subject}
            </span>
          )}
          {content.semester && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Semester {content.semester}
            </span>
          )}
        </div>
      )}

      {/* Author */}
      {content.createdBy?.name && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {content.createdBy.name[0]?.toUpperCase() || '?'}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {content.createdBy.name}
            {content.createdBy.designation && (
              <span className="text-gray-400 ml-1">({content.createdBy.designation})</span>
            )}
          </p>
        </div>
      )}

      {/* Attachments Count */}
      {content.attachments?.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="text-xs text-gray-500">
            {content.attachments.length} attachment{content.attachments.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          {actions}
        </div>
      )}
    </div>
  );
}