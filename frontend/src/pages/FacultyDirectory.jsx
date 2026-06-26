// pages/FacultyDirectory.jsx
// Searchable directory of faculty/HOD profiles - viewable by everyone.

import { useEffect, useState } from 'react';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '');

export default function FacultyDirectory() {
  const [search, setSearch] = useState('');
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDirectory = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get('/profiles/directory', { params: query ? { search: query } : {} });
      setFaculty(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDirectory(search);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Faculty Directory</h1>
        <p className="text-gray-600">Browse and search for faculty members and their research profiles</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3 max-w-2xl">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, designation, or research interests..."
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading directory...</p>
          </div>
        </div>
      )}

      {/* Error State */}
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

      {/* Faculty Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {faculty.map((f) => (
              <div
                key={f._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 group"
              >
                {/* Profile Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    {f.photo ? (
                      <img
                        src={`${API_BASE}${f.photo}`}
                        alt={f.name}
                        className="w-16 h-16 rounded-2xl object-cover shadow-lg ring-4 ring-gray-50 group-hover:ring-blue-50 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {f.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors duration-200">
                      {f.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 uppercase mt-1">
                      {f.designation || f.role}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {f.bio && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {f.bio}
                    </p>
                  </div>
                )}

                {/* Research Interests */}
                {f.researchInterests?.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Research Interests</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {f.researchInterests.map((r, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-1 rounded-full font-medium border border-blue-100 hover:border-blue-300 transition-colors duration-200"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qualifications */}
                {f.qualifications?.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualifications</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {f.qualifications.join(' • ')}
                    </p>
                  </div>
                )}

                {/* Publications Count */}
                {f.publications?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>{f.publications.length} Publication{f.publications.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {faculty.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No faculty members found</h3>
              <p className="text-gray-500">
                {search
                  ? `No results for "${search}". Try a different search term.`
                  : 'The directory is currently empty.'}
              </p>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}