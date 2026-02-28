import React from 'react';
import { BigNumber, BarChartSimple } from '../charts';

/**
 * NumberBarRenderer - Number + bar chart for topic variety
 * Handles 'number_bar' output type
 *
 * UI Refoundation: Chart portion de-emphasized on secondary cards
 *
 * @param {Object} data - The data object containing topicCount and topTopics
 * @param {boolean} deemphasizeCharts - Whether to reduce chart opacity
 * @param {boolean} isInline - Whether this is an inline card
 * @returns {React.ReactNode}
 */
const NumberBarRenderer = ({ data, deemphasizeCharts, isInline }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <BigNumber value={data.topicCount} label="topics detected" />
      {data.topTopics && data.topTopics.length > 0 && (
        <div className={deemphasizeCharts ? 'opacity-80' : ''}>
          <BarChartSimple data={data.topTopics} valueLabel="%" />
        </div>
      )}
      {data.unclassifiedNote && !isInline && (
        <p className="text-sm text-text-muted italic">
          {data.unclassifiedNote}
        </p>
      )}
    </div>
  );
};

export default NumberBarRenderer;
