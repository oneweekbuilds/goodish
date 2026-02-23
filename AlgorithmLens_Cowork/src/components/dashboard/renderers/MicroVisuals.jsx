import React from 'react';

/**
 * MicroVisuals - Three micro visual renderers (Visual Metrics v1)
 *
 * Supports three types:
 * - sparkline: line trend
 * - bar: horizontal bar
 * - segments: stacked composition
 */

/**
 * renderMicroSparkline - Sparkline chart
 *
 * @param {Object} micro - Micro data with points array
 * @returns {React.ReactNode}
 */
const renderMicroSparkline = ({ points = [], color = '#0EA5E9' }) => {
  if (!points || points.length < 2) return null;
  const display = points.slice(-8);
  const values = display.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 72;
  const height = 32;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const coords = display.map((p, i) => {
    const x = padding + (i / Math.max(1, display.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((p.value - min) / range) * chartHeight;
    return { x, y };
  });
  const path = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Describe the trend direction and range for screen readers
  const firstVal = values[0];
  const lastVal = values[values.length - 1];
  const trend = lastVal > firstVal ? 'increasing' : lastVal < firstVal ? 'decreasing' : 'stable';
  const ariaLabel = `Trend: ${trend} over ${display.length} points, from ${Math.round(firstVal)}% to ${Math.round(lastVal)}%`;

  return (
    <div className="w-[88px] h-[36px] flex items-center justify-end" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/**
 * renderMicroBar - Horizontal bar
 *
 * @param {Object} micro - Micro data with value and color
 * @returns {React.ReactNode}
 */
const renderMicroBar = ({ value = 0, color = '#0EA5E9' }) => {
  const safeValue = Math.max(0, Math.min(100, value));
  const level = safeValue >= 66 ? 'high' : safeValue >= 33 ? 'moderate' : 'low';
  const ariaLabel = `${Math.round(safeValue)}% of total, ${level}`;
  return (
    <div className="w-[88px] h-[12px] rounded-full bg-primary-blue/5 overflow-hidden border border-border-light" role="img" aria-label={ariaLabel}>
      <div
        className="h-full rounded-full"
        aria-hidden="true"
        style={{ width: `${safeValue}%`, background: color, transition: 'width 0.2s ease' }}
      />
    </div>
  );
};

/**
 * renderMicroSegments - Stacked segments
 *
 * @param {Object} micro - Micro data with segments array
 * @returns {React.ReactNode}
 */
const renderMicroSegments = ({ segments = [] }) => {
  if (!segments || segments.length === 0) return null;
  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0) || 1;
  const palette = ['#0EA5E9', '#22C55E', '#94A3B8'];
  // Build descriptive aria-label: "Composition: 45% news, 30% entertainment, 25% other"
  const segmentDescriptions = segments.slice(0, 3).map(s => {
    const pct = Math.round((s.value / total) * 100);
    return `${pct}% ${s.label || 'unknown'}`;
  }).join(', ');
  const ariaLabel = `Composition: ${segmentDescriptions}`;
  return (
    <div className="w-[96px] h-[14px] rounded-full bg-primary-blue/5 overflow-hidden border border-border-light flex" role="img" aria-label={ariaLabel}>
      {segments.slice(0, 3).map((s, idx) => {
        const widthPct = Math.max(0, Math.min(100, (s.value / total) * 100));
        return (
          <div
            key={s.label || idx}
            title={s.label}
            aria-hidden="true"
            style={{ width: `${widthPct}%`, background: palette[idx % palette.length] }}
            className="h-full"
          />
        );
      })}
    </div>
  );
};

/**
 * Dispatcher function - routes to appropriate micro visual renderer
 *
 * @param {Object} micro - Micro data object with type property
 * @returns {React.ReactNode}
 */
const renderMicroVisual = (micro) => {
  if (!micro || !micro.type) return null;
  switch (micro.type) {
    case 'sparkline':
      return renderMicroSparkline(micro);
    case 'bar':
      return renderMicroBar(micro);
    case 'segments':
      return renderMicroSegments(micro);
    default:
      return null;
  }
};

export {
  renderMicroVisual,
  renderMicroSparkline,
  renderMicroBar,
  renderMicroSegments,
};
