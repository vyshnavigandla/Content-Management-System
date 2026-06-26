// components/ErrorBoundary.jsx
// Catches JavaScript errors in the component tree below it and shows
// a fallback UI instead of a blank white screen.

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ errorInfo: info });
    
    // Log error details
    console.error('Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
    });
    
    // Optional: Send error to external service
    // if (process.env.NODE_ENV === 'production') {
    //   // Send to error tracking service like Sentry
    // }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
          <div className="w-full max-w-lg">
            <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-gray-100 text-center">
              {/* Error Icon */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                An unexpected error occurred in the application. 
                Don't worry, your data is safe.
              </p>

              {/* Error Details (Development Only) */}
              {isDev && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                  <div className="flex items-start gap-2 mb-2">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-red-800 mb-1">Error Details (Development Mode)</p>
                      <p className="text-xs text-red-700 font-mono break-all">
                        {this.state.error.message}
                      </p>
                      {this.state.errorInfo && (
                        <details className="mt-2">
                          <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                            View Component Stack
                          </summary>
                          <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40 p-2 bg-red-100 rounded">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRefresh}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-blue-500/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-200 transform hover:scale-[1.02] border border-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go to Dashboard
                </button>
              </div>

              {/* Help Text */}
              <p className="mt-6 text-xs text-gray-400">
                If the problem persists, please contact the system administrator or clear your browser cache.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}