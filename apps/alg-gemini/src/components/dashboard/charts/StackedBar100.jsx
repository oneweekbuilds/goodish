import React from 'react';

/**
 * 100% stacked horizontal bar chart component.
 * Shows segments that sum to 100%.
 *
 * @param {Array} segments - Array of { label: string, value: number (0-100), color: string }
 * @param {boolean} showLegend - Whether to show legend below the bar
 */
const StackedBar100 = ({ segments = [], showLegend = true }) => {
  if (!segments || segments.length === 0) return null;

  // Normalize to ensure sum = 100
  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
  const normalized = total > 0
    ? segments.map(s => ({ ...s, value: (s.value / total) * 100 }))
    : segments;

  return (
    <div className="space-y-3">
      {/* Stacked Bar */}
      <div className="h-8 bg-slate-100 rounded-full overflow-hidden flex">
        {normalized.map((segment, index) => (
          <div
            key={index}
            className="h-full transition-all duration-300 flex items-center justify-center"
            style={{
              width: `${segment.value}%`,
              backgroundColor: segment.color || '#94A3B8',
              minWidth: segment.value > 0 ? '2px' : '0',
            }}
            title={`${segment.label}: ${Math.round(segment.value)}%`}
          >
            {segment.value >= 10 && (
              <span className="text-xs font-medium text-white drop-shadow-sm">
                {Math.round(segment.value)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 justify-center">
          {normalized.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color || '#94A3B8' }}
              />
              <span className="text-sm text-slate-600">
                {segment.label}: {Math.round(segment.value)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StackedBar100;
