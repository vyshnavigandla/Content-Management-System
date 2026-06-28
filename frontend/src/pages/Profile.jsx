// pages/Profile.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '',
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

  // Password Change States
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profiles/me');
      const p = res.data.data;
      setProfile(p);
      setForm({
        name: p.user?.name || '',
        qualifications: (p.qualifications || []).join(', '),
        researchInterests: (p.researchInterests || []).join(', '),
        publications: (p.publications || []).join(', '),
        bio: p.bio || '',
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('qualifications', form.qualifications);
      data.append('researchInterests', form.researchInterests);
      data.append('publications', form.publications);
      data.append('bio', form.bio);
      if (photoFile) data.append('photo', photoFile);

      const res = await api.put('/profiles/me', data, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (res.status === 200 || res.status === 201) {
        if (res.data && res.data.success) {
          setProfile(res.data.data);
          if (res.data.data.user?.name) {
            updateUser({ name: res.data.data.user.name });
          }
          setSuccess('✅ Profile updated successfully!');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(res.data?.message || 'Failed to update profile');
        }
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('❌ Profile update error:', err);
      if (err.response && err.response.status !== 200 && err.response.status !== 201) {
        setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      } else {
        setSuccess('✅ Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  // ✅ Change Password Handler with proper success message
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setError('');
    setPasswordSuccess('');
    setSuccess('');

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      // ✅ Set success message
      setPasswordSuccess('✅ Password changed successfully!');
      
      // Reset password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      
      // Close password change form after 2 seconds
      setTimeout(() => {
        setShowPasswordChange(false);
        // Keep success message visible for 3 seconds after closing
        setTimeout(() => {
          setPasswordSuccess('');
        }, 3000);
      }, 2000);
      
    } catch (err) {
      console.error('❌ Password change error:', err);
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
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

      {/* Success Message - Profile Update */}
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

      {/* ✅ Password Change Success Message */}
      {passwordSuccess && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-700">{passwordSuccess}</p>
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
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {form.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{form.name || profile?.user?.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  profile?.user?.role === 'hod' ? 'bg-purple-100 text-purple-700' :
                  profile?.user?.role === 'faculty' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {profile?.user?.role?.toUpperCase()}
                </span>
                {profile?.user?.designation && (
                  <span className="text-sm text-gray-500">{profile?.user?.designation}</span>
                )}
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

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
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
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              maxLength={1000}
              placeholder="Write a brief professional bio..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/1000</p>
          </div>

          {/* Qualifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
            <input
              name="qualifications"
              value={form.qualifications}
              onChange={handleChange}
              placeholder="Ph.D. in CSE, M.Tech, B.Tech"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
          </div>

          {/* Research Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Research Interests</label>
            <input
              name="researchInterests"
              value={form.researchInterests}
              onChange={handleChange}
              placeholder="Machine Learning, IoT, Blockchain"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
          </div>

          {/* Publications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Publications</label>
            <input
              name="publications"
              value={form.publications}
              onChange={handleChange}
              placeholder="A Study on Neural Networks, 2022; IoT Security Framework, 2023"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-500/25"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            '💾 Save Profile'
          )}
        </button>
      </form>

      {/* Change Password Section */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                <p className="text-sm text-gray-500">Update your login password</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPasswordChange(!showPasswordChange);
                setError('');
                setPasswordSuccess('');
                setSuccess('');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showPasswordChange 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordChange && (
            <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl py-3 text-sm font-semibold hover:from-yellow-700 hover:to-orange-700 disabled:opacity-60 transition-all shadow-lg shadow-yellow-500/25"
              >
                {changingPassword ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Password...
                  </span>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Animations */}
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