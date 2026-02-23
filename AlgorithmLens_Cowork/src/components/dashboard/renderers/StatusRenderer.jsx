import React from 'react';
import { StatusCard } from '../charts';

/**
 * Helper to determine status variant
 * Maps status values to visual variants (positive, warning, neutral)
 *
 * @param {string} status - The status value
 * @param {Object} data - The full data object (for context)
 * @returns {string} - The variant ('positive', 'warning', or 'neutral')
 */
const getStatusVariant = (status, data) => {
  const s = status.toLowerCase();
  if (s.includes('broad') || s.includes('high') || s.includes('balanced') || s.includes('low') && data?.riskLevel) {
    return data?.riskLevel === 'low' ? 'positive' : 'positive';
  }
  if (s.includes('narrow') || s.includes('skewed') || s.includes('high') && data?.riskLevel) {
    return 'warning';
  }
  if (s.includes('moderate') || s.includes('stable') || s.includes('changing')) {
    return 'neutral';
  }
  return 'neutral';
};

/**
 * StatusRenderer - Status card display
 * Handles 'status' output type
 *
 * Special formats:
 * - patterns-stability: shows change evidence
 * - patterns-echo-risk: shows status + top topics
 * - Standard: shows status with description/factors
 *
 * @param {Object} data - The data object
 * @param {Object} view - View configuration object
 * @returns {React.ReactNode}
 */
const StatusRenderer = ({ data, view }) => {
  if (!data) return null;

  // Special handling for patterns-stability: evidence-based evolution
  if (view?.id === 'patterns-stability') {
    // If we have changes array and it's not empty, show them
    if (data.changes && Array.isArray(data.changes) && data.changes.length > 0) {
      const bullets = [];
      for (const change of data.changes.slice(0, 2)) {
        if (change.type === 'ads') {
          bullets.push(`Ads moved from ${change.earlier}% to ${change.recent}% of scanned posts.`);
        } else if (change.type === 'tone') {
          bullets.push(`More negative or tense posts moved from ${change.earlier}% to ${change.recent}% of scanned posts.`);
        } else if (change.type === 'topic_change') {
          bullets.push(`Top topic shifted from ${change.earlierTopic} to ${change.recentTopic}.`);
        } else if (change.type === 'topic_concentration') {
          bullets.push(`Top topic ${change.topic} became more common in recent scans.`);
        }
      }

      return (
        <div className="space-y-3">
          <p className="text-sm text-text-main font-medium">
            Based on your earlier scans compared with your most recent scans:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="text-sm text-text-muted">
                {bullet}
              </li>
            ))}
          </ul>
          <p className="text-sm text-text-muted italic mt-3">
            These are scan-based snapshots, not a complete view of everything you see.
          </p>
        </div>
      );
    }

    // Fallback: no changes detected or insufficient data
    return (
      <div className="space-y-2">
        <p className="text-sm text-text-muted">
          We need more scan history to describe changes over time. As you scan on different days, this section will summarize what actually shifted between earlier and more recent scans.
        </p>
      </div>
    );
  }

  const status = data.status || data.breadth || data.diversity || data.stability || data.riskLevel || 'Unknown';
  const variant = getStatusVariant(status, data);
  const description = data.factors?.join('. ') || data.description;

  // Special handling for patterns-echo-risk: show topic list
  if (view?.id === 'patterns-echo-risk') {
    const topTopics = data.topTopics || [];
    const hasTopics = topTopics.length > 0;

    return (
      <div className="space-y-3">
        <StatusCard status={status} variant={variant} description={description} />
        {hasTopics ? (
          <div className="mt-4 pt-4 border-t border-border-light">
            <p className="text-sm font-medium text-text-muted mb-2">Top topics observed</p>
            <ul className="space-y-1">
              {topTopics.map((topic, idx) => (
                <li key={idx} className="text-sm text-text-muted flex items-center gap-2">
                  <span className="text-text-muted">•</span>
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-border-light">
            <p className="text-sm text-text-muted">
              We did not have enough topic detail in this scan summary to list examples yet. When topic extraction is available, this section will list the topics that appeared most often.
            </p>
          </div>
        )}
      </div>
    );
  }

  return <StatusCard status={status} variant={variant} description={description} />;
};

export default StatusRenderer;
