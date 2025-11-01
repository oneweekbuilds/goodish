import React from 'react';

export interface DataBarSegment {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export interface DataBarProps {
  segments: DataBarSegment[];
  height?: number;
  showLabels?: boolean;
  ariaLabel?: string;
}

/**
 * DataBar component for segmented horizontal bar charts
 * - Used for political lean, tone distribution, etc.
 * - Color-coded segments with percentages
 * - Accessible with proper ARIA labels
 */
export function DataBar({ segments, height = 24, showLabels = true, ariaLabel }: DataBarProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <div role="img" aria-label={ariaLabel || 'Data visualization'}>
      {/* Bar */}
      <div
        className="flex rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            className="transition-all hover:opacity-80"
            style={{
              width: `${segment.percentage}%`,
              backgroundColor: segment.color,
            }}
            title={`${segment.label}: ${segment.percentage}%`}
          />
        ))}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex items-center justify-between mt-2 text-sm">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-inkMuted">
                {segment.label}{' '}
                <span className="font-medium text-ink tabular-nums">{segment.percentage}%</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Screen reader summary */}
      <div className="sr-only">
        {segments.map((segment) => (
          <span key={segment.label}>
            {segment.label}: {segment.percentage}%.{' '}
          </span>
        ))}
      </div>
    </div>
  );
}
