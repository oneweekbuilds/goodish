import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, X } from 'lucide-react';
import { compareTwoScans, generateChangeSummaries, generatePossibleFactors } from '../../lib/dashboard/trendsComparison';
import { logError } from '../../lib/errorLogger.js';
import TrendsScanSelector from './TrendsScanSelector';
import TrendsChangeSummary from './TrendsChangeSummary';
import TrendsComparisonTable from './TrendsComparisonTable';

/**
 * TrendsPanel - Real scan-to-scan comparison panel
 *
 * Shows for Plus users when they click "View Trends" CTA or embedded in tabs.
 * Displays honest comparison when 2+ scans available.
 *
 * Props:
 * - scans: array of scan objects
 * - scanDetails: map of scanId -> detail
 * - onClose: callback to close panel
 * - embedded: boolean (default false) - when true, shows inline without toggles and date filter
 */
const TrendsPanel = ({ scans, scanDetails, onClose, embedded = false }) => {
  const [baselineScanId, setBaselineScanId] = useState(null);
  const [compareScanId, setCompareScanId] = useState(null);
  const [isAutoSelected, setIsAutoSelected] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const hasAutoSelected = useRef(false);

  // Auto-select most recent two scans on mount
  useEffect(() => {
    if (scans.length >= 2 && !hasAutoSelected.current && !baselineScanId && !compareScanId) {
      hasAutoSelected.current = true;
      queueMicrotask(() => {
        setCompareScanId(scans[0].id); // Most recent
        setBaselineScanId(scans[1].id); // Second most recent
        setIsAutoSelected(true);
      });
    }
  }, [scans, baselineScanId, compareScanId]);

  // Initialize date range based on all scans
  useEffect(() => {
    if (embedded && scans.length >= 2) {
      const sortedScans = [...scans].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const startDate = new Date(sortedScans[0].created_at).toISOString().split('T')[0];
      const endDate = new Date(sortedScans[sortedScans.length - 1].created_at).toISOString().split('T')[0];
      setDateRange({ start: startDate, end: endDate });
    }
  }, [embedded, scans]);

  // Filter scans by date range when embedded
  const filteredScans = useMemo(() => {
    if (!embedded || !dateRange.start || !dateRange.end) {
      return scans;
    }
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);
    return scans.filter(scan => {
      const scanDate = new Date(scan.created_at);
      return scanDate >= start && scanDate <= end;
    });
  }, [scans, embedded, dateRange]);

  // Calculate comparison when both scans selected
  const comparisonMetrics = useMemo(() => {
    if (!baselineScanId || !compareScanId) {
      return [];
    }

    if (baselineScanId === compareScanId) {
      return [];
    }

    const baselineScan = filteredScans.find(s => s.id === baselineScanId);
    const compareScan = filteredScans.find(s => s.id === compareScanId);

    if (!baselineScan || !compareScan) {
      return [];
    }

    try {
      const metrics = compareTwoScans(baselineScan, compareScan, scanDetails);

      return metrics.sort((a, b) => {
        const deltaComparison = b.absoluteDelta - a.absoluteDelta;
        if (deltaComparison !== 0) return deltaComparison;
        return 0;
      });
    } catch (err) {
      logError('TrendsPanel', 'Error comparing scans:', err);
      return [];
    }
  }, [baselineScanId, compareScanId, filteredScans, scanDetails]);

  // Group metrics by category
  const groupedMetrics = useMemo(() => {
    const feedMakeup = comparisonMetrics.filter(m => m.category === 'feed_makeup');
    const whoWhat = comparisonMetrics.filter(m => m.category === 'who_what');
    return { feedMakeup, whoWhat };
  }, [comparisonMetrics]);

  // Generate summaries for top changes
  const changeSummaries = useMemo(() => {
    return generateChangeSummaries(comparisonMetrics);
  }, [comparisonMetrics]);

  // Generate possible factors for changes
  const possibleFactors = useMemo(() => {
    return generatePossibleFactors(comparisonMetrics);
  }, [comparisonMetrics]);

  // Handle Escape key
  useEffect(() => {
    if (embedded) return; // Don't handle Escape for embedded

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, embedded]);

  // Handle swap button
  const handleSwap = () => {
    const temp = baselineScanId;
    setBaselineScanId(compareScanId);
    setCompareScanId(temp);
    setIsAutoSelected(false);
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

  // If fewer than 2 scans, show message
  if (filteredScans.length < 2) {
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
          {!embedded && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded"
              aria-label="Close trends panel"
            >
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Message */}
        <div className="space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            Compare how key metrics changed between two saved scans.
          </p>

          {/* Scan count status */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-700">
              <span className="font-medium">You have {filteredScans.length} saved scan{filteredScans.length !== 1 ? 's' : ''} so far.</span>
              {' '}
              You'll see comparisons here after your second scan.
            </p>
            <p className="text-sm text-slate-600">
              Try scanning again in a few days to see how your feed changes over time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Embedded mode: simplified UI with date range filter
  if (embedded) {
    return (
      <div
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        role="region"
        aria-label="Trends panel"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center">
            <TrendingUp size={20} className="text-primary-blue" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Trends over time</h3>
        </div>

        {/* Explainer */}
        <p className="text-sm text-slate-600 leading-relaxed">
          See how your feed patterns have changed across scans.
        </p>

        {/* Date Range Filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">Filter by date range</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="date-start" className="block text-xs text-slate-600 mb-1">
                Start date
              </label>
              <input
                id="date-start"
                type="date"
                value={dateRange.start || ''}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/60 focus:border-primary-blue"
              />
            </div>
            <div>
              <label htmlFor="date-end" className="block text-xs text-slate-600 mb-1">
                End date
              </label>
              <input
                id="date-end"
                type="date"
                value={dateRange.end || ''}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/60 focus:border-primary-blue"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Scans in range: {filteredScans.length}
          </p>
        </div>

        {/* Scan Selectors */}
        <TrendsScanSelector
          baselineScanId={baselineScanId}
          compareScanId={compareScanId}
          filteredScans={filteredScans}
          onBaselineChange={handleBaselineChange}
          onCompareChange={handleCompareChange}
          onSwap={handleSwap}
          showAutoSelectHint={false}
        />

        {/* What Changed Summary */}
        <TrendsChangeSummary
          changeSummaries={changeSummaries}
          possibleFactors={possibleFactors}
        />

        {/* Comparison Results */}
        <div className="min-h-[200px]">
          {comparisonMetrics.length > 0 ? (
            <TrendsComparisonTable groupedMetrics={groupedMetrics} />
          ) : baselineScanId && compareScanId && baselineScanId === compareScanId ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700">
                Please select two different scans to compare.
              </p>
            </div>
          ) : baselineScanId && compareScanId ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-slate-700 font-medium">
                These scans didn't have enough overlap to compare.
              </p>
              <p className="text-sm text-slate-600">
                Try picking two scans from similar platforms or closer dates.
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
  }

  // Standard non-embedded mode: full UI with close button
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

      {/* Scan Selectors with Swap Button */}
      <TrendsScanSelector
        baselineScanId={baselineScanId}
        compareScanId={compareScanId}
        filteredScans={filteredScans}
        onBaselineChange={handleBaselineChange}
        onCompareChange={handleCompareChange}
        onSwap={handleSwap}
        showAutoSelectHint={isAutoSelected}
      />

      {/* What Changed Summary */}
      <TrendsChangeSummary
        changeSummaries={changeSummaries}
        possibleFactors={possibleFactors}
      />

      {/* Comparison Results */}
      <div className="min-h-[200px]">
        {comparisonMetrics.length > 0 ? (
          <TrendsComparisonTable groupedMetrics={groupedMetrics} />
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
