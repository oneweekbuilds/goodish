import React from 'react';
import { motion } from 'framer-motion';

/**
 * 100% stacked bar with percentages and counts - PREMIER QUALITY
 * Features: gradient fills, inner highlights, refined legend with shadow dots,
 * polished entrance animation. Includes accessibility patterns for color-blind users.
 */

const SEGMENT_PATTERNS = [
  'none', // first segment: solid
  'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.2) 3px, rgba(255,255,255,0.2) 5px)', // diagonal stripes
  'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,0.2) 3px, rgba(255,255,255,0.2) 5px)', // reverse stripes
  'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 6px)', // horizontal lines
  'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 6px)', // vertical lines
];

const CompositionBar100WithCounts = ({ segments = [] }) => {
  if (!segments || segments.length === 0) return null;

  // Build aria label for screen readers
  const ariaLabel = segments
    .map(s => `${s.label}: ${Math.round(s.percentage)}%`)
    .join(', ');

  return (
    <div className="space-y-3">
      {/* Stacked Bar */}
      <motion.div
        className="h-12 sm:h-14 rounded-xl overflow-hidden flex gap-[1px]"
        initial={{ opacity: 0, scaleX: 0.3 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          transformOrigin: 'left',
          background: 'rgba(226, 232, 240, 0.4)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.06)',
        }}
        role="img"
        aria-label={ariaLabel}
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            className="h-full transition-all duration-300 flex items-center justify-center relative"
            style={{
              width: `${segment.percentage}%`,
              background: `linear-gradient(180deg, ${segment.color} 0%, ${segment.color}CC 100%)`,
              minWidth: segment.percentage > 0 ? '3px' : '0',
              borderRadius: index === 0 ? '0.75rem 0 0 0.75rem' : index === segments.length - 1 ? '0 0.75rem 0.75rem 0' : '0',
            }}
            title={`${segment.label}: ${Math.round(segment.percentage)}% (${segment.count})`}
          >
            {/* Inner highlight for depth */}
            <div
              className="absolute inset-x-0 top-0 h-[40%] pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
              }}
            />
            {/* Accessibility pattern overlay */}
            {index > 0 && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: SEGMENT_PATTERNS[index % SEGMENT_PATTERNS.length],
                }}
              />
            )}
            {segment.percentage >= 10 && (
              <span
                className="relative z-10 font-bold text-white drop-shadow-sm"
                style={{
                  fontSize: segment.percentage >= 20 ? '0.875rem' : '0.75rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {Math.round(segment.percentage)}%
              </span>
            )}
          </div>
        ))}
      </motion.div>

      {/* Annotation row for small segments (3-9%) */}
      {segments.some(s => s.percentage >= 3 && s.percentage < 10) && (
        <div className="flex text-xs text-slate-500 font-medium">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="text-center"
              style={{ width: `${segment.percentage}%` }}
            >
              {segment.percentage >= 3 && segment.percentage < 10 && (
                <span>{Math.round(segment.percentage)}%</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend with counts */}
      <div className="flex flex-wrap gap-x-5 sm:gap-x-7 gap-y-2 justify-center pt-1">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-md flex-shrink-0 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${segment.color} 0%, ${segment.color}CC 100%)`,
                boxShadow: `0 1px 3px ${segment.color}30`,
              }}
            >
              {/* Pattern indicator in legend dot */}
              {index > 0 && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: SEGMENT_PATTERNS[index % SEGMENT_PATTERNS.length],
                  }}
                />
              )}
            </div>
            <span
              className="text-text-main font-medium"
              style={{ fontSize: '0.8125rem', letterSpacing: '-0.005em' }}
            >
              {segment.label}
            </span>
            <span className="text-text-muted tabular-nums" style={{ fontSize: '0.8125rem' }}>
              {Math.round(segment.percentage)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompositionBar100WithCounts;
