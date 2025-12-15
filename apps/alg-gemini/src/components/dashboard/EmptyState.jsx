import React from 'react';

/**
 * EmptyState component for dashboard views that don't have data yet.
 * Shows a calm, honest message about data availability.
 */
const EmptyState = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 mb-6 rounded-full bg-surface-card border border-border-card flex items-center justify-center">
        <svg
          className="w-8 h-8 text-text-muted"
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

      {title && (
        <h4 className="text-lg font-semibold text-text-main mb-2">
          {title}
        </h4>
      )}

      <p className="text-sm text-text-muted max-w-xs">
        {description || "Not enough data yet. Run more scans to populate this view."}
      </p>
    </div>
  );
};

export default EmptyState;
