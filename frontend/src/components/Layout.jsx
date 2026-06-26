// components/Layout.jsx
// Wraps protected pages with the Navbar + a content container.
// Used as a parent route so we don't repeat <Navbar /> on every page.

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="animate-fadeIn">
          <Outlet />
        </div>
      </main>
      
      {/* Optional Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">
              Department CMS &copy; {new Date().getFullYear()}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Help</span>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}