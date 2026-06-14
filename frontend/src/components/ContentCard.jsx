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

export default function ContentCard({ content, showStatus = true, actions = null }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-medium text-blue-600 uppercase">
            {TYPE_LABELS[content.type] || content.type}
          </span>
          <h3 className="text-base font-semibold text-gray-800 mt-0.5">
            <Link to={`/content/${content._id}`} className="hover:underline">
              {content.title}
            </Link>
          </h3>
          {content.type === 'study_material' && (
            <p className="text-xs text-gray-500 mt-0.5">
              {content.subject} {content.semester ? `· Semester ${content.semester}` : ''}
            </p>
          )}
          {content.createdBy?.name && (
            <p className="text-xs text-gray-400 mt-1">By {content.createdBy.name}</p>
          )}
        </div>
        {showStatus && <StatusBadge status={content.status} />}
      </div>

      {content.attachments?.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">{content.attachments.length} attachment(s)</p>
      )}

      {actions && <div className="flex gap-2 mt-3">{actions}</div>}
    </div>
  );
}