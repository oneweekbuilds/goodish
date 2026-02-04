import React from 'react';

/**
 * MasterNumbersLine
 *
 * Footer line shown at the bottom of every tab in the locked spec.
 * Displays scan, platform, and post counts or fallback message.
 *
 * Props:
 * - scanCount: number (required) - Number of scans
 * - platformCount: number (required) - Number of platforms
 * - postCount: number (required) - Number of posts
 */
const MasterNumbersLine = ({ scanCount, platformCount, postCount }) => {
  const text = postCount > 0
    ? `Based on ${scanCount} scan(s) across ${platformCount} platform(s) and ${postCount} posts.`
    : 'Based on the selected date range, no posts were available for this tab.';

  return (
    <p className="text-xs text-slate-400 text-left">
      {text}
    </p>
  );
};

export default MasterNumbersLine;
