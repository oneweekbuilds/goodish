import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, X, ArrowLeftRight } from 'lucide-react';
import { compareTwoScans } from '../../lib/dashboard/trendsComparison';

/**
 * TrendsPanel - Real scan-to-scan comparison panel
 *
 * Shows for Plus users when they click "View Trends" CTA.
 * Displays honest comparison when 2+ scans available.
 *
 * Props:
 * - scans: array of scan objects
 * - scanDetails: map of scanId -> detail
 * - onClose: callback to close panel
 */
const TrendsPanel = ({ scans, scanDetails, onClose }) => {
  const [baselineScanId, setBaselineScanId] = useState(null);
  const [compareScanId, setCompareScanId] = useState(null);
  const [isAutoSelected, setIsAutoSelected] = useState(false);
  const hasAutoSelected = useRef(false);

  // Auto-select most recent two scans on mount
  useEffect(() => {
    if (scans.length >= 2 && !hasAutoSelected.current && !baselineScanId && !compareScanId) {
      // scans should already be sorted by date descending
      hasAutoSelected.current = true;
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setCompareScanId(scans[0].id); // Most recent
        setBaselineScanId(scans[1].id); // Second most recent
        setIsAutoSelected(true);
      });
    }
  }, [scans, baselineScanId, compareScanId]);

  // Calculate comparison when both scans selected (using useMemo for derived state)
  const comparisonMetrics = useMemo(() => {
    if (!baselineScanId || !compareScanId) {
      return [];
    }

    if (baselineScanId === compareScanId) {
      return [];
    }

    const baselineScan = scans.find(s => s.id === baselineScanId);
    const compareScan = scans.find(s => s.id === compareScanId);

    if (!baselineScan || !compareScan) {
      return [];
    }

    try {
      return compareTwoScans(baselineScan, compareScan, scanDetails);
    } catch (err) {
      console.error('Error comparing scans:', err);
      return [];
    }
  }, [baselineScanId, compareScanId, scans, scanDetails]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle swap button
  const handleSwap = () => {
    const temp = baselineScanId;
    setBaselineScanId(compareScanId);
    setCompareScanId(temp);
    setIsAutoSelected(false); // User manually changed selection
  };

  // Handle manual scan selection
  const handleBaselineChange = (scanId) => {
    setBaselineScanId(scanId);
    setIsAutoSelected(false);
  };

  const handleCompareChange = (scanId) => {
    setCompareScanId(scanId);
    setIsAutoSelected(false);
  };

  // Determine which scan is newer
  const getNewerScanId = () => {
    if (!baselineScanId || !compareScanId) return null;
    const baselineScan = scans.find(s => s.id === baselineScanId);
    const compareScan = scans.find(s => s.id === compareScanId);
    if (!baselineScan || !compareScan) return null;

    const baselineDate = new Date(baselineScan.created_at);
    const compareDate = new Date(compareScan.created_at);

    return compareDate > baselineDate ? compareScanId : baselineScanId;
  };

  // Format scan label for dropdown
  const formatScanLabel = (scan) => {
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

  // If fewer than 2 scans, show honest message
  if (scans.length < 2) {
    return (
      <div
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        role="region"
        aria-label="Trends panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-primary-blue" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Trends over time</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded"
            aria-label="Close trends panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            Compare how key metrics changed between two saved scans.
          </p>

          {/* Scan count status */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              <span className="font-medium">You currently have {scans.length} saved scan{scans.length !== 1 ? 's' : ''}.</span>
              {' '}
              Comparisons require at least 2 scans.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show comparison UI
  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      role="region"
      aria-label="Trends panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center">
            <TrendingUp size={20} className="text-primary-blue" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Trends over time</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded"
          aria-label="Close trends panel"
        >
          <X size={20} />
        </button>
      </div>

      {/* Explainer */}
      <p className="text-sm text-slate-600 leading-relaxed">
        Compare how key metrics changed between two saved scans.
      </p>

      {/* Auto-select helper text */}
      {isAutoSelected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-700">
            Auto-selected your two most recent scans.
          </p>
        </div>
      )}

      {/* Scan Selectors with Swap Button */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          {/* Baseline Scan */}
          <div>
            <label htmlFor="baseline-scan" className="block text-xs font-medium text-slate-700 mb-2">
              Baseline scan
              {baselineScanId && baselineScanId === getNewerScanId() && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  Newer
                </span>
              )}
            </label>
            <select
              id="baseline-scan"
              value={baselineScanId || ''}
              onChange={(e) => handleBaselineChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/60 focus:border-primary-blue"
            >
              <option value="">Select baseline...</option>
              {scans.map(scan => (
                <option key={scan.id} value={scan.id}>
                  {formatScanLabel(scan)}
                </option>
              ))}
            </select>
          </div>

          {/* Compare Scan */}
          <div>
            <label htmlFor="compare-scan" className="block text-xs font-medium text-slate-700 mb-2">
              Compare scan
              {compareScanId && compareScanId === getNewerScanId() && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  Newer
                </span>
              )}
            </label>
            <select
              id="compare-scan"
              value={compareScanId || ''}
              onChange={(e) => handleCompareChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/60 focus:border-primary-blue"
            >
              <option value="">Select compare...</option>
              {scans.map(scan => (
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
              onClick={handleSwap}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2"
              aria-label="Swap baseline and compare scans"
            >
              <ArrowLeftRight size={14} />
              Swap scans
            </button>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      <div className="min-h-[200px]">
        {comparisonMetrics.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Comparison Summary
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100">
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Metric</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Baseline</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Compare</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Change</th>
                </tr>
              </thead>
              <tbody>
                {comparisonMetrics.map((metric, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="py-2 px-3 text-slate-900">{metric.label}</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-mono text-xs">{metric.baseline}</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-mono text-xs">{metric.compare}</td>
                    <td className={`py-2 px-3 text-right font-mono text-xs font-medium ${
                      metric.delta.startsWith('+') ? 'text-emerald-600' :
                      metric.delta.startsWith('-') ? 'text-red-600' :
                      'text-slate-500'
                    }`}>
                      {metric.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        ) : baselineScanId && compareScanId && baselineScanId === compareScanId ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Please select two different scans to compare.
            </p>
          </div>
        ) : baselineScanId && compareScanId ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Loading comparison...
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Select two scans above to see the comparison.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendsPanel;
