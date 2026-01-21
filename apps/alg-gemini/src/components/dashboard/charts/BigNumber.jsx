import React from 'react';

/**
 * Big number display component.
 * Shows a prominent metric with optional label.
 *
 * @param {string|number} value - The main value to display
 * @param {string} label - Label below the number
 * @param {string} color - Text color class (default text-text-main)
 */
const BigNumber = ({ value, label, color = 'text-text-main', className = '' }) => {
  return (
    <div className="text-center py-3">
      <div className={`text-3xl font-medium ${color} mb-1 opacity-90 ${className}`}>
        {value}
      </div>
      {label && (
        <p className="text-xs text-slate-400">{label}</p>
      )}
    </div>
  );
};

export default BigNumber;
