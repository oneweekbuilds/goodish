import React from 'react';

export interface DonutProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
}

/**
 * Donut chart component for percentage displays
 * - Center number display
 * - Configurable size and colors
 * - Starts at 12 o'clock
 * - Smooth animation on mount
 */
export function Donut({
  value,
  size = 120,
  strokeWidth = 12,
  color = '#01B1C0',
  backgroundColor = '#f5f6f7',
  label,
}: DonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              transitionProperty: 'stroke-dashoffset',
            }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl md:text-3xl font-semibold text-ink tabular-nums">
            {Math.round(value)}%
          </span>
        </div>
      </div>

      {label && <span className="text-sm text-inkMuted text-center">{label}</span>}
    </div>
  );
}
