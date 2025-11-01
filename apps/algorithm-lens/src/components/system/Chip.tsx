import React from 'react';

export interface ChipProps {
  children: React.ReactNode;
  color?: string;
  onRemove?: () => void;
}

/**
 * Chip component for tags and removable items
 * - Shows optional remove button
 * - Customizable color
 */
export function Chip({ children, color, onRemove }: ChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-lg bg-panel border border-line"
      style={color ? { borderColor: color, color } : undefined}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-70 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
          aria-label="Remove"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
