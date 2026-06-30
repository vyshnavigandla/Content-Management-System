// components/ContentCard.jsx
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DOMPurify from 'dompurify';

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
  notice: 'text-blue-700 bg-blue-100',
  circular: 'text-purple-700 bg-purple-100',
  event: 'text-pink-700 bg-pink-100',
  exam_schedule: 'text-orange-700 bg-orange-100',
  study_material: 'text-green-700 bg-green-100',
  placement_update: 'text-indigo-700 bg-indigo-100',
  achievement: 'text-yellow-700 bg-yellow-100',
};

export default function ContentCard({ content, showStatus = true, onDelete, actions = null }) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { user } = useAuth();

  const isOwner = user?._id === content.createdBy?._id;
  const isHOD = user?.role === 'hod';

  const canDelete =
    isHOD ||
    (isOwner && ['draft', 'rejected'].includes(content.status));

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const params = isHOD && content.status === 'published' ? '?confirm=true' : '';
      await api.delete(`/content/${content._id}${params}`);
      setShowConfirm(false);
      if (onDelete) onDelete(content._id);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete content');
    } finally {
      setDeleting(false);
    }
  };

  const getPlainText = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const plainTextBody = getPlainText(content.body);
  const shouldTruncate = plainTextBody.length > 300;

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
  };

  // ✅ FIXED: Handle all file path formats correctly
  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // If it already starts with /uploads/, just add the base
    if (filePath.startsWith('/uploads/')) {
      return `${cleanBase}${filePath}`;
    }
    
    // If it starts with uploads/ (no leading slash), add slash
    if (filePath.startsWith('uploads/')) {
      return `${cleanBase}/${filePath}`;
    }
    
    // Default: assume it's a filename and add uploads/
    return `${cleanBase}/uploads/${filePath}`;
  };

  const imageAttachments = content.attachments?.filter(f => isImageFile(f)) || [];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${TYPE_COLORS[content.type] || 'text-gray-700 bg-gray-100'}`}>
            {TYPE_LABELS[content.type] || content.type}
          </span>
          <h3 className="text-base font-semibold text-gray-900 mt-2 leading-snug">
            <Link to={`/content/${content._id}`} className="hover:text-blue-600 transition-colors line-clamp-2">
              {content.title}
            </Link>
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showStatus && <StatusBadge status={content.status} size="xs" />}
          {canDelete && (
            <button
              onClick={() => setShowConfirm(true)}
              className={`transition-colors p-1 rounded ${
                isHOD 
                  ? 'text-red-500 hover:text-red-700 hover:bg-red-50' 
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              }`}
              title={isHOD ? 'Delete content (HOD)' : 'Delete content'}
            >
              <span className="text-sm font-bold">×</span>
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Content</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>"{content.title}"</strong>?
              {content.status === 'published' && (
                <span className="block mt-2 text-red-600">This is published content and will be permanently removed!</span>
              )}
              {isHOD && !isOwner && (
                <span className="block mt-2 text-orange-600">You are deleting content uploaded by <strong>{content.createdBy?.name}</strong></span>
              )}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)} 
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {content.body && (
        <div className="mb-4 mt-2">
          <div 
            className="prose prose-sm max-w-none text-gray-700 
              prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-1.5
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-em:text-gray-700
              prose-ul:list-disc prose-ul:pl-5 prose-ul:my-1.5
              prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-1.5
              prose-li:text-gray-700 prose-li:my-0.5
              prose-a:text-blue-600 prose-a:underline prose-a:hover:text-blue-800
              prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:text-gray-600
              prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(content.body, {
                ALLOWED_TAGS: [
                  'p', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                  'ul', 'ol', 'li', 'a', 'br', 'div', 'span', 'table', 'thead', 
                  'tbody', 'tr', 'td', 'th', 'img', 'b', 'i', 'u', 'strike', 
                  'blockquote', 'code', 'pre', 'hr', 'sub', 'sup'
                ],
                ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'style', 'rel', 'id']
              })
            }} 
          />
        </div>
      )}

      {content.body && shouldTruncate && (
        <Link 
          to={`/content/${content._id}`}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-block mb-3 hover:underline"
        >
          Read full content →
        </Link>
      )}

      {imageAttachments.length > 0 && (
        <div className="mb-3">
          <div className="grid grid-cols-3 gap-2">
            {imageAttachments.slice(0, 3).map((file, idx) => {
              const fileUrl = getFileUrl(file);
              return (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img 
                    src={fileUrl} 
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          Image
                        </div>
                      `;
                    }}
                  />
                </div>
              );
            })}
            {imageAttachments.length > 3 && (
              <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-500">
                +{imageAttachments.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {content.type === 'study_material' && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {content.subject && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
              {content.subject}
            </span>
          )}
          {content.semester && (
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
              Semester {content.semester}
            </span>
          )}
        </div>
      )}

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
            {isHOD && !isOwner && (
              <span className="ml-2 text-xs text-orange-500 font-medium">(Faculty Content)</span>
            )}
          </p>
        </div>
      )}

      <div className="flex items-center text-xs text-gray-400 mb-3">
        <span>{new Date(content.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })}</span>
      </div>

      {content.attachments?.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
          <span className="text-gray-400 font-bold text-sm">📎</span>
          <span className="text-xs text-gray-500">
            {content.attachments.length} attachment{content.attachments.length !== 1 ? 's' : ''}
            {imageAttachments.length > 0 && ` (${imageAttachments.length} image${imageAttachments.length !== 1 ? 's' : ''})`}
          </span>
        </div>
      )}

      {actions && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          {actions}
        </div>
      )}
    </div>
  );
}