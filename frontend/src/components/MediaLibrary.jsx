// components/MediaLibrary.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '');

export default function MediaLibrary({ onSelect, onClose }) {
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    fetchMedia();
  }, [search, selectedType]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedType) params.type = selectedType;
      
      const res = await api.get('/media', { params });
      setMedia(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('media', file);
    });

    try {
      await api.post('/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchMedia();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this media?')) return;
    try {
      await api.delete(`/media/${id}`);
      await fetchMedia();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Media Library</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 text-sm"
          />
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
          </select>

          <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
            {uploading ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No media found</p>
              <p className="text-sm">Upload your first file</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {media.map((item) => (
                <div
                  key={item._id}
                  className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onSelect && onSelect(item)}
                >
                  {item.type === 'image' ? (
                    <img
                      src={`${API_BASE}${item.path}`}
                      alt={item.originalName}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                      <span className="text-4xl">📄</span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {item.originalName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(item.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item._id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}