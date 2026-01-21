import React from 'react';

// HOTFIX: Emotional tone color palette (moved from dataHelpers.js)
// Softer pastel tones to feel less judgmental and align with Oura aesthetic
const EMOTIONAL_TONE_COLORS = {
  positive: '#86EFAC',  // Pastel green
  neutral: '#CBD5E1',   // Soft slate
  negative: '#FCA5A5',  // Pastel red/pink
};

/**
 * 100% stacked horizontal bar chart component.
 * Shows segments that sum to 100%.
 *
 * @param {Array} segments - Array of { label: string, value: number (0-100), color?: string, category?: string }
 * @param {boolean} showLegend - Whether to show legend below the bar
 */
const StackedBar100 = ({ segments = [], showLegend = true }) => {
  if (!segments || segments.length === 0) return null;

  // Apply color mapping from category if color not provided
  const segmentsWithColors = segments.map(s => ({
    ...s,
    color: s.color || (s.category && EMOTIONAL_TONE_COLORS[s.category]) || '#94A3B8',
  }));

  // Normalize to ensure sum = 100
  const total = segmentsWithColors.reduce((sum, s) => sum + (s.value || 0), 0);
  const normalized = total > 0
    ? segmentsWithColors.map(s => ({ ...s, value: (s.value / total) * 100 }))
    : segmentsWithColors;

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

      {/* Legend - FIX PA7: Increase readability with larger text and better spacing */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
          {normalized.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color || '#94A3B8' }}
              />
              <span className="text-[13px] leading-relaxed text-slate-700 font-medium">
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
