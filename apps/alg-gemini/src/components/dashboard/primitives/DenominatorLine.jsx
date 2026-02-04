import React from 'react';

/**
 * DenominatorLine
 *
 * Standardized denominator copy shown under charts and cards.
 * Component does not generate copy - parent provides fully formatted text.
 *
 * Props:
 * - text: string (required) - Preformatted denominator text
 */
const DenominatorLine = ({ text }) => {
  if (!text) return null;

  return (
    <p className="text-xs text-slate-400 mt-2">
      {text}
    </p>
  );
};

export default DenominatorLine;
