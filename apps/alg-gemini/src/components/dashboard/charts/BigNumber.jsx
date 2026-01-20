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
    <div className="text-center py-4">
      <div className={`text-4xl font-semibold ${color} mb-1 ${className}`}>
        {value}
      </div>
      {label && (
        <p className="text-sm text-slate-500">{label}</p>
      )}
    </div>
  );
};

export default BigNumber;
