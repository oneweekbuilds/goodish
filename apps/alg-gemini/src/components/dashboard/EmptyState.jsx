import React from 'react';
import { Link } from 'react-router-dom';

/**
 * EmptyState component for dashboard views that don't have data yet.
 * Shows a calm, honest message about data availability with contextual guidance.
 *
 * @param {string} missing - Specific message about what data is missing
 */
const EmptyState = ({ missing }) => {
  // Default message if none provided
  const message = missing || "Not enough data yet. Run more scans to populate this view.";

  // Check if the message suggests running scans
  const suggestsScans = message.toLowerCase().includes('scan') ||
                        message.toLowerCase().includes('run') ||
                        message.toLowerCase().includes('need');

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {/* Icon */}
      <div className="w-12 h-12 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-600 mb-2">
        Awaiting Data
      </h4>

      {/* Message */}
      <p className="text-sm text-slate-500 max-w-xs mb-4">
        {message}
      </p>

      {/* Action link if appropriate */}
      {suggestsScans && (
        <Link
          to="/start"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-blue hover:underline"
        >
          Start a Scan
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
