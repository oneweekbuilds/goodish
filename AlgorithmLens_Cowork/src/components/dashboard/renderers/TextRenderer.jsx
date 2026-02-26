import React from 'react';
import { InsightCard } from '../charts';

/**
 * TextRenderer - Text/insight card display
 * Handles 'text' output type
 *
 * Supports multiple special formats:
 * - Creator concentration (primaryInsight + contextLine + topCreators)
 * - Ads concentration (advertiserCount + advertisers list)
 * - Algo confident (summaryThemes + evidence)
 * - Algo future (suggestedThemes + coOccurrence)
 * - Standard insights
 *
 * @param {Object} data - The data object
 * @param {Object} view - View configuration object
 * @returns {React.ReactNode}
 */
const TextRenderer = ({ data, view }) => {
  if (!data) return null;

  // Special handling for creator concentration with context line and top creators
  if (data.primaryInsight) {
    return (
      <div className="space-y-3">
        {/* Primary insight */}
        <p className="text-text-main leading-relaxed">
          {data.primaryInsight}
        </p>
        {/* Oura-style context line */}
        {data.contextLine && (
          <p className="text-sm text-text-muted leading-relaxed italic">
            {data.contextLine}
          </p>
        )}
        {/* Top creators list - visually secondary */}
        {data.topCreators && data.topCreators.length > 0 && (
          <div className="pt-2 border-t border-border-light">
            <p className="text-sm text-text-muted mb-2 font-medium">Top accounts during this window:</p>
            <ul className="space-y-1">
              {data.topCreators.slice(0, 5).map((c, idx) => (
                <li key={idx} className="text-sm text-text-muted flex items-center gap-2">
                  <span className="text-text-muted">{idx + 1}.</span>
                  <span>{c.creator}</span>
                  <span className="text-text-muted">({c.share}%)</span>
                </li>
              ))}
              {data.topCreators.length > 5 && (
                <li className="text-sm text-text-muted italic">
                  ...and {data.topCreators.length - 5} more
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Special handling for ads-concentration: show advertiser list or fallback
  if (view?.id === 'ads-concentration' && data) {
    const advertiserCount = data.advertiserCount || 0;
    const advertisers = data.advertisers || [];

    // Advertiser list or fallback message
    if (advertisers.length > 0) {
      return (
        <div className="pt-2 border-t border-border-light">
          <p className="text-sm text-text-muted mb-2 font-medium">
            Advertisers observed: {advertiserCount}
          </p>
          <ul className="space-y-1">
            {advertisers.map((advertiser, idx) => (
              <li key={idx} className="text-sm text-text-muted flex items-center gap-2">
                <span className="text-text-muted">{idx + 1}.</span>
                <span>{advertiser.name}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    } else if (advertiserCount > 0) {
      return (
        <div className="pt-2 border-t border-border-light">
          <p className="text-sm text-text-muted mb-1 font-medium">
            Advertisers observed: {advertiserCount}
          </p>
          <p className="text-sm text-text-muted italic">
            This scan summary did not include advertiser names. Future versions will list them when available.
          </p>
        </div>
      );
    }
    // If no advertiser count, fall through to standard handling
  }

  // Special handling for algo-confident: show summary themes with evidence
  if (view?.id === 'algo-confident' && data) {
    const summaryThemes = data.summaryThemes || [];
    const evidence = data.evidence || [];

    if (summaryThemes.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-text-muted">
            We did not detect strong recurring themes in your scanned posts yet.
          </p>
          <p className="text-sm text-text-muted">
            As you scan more, this section will summarize themes that repeatedly show up.
          </p>
        </div>
      );
    }

    // Format theme list (up to 3)
    const themeList = summaryThemes.slice(0, 3).join(', ');

    // Build evidence line
    let evidenceLine = null;
    if (evidence.length > 0 && evidence.some(e => e.percentage !== undefined)) {
      // We have percentage data
      const evidenceParts = evidence
        .filter(e => e.theme && e.percentage !== undefined)
        .slice(0, 3)
        .map(e => `${e.theme} appeared in ${e.percentage}% of scanned posts`);

      if (evidenceParts.length > 0) {
        evidenceLine = `Evidence from your scans: ${evidenceParts.join(', ')}.`;
      }
    } else if (evidence.length > 0 && evidence.some(e => e.scanCount !== undefined)) {
      // We have scan count data
      const evidenceParts = evidence
        .filter(e => e.theme && e.scanCount !== undefined)
        .slice(0, 3)
        .map(e => `${e.theme} appeared in ${e.scanCount} scan${e.scanCount !== 1 ? 's' : ''}`);

      if (evidenceParts.length > 0) {
        evidenceLine = `Evidence from your scans: ${evidenceParts.join(', ')}.`;
      }
    } else if (evidence.length > 0) {
      // We have themes but no counts
      evidenceLine = 'Evidence from your scans: these themes appeared across multiple posts and accounts in your scans.';
    } else {
      // No evidence data
      evidenceLine = 'Evidence from your scans: detailed evidence is not available for this card yet.';
    }

    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-text-main leading-relaxed">
          The strongest recurring themes in your scanned feed are: {themeList}.
        </p>
        {evidenceLine && (
          <p className="text-sm text-text-muted">
            {evidenceLine}
          </p>
        )}
      </div>
    );
  }

  // Special handling for algo-future: show co-occurrence-based suggestions
  if (view?.id === 'algo-future' && data) {
    const suggestedThemes = data.suggestedThemes || [];
    const topTheme = data.topTheme;
    const coOccurrenceCounts = data.coOccurrenceCounts || {};

    if (suggestedThemes.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-text-muted">
            We do not have enough consistent co-occurrence signal yet to suggest related future themes.
          </p>
          <p className="text-sm text-text-muted">
            As you scan more over time, this section will highlight topics that repeatedly appear together.
          </p>
        </div>
      );
    }

    // Format theme list (up to 3)
    const themeList = suggestedThemes.join(', ');

    // Build evidence line if we have top theme
    let evidenceLine = null;
    if (topTheme && coOccurrenceCounts[suggestedThemes[0]] >= 2) {
      evidenceLine = `Evidence from your scans: these topics frequently appeared in the same scans as ${topTheme}.`;
    }

    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-text-main leading-relaxed">
          If these scan patterns continue, related themes that may show up more often include: {themeList}.
        </p>
        <p className="text-sm text-text-muted">
          This is a scan-based guess based on which topics tended to appear together in your scans.
        </p>
        {evidenceLine && (
          <p className="text-sm text-text-muted">
            {evidenceLine}
          </p>
        )}
      </div>
    );
  }

  // Standard handling for other text types
  let content = [];
  if (data.insights) {
    content = data.insights;
  } else if (data.predictions) {
    content = data.predictions;
  } else if (data.interests) {
    content = [`Interests: ${data.interests.join(', ')}`];
  } else if (typeof data === 'string') {
    content = [data];
  }

  if (content.length === 0) return null;

  return <InsightCard content={content} />;
};

export default TextRenderer;
