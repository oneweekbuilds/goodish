import React from 'react';

/**
 * DenominatorLine - PREMIER QUALITY
 * Context line shown under charts with refined icon and typography.
 */
const DenominatorLine = ({ text }) => {
  if (!text) return null;

  return (
    <p
      className="flex items-center gap-1.5 mt-2"
      style={{
        fontSize: '0.8125rem',
        color: '#94A3B8',
        letterSpacing: '0.005em',
      }}
    >
      <svg
        className="w-3.5 h-3.5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ opacity: 0.6 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {text}
    </p>
  );
};

export default DenominatorLine;
