// pages/Profile.jsx
// Faculty/HOD self-service profile editor.

import { useEffect, useState } from 'react';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '');

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    qualifications: '',
    researchInterests: '',
    publications: '',
    bio: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api
      .get('/profiles/me')
      .then((res) => {
        const p = res.data.data;
        setProfile(p);
        setForm({
          qualifications: (p.qualifications || []).join(', '),
          researchInterests: (p.researchInterests || []).join(', '),
          publications: (p.publications || []).join(', '),
          bio: p.bio || '',
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('qualifications', form.qualifications);
      data.append('researchInterests', form.researchInterests);
      data.append('publications', form.publications);
      data.append('bio', form.bio);
      if (photoFile) data.append('photo', photoFile);

      const res = await api.put('/profiles/me', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(res.data.data);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">My Profile</h1>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-4">
          {profile?.photo ? (
            <img src={`${API_BASE}${profile.photo}`} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-semibold">
              {profile?.user?.name?.[0]}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-800">{profile?.user?.name}</p>
            <p className="text-xs text-gray-500 uppercase">{profile?.user?.designation || profile?.user?.role}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Profile Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="text-sm" />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            maxLength={1000}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Qualifications (comma-separated)</label>
          <input
            name="qualifications"
            value={form.qualifications}
            onChange={handleChange}
            placeholder="Ph.D. in CSE, M.Tech"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Research Interests (comma-separated)</label>
          <input
            name="researchInterests"
            value={form.researchInterests}
            onChange={handleChange}
            placeholder="Machine Learning, IoT"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Publications (comma-separated)</label>
          <input
            name="publications"
            value={form.publications}
            onChange={handleChange}
            placeholder="A Study on Neural Networks, 2022"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}