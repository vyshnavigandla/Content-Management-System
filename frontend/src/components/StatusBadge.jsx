// components/StatusBadge.jsx
// Small colored pill showing a content item's workflow status.

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-600',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  archived: 'bg-gray-200 text-gray-500',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  published: 'Published',
  rejected: 'Rejected',
  archived: 'Archived',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}