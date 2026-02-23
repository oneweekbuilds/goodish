import React from 'react';

/**
 * ListRenderer - Bulleted list display
 * Handles 'list' output type
 *
 * Supports multiple data shapes (array, tips, interests, rareTopics, topics, blindSpots)
 * Handles unclassified items separately
 *
 * @param {Object} data - The data object (can be array or object with various shapes)
 * @param {Object} dataResult - The full dataResult object (for notes)
 * @param {Object} view - View configuration object
 * @param {string} accentColor - Semantic color ('blue' or 'green')
 * @param {boolean} isInline - Whether this is an inline card
 * @returns {React.ReactNode}
 */
const ListRenderer = ({ data, dataResult, view, accentColor, isInline }) => {
  if (!data) return null;

  // Handle different data shapes
  let items = [];
  let note = null;

  if (Array.isArray(data)) {
    items = data.map((d, index) => ({
      text: d.topic || d.label || d,
      isUnclassified: d.isUnclassified || false,
      // FIX W3: Add share percentage or rank context for topics
      subtext: d.share !== undefined ? `${d.share}% of feed` : (view?.id === 'algo-topics-liked' && index < 5 ? `#${index + 1}` : null),
    }));
  } else if (data.tips) {
    items = data.tips.map(t => ({ text: t, isUnclassified: false }));
  } else if (data.interests) {
    items = data.interests.map(i => ({ text: i, isUnclassified: false }));
  } else if (data.rareTopics) {
    // PHASE 6A: Handle rare topics format
    items = data.rareTopics.map(t => ({
      text: t.topic,
      isUnclassified: false,
      subtext: `${t.share}% of feed`,
    }));
  } else if (data.topics) {
    // PHASE 6A: Handle topics array (for algo-topics-avoided)
    items = data.topics.map(t => ({
      text: t,
      isUnclassified: false,
    }));
  } else if (data.blindSpots) {
    // PHASE 6A: Handle political blind spots
    items = data.blindSpots.map(b => ({
      text: b,
      isUnclassified: false,
    }));
  }

  // Check for notes
  note = dataResult?.unclassifiedNote || dataResult?.data?.unclassifiedNote || data.note || data.message;

  // PHASE 6A: Show message if no items
  if (items.length === 0) {
    if (data.message) {
      return <p className="text-sm text-text-muted">{data.message}</p>;
    }
    return null;
  }

  const unclassifiedItems = items.filter(item => item.isUnclassified);
  const mainItems = items.filter(item => !item.isUnclassified);

  // UI Refoundation: Bullet color uses semantic accent
  const bulletColor = accentColor === 'green' ? 'text-emerald-500' : 'text-primary-blue';

  return (
    <div className="space-y-3">
      {mainItems.length > 0 && (
        <ul className="space-y-2">
          {mainItems.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-text-main">
              <span className={`${bulletColor} mt-1`}>•</span>
              <span>
                {typeof item === 'string' ? item : item.text}
                {item.subtext && (
                  <span className="text-sm text-text-muted ml-2">({item.subtext})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {unclassifiedItems.length > 0 && (
        <p className="text-sm text-text-muted italic">
          Other / couldn&apos;t categorize: {unclassifiedItems.map(item => (typeof item === 'string' ? item : item.text)).join(', ')}
        </p>
      )}
      {note && !isInline && (
        <p className="text-sm text-text-muted italic">
          {note}
        </p>
      )}
    </div>
  );
};

export default ListRenderer;
