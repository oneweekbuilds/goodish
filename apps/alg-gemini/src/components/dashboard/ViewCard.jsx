import React from 'react';
import EmptyState from './EmptyState';

/**
 * ViewCard component - renders a single dashboard view card.
 * Shows view metadata and either content (when data exists) or empty state.
 */
const ViewCard = ({ view, data = null }) => {
  const { title, description, dataRequirement } = view;
  const hasData = data !== null && data !== undefined;

  return (
    <div className="bg-surface-card border border-border-card rounded-2xl overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-border-card">
        <h3 className="text-base font-semibold text-text-main mb-1">
          {title}
        </h3>
        <p className="text-sm text-text-muted line-clamp-2">
          {description}
        </p>
      </div>

      {/* Card Content */}
      <div className="min-h-[200px] flex items-center justify-center">
        {hasData ? (
          <div className="w-full p-5">
            {/* Content would render here when data exists */}
            {data}
          </div>
        ) : (
          <EmptyState
            title="Awaiting Data"
            description={dataRequirement || "Run more scans to populate this view."}
          />
        )}
      </div>
    </div>
  );
};

export default ViewCard;
