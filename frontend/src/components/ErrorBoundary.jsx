// components/ErrorBoundary.jsx
// Catches JavaScript errors in the component tree below it and shows
// a fallback UI instead of a blank white screen.

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unexpected error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center max-w-sm">
            <h1 className="text-xl font-semibold text-gray-800">Something went wrong</h1>
            <p className="text-gray-500 text-sm mt-2">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}