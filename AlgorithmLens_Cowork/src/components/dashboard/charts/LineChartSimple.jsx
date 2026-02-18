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
 * @param {string} title - Optional chart title
 * @param {string} xAxisLabel - Optional x-axis label
 * @param {string} yAxisLabel - Optional y-axis label
 */
const LineChartSimple = ({ data = [], valueLabel = '', color = '#3B82F6', height = 100, maxPoints = 7, title = null, xAxisLabel = null, yAxisLabel = null }) => {
  if (!data || data.length < 2) return null;

  // UI Refoundation: Limit data points for visual clarity
  const displayData = data.slice(-maxPoints);

  const width = 100; // percentage-based
  // Increase left padding for y-axis label, bottom padding for x-axis label
  const padding = { 
    top: title ? 20 : 10, 
    right: 10, 
    bottom: xAxisLabel ? 40 : 30, 
    left: yAxisLabel ? 20 : 10 
  };
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
      {/* Chart title */}
      {title && (
        <h4 className="text-sm font-semibold text-text-main mb-2">
          {title}
        </h4>
      )}
      {/* (Audit 8 Cycle 2) Added role="img" and aria-label for screen reader accessibility */}
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Line chart${title ? `: ${title}` : ''} showing ${displayData.length} data points. Values range from ${Math.min(...values)}${valueLabel} to ${Math.max(...values)}${valueLabel}.`}
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
            stroke="rgba(30,41,59,0.06)"
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

        {/* Data points - reduced size for subtle appearance */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
            fill="white"
            stroke={color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            title={`${p.label}: ${p.value}`}
          />
        ))}
        
        {/* Y-axis label */}
        {yAxisLabel && (
          <text
            x={padding.left / 2}
            y={padding.top + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${padding.left / 2} ${padding.top + chartHeight / 2})`}
            fill="#4B5563"
            fontSize="11"
            fontWeight="500"
          >
            {yAxisLabel}
          </text>
        )}
      </svg>

      {/* X-axis label */}
      {xAxisLabel && (
        <p className="text-sm text-text-muted text-center mt-1 font-medium">
          {xAxisLabel}
        </p>
      )}

      {/* X-axis labels - FIX A4 & P3: Improved spacing, readability, and label clarity */}
      <div className="flex justify-between px-2 mt-3">
        {displayData.map((d, i) => {
          // Check if this label is the same as previous one
          const prevLabel = i > 0 ? displayData[i - 1]?.label : null;
          const isDuplicate = prevLabel === d.label;
          
          return (
            <div key={i} className="text-sm text-center" style={{ maxWidth: '80px' }}>
              {/* Only show label if it's not a duplicate, or if it's the first or last */}
              {/* FIX P3: Increased label spacing and contrast */}
              <div className="truncate text-text-muted mb-1 font-medium text-xs">
                {!isDuplicate || i === 0 || i === displayData.length - 1 ? d.label : '·'}
              </div>
              <div className="font-semibold text-text-main text-sm">
                {typeof d.value === 'number' && d.value % 1 !== 0
                  ? d.value.toFixed(1)
                  : d.value}
                {valueLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LineChartSimple;
