// pages/ContentDetail.jsx
// Detail view for a single content item - shows full body, attachments
// (with download tracking), and review remarks if rejected/approved.

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '');

export default function ContentDetail() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/content/${id}`)
      .then((res) => setContent(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load content'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async (path) => {
    // Fire-and-forget: increment the download counter, then open the file
    try {
      await api.put(`/content/${id}/download`);
    } catch {
      // Even if tracking fails, still let the user download the file
    }
    window.open(`${API_BASE}${path}`, '_blank');
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!content) return null;

  return (
    <div className="max-w-2xl">
      <Link to="/content" className="text-sm text-blue-600 hover:underline">
        &larr; Back to content
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-blue-600 uppercase">
            {content.type.replace('_', ' ')}
          </span>
          <StatusBadge status={content.status} />
        </div>

        <h1 className="text-2xl font-semibold text-gray-800">{content.title}</h1>

        {content.type === 'study_material' && (
          <p className="text-sm text-gray-500 mt-1">
            {content.subject} {content.semester ? `· Semester ${content.semester}` : ''}
          </p>
        )}

        <p className="text-sm text-gray-400 mt-1">
          By {content.createdBy?.name} ({content.createdBy?.role})
          {content.publishedAt && ` · Published ${new Date(content.publishedAt).toLocaleDateString()}`}
        </p>

        <div className="prose prose-sm mt-4 text-gray-700 whitespace-pre-wrap">{content.body}</div>

        {content.attachments?.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Attachments</h2>
            <ul className="space-y-1">
              {content.attachments.map((path, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleDownload(path)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {path.split('/').pop()}
                  </button>
                </li>
              ))}
            </ul>
            {typeof content.downloadCount === 'number' && (
              <p className="text-xs text-gray-400 mt-1">Downloads: {content.downloadCount}</p>
            )}
          </div>
        )}

        {content.status === 'rejected' && content.reviewRemarks && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            <strong>Rejection remarks:</strong> {content.reviewRemarks}
          </div>
        )}

        {content.status === 'published' && content.reviewedBy?.name && (
          <p className="text-xs text-gray-400 mt-3">
            Approved by {content.reviewedBy.name}
            {content.reviewRemarks ? ` — "${content.reviewRemarks}"` : ''}
          </p>
        )}
      </div>
    </div>
  );
}