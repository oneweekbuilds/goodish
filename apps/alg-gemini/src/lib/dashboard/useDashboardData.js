import { useState, useEffect, useCallback, useMemo } from 'react';
import { getApiBaseUrl } from '../apiConfig';

/**
 * Custom hook to fetch and process scan data for the dashboard.
 * Reuses the same API endpoints as HistoryPage and ResultsPage.
 *
 * @param {Object} options - Optional configuration
 * @param {Object} options.filters - Filter configuration (premium feature)
 * @param {string} options.filters.platform - Platform filter: 'all' | 'instagram' | 'tiktok' | 'youtube' | 'x' | 'other'
 * @param {string} options.filters.startDate - Start date filter (YYYY-MM-DD)
 * @param {string} options.filters.endDate - End date filter (YYYY-MM-DD)
 * @param {boolean} options.skipFetch - If true, skip all API calls (for demo mode)
 */
export function useDashboardData(options = {}) {
  const { filters = null, skipFetch = false } = options;
  const [allScans, setAllScans] = useState([]); // Unfiltered scans from API
  const [scanDetails, setScanDetails] = useState({}); // Map of scanId -> detail
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // null | 'network' | 'other'
  const [errorMessage, setErrorMessage] = useState(null); // Detailed error for debugging

  // Fetch scan list
  const fetchScans = useCallback(async () => {
    const apiBase = getApiBaseUrl();
    try {
      const response = await fetch(`${apiBase}/api/scans`);
      if (!response.ok) {
        throw new Error(`Failed to fetch scans: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const scanList = data.scans || [];
      // Sort by date descending
      scanList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAllScans(scanList);
      setError(null);
      setErrorMessage(null);
      return scanList;
    } catch (err) {
      console.error('Error fetching scans:', err);
      // Classify error type for better UI handling
      const isNetworkError = err.message === 'Failed to fetch' ||
        (typeof err.message === 'string' && err.message.toLowerCase().includes('fetch') && (err.name === 'TypeError' || err.name === 'DOMException'));
      if (isNetworkError) {
        setError('network');
        setErrorMessage(`Could not reach API at ${apiBase}`);
      } else {
        setError('other');
        setErrorMessage(err.message);
      }
      return [];
    }
  }, []);

  // Fetch detail for a specific scan
  const fetchScanDetail = useCallback(async (scanId) => {
    if (scanDetails[scanId]) {
      return scanDetails[scanId];
    }

    const apiBase = getApiBaseUrl();
    try {
      const response = await fetch(`${apiBase}/api/scans/${scanId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch scan ${scanId}: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const detail = data.result || data.scan || data;
      setScanDetails(prev => ({ ...prev, [scanId]: detail }));
      return detail;
    } catch (err) {
      console.error(`Error fetching scan ${scanId}:`, err);
      return null;
    }
  }, [scanDetails]);

  // Fetch details for all scans (for trend views)
  const fetchAllScanDetails = useCallback(async (scanList) => {
    const details = {};
    let totalFeedItems = 0;
    const platformSet = new Set();

    for (const scan of scanList) {
      if (!scanDetails[scan.id]) {
        const detail = await fetchScanDetail(scan.id);
        if (detail) {
          details[scan.id] = detail;
        }
      } else {
        details[scan.id] = scanDetails[scan.id];
      }

      // Aggregate stats for debug
      const scanData = details[scan.id];
      if (scanData) {
        const data = scanData.result || scanData.scan || scanData;
        const items = data?.feed_items || [];
        totalFeedItems += items.length;
        if (scan.platform) {
          platformSet.add(scan.platform.toLowerCase());
        }
      }
    }

    return details;
  }, [scanDetails, fetchScanDetail]);

  // Initial fetch (skip if in demo mode)
  useEffect(() => {
    if (skipFetch) {
      setLoading(false);
      return;
    }
    const init = async () => {
      setLoading(true);
      await fetchScans();
      setLoading(false);
    };
    init();
  }, [fetchScans, skipFetch]);

  // Apply filters to scans (premium feature) - memoized for performance
  const scans = useMemo(() => {
    if (!filters || !allScans || allScans.length === 0) {
      return allScans;
    }

    // Validate date range: if endDate < startDate, ignore date filters
    const hasValidDateRange = !filters.startDate || !filters.endDate || 
      new Date(filters.endDate) >= new Date(filters.startDate);

    return allScans.filter(scan => {
      // Platform filter
      if (filters.platform && filters.platform !== 'all') {
        const scanPlatform = (scan.platform || 'other').toLowerCase();
        if (scanPlatform !== filters.platform.toLowerCase()) {
          return false;
        }
      }

      // Date range filter (only if valid)
      if (hasValidDateRange) {
        if (filters.startDate || filters.endDate) {
          if (!scan.created_at) {
            // Exclude scans without timestamps when date filter is active
            return false;
          }

          const scanDate = new Date(scan.created_at);
          const scanDateStr = scanDate.toISOString().split('T')[0]; // YYYY-MM-DD

          if (filters.startDate && scanDateStr < filters.startDate) {
            return false;
          }
          if (filters.endDate && scanDateStr > filters.endDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [allScans, filters]);

  // Computed properties (using filtered scans) - memoized
  const hasScans = useMemo(() => scans.length > 0, [scans]);
  const hasMultipleScans = useMemo(() => scans.length >= 2, [scans]);
  const platforms = useMemo(() => [...new Set(scans.map(s => s.platform?.toLowerCase()).filter(Boolean))], [scans]);
  const hasMultiplePlatforms = useMemo(() => platforms.length >= 2, [platforms]);

  // Count filtered scans: dedupe by scan id if available, otherwise use array length
  const totalScanCount = useMemo(() => {
    if (!scans || scans.length === 0) return 0;
    // Dedupe by scan id if ids exist
    const uniqueScanIds = new Set(scans.map(s => s.id).filter(Boolean));
    if (uniqueScanIds.size > 0) {
      return uniqueScanIds.size;
    }
    // Fallback to array length if no ids
    return scans.length;
  }, [scans]);

  // Count unfiltered scans: dedupe by scan id if available, otherwise use array length
  const unfilteredScanCount = useMemo(() => {
    if (!allScans || allScans.length === 0) return 0;
    // Dedupe by scan id if ids exist
    const uniqueScanIds = new Set(allScans.map(s => s.id).filter(Boolean));
    if (uniqueScanIds.size > 0) {
      return uniqueScanIds.size;
    }
    // Fallback to array length if no ids
    return allScans.length;
  }, [allScans]);

  return {
    scans, // Filtered scans (used by dashboard)
    allScans, // Unfiltered scans (for reference)
    scanDetails,
    loading,
    error, // null | 'network' | 'other'
    errorMessage, // Detailed error message for debugging
    fetchScans,
    fetchScanDetail,
    fetchAllScanDetails,
    hasScans,
    hasMultipleScans,
    platforms,
    hasMultiplePlatforms,
    totalScanCount, // Count of filtered scans
    unfilteredScanCount, // Count of all scans
  };
}

export default useDashboardData;
