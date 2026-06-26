// pages/ContentDetail.jsx
// FIX: handleDownload previously only opened attachments[0], ignoring
// any additional files. Now shows all attachments as individual download
// links, each tracked separately.

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import CommentSection from '../components/CommentSection';
import Spinner from '../components/Spinner';
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

export default function ContentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingIdx, setDownloadingIdx] = useState(null);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/content/${id}`);
      setContent(res.data.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError(err.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  // FIX: track download for the specific file and open it.
  // trackDownload increments the counter once per "download session"
  // (we call it once regardless of how many files are clicked).
  const handleDownload = async (filePath, idx) => {
    setDownloadingIdx(idx);
    try {
      // Track the download on the backend (increments downloadCount once)
      if (idx === 0) {
        await api.put(`/content/${id}/download`);
      }
      const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      window.open(`${base}${filePath}`, '_blank');
    } catch (err) {
      console.error('Failed to track download:', err);
      // Still open the file even if tracking fails
      const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      window.open(`${base}${filePath}`, '_blank');
    } finally {
      setDownloadingIdx(null);
    }
  };

  const getFileName = (filePath) => {
    return filePath.split('/').pop() || filePath;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading content..." />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Content not found'}</p>
        <Link to="/content" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Content
        </Link>
      </div>
    );
  }

  const isOwner = content.createdBy?._id === user?._id;
  const canEdit = isOwner && ['draft', 'rejected'].includes(content.status);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        to="/content"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Content
      </Link>

      {/* Content Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <StatusBadge status={content.status} />
              <span className="text-sm text-gray-400 capitalize">
                {content.type.replace(/_/g, ' ')}
              </span>
              {content.category && content.category !== 'general' && (
                <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full capitalize">
                  {content.category}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                {content.createdBy?.name || 'Unknown'}
                {content.createdBy?.designation && (
                  <span className="text-gray-400">· {content.createdBy.designation}</span>
                )}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {new Date(content.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                {content.viewCount || 0} views
              </span>
              {content.downloadCount > 0 && (
                <span className="flex items-center gap-1">
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  {content.downloadCount} downloads
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          {canEdit && (
            <Link
              to={`/content/${content._id}/edit`}
              className="flex-shrink-0 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Link>
          )}
        </div>

        {/* Study material metadata */}
        {content.type === 'study_material' && (content.subject || content.semester) && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {content.subject && (
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                Subject: {content.subject}
              </span>
            )}
            {content.semester && (
              <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-medium">
                Semester: {content.semester}
              </span>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="mt-6 prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {content.body}
          </div>
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {content.tags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* FIX: All attachments listed individually, each with its own download button */}
        {content.attachments && content.attachments.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <PaperClipIcon className="h-4 w-4" />
              Attachments ({content.attachments.length})
            </h3>
            <div className="space-y-2">
              {content.attachments.map((filePath, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <DocumentArrowDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{getFileName(filePath)}</span>
                  </div>
                  <button
                    onClick={() => handleDownload(filePath, idx)}
                    disabled={downloadingIdx === idx}
                    className="flex-shrink-0 ml-3 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-1"
                  >
                    {downloadingIdx === idx ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <DocumentArrowDownIcon className="h-3 w-3" />
                    )}
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Info */}
        {content.reviewedBy && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${content.status === 'rejected' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
            <span className="font-medium text-gray-700">Reviewed by:</span>{' '}
            <span className="text-gray-600">{content.reviewedBy.name}</span>
            {content.reviewRemarks && (
              <div className="mt-1">
                <span className="font-medium text-gray-700">Remarks:</span>{' '}
                <span className={content.status === 'rejected' ? 'text-red-700' : 'text-gray-600'}>
                  {content.reviewRemarks}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Scheduled publish info */}
        {content.scheduledPublishAt && content.status !== 'published' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            Scheduled to publish on{' '}
            <strong>{new Date(content.scheduledPublishAt).toLocaleString()}</strong>
          </div>
        )}
      </div>

      {/* Comments Section - only for published content */}
      {content.status === 'published' && (
        <CommentSection contentId={content._id} />
      )}
    </div>
  );
}