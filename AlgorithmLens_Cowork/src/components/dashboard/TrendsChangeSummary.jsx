import React from 'react';

/**
 * TrendsChangeSummary - Renders the "What Changed" summary section with collapsible "Possible Factors"
 *
 * Props:
 * - changeSummaries: array of change summary strings
 * - possibleFactors: array of possible factor strings
 */
const TrendsChangeSummary = ({ changeSummaries, possibleFactors }) => {
  if (changeSummaries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-900">What changed</h4>
      <p className="text-sm text-slate-500">Based on the largest differences between these two scans.</p>
      <ul className="space-y-1.5 text-sm text-slate-700">
        {changeSummaries.map((summary, index) => (
          <li key={index} className="leading-relaxed">
            • {summary}
          </li>
        ))}
      </ul>

      {/* Possible Factors */}
      {possibleFactors.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded">
            Possible factors (optional)
          </summary>
          <div className="mt-2 pl-3 space-y-2">
            <p className="text-sm text-slate-500 italic">
              The following are common factors that can influence feeds. They may or may not apply here.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {possibleFactors.map((factor, index) => (
                <li key={index} className="leading-relaxed">
                  • {factor}
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </div>
  );
};

export default TrendsChangeSummary;
