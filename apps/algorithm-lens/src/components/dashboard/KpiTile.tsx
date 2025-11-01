import React from 'react';
interface KpiTileProps {
  label: string;
  value: string | number;
  helper: string;
  sparkline?: number[];
}

export function KpiTile({ label, value, helper, sparkline }: KpiTileProps) {
  return (
    <div className="bg-surface-1 border border-stroke rounded-xl shadow-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2">
            {label}
          </div>
          <div
            className="font-bold text-ink leading-tight"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
          >
            {value}
          </div>
        </div>
        {sparkline && sparkline.length > 0 && (
          <div className="w-20 h-12">
            <svg viewBox="0 0 80 48" className="w-full h-full">
              <polyline
                points={sparkline
                  .map((v, i) => `${(i / (sparkline.length - 1)) * 80},${48 - (v / Math.max(...sparkline)) * 40}`)
                  .join(' ')}
                fill="none"
                stroke="var(--tone-blue)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
      <p className="text-sm text-ink-2">{helper}</p>
    </div>
  );
}
