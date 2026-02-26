import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import SEO from '../components/SEO';

/**
 * NotFoundPage - 404 catch-all route (#4)
 */
const NotFoundPage = () => {
  return (
    <>
      <SEO title="Page Not Found" noIndex={true} />
      <div className="min-h-screen bg-bg-page flex items-center justify-center py-24 px-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-primary-blue" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-text-main mb-3">
          Page not found
        </h1>

        {/* Body */}
        <p className="text-text-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-full font-semibold hover:bg-primary-blue/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
          >
            <Home size={18} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 border border-primary-blue text-primary-blue rounded-full font-semibold hover:bg-primary-blue/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

export default NotFoundPage;
