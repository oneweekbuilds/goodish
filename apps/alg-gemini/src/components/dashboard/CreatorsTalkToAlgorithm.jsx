import React from 'react';

/**
 * CreatorsTalkToAlgorithm - Placeholder component for Creators tab
 * Matches the structure expected by TalkToAlgorithmSection
 */
const CreatorsTalkToAlgorithm = ({ scanId }) => {
  // Don't render if no scanId (matching AdsTalkToAlgorithm pattern)
  if (!scanId) {
    return null;
  }

  return (
    <div className="talk-to-algorithm-panel">
      <div className="talk-to-algorithm-content">
        <h3>Creators Talk to Algorithm</h3>
        <p>Coming soon</p>
      </div>
    </div>
  );
};

export default CreatorsTalkToAlgorithm;


