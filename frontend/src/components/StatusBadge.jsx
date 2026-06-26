// components/StatusBadge.jsx
// Small colored pill showing a content item's workflow status.

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  published: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  archived: 'bg-gray-200 text-gray-600 border-gray-300',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  published: 'Published',
  rejected: 'Rejected',
  archived: 'Archived',
};

const STATUS_DOTS = {
  draft: 'bg-gray-400',
  pending_approval: 'bg-yellow-500',
  published: 'bg-green-500',
  rejected: 'bg-red-500',
  archived: 'bg-gray-500',
};

export default function StatusBadge({ status, showDot = true, size = 'sm' }) {
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200'} ${sizeClasses[size] || sizeClasses.sm} transition-all duration-200`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status] || 'bg-gray-400'}`}></span>
      )}
      {STATUS_LABELS[status] || status}
    </span>
  );
}