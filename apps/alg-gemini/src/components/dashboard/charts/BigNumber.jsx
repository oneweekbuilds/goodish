import React from 'react';

/**
 * Big number display component.
 * Shows a prominent metric with optional label.
 *
 * @param {string|number} value - The main value to display
 * @param {string} label - Label below the number
 * @param {string} color - Text color class (default text-text-main)
 * @param {boolean} deemphasize - FIX A5: Make number secondary to interpretation
 */
const BigNumber = ({ value, label, color = 'text-text-main', className = '', deemphasize = false }) => {
  return (
    <div className="text-center py-3">
      {/* R2-PA5: Further reduced visual weight when de-emphasized for better hierarchy */}
      <div className={`${deemphasize ? 'text-xl' : 'text-3xl'} ${deemphasize ? 'font-normal' : 'font-medium'} ${color} mb-1 ${deemphasize ? 'opacity-50' : 'opacity-90'} ${className}`}>
        {value}
      </div>
      {label && (
        <p className="text-xs text-slate-400">{label}</p>
      )}
    </div>
  );
};

export default BigNumber;
