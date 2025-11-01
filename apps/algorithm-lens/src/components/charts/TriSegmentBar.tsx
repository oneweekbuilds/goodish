import React from 'react';
interface TriSegmentBarProps {
  left: number;
  neutral: number;
  right: number;
  showLabels?: boolean;
}

export function TriSegmentBar({
  left,
  neutral,
  right,
  showLabels = true
}: TriSegmentBarProps) {
  const total = left + neutral + right;
  const leftPercent = total > 0 ? (left / total) * 100 : 0;
  const neutralPercent = total > 0 ? (neutral / total) * 100 : 0;
  const rightPercent = total > 0 ? (right / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex h-8 rounded-lg overflow-hidden border border-slate-200">
        {/* Left segment */}
        {leftPercent > 0 && (
          <div
            className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold transition-all duration-500"
            style={{ width: `${leftPercent}%` }}
          >
            {leftPercent >= 10 && `${Math.round(leftPercent)}%`}
          </div>
        )}

        {/* Neutral segment */}
        {neutralPercent > 0 && (
          <div
            className="bg-gray-400 flex items-center justify-center text-white text-xs font-semibold transition-all duration-500"
            style={{ width: `${neutralPercent}%` }}
          >
            {neutralPercent >= 10 && `${Math.round(neutralPercent)}%`}
          </div>
        )}

        {/* Right segment */}
        {rightPercent > 0 && (
          <div
            className="bg-red-500 flex items-center justify-center text-white text-xs font-semibold transition-all duration-500"
            style={{ width: `${rightPercent}%` }}
          >
            {rightPercent >= 10 && `${Math.round(rightPercent)}%`}
          </div>
        )}
      </div>

      {showLabels && (
        <div className="flex justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Left: {Math.round(leftPercent)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Neutral: {Math.round(neutralPercent)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Right: {Math.round(rightPercent)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
