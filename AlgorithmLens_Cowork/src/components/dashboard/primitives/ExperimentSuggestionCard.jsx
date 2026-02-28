import React from 'react';
import { Lightbulb } from 'lucide-react';

/**
 * ExperimentSuggestionCard
 *
 * "What you can do with this" card for Overview tab.
 * Shows 1-2 experiment-style suggestions in visually engaging cards.
 *
 * Props:
 * - suggestions: string[] (required) - Array of 1 or 2 suggestion strings
 *
 * Rules:
 * - Renders suggestions as styled action cards with numbering
 * - No generic copy
 * - No internal generation logic
 * - Component does not decide count - parent provides
 */
const ExperimentSuggestionCard = ({ suggestions = [] }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-white border border-border-light rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-medium text-text-main">
          What you can do with this
        </h3>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex gap-4 items-start p-4 rounded-xl border border-slate-100 bg-gradient-to-r from-blue-50/50 to-transparent">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">{index + 1}</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperimentSuggestionCard;
