import React from 'react';
import DenominatorLine from './DenominatorLine';

/**
 * ToplineMetricCard
 *
 * Card component for Overview tab's 4-card summary.
 * Shows headline, value, optional micro line, denominator, and fallback.
 *
 * Props:
 * - headline: string (required) - Card headline (medium weight)
 * - microLine: string (optional) - Small supplementary text
 * - valueNode: ReactNode (required) - Number, bar, or small chart (largest visual element)
 * - denominatorText: string (required) - Denominator line text
 * - fallbackText: string (optional) - Text shown when hasData is false
 * - hasData: boolean (required) - Whether to show data or fallback
 *
 * Rendering rules:
 * - If hasData is false: hide valueNode, show fallbackText
 */
const ToplineMetricCard = ({
  headline,
  microLine,
  valueNode,
  denominatorText,
  fallbackText,
  hasData,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      {/* Headline */}
      <h3 className="text-sm font-medium text-slate-700">
        {headline}
      </h3>

      {/* Value or Fallback */}
      {hasData ? (
        <>
          {/* Value (largest visual element) */}
          <div className="my-4">
            {valueNode}
          </div>

          {/* Micro line */}
          {microLine && (
            <p className="text-xs text-slate-500">
              {microLine}
            </p>
          )}

          {/* Denominator */}
          <DenominatorLine text={denominatorText} />
        </>
      ) : (
        <p className="text-sm text-slate-400 italic py-4">
          {fallbackText}
        </p>
      )}
    </div>
  );
};

export default ToplineMetricCard;
