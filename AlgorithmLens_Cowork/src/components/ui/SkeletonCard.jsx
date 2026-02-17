import React from 'react';

/**
 * SkeletonCard - Loading placeholder for dashboard cards (#13)
 *
 * @param {number} lines - Number of skeleton text lines (default: 3)
 * @param {boolean} showChart - Show a chart placeholder area
 */
const SkeletonCard = ({ lines = 3, showChart = false }) => (
  <div className="bg-white rounded-2xl border border-border-light p-6 animate-pulse">
    {/* Header skeleton */}
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-primary-blue/10 rounded-full" />
      <div className="flex-1">
        <div className="h-4 bg-primary-blue/10 rounded w-2/3 mb-2" />
        <div className="h-3 bg-primary-blue/5 rounded w-1/2" />
      </div>
    </div>

    {/* Chart placeholder */}
    {showChart && (
      <div className="h-32 bg-primary-blue/5 rounded-xl mb-4" />
    )}

    {/* Line skeletons */}
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-primary-blue/5 rounded"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  </div>
);

/**
 * SkeletonGrid - Multiple skeleton cards in a grid layout
 */
export const SkeletonGrid = ({ count = 4, columns = 2 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} showChart={i < 2} />
    ))}
  </div>
);

export default SkeletonCard;
