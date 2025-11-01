import React from 'react';
import { Tooltip } from './Tooltip';
import { InlineInfo } from './InlineInfo';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  helpText?: string;
  infoContent?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * MetricCard component for dashboard metrics
 * - Title row with optional help tooltip
 * - Large numeric value
 * - Optional subtitle and visualization
 * - "What this means" collapsible section
 */
export function MetricCard({
  title,
  value,
  subtitle,
  helpText,
  infoContent,
  icon,
  children,
}: MetricCardProps) {
  return (
    <div className="rounded-lg bg-panel shadow-e2 p-5 border border-line">
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <div className="flex items-center gap-2">
          {icon && <div className="text-brand">{icon}</div>}
          {helpText && (
            <Tooltip content={helpText}>
              <button
                className="p-1 hover:bg-neuLight rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="Help"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-inkMuted"
                >
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M8 11V11.01M8 8C8 6.89543 8.89543 6 10 6C11.1046 6 12 6.89543 12 8C12 8.73638 11.5978 9.37224 11 9.73205"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="text-3xl md:text-4xl font-semibold text-ink mb-2 tabular-nums">
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && <p className="text-sm text-inkMuted mb-3">{subtitle}</p>}

      {/* Children (visualizations, etc.) */}
      {children && <div className="mt-4">{children}</div>}

      {/* Inline info */}
      {infoContent && <InlineInfo>{infoContent}</InlineInfo>}
    </div>
  );
}
