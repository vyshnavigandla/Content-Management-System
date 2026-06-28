// pages/FacultyDirectory.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  MagnifyingGlassIcon, 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  AcademicCapIcon,
  BriefcaseIcon,
  BookOpenIcon,
  TrophyIcon,
  GlobeAltIcon,
  LinkIcon,
  UserGroupIcon,
  StarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function FacultyDirectory() {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/faculty');
      console.log('Faculty data:', res.data); // Debug log
      setFaculty(res.data.data || []);
    } catch (err) {
      console.error('Error fetching faculty:', err);
      setError(err.response?.data?.message || 'Failed to load faculty directory');
    } finally {
      setLoading(false);
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    const searchLower = search.toLowerCase();
    return (
      f.name?.toLowerCase().includes(searchLower) ||
      f.designation?.toLowerCase().includes(searchLower) ||
      f.department?.toLowerCase().includes(searchLower) ||
      f.researchInterests?.some((interest) =>
        interest.toLowerCase().includes(searchLower)
      ) ||
      f.specialization?.toLowerCase().includes(searchLower) ||
      f.bio?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFaculty(null);
  };

  const getImageUrl = (profilePhoto) => {
    if (!profilePhoto) return null;
    if (profilePhoto.startsWith('http://') || profilePhoto.startsWith('https://')) {
      return profilePhoto;
    }
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    return `${baseUrl}${profilePhoto}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-500 text-lg">Loading faculty directory...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Faculty Directory</h1>
        <p className="text-gray-600">
          Browse and search for faculty members and their complete research profiles
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, designation, research, or bio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>
      </div>

      {/* Faculty Grid */}
      {filteredFaculty.length === 0 ? (
        <div className="text-center py-12">
          <UserCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No faculty found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map((facultyMember) => {
            const imageUrl = getImageUrl(facultyMember.photo || facultyMember.profilePhoto);
            return (
              <div
                key={facultyMember._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => handleViewDetails(facultyMember)}
              >
                <div className="p-6">
                  {/* Profile Photo */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={facultyMember.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-2xl font-bold text-blue-600">
                                ${facultyMember.name?.[0]?.toUpperCase() || '?'}
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-blue-600">
                          {facultyMember.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {facultyMember.name}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium truncate">
                        {facultyMember.designation || 'Faculty'}
                      </p>
                    </div>
                  </div>

                  {/* Department */}
                  {facultyMember.department && (
                    <p className="text-sm text-gray-600 mb-2 truncate">
                      <span className="font-medium">Department:</span> {facultyMember.department}
                    </p>
                  )}

                  {/* Bio Preview */}
                  {facultyMember.bio && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {facultyMember.bio}
                    </p>
                  )}

                  {/* Research Interests Preview */}
                  {facultyMember.researchInterests?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Research Interests
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {facultyMember.researchInterests.slice(0, 3).map((interest, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs"
                          >
                            {interest}
                          </span>
                        ))}
                        {facultyMember.researchInterests.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{facultyMember.researchInterests.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Click to view full details */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      Click to view full profile
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Faculty Detail Modal - COMPLETE PROFILE */}
      {showModal && selectedFaculty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900">Complete Faculty Profile</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0">
                  {getImageUrl(selectedFaculty.photo || selectedFaculty.profilePhoto) ? (
                    <img
                      src={getImageUrl(selectedFaculty.photo || selectedFaculty.profilePhoto)}
                      alt={selectedFaculty.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center text-4xl font-bold text-blue-600">
                            ${selectedFaculty.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-blue-600">
                      {selectedFaculty.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedFaculty.name}</h3>
                  <p className="text-lg text-blue-600 font-medium">{selectedFaculty.designation || 'Faculty'}</p>
                  {selectedFaculty.department && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Department:</span> {selectedFaculty.department}
                    </p>
                  )}
                  {selectedFaculty.yearsOfExperience > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Experience:</span> {selectedFaculty.yearsOfExperience} years
                    </p>
                  )}
                  {selectedFaculty.availableForMentorship && (
                    <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <StarIcon className="h-3 w-3" />
                      Available for Mentorship
                    </span>
                  )}
                </div>
              </div>

              {/* Contact & Links Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedFaculty.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{selectedFaculty.email}</p>
                    </div>
                  </div>
                )}
                {selectedFaculty.contactNumber && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="text-sm text-gray-900">{selectedFaculty.contactNumber}</p>
                    </div>
                  </div>
                )}
                {selectedFaculty.officeLocation && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Office</p>
                      <p className="text-sm text-gray-900">{selectedFaculty.officeLocation}</p>
                    </div>
                  </div>
                )}
                {selectedFaculty.linkedinUrl && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">LinkedIn</p>
                      <a href={selectedFaculty.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-blue-600 hover:underline truncate">
                        View Profile
                      </a>
                    </div>
                  </div>
                )}
                {selectedFaculty.googleScholarUrl && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Google Scholar</p>
                      <a href={selectedFaculty.googleScholarUrl} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-blue-600 hover:underline truncate">
                        View Publications
                      </a>
                    </div>
                  </div>
                )}
                {selectedFaculty.personalWebsite && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Personal Website</p>
                      <a href={selectedFaculty.personalWebsite} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-blue-600 hover:underline truncate">
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Biography */}
              {selectedFaculty.bio && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserCircleIcon className="h-4 w-4" />
                    Biography
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedFaculty.bio}
                    </p>
                  </div>
                </div>
              )}

              {/* Qualifications */}
              {selectedFaculty.qualifications?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AcademicCapIcon className="h-4 w-4" />
                    Qualifications
                  </h4>
                  <ul className="list-disc list-inside space-y-1 bg-gray-50 rounded-xl p-4">
                    {selectedFaculty.qualifications.map((qual, index) => (
                      <li key={index} className="text-sm text-gray-700">{qual}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Research Interests */}
              {selectedFaculty.researchInterests?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <BookOpenIcon className="h-4 w-4" />
                    Research Interests
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFaculty.researchInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications */}
              {selectedFaculty.publications?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <BookOpenIcon className="h-4 w-4" />
                    Publications ({selectedFaculty.publications.length})
                  </h4>
                  <ul className="list-disc list-inside space-y-1 bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                    {selectedFaculty.publications.map((pub, index) => (
                      <li key={index} className="text-sm text-gray-700">{pub}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mentorship Areas */}
              {selectedFaculty.mentorshipAreas?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserGroupIcon className="h-4 w-4" />
                    Mentorship Areas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFaculty.mentorshipAreas.map((area, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Alumni Status */}
              {selectedFaculty.isAlumnus && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Alumni
                  </h4>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4">
                    Alumni Batch: {selectedFaculty.alumniBatchYear || 'N/A'}
                  </p>
                </div>
              )}

              {/* Metadata Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                  <div>
                    <p className="font-medium">Profile Created</p>
                    <p>{new Date(selectedFaculty.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p>{new Date(selectedFaculty.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}