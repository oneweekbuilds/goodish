import React from 'react';
import { motion } from 'framer-motion';

/**
 * PREMIER color palette - Blue & Green harmonious tones
 * Replaces dull grays with palette-cohesive colors
 */
const EMOTIONAL_TONE_COLORS = {
  positive: '#34D399',  // Richer green (was #86EFAC)
  neutral: '#94A3B8',   // Slate (kept for neutral)
  negative: '#93C5FD',  // Blue-tinted (was #FCA5A5 red)
};

/**
 * 100% stacked horizontal bar chart - PREMIER QUALITY
 * Features: gradient fills, refined legend, polished entrance animation.
 * @param {Array} segments - Array of { label: string, value: number (0-100), color?: string, category?: string }
 * @param {boolean} showLegend - Whether to show legend below the bar
 */
const StackedBar100 = ({ segments = [], showLegend = true }) => {
  if (!segments || segments.length === 0) return null;

  const segmentsWithColors = segments.map(s => ({
    ...s,
    color: s.color || (s.category && EMOTIONAL_TONE_COLORS[s.category]) || '#94A3B8',
  }));

  const total = segmentsWithColors.reduce((sum, s) => sum + (s.value || 0), 0);
  const normalized = total > 0
    ? segmentsWithColors.map(s => ({ ...s, value: (s.value / total) * 100 }))
    : segmentsWithColors;

  // Create a descriptive aria-label for screen readers
  const ariaLabel = normalized.length > 0
    ? `Stacked bar chart showing ${normalized.map(s => `${s.label}: ${Math.round(s.value)}%`).join(', ')}`
    : 'Stacked bar chart';

  return (
    <div className="space-y-3" role="img" aria-label={ariaLabel}>
      {/* Stacked Bar */}
      <motion.div
        className="h-11 sm:h-14 rounded-xl overflow-hidden flex gap-[1px]"
        initial={{ opacity: 0, scaleX: 0.3 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          transformOrigin: 'left',
          background: 'rgba(226, 232, 240, 0.4)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.06)',
        }}
      >
        {normalized.map((segment, index) => (
          <div
            key={index}
            className="h-full transition-all duration-300 flex items-center justify-center relative"
            style={{
              width: `${segment.value}%`,
              background: `linear-gradient(180deg, ${segment.color || '#94A3B8'} 0%, ${segment.color || '#94A3B8'}CC 100%)`,
              minWidth: segment.value > 0 ? '3px' : '0',
              borderRadius: index === 0 ? '0.75rem 0 0 0.75rem' : index === normalized.length - 1 ? '0 0.75rem 0.75rem 0' : '0',
            }}
            title={`${segment.label}: ${Math.round(segment.value)}%`}
          >
            {/* Inner highlight for depth */}
            <div
              className="absolute inset-x-0 top-0 h-[40%] pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
              }}
            />
            {segment.value >= 10 && (
              <span
                className="relative z-10 font-bold text-white drop-shadow-sm"
                style={{
                  fontSize: segment.value >= 20 ? '0.875rem' : '0.75rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {Math.round(segment.value)}%
              </span>
            )}
          </div>
        ))}
      </motion.div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-5 sm:gap-x-7 gap-y-2 justify-center pt-1">
          {normalized.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-md flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${segment.color || '#94A3B8'} 0%, ${segment.color || '#94A3B8'}CC 100%)`,
                  boxShadow: `0 1px 3px ${segment.color || '#94A3B8'}30`,
                }}
              />
              <span
                className="text-text-main font-medium"
                style={{ fontSize: '0.8125rem', letterSpacing: '-0.005em' }}
              >
                {segment.label}
              </span>
              <span className="text-text-muted tabular-nums" style={{ fontSize: '0.8125rem' }}>
                {Math.round(segment.value)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StackedBar100;
