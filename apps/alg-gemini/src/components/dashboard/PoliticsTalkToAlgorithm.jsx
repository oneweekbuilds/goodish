import React from 'react';

/**
 * PoliticsTalkToAlgorithm - Placeholder component for Politics tab
 * Matches the structure expected by TalkToAlgorithmSection
 */
const PoliticsTalkToAlgorithm = ({ scanId }) => {
  // Don't render if no scanId (matching AdsTalkToAlgorithm pattern)
  if (!scanId) {
    return null;
  }

  return (
    <div className="talk-to-algorithm-panel">
      <div className="talk-to-algorithm-content">
        <h3>Politics Talk to Algorithm</h3>
        <p>Coming soon</p>
      </div>
    </div>
  );
};

export default PoliticsTalkToAlgorithm;


