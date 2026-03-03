/**
 * TrendsDataHelpers.js
 * Pure data-processing functions for TrendsPanel
 */

/**
 * Formats scan date/time for display in dropdowns
 * @param {Object} scan - Scan object with created_at property
 * @returns {string} - Formatted label like "Jan 15, 2025 at 2:30 PM (Twitter)"
 */
export const formatScanLabel = (scan) => {
  if (!scan) return '';
  const date = new Date(scan.created_at);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const platform = scan.platform ? ` (${scan.platform})` : '';
  return `${dateStr} at ${timeStr}${platform}`;
};

/**
 * Determines which scan is newer based on created_at dates
 * @param {string} baselineScanId - ID of baseline scan
 * @param {string} compareScanId - ID of compare scan
 * @param {Array} filteredScans - Array of scan objects to search within
 * @returns {string|null} - ID of newer scan, or null if unable to determine
 */
export const getNewerScanId = (baselineScanId, compareScanId, filteredScans) => {
  if (!baselineScanId || !compareScanId) return null;
  const baselineScan = filteredScans.find(s => s.id === baselineScanId);
  const compareScan = filteredScans.find(s => s.id === compareScanId);
  if (!baselineScan || !compareScan) return null;

  const baselineDate = new Date(baselineScan.created_at);
  const compareDate = new Date(compareScan.created_at);

  return compareDate > baselineDate ? compareScanId : baselineScanId;
};
