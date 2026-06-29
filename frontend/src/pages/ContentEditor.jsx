// pages/ContentEditor.jsx
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

const TARGET_AUDIENCE = [
  { value: 'ug', label: '🎓 UG Students' },
  { value: 'pg', label: '📚 PG Students' },
  { value: 'both', label: '👥 Both UG & PG' },
];

const htmlWordCount = (html) => {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
};

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const attachmentInputRef = useRef(null);

  const [form, setForm] = useState({ 
    title: '', 
    body: '', 
    type: 'notice',
    targetAudience: 'both',
    subject: '', 
    semester: '', 
    tags: '', 
    excerpt: '' 
  });
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isEditMode) return;
    api.get(`/content/${id}`)
      .then((res) => {
        const d = res.data.data;
        setExisting(d);
        setForm({ 
          title: d.title, 
          body: d.body, 
          type: d.type,
          targetAudience: d.targetAudience || 'both',
          subject: d.subject || '', 
          semester: d.semester || '', 
          tags: (d.tags || []).join(', '), 
          excerpt: d.excerpt || '' 
        });
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
  };

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
    data.append('targetAudience', form.targetAudience);
    if (form.tags) data.append('tags', form.tags);
    if (form.excerpt) data.append('excerpt', form.excerpt);
    if (form.type === 'study_material') {
      if (form.subject) data.append('subject', form.subject);
      if (form.semester) data.append('semester', form.semester);
    }
    
    const newFiles = files.filter(f => typeof f !== 'string');
    newFiles.forEach((file) => data.append('attachments', file));
    
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (isEditMode) {
        await api.put(`/content/${id}`, buildFormData(), { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/content', buildFormData(), { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      
      // ✅ Show appropriate success message
      if (form.type === 'study_material') {
        setSuccess('✅ Study material published successfully!');
        setTimeout(() => navigate('/content'), 1500);
      } else {
        setSuccess('✅ Content saved as draft!');
        setTimeout(() => navigate('/content'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Only show submit for approval for non-study materials
  const handleSubmitForApproval = async () => {
    setError('');
    setSuccess('');
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
      setSuccess('✅ Content submitted for approval!');
      setTimeout(() => navigate('/content'), 1500);
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
        <p className="text-sm text-gray-500 mt-1">
          {form.type === 'study_material' ? '📚 Study materials are auto-published immediately' : '📝 Other content requires HOD approval'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg animate-fadeIn">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
            <input 
              name="title" 
              value={form.title} 
              onChange={handleChange} 
              required 
              placeholder="Enter content title..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" 
            />
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type <span className="text-red-500">*</span></label>
            <select 
              name="type" 
              value={form.type} 
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {form.type === 'study_material' && (
              <p className="text-xs text-green-600 mt-1.5">✅ Study materials are published immediately without approval</p>
            )}
            {form.type !== 'study_material' && (
              <p className="text-xs text-yellow-600 mt-1.5">⏳ Other content requires HOD approval before publishing</p>
            )}
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <div className="flex flex-wrap gap-3">
              {TARGET_AUDIENCE.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${
                    form.targetAudience === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetAudience"
                    value={option.value}
                    checked={form.targetAudience === option.value}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Study Material Fields */}
          {form.type === 'study_material' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input 
                  name="subject" 
                  value={form.subject} 
                  onChange={handleChange} 
                  placeholder="e.g. Data Structures"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <input 
                  name="semester" 
                  type="number" 
                  value={form.semester} 
                  onChange={handleChange} 
                  placeholder="e.g. 5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                />
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body / Description <span className="text-red-500">*</span></label>
            <RichTextEditor 
              value={form.body} 
              onChange={(content) => setForm({ ...form, body: content })} 
              placeholder="Write your content here..." 
            />
            <p className="text-xs text-gray-400 mt-1 text-right">~{htmlWordCount(form.body)} words</p>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt / Summary</label>
            <textarea 
              name="excerpt" 
              value={form.excerpt} 
              onChange={handleChange} 
              rows="3" 
              maxLength="300"
              placeholder="Brief summary of your content"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" 
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.excerpt.length}/300</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input 
              name="tags" 
              value={form.tags} 
              onChange={handleChange} 
              placeholder="e.g. exam, important, 2025"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" 
            />
            <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
          </div>

          {/* Attachments */}
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition-all"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                form.type === 'study_material' ? '📚 Publish Study Material' : '💾 Save as Draft'
              )}
            </button>

            {/* ✅ Only show approval button for non-study materials */}
            {form.type !== 'study_material' && (
              <button 
                type="button" 
                onClick={handleSubmitForApproval} 
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-lg"
              >
                {saving ? 'Submitting...' : '📤 Save & Submit for Approval'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}