// components/Layout.jsx
// Wraps protected pages with the Navbar + a content container.
// Used as a parent route so we don't repeat <Navbar /> on every page.

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}