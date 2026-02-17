import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, X, ArrowLeftRight } from 'lucide-react';
import { compareTwoScans, generateChangeSummaries, generatePossibleFactors } from '../../lib/dashboard/trendsComparison';
import { logError } from '../../lib/errorLogger.js';

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
      const metrics = compareTwoScans(baselineScan, compareScan, scanDetails);

      // Sort by absolute impact (largest first), with stable order for ties
      return metrics.sort((a, b) => {
        const deltaComparison = b.absoluteDelta - a.absoluteDelta;
        if (deltaComparison !== 0) return deltaComparison;
        // Stable tie-breaker: maintain original order
        return 0;
      });
    } catch (err) {
      logError('TrendsPanel', 'Error comparing scans:', err);
      return [];
    }
  }, [baselineScanId, compareScanId, scans, scanDetails]);

  // Group metrics by category
  const groupedMetrics = useMemo(() => {
    const feedMakeup = comparisonMetrics.filter(m => m.category === 'feed_makeup');
    const whoWhat = comparisonMetrics.filter(m => m.category === 'who_what');
    return { feedMakeup, whoWhat };
  }, [comparisonMetrics]);

  // Generate plain-English summaries for top changes
  const changeSummaries = useMemo(() => {
    return generateChangeSummaries(comparisonMetrics);
  }, [comparisonMetrics]);

  // Generate possible factors for changes (optional, non-causal)
  const possibleFactors = useMemo(() => {
    return generatePossibleFactors(comparisonMetrics);
  }, [comparisonMetrics]);

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
              <TrendingUp size={20} className="text-primary-blue" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Trends over time</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded"
            aria-label="Close trends panel"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            Compare how key metrics changed between two saved scans.
          </p>

          {/* Scan count status */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-700">
              <span className="font-medium">You currently have {scans.length} saved scan{scans.length !== 1 ? 's' : ''}.</span>
              {' '}
              Comparisons require at least 2 scans.
            </p>
            <p className="text-sm text-slate-600">
              Run and save another scan to enable comparisons.
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
            <TrendingUp size={20} className="text-primary-blue" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Trends over time</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded"
          aria-label="Close trends panel"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Explainer */}
      <p className="text-sm text-slate-600 leading-relaxed">
        Compare how key metrics changed between two saved scans.
      </p>

      {/* Auto-select helper text */}
      {isAutoSelected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-sm text-blue-700">
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
              <span className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">Baseline</span>
                {baselineScanId && baselineScanId === getNewerScanId() && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                    Newer
                  </span>
                )}
              </span>
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
              <span className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">Compare</span>
                {compareScanId && compareScanId === getNewerScanId() && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                    Newer
                  </span>
                )}
              </span>
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
              title="Swap baseline and compare scans"
            >
              <ArrowLeftRight size={14} aria-hidden="true" />
              Swap scans
            </button>
          </div>
        )}
      </div>

      {/* What Changed Summary */}
      {changeSummaries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">What changed</h4>
          <p className="text-sm text-slate-500">Based on the largest differences between these two scans.</p>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {changeSummaries.map((summary, index) => (
              <li key={index} className="leading-relaxed">
                • {summary}
              </li>
            ))}
          </ul>

          {/* Possible Factors (Optional, Collapsed by Default) */}
          {possibleFactors.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded">
                Possible factors (optional)
              </summary>
              <div className="mt-2 pl-3 space-y-2">
                <p className="text-sm text-slate-500 italic">
                  The following are common factors that can influence feeds. They may or may not apply here.
                </p>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {possibleFactors.map((factor, index) => (
                    <li key={index} className="leading-relaxed">
                      • {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Comparison Results */}
      <div className="min-h-[200px]">
        {comparisonMetrics.length > 0 ? (
          <div className="space-y-4">
            {/* Feed Makeup Section */}
            {groupedMetrics.feedMakeup.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Feed makeup
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
                      {groupedMetrics.feedMakeup.map((metric, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                        >
                          <td className="py-2 px-3 text-slate-900">{metric.label}</td>
                          <td className="py-2 px-3 text-right text-slate-700 font-mono text-xs">{metric.baseline}</td>
                          <td className="py-2 px-3 text-right text-slate-700 font-mono text-xs">{metric.compare}</td>
                          <td className={`py-2 px-3 text-right font-mono text-xs font-medium ${
                            metric.delta.startsWith('+') ? 'text-teal-600' :
                            metric.delta.startsWith('-') ? 'text-slate-500' :
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
            )}

            {/* Who and What Section */}
            {groupedMetrics.whoWhat.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Who and what you saw
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
                      {groupedMetrics.whoWhat.map((metric, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                        >
                          <td className="py-2 px-3 text-slate-900">{metric.label}</td>
                          <td className="py-2 px-3 text-right text-slate-700 font-mono text-xs">{metric.baseline}</td>
                          <td className="py-2 px-3 text-right text-slate-700 font-mono text-xs">{metric.compare}</td>
                          <td className={`py-2 px-3 text-right font-mono text-xs font-medium ${
                            metric.delta.startsWith('+') ? 'text-teal-600' :
                            metric.delta.startsWith('-') ? 'text-slate-500' :
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
            )}
          </div>
        ) : baselineScanId && compareScanId && baselineScanId === compareScanId ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              Please select two different scans to compare.
            </p>
          </div>
        ) : baselineScanId && compareScanId ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-700 font-medium">
              We could not find overlapping metrics between these two scans yet.
            </p>
            <p className="text-sm text-slate-600">
              Try comparing two more recent scans.
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
