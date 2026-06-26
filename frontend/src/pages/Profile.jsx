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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your professional profile and portfolio</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              {profile?.photo ? (
                <div className="relative">
                  <img 
                    src={`${API_BASE}${profile.photo}`} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-2xl object-cover shadow-lg ring-4 ring-white"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {profile?.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{profile?.user?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 uppercase">
                  {profile?.user?.designation || profile?.user?.role}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{profile?.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Form Fields Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile Information
          </h3>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Profile Photo
              </span>
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-colors duration-200 cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setPhotoFile(e.target.files[0])} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <div className="text-center">
                    <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-500 group-hover:text-blue-600">
                      {photoFile ? photoFile.name : 'Click to upload photo'}
                    </p>
                  </div>
                </div>
              </label>
              {photoFile && (
                <button
                  type="button"
                  onClick={() => setPhotoFile(null)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                  title="Remove file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Bio
              </span>
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              maxLength={1000}
              placeholder="Write a brief professional bio..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/1000 characters</p>
          </div>

          {/* Qualifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Qualifications
              </span>
            </label>
            <input
              name="qualifications"
              value={form.qualifications}
              onChange={handleChange}
              placeholder="Ph.D. in CSE, M.Tech, B.Tech"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">Separate multiple qualifications with commas</p>
          </div>

          {/* Research Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Research Interests
              </span>
            </label>
            <input
              name="researchInterests"
              value={form.researchInterests}
              onChange={handleChange}
              placeholder="Machine Learning, IoT, Blockchain"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">Separate multiple interests with commas</p>
          </div>

          {/* Publications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Publications
              </span>
            </label>
            <input
              name="publications"
              value={form.publications}
              onChange={handleChange}
              placeholder="A Study on Neural Networks, 2022; IoT Security Framework, 2023"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">Separate multiple publications with commas</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-blue-500/25"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Changes...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Profile
              </span>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}