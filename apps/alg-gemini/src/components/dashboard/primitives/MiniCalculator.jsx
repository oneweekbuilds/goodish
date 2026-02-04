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
      <div className="text-sm font-medium text-slate-700">
        {label}
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="text-xs text-slate-500">
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
              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        />
      </div>

      {/* Formula */}
      <div className="text-xs text-slate-600 font-mono bg-slate-50 px-3 py-2 rounded">
        {minutesPerDay} × {percent !== null ? `${percent.toFixed(1)}%` : '—'} = {isDisabled ? '—' : calculatedMinutes}
      </div>

      {/* Output or Disabled Message */}
      {isDisabled ? (
        <p className="text-xs text-slate-400 italic">
          {disabledMessage}
        </p>
      ) : (
        <div className="text-lg font-semibold text-slate-900">
          ≈ {calculatedMinutes} minutes per day
        </div>
      )}
    </div>
  );
};

export default MiniCalculator;
