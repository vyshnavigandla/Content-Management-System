// pages/ContentEditor.jsx
// Used for BOTH creating new content (route: /content/new) and
// editing an existing draft/rejected item (route: /content/:id/edit).
// Faculty and HOD only.

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const TYPES = [
  { value: 'notice', label: 'Notice' },
  { value: 'circular', label: 'Circular' },
  { value: 'event', label: 'Event' },
  { value: 'exam_schedule', label: 'Exam Schedule' },
  { value: 'study_material', label: 'Study Material' },
  { value: 'placement_update', label: 'Placement Update' },
  { value: 'achievement', label: 'Achievement' },
];

export default function ContentEditor() {
  const { id } = useParams(); // present only when editing
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'notice',
    subject: '',
    semester: '',
  });
  const [files, setFiles] = useState([]);
  const [existing, setExisting] = useState(null); // existing content (edit mode)
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditMode) return;

    api
      .get(`/content/${id}`)
      .then((res) => {
        const data = res.data.data;
        setExisting(data);
        setForm({
          title: data.title,
          body: data.body,
          type: data.type,
          subject: data.subject || '',
          semester: data.semester || '',
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load content'))
      .finally(() => setLoading(false));
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const buildFormData = () => {
    const data = new FormData();
    data.append('title', form.title);
    data.append('body', form.body);
    data.append('type', form.type);
    if (form.type === 'study_material') {
      data.append('subject', form.subject);
      data.append('semester', form.semester);
    }
    files.forEach((file) => data.append('attachments', file));
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const data = buildFormData();

      if (isEditMode) {
        await api.put(`/content/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/content', data, {
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

  const handleSubmitForApproval = async () => {
    setSaving(true);
    setError('');
    try {
      // Save any pending edits first
      await api.put(`/content/${id}`, buildFormData(), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Then move to pending_approval
      await api.put(`/content/${id}/submit`);
      navigate('/content');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit for approval');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  // Once content leaves draft/rejected, it can't be edited (Phase 4 rule)
  const isLocked = existing && !['draft', 'rejected'].includes(existing.status);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">
        {isEditMode ? 'Edit Content' : 'New Content'}
      </h1>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {existing?.status === 'rejected' && existing.reviewRemarks && (
        <div className="mb-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
          <strong>Rejected by HOD:</strong> {existing.reviewRemarks}
          <br />
          Editing this will move it back to draft so you can resubmit.
        </div>
      )}

      {isLocked ? (
        <p className="text-gray-500">
          This content has status <strong>{existing.status}</strong> and can no longer be edited.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {form.type === 'study_material' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Subject</label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g. Data Structures"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Semester</label>
                <input
                  name="semester"
                  type="number"
                  value={form.semester}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-700 mb-1">Body / Description</label>
            <textarea
              name="body"
              value={form.body}
              onChange={handleChange}
              required
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Attachments (PDF, DOC, PPT, images - max 5)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full text-sm"
            />
            {existing?.attachments?.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {existing.attachments.length} file(s) already attached. New files will be added.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-900 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={saving}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                Save &amp; Submit for Approval
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}