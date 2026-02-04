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
    <div className="space-y-2">
      <div className="text-sm text-slate-700">
        <span className="font-medium">Top 5 sources:</span> {Math.round(top5Percent)}%
      </div>
      <div className="text-sm text-slate-700">
        <span className="font-medium">Top 10 sources:</span> {Math.round(top10Percent)}%
      </div>
      <div className="text-sm text-slate-700">
        <span className="font-medium">All others:</span> {Math.round(othersPercent)}%
      </div>
    </div>
  );
};

export default ConcentrationSummary;
