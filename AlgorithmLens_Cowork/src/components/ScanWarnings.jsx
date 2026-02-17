import React from 'react';

/**
 * ScanWarnings - Displays integrity warnings for low-quality or partial scans
 * Only shown when certain backend fields signal issues
 */
const ScanWarnings = ({ scan }) => {
  if (!scan) return null;

  const warnings = [];

  // Extract scan data from various possible structures
  const scanData = scan.result || scan.scan || scan;
  const aggregates = scanData?.aggregates || {};
  const debugInfo = scanData?.debug || {};
  const metadata = scanData?.scan_metadata || scanData?.metadata || {};

  // Check for warning conditions
  const totalPosts = aggregates.total_feed_items || 0;
  const adsPercentage = aggregates.ad_percentage || 0;
  const errors = debugInfo.errors || scanData?.errors || scan?.errors || [];
  const skippedPosts = metadata.skipped_posts || scanData?.metadata?.skipped_posts || [];

  // Warning 1: Few posts captured
  if (totalPosts < 3) {
    warnings.push({
      type: 'few_posts',
      message: 'This scan captured only a few posts. Try scrolling more next time.',
    });
  }

  // Warning 2: No ads detected (but many posts)
  if (adsPercentage === 0 && totalPosts > 10) {
    warnings.push({
      type: 'no_ads',
      message: 'No ads were detected in this scan. This may indicate limited feed variety.',
    });
  }

  // Warning 3: Backend-reported errors
  if (errors.length > 0) {
    errors.forEach((error, index) => {
      warnings.push({
        type: 'error',
        message: error.message || error.code || `Error ${index + 1}`,
      });
    });
  }

  // Warning 4: Skipped posts
  if (skippedPosts.length > 0) {
    warnings.push({
      type: 'skipped_posts',
      message: 'Some posts were skipped due to missing metadata.',
    });
  }

  // Don't render if no warnings
  if (warnings.length === 0) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 flex-shrink-0 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">
            A few things to know about this scan
          </h3>
          <ul className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm text-slate-500">
                • {warning.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScanWarnings;

