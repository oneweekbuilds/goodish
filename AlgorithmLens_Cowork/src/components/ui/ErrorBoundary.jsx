import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logError } from '../../lib/errorLogger.js';

/**
 * ErrorBoundary - Catches React rendering errors (#24)
 *
 * Prevents full-page crashes by catching errors in child component trees.
 * Shows a friendly fallback UI with recovery options.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError('ErrorBoundary', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle = 'Something went wrong', fallbackMessage } = this.props;

      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-14 h-14 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-status-error" />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">{fallbackTitle}</h2>
            <p className="text-text-muted mb-6">
              {fallbackMessage || 'An unexpected error occurred. Try refreshing the page or going back home.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-blue text-white rounded-lg font-semibold hover:bg-primary-blue/90 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-border-light text-text-main rounded-lg font-semibold hover:bg-primary-blue/5 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
              >
                <Home size={16} />
                Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
