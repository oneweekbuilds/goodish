import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { formatScanLabel, getNewerScanId } from './TrendsDataHelpers';

/**
 * TrendsScanSelector - Renders the baseline/compare scan selection dropdowns with swap button
 * Appears in both embedded and non-embedded modes.
 *
 * Props:
 * - baselineScanId: selected baseline scan ID
 * - compareScanId: selected compare scan ID
 * - filteredScans: array of scans to choose from
 * - onBaselineChange: callback when baseline selection changes
 * - onCompareChange: callback when compare selection changes
 * - onSwap: callback when swap button is clicked
 * - showAutoSelectHint: boolean - if true, shows "auto-selected" helper text (non-embedded only)
 */
const TrendsScanSelector = ({
  baselineScanId,
  compareScanId,
  filteredScans,
  onBaselineChange,
  onCompareChange,
  onSwap,
  showAutoSelectHint = false,
}) => {
  const newerScanId = getNewerScanId(baselineScanId, compareScanId, filteredScans);

  return (
    <div className="space-y-3">
      {/* Auto-select helper text (non-embedded only) */}
      {showAutoSelectHint && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-sm text-blue-700">
            Auto-selected your two most recent scans.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        {/* Baseline Scan */}
        <div>
          <label htmlFor="baseline-scan" className="block text-xs font-medium text-slate-700 mb-2">
            <span className="inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">Baseline</span>
              {baselineScanId && baselineScanId === newerScanId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  Newer
                </span>
              )}
            </span>
          </label>
          <select
            id="baseline-scan"
            value={baselineScanId || ''}
            onChange={(e) => onBaselineChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/60 focus:border-primary-blue"
          >
            <option value="">Select baseline...</option>
            {filteredScans.map(scan => (
              <option key={scan.id} value={scan.id}>
                {formatScanLabel(scan)}
              </option>
            ))}
          </select>
        </div>

        {/* Compare Scan */}
        <div>
          <label htmlFor="compare-scan" className="block text-xs font-medium text-slate-700 mb-2">
            <span className="inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">Compare</span>
              {compareScanId && compareScanId === newerScanId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  Newer
                </span>
              )}
            </span>
          </label>
          <select
            id="compare-scan"
            value={compareScanId || ''}
            onChange={(e) => onCompareChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/60 focus:border-primary-blue"
          >
            <option value="">Select compare...</option>
            {filteredScans.map(scan => (
              <option key={scan.id} value={scan.id}>
                {formatScanLabel(scan)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap Button */}
      {baselineScanId && compareScanId && baselineScanId !== compareScanId && (
        <div className="flex justify-center">
          <button
            onClick={onSwap}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2"
            aria-label="Swap baseline and compare scans"
            title="Swap baseline and compare scans"
          >
            <ArrowLeftRight size={14} aria-hidden="true" />
            Swap scans
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendsScanSelector;
