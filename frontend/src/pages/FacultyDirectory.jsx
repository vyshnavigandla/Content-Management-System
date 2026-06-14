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
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Faculty Directory</h1>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="flex-1 max-w-sm border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-900">
          Search
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {faculty.map((f) => (
          <div key={f._id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              {f.photo ? (
                <img
                  src={`${API_BASE}${f.photo}`}
                  alt={f.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                  {f.name?.[0]}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-800">{f.name}</h3>
                <p className="text-xs text-gray-500 uppercase">{f.designation || f.role}</p>
              </div>
            </div>

            {f.bio && <p className="text-sm text-gray-600 mt-3">{f.bio}</p>}

            {f.researchInterests?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">Research Interests</p>
                <div className="flex flex-wrap gap-1">
                  {f.researchInterests.map((r, idx) => (
                    <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {f.qualifications?.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">{f.qualifications.join(' · ')}</p>
            )}
          </div>
        ))}
      </div>

      {!loading && faculty.length === 0 && (
        <p className="text-gray-400 text-sm">No faculty members found.</p>
      )}
    </div>
  );
}