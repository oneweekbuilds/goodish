import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

/**
 * Custom hook to fetch and process scan data for the dashboard.
 * Reuses the same API endpoints as HistoryPage and ResultsPage.
 */
export function useDashboardData() {
  const [scans, setScans] = useState([]);
  const [scanDetails, setScanDetails] = useState({}); // Map of scanId -> detail
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch scan list
  const fetchScans = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/scans`);
      if (!response.ok) {
        throw new Error(`Failed to fetch scans: ${response.status}`);
      }
      const data = await response.json();
      const scanList = data.scans || [];
      // Sort by date descending
      scanList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setScans(scanList);
      return scanList;
    } catch (err) {
      console.error('Error fetching scans:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // Fetch detail for a specific scan
  const fetchScanDetail = useCallback(async (scanId) => {
    if (scanDetails[scanId]) {
      return scanDetails[scanId];
    }

    try {
      const response = await fetch(`${API_BASE}/api/scans/${scanId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch scan ${scanId}: ${response.status}`);
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

    // DEV-ONLY DEBUG: Print aggregation stats (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Dashboard Debug] Scan aggregation stats:', {
        totalScans: scanList.length,
        scansWithDetails: Object.keys(details).length,
        platforms: Array.from(platformSet),
        platformCount: platformSet.size,
        totalFeedItems,
      });
    }

    return details;
  }, [scanDetails, fetchScanDetail]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchScans();
      setLoading(false);
    };
    init();
  }, [fetchScans]);

  // Computed properties
  const hasScans = scans.length > 0;
  const hasMultipleScans = scans.length >= 2;
  const platforms = [...new Set(scans.map(s => s.platform?.toLowerCase()).filter(Boolean))];
  const hasMultiplePlatforms = platforms.length >= 2;

  return {
    scans,
    scanDetails,
    loading,
    error,
    fetchScans,
    fetchScanDetail,
    fetchAllScanDetails,
    hasScans,
    hasMultipleScans,
    platforms,
    hasMultiplePlatforms,
  };
}

export default useDashboardData;
