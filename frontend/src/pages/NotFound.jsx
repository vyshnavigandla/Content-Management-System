// pages/NotFound.jsx
// FIX: <style jsx> replaced with plain <style>
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      <div className="text-center max-w-md">
        <div className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-none select-none mb-8">
          404
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>

        <div className="bg-white/80 rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="space-y-2 text-left">
            <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600">Go to Dashboard</span>
            </Link>
            <Link to="/login" className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-800 group-hover:text-green-600">Sign In</span>
            </Link>
          </div>
        </div>
        <p className="text-xs text-gray-400">Error code: 404 • Page not found</p>
      </div>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
}