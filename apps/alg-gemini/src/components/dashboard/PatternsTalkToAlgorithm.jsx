import React from 'react';

/**
 * PatternsTalkToAlgorithm - Placeholder component for Patterns tab
 * Matches the structure expected by TalkToAlgorithmSection
 */
const PatternsTalkToAlgorithm = ({ scanId }) => {
  // Don't render if no scanId (matching AdsTalkToAlgorithm pattern)
  if (!scanId) {
    return null;
  }

  return (
    <div className="talk-to-algorithm-panel">
      <div className="talk-to-algorithm-content">
        <h3>Talk to your algorithm (coming soon)</h3>
        <p>Coming soon</p>
      </div>
    </div>
  );
};

export default PatternsTalkToAlgorithm;


