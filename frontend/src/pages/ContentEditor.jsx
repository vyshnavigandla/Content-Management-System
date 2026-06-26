// pages/ContentEditor.jsx
// FIX: handleSubmitForApproval previously called save then submit with no
// guard between them — if save failed, submit still ran. Now each step
// is awaited independently and errors abort the chain.
// Also added tags field to the form (supported by backend).

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const TYPES = [
  { value: 'notice',           label: 'Notice' },
  { value: 'circular',         label: 'Circular' },
  { value: 'event',            label: 'Event' },
  { value: 'exam_schedule',    label: 'Exam Schedule' },
  { value: 'study_material',   label: 'Study Material' },
  { value: 'placement_update', label: 'Placement Update' },
  { value: 'achievement',      label: 'Achievement' },
];

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    title:    '',
    body:     '',
    type:     'notice',
    subject:  '',
    semester: '',
    tags:     '',
  });
  const [files, setFiles]     = useState([]);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading]   = useState(isEditMode);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!isEditMode) return;
    api
      .get(`/content/${id}`)
      .then((res) => {
        const d = res.data.data;
        setExisting(d);
        setForm({
          title:    d.title,
          body:     d.body,
          type:     d.type,
          subject:  d.subject  || '',
          semester: d.semester || '',
          tags:     (d.tags || []).join(', '),
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load content'))
      .finally(() => setLoading(false));
  }, [id, isEditMode]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const buildFormData = () => {
    const data = new FormData();
    data.append('title', form.title);
    data.append('body',  form.body);
    data.append('type',  form.type);
    if (form.tags) data.append('tags', form.tags);
    if (form.type === 'study_material') {
      if (form.subject)  data.append('subject',  form.subject);
      if (form.semester) data.append('semester', form.semester);
    }
    files.forEach((file) => data.append('attachments', file));
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEditMode) {
        await api.put(`/content/${id}`, buildFormData(), {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/content', buildFormData(), {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      navigate('/content');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // FIX: if the save fails, we stop and show the error rather than
  // proceeding to submit broken/stale content.
  const handleSubmitForApproval = async () => {
    setError('');
    setSaving(true);
    try {
      // Step 1: save current edits
      await api.put(`/content/${id}`, buildFormData(), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Step 2: only submit if save succeeded
      await api.put(`/content/${id}/submit`);
      navigate('/content');
    } catch (err) {
      // Show exactly which step failed
      setError(err.response?.data?.message || 'Failed to submit for approval');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-lg">Loading content editor...</p>
        </div>
      </div>
    );
  }

  const isLocked = existing && !['draft', 'rejected'].includes(existing.status);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Content' : 'Create New Content'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode
            ? 'Update your content and resubmit for approval'
            : 'Create and publish new department content'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Rejection notice */}
      {existing?.status === 'rejected' && existing.reviewRemarks && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
          <p className="text-sm font-semibold text-yellow-800 mb-1">Rejection Feedback</p>
          <p className="text-sm text-yellow-700">{existing.reviewRemarks}</p>
          <p className="text-xs text-yellow-600 mt-2">
            Editing will reset status to draft so you can resubmit.
          </p>
        </div>
      )}

      {/* Locked notice */}
      {isLocked ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <p className="text-gray-600">
            Content with status <strong>{existing.status.replace('_', ' ')}</strong> cannot be edited.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8 space-y-6">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Enter content title..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Study material extras */}
          {form.type === 'study_material' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g. Data Structures"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                />
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body / Description</label>
            <textarea
              name="body"
              value={form.body}
              onChange={handleChange}
              required
              rows={8}
              placeholder="Write your content here..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white resize-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.body.length} characters</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g. exam, important, 2025"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors bg-gray-50">
              <div className="text-center pointer-events-none">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, PPT, Images (max 5 files, 10 MB each)</p>
              </div>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles([...e.target.files])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {Array.from(files).map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-sm">
                    <span className="text-gray-700 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-600 text-xs ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {existing?.attachments?.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  Existing attachments ({existing.attachments.length}) — new files will be added to these.
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition-all"
            >
              {saving ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-500/25"
              >
                {saving ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                {saving ? 'Submitting...' : 'Save & Submit for Approval'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}