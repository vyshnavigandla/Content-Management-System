// pages/ContentEditor.jsx
// FIX: handleSubmitForApproval now works in create mode too (POST then submit);
// body word count strips HTML tags; <style jsx> replaced with <style>
import { useState, useEffect } from 'react';
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

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({ title: '', body: '', type: 'notice', subject: '', semester: '', tags: '', excerpt: '' });
  const [seo, setSeo] = useState({ metaTitle: '', metaDescription: '', metaKeywords: '', slug: '' });
  const [showSEO, setShowSEO] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [featuredImage, setFeaturedImage] = useState(null);
  const [files, setFiles] = useState([]);
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
        setFeaturedImage(d.featuredImage || null);
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
    if (featuredImage && typeof featuredImage !== 'string') data.append('featuredImage', featuredImage);
    files.forEach((file) => data.append('attachments', file));
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

  // FIX: works for both create and edit mode
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="Enter content title..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body / Description</label>
            <RichTextEditor value={form.body} onChange={(content) => setForm({ ...form, body: content })} placeholder="Write your content here..." />
            {/* FIX: word count from stripped HTML */}
            <p className="text-xs text-gray-400 mt-1 text-right">~{htmlWordCount(form.body)} words</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt / Summary</label>
            <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows="3" maxLength="300"
              placeholder="Brief summary of your content"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.excerpt.length}/300</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. exam, important, 2025"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors bg-gray-50">
              <p className="text-sm text-gray-600 text-center pointer-events-none">Click to upload featured image</p>
              <input type="file" accept="image/*" onChange={(e) => setFeaturedImage(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            {featuredImage && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                <p className="text-sm text-gray-700 flex-1">{typeof featuredImage === 'string' ? featuredImage.split('/').pop() : featuredImage.name}</p>
                <button type="button" onClick={() => setFeaturedImage(null)} className="text-xs text-red-500">Remove</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors bg-gray-50">
              <p className="text-sm text-gray-600 text-center pointer-events-none">Click to upload files (max 5)</p>
              <input type="file" multiple onChange={(e) => setFiles([...e.target.files])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {Array.from(files).map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-sm">
                    <span className="flex-1 truncate">{file.name}</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="text-red-400 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO */}
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

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition-all">
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button type="button" onClick={handleSubmitForApproval} disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-lg">
              {saving ? 'Submitting...' : 'Save & Submit for Approval'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}