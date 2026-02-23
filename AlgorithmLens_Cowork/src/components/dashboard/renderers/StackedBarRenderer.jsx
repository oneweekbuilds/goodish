import React from 'react';
import { StackedBar100 } from '../charts';

/**
 * StackedBarRenderer - 100% stacked bar chart
 * Handles 'stacked100' output type
 *
 * UI Refoundation: De-emphasized on secondary cards
 *
 * @param {Object} data - The data object containing segments
 * @param {Object} view - View configuration object
 * @param {boolean} deemphasizeCharts - Whether to reduce chart opacity
 * @returns {React.ReactNode}
 */
const StackedBarRenderer = ({ data, view, deemphasizeCharts }) => {
  if (!data) return null;

  const segments = data.segments || data;
  if (!Array.isArray(segments)) return null;

  // Special handling for patterns-emotional-weight: show tone examples
  const isToneView = view?.id === 'patterns-emotional-weight';
  const hasExamples = isToneView && (data.positiveExamples || data.negativeExamples);
  const hasAnyExamples = hasExamples && (
    (data.positiveExamples && data.positiveExamples.length > 0) ||
    (data.negativeExamples && data.negativeExamples.length > 0)
  );

  return (
    <div className="space-y-3">
      <div className={deemphasizeCharts ? 'opacity-80' : ''}>
        <StackedBar100 segments={segments} />
      </div>
      {/* PHASE 6A: Show disclaimer if present (political leaning) */}
      {data.disclaimer && (
        <p className="text-sm text-text-muted italic">{data.disclaimer}</p>
      )}
      {/* Examples for tone view */}
      {isToneView && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <p className="text-sm font-medium text-text-muted mb-3">Examples from your scans</p>
          {hasAnyExamples ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-text-muted mb-1.5">Positive</p>
                {data.positiveExamples && data.positiveExamples.length > 0 ? (
                  <ul className="space-y-1">
                    {data.positiveExamples.map((example, idx) => (
                      <li key={idx} className="text-sm text-text-muted flex items-center gap-2">
                        <span className="text-text-muted">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-muted">
                    No positive tone examples in your scanned posts yet.
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted mb-1.5">Negative</p>
                {data.negativeExamples && data.negativeExamples.length > 0 ? (
                  <ul className="space-y-1">
                    {data.negativeExamples.map((example, idx) => (
                      <li key={idx} className="text-sm text-text-muted flex items-center gap-2">
                        <span className="text-text-muted">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-muted">
                    No negative tone examples in your scanned posts yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              We do not have enough detail in this scan summary to list accounts by tone yet. When available, you will see which accounts skew more positive or more negative in the scanned content.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StackedBarRenderer;
