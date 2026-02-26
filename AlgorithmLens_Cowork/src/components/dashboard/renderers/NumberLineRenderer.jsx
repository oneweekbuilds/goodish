import React from 'react';
import { BigNumber } from '../charts';

/**
 * NumberLineRenderer - Number display with optional signals/examples
 * Handles 'number' and 'number_line' output types
 *
 * @param {Object} data - The data object to render
 * @param {string} outputType - Either 'number' or 'number_line'
 * @param {Object} view - View configuration object
 * @param {boolean} isPrimary - Whether this is a primary card
 * @returns {React.ReactNode}
 */
const NumberLineRenderer = ({ data, outputType, view, isPrimary }) => {
  if (!data) return null;

  // PHASE 6A: Handle possibleInfluencePercent for promotion heuristic
  const value = data.currentPercent ?? data.concentration ?? data.discoveryRate ?? data.top3Percent ?? data.possibleInfluencePercent;
  const isAttentionTactics = data?.flaggedCount !== undefined && data?.totalPosts !== undefined && data?.status !== undefined;
  const isPromoContent = view?.id === 'ads-likely-promo';

  return (
    <div className="space-y-4">
      {value !== undefined && (
        <BigNumber
          value={`${value}%`}
          color={isAttentionTactics ? 'text-text-main' : 'text-text-main'}
          className={isAttentionTactics ? 'tracking-tight' : ''}
          deemphasize={!isPrimary}
        />
      )}
      {isAttentionTactics && (
        <p className="text-sm text-text-muted text-center">Flagged during this window</p>
      )}
      {isPromoContent && data.totalPosts && (
        <p className="text-sm text-text-muted text-center">Percent of posts in the selected date range</p>
      )}
      {/* PHASE 6A: Show top signals for promotion heuristic */}
      {data.topSignals && data.topSignals.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-light">
          <p className="text-sm font-medium text-text-muted mb-2">How we identified this:</p>
          <ul className="space-y-1">
            {data.topSignals.slice(0, 3).map((signal, i) => (
              <li key={i} className="text-sm text-text-muted flex items-center gap-2">
                <span className="text-text-muted">•</span>
                {signal.signal} ({signal.count} posts)
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* PHASE 6A: Show message if no promotional signals */}
      {data.message && (
        <p className="text-sm text-text-muted">{data.message}</p>
      )}
      {/* Examples for promotional content */}
      {isPromoContent && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <p className="text-sm font-medium text-text-muted mb-2">Examples from your scans</p>
          {data.examples && data.examples.length > 0 ? (
            <ul className="space-y-1">
              {data.examples.map((example, idx) => (
                <li key={idx} className="text-sm text-text-muted flex items-center gap-2">
                  <span className="text-text-muted">•</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">
              No specific account examples available in this scan summary.
            </p>
          )}
        </div>
      )}
      {/* Examples for attention tactics */}
      {view?.id === 'repetition-patterns' && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <p className="text-sm font-medium text-text-muted mb-2">Examples from your scans</p>
          {data.examples && data.examples.length > 0 ? (
            <ul className="space-y-1">
              {data.examples.map((example, idx) => (
                <li key={idx} className="text-sm text-text-muted flex items-center gap-2">
                  <span className="text-text-muted">•</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">
              We detected attention-style language, but this scan summary did not include specific examples. When examples are available, you will see the accounts or phrases that triggered the detection.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NumberLineRenderer;
