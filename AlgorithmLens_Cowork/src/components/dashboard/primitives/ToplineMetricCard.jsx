import React from 'react';
import DenominatorLine from './DenominatorLine';

/**
 * ToplineMetricCard - PREMIER QUALITY
 *
 * Elevated card component for Overview tab's 4-card summary.
 * Features: subtle gradient background, refined shadow depth, stronger typography hierarchy.
 *
 * Props:
 * - headline: string (required) - Card headline (medium weight)
 * - microLine: string (optional) - Small supplementary text
 * - valueNode: ReactNode (required) - Number, bar, or small chart (largest visual element)
 * - denominatorText: string (required) - Denominator line text
 * - fallbackText: string (optional) - Text shown when hasData is false
 * - hasData: boolean (required) - Whether to show data or fallback
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
    <div
      className="rounded-xl p-5 sm:p-6 space-y-3 transition-all duration-200 group"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFE 100%)',
        border: '1px solid rgba(37, 99, 235, 0.08)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(15, 23, 42, 0.03)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(15, 23, 42, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.14)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(15, 23, 42, 0.03)';
        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.08)';
      }}
    >
      {/* Headline */}
      <h3
        className="text-text-main"
        style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          lineHeight: 1.4,
        }}
      >
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
            <p className="text-sm text-text-muted leading-relaxed">
              {microLine}
            </p>
          )}

          {/* Denominator */}
          <DenominatorLine text={denominatorText} />
        </>
      ) : (
        <div className="py-6 flex items-center justify-center">
          <p className="text-sm text-slate-400 italic leading-relaxed text-center" style={{ maxWidth: '220px' }}>
            {fallbackText}
          </p>
        </div>
      )}
    </div>
  );
};

export default ToplineMetricCard;
