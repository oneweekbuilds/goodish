import React from 'react';

/**
 * TrendSummaryRenderer - Line chart replaced with simple summary
 * Handles 'line' output type
 *
 * Summary due to clarity issues. Displays trend data as statistics
 * (recent, average, range) instead of line chart.
 *
 * @param {Object} data - The data object containing trend array
 * @returns {React.ReactNode}
 */
const TrendSummaryRenderer = ({ data }) => {
  if (!data) return null;

  const trend = data.trend || data;
  if (!Array.isArray(trend) || trend.length < 2) {
    return (
      <p className="text-sm text-center text-text-muted">
        Insufficient data to show trend.
      </p>
    );
  }

  // Calculate summary stats from trend data
  // Trend data represents scans within the selected date range
  const values = trend.map(t => t.value).filter(v => typeof v === 'number' && v !== null && v !== undefined);
  if (values.length === 0) {
    return (
      <p className="text-sm text-center text-text-muted">
        No trend data available.
      </p>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const latest = values[values.length - 1];

  // Format percent: 0 decimals if >= 10%, 1 decimal if < 10%
  const formatPercent = (val) => {
    if (val === null || val === undefined) return 'Not available';
    if (val >= 10) return `${Math.round(val)}%`;
    return `${val.toFixed(1)}%`;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-primary-blue/5 rounded-lg border border-border-light">
          <p className="text-sm text-text-muted mb-1">Most recent scan</p>
          <p className="text-lg font-semibold text-text-main">{formatPercent(latest)}</p>
          <p className="text-sm text-text-muted mt-1">Percent of posts in the selected date range</p>
        </div>
        <div className="p-3 bg-primary-blue/5 rounded-lg border border-border-light">
          <p className="text-sm text-text-muted mb-1">Average across scans</p>
          <p className="text-lg font-semibold text-text-main">{formatPercent(avg)}</p>
          <p className="text-sm text-text-muted mt-1">Percent of posts in the selected date range</p>
        </div>
      </div>
      {min !== max && (
        <p className="text-sm text-center text-text-muted">
          Range across scans: {formatPercent(min)} to {formatPercent(max)}
        </p>
      )}
    </div>
  );
};

export default TrendSummaryRenderer;
