import React from 'react';

/**
 * InferencesTalkToAlgorithm - Placeholder component for Algorithm/Inferences tab
 * Matches the structure expected by TalkToAlgorithmSection
 */
const InferencesTalkToAlgorithm = ({ scanId }) => {
  // Don't render if no scanId (matching AdsTalkToAlgorithm pattern)
  if (!scanId) {
    return null;
  }

  return (
    <div className="talk-to-algorithm-panel">
      <div className="talk-to-algorithm-content">
        <h3>Inferences Talk to Algorithm</h3>
        <p>Coming soon</p>
      </div>
    </div>
  );
};

export default InferencesTalkToAlgorithm;


