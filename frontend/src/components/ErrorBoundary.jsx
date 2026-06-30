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
                <span className="text-white text-3xl font-bold">!</span>
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
                    <span className="text-red-500 font-bold text-sm flex-shrink-0 mt-0.5">!</span>
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
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-blue-500/25"
                >
                  Refresh Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-200 transform hover:scale-[1.02] border border-gray-200"
                >
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