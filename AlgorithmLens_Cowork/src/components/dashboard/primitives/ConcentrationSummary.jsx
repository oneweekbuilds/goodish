import React from 'react';

/**
 * ConcentrationSummary
 *
 * Summary component for Sources tab showing concentration metrics.
 * Displays exactly three lines: Top 5, Top 10, All others.
 *
 * Props:
 * - top5Percent: number (required) - Percentage for top 5 sources (0-100)
 * - top10Percent: number (required) - Percentage for top 10 sources (0-100)
 * - othersPercent: number (required) - Percentage for all others (0-100)
 *
 * No charts, no fallback logic inside component.
 * Component does not validate that percentages sum to 100.
 */
const ConcentrationSummary = ({ top5Percent, top10Percent, othersPercent }) => {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-2xl font-bold text-text-main">{Math.round(top5Percent)}%</div>
        <div className="text-sm text-text-muted">from your top 5 sources</div>
      </div>
      <div className="flex gap-6 text-sm text-text-muted">
        <div><span className="font-medium text-text-main">{Math.round(top10Percent)}%</span> top 10</div>
        <div><span className="font-medium text-text-main">{Math.round(othersPercent)}%</span> all others</div>
      </div>
    </div>
  );
};

export default ConcentrationSummary;
