import React from 'react';
interface RingGaugeProps {
  value: number;
  label?: string;
  size?: number;
}

export function RingGauge({ value, label = 'Score', size = 120 }: RingGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  // Color based on bands: 0-40 green, 41-70 yellow, 71-100 red
  const bandColor =
    clamped <= 40 ? 'text-green-500' : clamped <= 70 ? 'text-yellow-500' : 'text-red-500';

  const strokeWidth = 12;

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        style={{ width: size, height: size }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={`${bandColor} transition-all duration-1000 ease-out`}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-slate-900">{clamped}%</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}
