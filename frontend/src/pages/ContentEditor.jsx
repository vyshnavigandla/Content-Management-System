// pages/ContentEditor.jsx
// FIX: Featured image preview, attachment preview, and proper file handling
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import RichTextEditor from '../components/RichTextEditor';

const TYPES = [
  { value: 'notice', label: 'Notice' },
  { value: 'circular', label: 'Circular' },
  { value: 'event', label: 'Event' },
  { value: 'exam_schedule', label: 'Exam Schedule' },
  { value: 'study_material', label: 'Study Material' },
  { value: 'placement_update', label: 'Placement Update' },
  { value: 'achievement', label: 'Achievement' },
];

const generateSlug = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const htmlWordCount = (html) => {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
};

const getFileUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${baseUrl}${filePath}`;
};

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const [form, setForm] = useState({ title: '', body: '', type: 'notice', subject: '', semester: '', tags: '', excerpt: '' });
  const [seo, setSeo] = useState({ metaTitle: '', metaDescription: '', metaKeywords: '', slug: '' });
  const [showSEO, setShowSEO] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [featuredImage, setFeaturedImage] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
  const [existingFeaturedImage, setExistingFeaturedImage] = useState(null);
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditMode) return;
    api.get(`/content/${id}`)
      .then((res) => {
        const d = res.data.data;
        setExisting(d);
        setForm({ title: d.title, body: d.body, type: d.type, subject: d.subject || '', semester: d.semester || '', tags: (d.tags || []).join(', '), excerpt: d.excerpt || '' });
        setSeo({ metaTitle: d.seo?.metaTitle || d.title || '', metaDescription: d.seo?.metaDescription || '', metaKeywords: (d.seo?.metaKeywords || []).join(', '), slug: d.seo?.slug || generateSlug(d.title) });
        if (d.featuredImage) {
          setExistingFeaturedImage(d.featuredImage);
          setFeaturedImagePreview(getFileUrl(d.featuredImage));
        }
        if (d.attachments) {
          setFiles(d.attachments);
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load content'))
      .finally(() => setLoading(false));
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'title' && autoGenerateSlug) setSeo((prev) => ({ ...prev, slug: generateSlug(value) }));
  };

  const handleSeoChange = (e) => {
    const { name, value } = e.target;
    setSeo({ ...seo, [name]: value });
    if (name === 'slug') setAutoGenerateSlug(false);
  };

  // ✅ Featured Image Handler with Preview
  const handleFeaturedImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeaturedImage(file);
      setExistingFeaturedImage(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeaturedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFeaturedImage = () => {
    setFeaturedImage(null);
    setExistingFeaturedImage(null);
    setFeaturedImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ✅ Attachments Handler with Preview
  const handleAttachmentsChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 5) {
      setError('Maximum 5 attachments allowed');
      return;
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => [...prev, {
          name: file.name,
          size: file.size,
          type: file.type,
          preview: reader.result,
          isImage: file.type.startsWith('image/'),
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const buildFormData = () => {
    const data = new FormData();
    data.append('title', form.title);
    data.append('body', form.body);
    data.append('type', form.type);
    if (form.tags) data.append('tags', form.tags);
    if (form.excerpt) data.append('excerpt', form.excerpt);
    if (form.type === 'study_material') {
      if (form.subject) data.append('subject', form.subject);
      if (form.semester) data.append('semester', form.semester);
    }
    data.append('metaTitle', seo.metaTitle);
    data.append('metaDescription', seo.metaDescription);
    data.append('metaKeywords', seo.metaKeywords);
    data.append('slug', seo.slug || generateSlug(form.title));
    
    // Featured Image
    if (featuredImage) {
      data.append('featuredImage', featuredImage);
    }
    if (existingFeaturedImage && !featuredImage) {
      data.append('existingFeaturedImage', existingFeaturedImage);
    }
    
    // Attachments
    const newFiles = files.filter(f => typeof f !== 'string');
    newFiles.forEach((file) => data.append('attachments', file));
    
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEditMode) {
        await api.put(`/content/${id}`, buildFormData(), { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/content', buildFormData(), { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/content');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setError('');
    setSaving(true);
    try {
      let contentId = id;
      if (isEditMode) {
        await api.put(`/content/${id}`, buildFormData(), { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const res = await api.post('/content', buildFormData(), { headers: { 'Content-Type': 'multipart/form-data' } });
        contentId = res.data.data._id;
      }
      await api.put(`/content/${contentId}/submit`);
      navigate('/content');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit for approval');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><p className="text-gray-500">Loading editor...</p></div>;

  const isLocked = existing && !['draft', 'rejected'].includes(existing.status);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? 'Edit Content' : 'Create New Content'}</h1>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg"><p className="text-sm text-red-700">{error}</p></div>}

      {existing?.status === 'rejected' && existing.reviewRemarks && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
          <p className="text-sm font-semibold text-yellow-800 mb-1">Rejection Feedback</p>
          <p className="text-sm text-yellow-700">{existing.reviewRemarks}</p>
        </div>
      )}

      {isLocked ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <p className="text-gray-600">Content with status <strong>{existing.status.replace('_', ' ')}</strong> cannot be edited.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="Enter content title..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Study Material Fields */}
          {form.type === 'study_material' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Data Structures"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <input name="semester" type="number" value={form.semester} onChange={handleChange} placeholder="e.g. 5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body / Description</label>
            <RichTextEditor value={form.body} onChange={(content) => setForm({ ...form, body: content })} placeholder="Write your content here..." />
            <p className="text-xs text-gray-400 mt-1 text-right">~{htmlWordCount(form.body)} words</p>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt / Summary</label>
            <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows="3" maxLength="300"
              placeholder="Brief summary of your content"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.excerpt.length}/300</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. exam, important, 2025"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
          </div>

          {/* ✅ Featured Image with Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
            {featuredImagePreview ? (
              <div className="relative border rounded-xl overflow-hidden bg-gray-50">
                <img
                  src={featuredImagePreview}
                  alt="Featured"
                  className="w-full max-h-64 object-contain"
                />
                <button
                  type="button"
                  onClick={removeFeaturedImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div 
                className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors bg-gray-50 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600">Click to upload featured image</p>
                  <p className="text-xs text-gray-400">JPG, PNG, GIF, WEBP (Max 5MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
            {featuredImage && typeof featuredImage === 'object' && (
              <p className="text-xs text-green-600 mt-1">✅ {featuredImage.name} selected</p>
            )}
            {existingFeaturedImage && !featuredImage && (
              <p className="text-xs text-blue-600 mt-1">📷 Current image: {existingFeaturedImage.split('/').pop()}</p>
            )}
          </div>

          {/* ✅ Attachments with Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (max 5)</label>
            <div 
              className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors bg-gray-50 cursor-pointer"
              onClick={() => attachmentInputRef.current?.click()}
            >
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <p className="text-sm text-gray-600">Click to upload files (max 5)</p>
                <p className="text-xs text-gray-400">PDF, DOC, DOCX, PPT, PPTX, JPG, PNG (Max 10MB each)</p>
              </div>
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleAttachmentsChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            
            {/* Attachment Previews */}
            {(filePreviews.length > 0 || (files.length > 0 && files.some(f => typeof f === 'string'))) && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected Files ({files.filter(f => typeof f !== 'string').length + (files.filter(f => typeof f === 'string').length)}/5)</p>
                {filePreviews.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 min-w-0">
                      {file.isImage ? (
                        <img src={file.preview} alt={file.name} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {/* Existing attachments from server */}
                {files.filter(f => typeof f === 'string').map((file, index) => (
                  <div key={`existing-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 truncate">{file.split('/').pop()}</p>
                        <p className="text-xs text-blue-500">Existing file</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO Settings */}
          <div className="border-t pt-6">
            <button type="button" onClick={() => setShowSEO(!showSEO)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
              {showSEO ? '▾' : '▸'} 📢 SEO Settings (Optional)
            </button>

            {showSEO && (
              <div className="mt-4 bg-blue-50 rounded-xl border border-blue-200 p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🔗 URL Slug</label>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-l-lg border border-r-0 border-gray-200">{window.location.origin}/content/</span>
                    <input name="slug" value={seo.slug} onChange={handleSeoChange} placeholder="e.g. holiday-notice-2024"
                      className="flex-1 border border-gray-200 rounded-r-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📰 Meta Title</label>
                  <input name="metaTitle" value={seo.metaTitle} onChange={handleSeoChange} placeholder="e.g. Holiday Notice 2024 | CS Department"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  <p className="text-xs text-gray-400 mt-1">{seo.metaTitle.length} chars (aim for 50–60)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📝 Meta Description</label>
                  <textarea name="metaDescription" value={seo.metaDescription} onChange={handleSeoChange} rows="2"
                    placeholder="Brief description for search engines"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                  <p className="text-xs text-gray-400 mt-1">{seo.metaDescription.length} chars (aim for 150–160)</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition-all">
              {saving ? 'Saving...' : '💾 Save as Draft'}
            </button>
            <button type="button" onClick={handleSubmitForApproval} disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-lg">
              {saving ? 'Submitting...' : '📤 Save & Submit for Approval'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}