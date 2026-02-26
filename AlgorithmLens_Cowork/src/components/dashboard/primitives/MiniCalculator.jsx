import React, { useState } from 'react';

/**
 * MiniCalculator
 *
 * Calculator for "minutes per day" metrics (ads, political content).
 * Shows input, formula, and calculated output.
 *
 * Props:
 * - label: string (required) - Display label (e.g. "Minutes per day advertised to")
 * - percent: number | null (required) - Percentage to multiply by (0-100), or null if disabled
 * - disabledMessage: string (required) - Message shown when percent is null
 *
 * UI behavior:
 * - Numeric input for "Minutes per day on social media"
 * - Formula line always visible
 * - If percent is null: input disabled, output hidden, show disabledMessage
 * - No persistence, no side effects
 */
const MiniCalculator = ({ label, percent, disabledMessage }) => {
  const [minutesPerDay, setMinutesPerDay] = useState(30);

  const isDisabled = percent === null;
  const calculatedMinutes = isDisabled ? 0 : Math.round((minutesPerDay * percent) / 100);

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setMinutesPerDay(value);
    }
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="text-sm font-medium text-text-main">
        {label}
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm text-text-muted">
          Minutes per day on social media
        </label>
        <input
          type="number"
          min="0"
          value={minutesPerDay}
          onChange={handleInputChange}
          disabled={isDisabled}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${
            isDisabled
              ? 'bg-primary-blue/5 text-text-muted border-border-light cursor-not-allowed'
              : 'bg-white text-text-main border-border-light focus:outline-none focus:ring-2 focus:ring-primary-blue'
          }`}
        />
      </div>

      {/* Formula */}
      <div className="text-sm text-text-muted font-mono bg-primary-blue/5 px-3 py-2 rounded">
        {minutesPerDay} × {percent !== null ? `${percent.toFixed(1)}%` : 'N/A'} = {isDisabled ? 'N/A' : calculatedMinutes}
      </div>

      {/* Output or Disabled Message */}
      {isDisabled ? (
        <p className="text-sm text-text-muted italic">
          {disabledMessage}
        </p>
      ) : (
        <div className="text-lg font-semibold text-text-main">
          ≈ {calculatedMinutes} minutes per day
        </div>
      )}
    </div>
  );
};

export default MiniCalculator;
