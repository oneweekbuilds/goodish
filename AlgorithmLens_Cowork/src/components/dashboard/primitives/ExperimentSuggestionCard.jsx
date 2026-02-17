import React from 'react';

/**
 * ExperimentSuggestionCard
 *
 * "What you can do with this" card for Overview tab.
 * Shows 1-2 experiment-style suggestions.
 *
 * Props:
 * - suggestions: string[] (required) - Array of 1 or 2 suggestion strings
 *
 * Rules:
 * - Renders suggestions as numbered list
 * - No generic copy
 * - No internal generation logic
 * - Component does not decide count - parent provides
 */
const ExperimentSuggestionCard = ({ suggestions = [] }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-white border border-border-light rounded-lg p-5 space-y-3">
      <h3 className="text-sm font-medium text-text-main">
        What you can do with this
      </h3>

      <ol className="space-y-2 list-decimal list-inside">
        {suggestions.map((suggestion, index) => (
          <li key={index} className="text-sm text-text-muted leading-relaxed">
            {suggestion}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ExperimentSuggestionCard;
