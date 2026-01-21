import React from 'react';

/**
 * Simple line chart using SVG.
 * Requires at least 2 data points to render.
 *
 * UI Refoundation: Max height 120px, max 7 data points
 *
 * @param {Array} data - Array of { label: string, value: number }
 * @param {string} valueLabel - Label suffix for values (e.g., "%")
 * @param {string} color - Line color (default blue)
 * @param {number} height - Chart height in pixels (max 120)
 * @param {number} maxPoints - Maximum data points to show (default 7)
 */
const LineChartSimple = ({ data = [], valueLabel = '', color = '#3B82F6', height = 100, maxPoints = 7 }) => {
  if (!data || data.length < 2) return null;

  // UI Refoundation: Limit data points for visual clarity
  const displayData = data.slice(-maxPoints);

  const width = 100; // percentage-based
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };
  const chartWidth = 100 - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = displayData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Calculate points
  const points = displayData.map((d, i) => {
    const x = padding.left + (i / (displayData.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, ...d };
  });

  // Create SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Create area path (for gradient fill)
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + ratio * chartHeight}
            x2={100 - padding.right}
            y2={padding.top + ratio * chartHeight}
            stroke="#E2E8F0"
            strokeWidth="0.5"
          />
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#lineGradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.9"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="white"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between px-2 mt-1">
        {displayData.map((d, i) => (
          <div key={i} className="text-xs text-slate-400 text-center" style={{ maxWidth: '60px' }}>
            <div className="truncate">{d.label}</div>
            <div className="font-medium text-slate-600">
              {typeof d.value === 'number' && d.value % 1 !== 0
                ? d.value.toFixed(1)
                : d.value}
              {valueLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineChartSimple;
