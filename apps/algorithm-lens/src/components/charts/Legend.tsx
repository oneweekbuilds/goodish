import React from 'react';

export interface LegendItem {
  label: string;
  color: string;
  value?: string | number;
}

export interface LegendProps {
  items: LegendItem[];
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Legend component for charts
 * - Horizontal or vertical layout
 * - Color dots with labels
 * - Optional values
 */
export function Legend({ items, orientation = 'horizontal' }: LegendProps) {
  return (
    <div
      className={`
        flex gap-4
        ${orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'}
      `.replace(/\s+/g, ' ').trim()}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-inkMuted">
            {item.label}
            {item.value !== undefined && (
              <span className="ml-1 font-medium text-ink tabular-nums">{item.value}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
