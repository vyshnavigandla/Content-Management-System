// pages/NotFound.jsx
// Simple 404 page for unmatched routes.

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-300">404</h1>
        <p className="text-gray-600 mt-2">Page not found</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}