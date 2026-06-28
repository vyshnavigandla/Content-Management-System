// pages/ContentDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import CommentSection from '../components/CommentSection';
import Spinner from '../components/Spinner';
import DOMPurify from 'dompurify';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  PaperClipIcon,
  PhotoIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

export default function ContentDetail() {
  const { id, slug } = useParams(); // Support both id and slug
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingIdx, setDownloadingIdx] = useState(null);

  // Determine if we're using slug or id
  const isSlug = slug !== undefined;
  const identifier = isSlug ? slug : id;

  useEffect(() => {
    fetchContent();
  }, [identifier, isSlug]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      let res;
      if (isSlug) {
        // Fetch by slug (SEO-friendly URL)
        res = await api.get(`/content/slug/${identifier}`);
      } else {
        // Fetch by ID (fallback)
        res = await api.get(`/content/${identifier}`);
      }
      setContent(res.data.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError(err.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filePath, idx) => {
    const contentId = content?._id;
    if (!contentId) return;
    
    setDownloadingIdx(idx);
    try {
      if (idx === 0) {
        await api.put(`/content/${contentId}/download`);
      }
      const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      window.open(`${base}${filePath}`, '_blank');
    } catch (err) {
      console.error('Failed to track download:', err);
      const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      window.open(`${base}${filePath}`, '_blank');
    } finally {
      setDownloadingIdx(null);
    }
  };

  const getFileName = (filePath) => {
    return filePath.split('/').pop() || filePath;
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <PhotoIcon className="h-5 w-5 text-green-500" />;
    }
    if (['pdf'].includes(ext)) {
      return <DocumentIcon className="h-5 w-5 text-red-500" />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <DocumentIcon className="h-5 w-5 text-blue-500" />;
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return <DocumentIcon className="h-5 w-5 text-green-600" />;
    }
    return <PaperClipIcon className="h-5 w-5 text-gray-400" />;
  };

  const isImageFile = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  };

  const getFileUrl = (filePath) => {
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    return `${base}${filePath}`;
  };

  // SEO Meta Data
  const seoTitle = content?.seo?.metaTitle || content?.title || 'Content';
  const seoDescription = content?.seo?.metaDescription || content?.excerpt || `${seoTitle} - Department CMS`;
  const seoKeywords = content?.seo?.metaKeywords?.join(', ') || '';
  const seoSlug = content?.seo?.slug || '';
  const featuredImageUrl = content?.featuredImage ? getFileUrl(content.featuredImage) : '';

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
    <>
      {/* ✅ SEO Meta Tags */}
      <Helmet>
        <title>{seoTitle} | Department CMS</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <link rel="canonical" href={`${window.location.origin}/content/${seoSlug || content._id}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={window.location.href} />
        {featuredImageUrl && (
          <meta property="og:image" content={featuredImageUrl} />
        )}
        <meta property="og:site_name" content="Department CMS" />
        <meta property="article:published_time" content={content.publishedAt || content.createdAt} />
        <meta property="article:modified_time" content={content.updatedAt} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {featuredImageUrl && (
          <meta name="twitter:image" content={featuredImageUrl} />
        )}
        
        {/* Additional SEO */}
        {content.tags && content.tags.length > 0 && (
          <meta name="news_keywords" content={content.tags.join(', ')} />
        )}
      </Helmet>

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
          <div className="mt-6">
            {content.body ? (
              <div 
                className="prose prose-sm max-w-none text-gray-700
                  prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                  prose-h1:text-2xl prose-h1:font-bold
                  prose-h2:text-xl prose-h2:font-semibold
                  prose-h3:text-lg prose-h3:font-semibold
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-2
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-em:text-gray-700
                  prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
                  prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
                  prose-li:text-gray-700 prose-li:my-0.5
                  prose-a:text-blue-600 prose-a:underline prose-a:hover:text-blue-800
                  prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:text-gray-600 prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:rounded-r
                  prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                  prose-table:border-collapse prose-table:w-full
                  prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:p-2 prose-th:text-left
                  prose-td:border prose-td:border-gray-300 prose-td:p-2
                  prose-img:rounded-lg prose-img:max-w-full prose-img:my-4
                  [&_*]:max-w-full"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(content.body, {
                    ALLOWED_TAGS: [
                      'p', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                      'ul', 'ol', 'li', 'a', 'br', 'div', 'span', 'table', 'thead', 
                      'tbody', 'tr', 'td', 'th', 'img', 'b', 'i', 'u', 'strike', 
                      'blockquote', 'code', 'pre', 'hr', 'sub', 'sup', 'section',
                      'article', 'header', 'footer', 'main', 'aside', 'figure',
                      'figcaption', 'mark', 'small', 'time', 'address'
                    ],
                    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'style', 'rel', 'id', 'title'],
                    ALLOW_DATA_ATTR: false,
                  })
                }} 
              />
            ) : (
              <p className="text-gray-500 italic">No content body</p>
            )}
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

          {/* Attachments */}
          {content.attachments && content.attachments.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <PaperClipIcon className="h-4 w-4" />
                Attachments ({content.attachments.length})
              </h3>
              <div className="space-y-3">
                {content.attachments.map((filePath, idx) => {
                  const fileName = getFileName(filePath);
                  const fileUrl = getFileUrl(filePath);
                  const isImage = isImageFile(fileName);
                  
                  return (
                    <div
                      key={idx}
                      className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          {getFileIcon(fileName)}
                          <span className="text-sm text-gray-700 truncate">{fileName}</span>
                        </div>
                        <button
                          onClick={() => handleDownload(filePath, idx)}
                          disabled={downloadingIdx === idx}
                          className="flex-shrink-0 ml-3 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-1"
                        >
                          {downloadingIdx === idx ? (
                            <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <ArrowDownTrayIcon className="h-3 w-3" />
                          )}
                          Download
                        </button>
                      </div>
                      
                      {isImage && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={fileUrl}
                            alt={fileName}
                            className="w-full max-h-64 object-contain bg-white"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div class="p-4 text-center text-gray-400 text-sm">
                                  <PhotoIcon class="h-8 w-8 mx-auto mb-1" />
                                  Failed to load image
                                </div>
                              `;
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
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
    </>
  );
}