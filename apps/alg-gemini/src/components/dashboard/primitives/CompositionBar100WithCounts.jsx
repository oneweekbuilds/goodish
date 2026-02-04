import React from 'react';

/**
 * CompositionBar100WithCounts
 *
 * 100% stacked bar with both percentages and counts, required by locked spec.
 * Visually similar to existing StackedBar100 but shows counts alongside percentages.
 *
 * Props:
 * - segments: Array<{ label: string, percentage: number, count: number, color: string }>
 *   - percentage: 0-100, must sum to 100
 *   - count: integer count for this segment
 *   - color: hex color code
 *
 * Component does not calculate percentages or counts - parent must provide.
 * No fallback behavior inside component - parent handles hide/show.
 */
const CompositionBar100WithCounts = ({ segments = [] }) => {
  if (!segments || segments.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Stacked Bar */}
      <div className="h-8 bg-slate-100 rounded-full overflow-hidden flex">
        {segments.map((segment, index) => (
          <div
            key={index}
            className="h-full transition-all duration-300 flex items-center justify-center"
            style={{
              width: `${segment.percentage}%`,
              backgroundColor: segment.color,
              minWidth: segment.percentage > 0 ? '2px' : '0',
            }}
            title={`${segment.label}: ${Math.round(segment.percentage)}% (${segment.count})`}
          >
            {segment.percentage >= 10 && (
              <span className="text-xs font-medium text-white drop-shadow-sm">
                {Math.round(segment.percentage)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend with counts */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-[13px] leading-relaxed text-slate-700 font-medium">
              {segment.label}: {Math.round(segment.percentage)}% ({segment.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompositionBar100WithCounts;
