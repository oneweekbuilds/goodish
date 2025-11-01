import React from 'react';
export interface BarData {
  label: string;
  value: number;
  color: string;
  emoji?: string;
}

interface HorizontalBarsProps {
  data: BarData[];
  maxValue?: number;
  showPercentage?: boolean;
}

export function HorizontalBars({
  data,
  maxValue,
  showPercentage = true
}: HorizontalBarsProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 100);

  return (
    <div className="space-y-4">
      {data.map((item, idx) => {
        const widthPercent = (item.value / max) * 100;

        return (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                {item.emoji && <span>{item.emoji}</span>}
                <span>{item.label}</span>
              </div>
              {showPercentage && (
                <span className="font-semibold text-slate-900">{item.value}%</span>
              )}
            </div>
            <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-3"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: item.color
                }}
              >
                {widthPercent > 15 && showPercentage && (
                  <span className="text-white text-xs font-bold">{item.value}%</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
