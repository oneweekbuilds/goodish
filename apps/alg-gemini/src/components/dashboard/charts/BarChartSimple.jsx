import React from 'react';

/**
 * Simple horizontal bar chart component.
 * No external dependencies - pure HTML/CSS.
 *
 * UI Refoundation: Default to max 5 bars for visual clarity
 *
 * @param {Array} data - Array of { label: string, value: number, color?: string }
 * @param {string} valueLabel - Label for values (e.g., "%" or "posts")
 * @param {number} maxBars - Maximum number of bars to show (default 5)
 */
const BarChartSimple = ({ data = [], valueLabel = '', maxBars = 5 }) => {
  if (!data || data.length === 0) return null;

  const displayData = data.slice(0, maxBars);
  const maxValue = Math.max(...displayData.map(d => d.value), 1);

  return (
    <div className="space-y-3">
      {displayData.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-sm text-slate-500 w-32 truncate flex-shrink-0" title={item.label}>
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color || '#3B82F6',
                minWidth: item.value > 0 ? '8px' : '0',
                opacity: 0.85,
              }}
            />
          </div>
          <span className="text-sm font-medium text-slate-600 w-16 text-right flex-shrink-0">
            {typeof item.value === 'number' && item.value % 1 !== 0
              ? item.value.toFixed(1)
              : item.value}
            {valueLabel}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BarChartSimple;
