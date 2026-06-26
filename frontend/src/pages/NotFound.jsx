// pages/NotFound.jsx
// Simple 404 page for unmatched routes.

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg className="w-48 h-48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">You might want to:</h3>
          <div className="space-y-2 text-left">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                  Go to Dashboard
                </p>
                <p className="text-xs text-gray-500">Return to your main dashboard</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link 
              to="/login" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-green-600 transition-colors duration-200">
                  Sign In
                </p>
                <p className="text-xs text-gray-500">Log in to your account</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 ml-auto group-hover:text-green-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link 
              to="/" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-purple-600 transition-colors duration-200">
                  Home Page
                </p>
                <p className="text-xs text-gray-500">Go to the landing page</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 ml-auto group-hover:text-purple-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400">
          Error code: 404 • Page not found
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}