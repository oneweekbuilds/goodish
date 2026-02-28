import React from 'react';

/**
 * Plain-language insight card component.
 * Shows 2-4 sentences of analysis.
 *
 * @param {Array|string} content - Array of strings or single string for insights
 */
const InsightCard = ({ content }) => {
  if (!content) return null;

  const items = Array.isArray(content) ? content : [content];

  return (
    <div className="space-y-3">
      {items.map((text, index) => (
        <p key={index} className="text-text-main leading-relaxed">
          {text}
        </p>
      ))}
    </div>
  );
};

export default InsightCard;
