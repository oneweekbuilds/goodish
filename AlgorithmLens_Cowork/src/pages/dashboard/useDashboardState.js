import { useState, useEffect } from 'react';

/**
 * useDashboardState - Custom hook for dashboard state management
 * Handles all dashboard-level state and derived computations
 */
const useDashboardState = () => {
  // Global filter state (for premium users)
  const [platformFilter, setPlatformFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // Date filter preset state
  const [datePreset, setDatePreset] = useState('all');

  // Hero evidence expansion state (per-tab + per-hero-view)
  const [heroEvidenceExpanded, setHeroEvidenceExpanded] = useState({});

  // Helper function to compute date ranges from presets
  const computeDateRangeFromPreset = (preset) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const endDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

    if (preset === 'all') {
      return { startDate: '', endDate: '' };
    }

    if (preset === 'today') {
      // Today only - start and end date are both today
      return { startDate: endDate, endDate: endDate };
    }

    const startDate = new Date(today);
    if (preset === '7days') {
      startDate.setDate(today.getDate() - 6); // Last 7 days (today + 6 previous)
    } else if (preset === '30days') {
      startDate.setDate(today.getDate() - 29); // Last 30 days (today + 29 previous)
    } else if (preset === '90days') {
      startDate.setDate(today.getDate() - 89); // Last 90 days (today + 89 previous)
    } else {
      return { startDate: '', endDate: '' };
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate,
    };
  };

  // Handle preset change
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset === 'custom') {
      // Keep existing custom dates, don't clear them
      return;
    }
    const range = computeDateRangeFromPreset(preset);
    setDateRange(range);
  };

  // Derived: check if any filters are active
  // For custom date range, only count as active if both dates are present
  const dateFilterActive = datePreset === 'custom'
    ? (dateRange.startDate !== '' && dateRange.endDate !== '' && new Date(dateRange.startDate) <= new Date(dateRange.endDate))
    : (dateRange.startDate !== '' || dateRange.endDate !== '');
  const filtersActive = platformFilter !== 'all' || dateFilterActive;

  // Reset filters function
  const resetFilters = () => {
    setPlatformFilter('all');
    setDateRange({ startDate: '', endDate: '' });
    setDatePreset('all');
  };

  // Active filters object (ready for future integration with data helpers)
  // For custom date range, only include dates if both are present and valid
  const activeFilters = {
    platform: platformFilter,
    startDate: (datePreset === 'custom' && (!dateRange.startDate || !dateRange.endDate || new Date(dateRange.startDate) > new Date(dateRange.endDate)))
      ? ''
      : dateRange.startDate,
    endDate: (datePreset === 'custom' && (!dateRange.startDate || !dateRange.endDate || new Date(dateRange.startDate) > new Date(dateRange.endDate)))
      ? ''
      : dateRange.endDate,
  };

  // Format date range for display
  const formatDateRange = (start, end) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate) || Number.isNaN(endDate)) return null;
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    const baseOptions = { month: 'short', day: 'numeric' };
    const startText = startDate.toLocaleDateString('en-US', sameYear ? baseOptions : { ...baseOptions, year: 'numeric' });
    const endText = endDate.toLocaleDateString('en-US', { ...baseOptions, year: 'numeric' });
    return `${startText} – ${endText}`;
  };

  // FIX X2/A2: Remove specific scan counts to avoid contradictory numbers across views
  // Each view has different scansUsed counts based on data availability, which creates trust issues
  // Solution: Prefer date ranges, fall back to generic "window" language without specific counts
  const deriveWindowLabel = (start, end, scansUsed) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (!Number.isNaN(startDate) && !Number.isNaN(endDate)) {
        const diffDays = Math.max(0, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
        if (diffDays >= 5 && diffDays <= 9) {
          return 'In the past 7 days';
        }
        const rangeText = formatDateRange(start, end);
        if (rangeText) return `During this window (${rangeText})`;
      }
    }
    // Avoid showing specific scan counts - they vary per-metric and create confusion
    return 'Based on your recent scans';
  };

  return {
    platformFilter,
    setPlatformFilter,
    dateRange,
    setDateRange,
    datePreset,
    setDatePreset,
    heroEvidenceExpanded,
    setHeroEvidenceExpanded,
    computeDateRangeFromPreset,
    handlePresetChange,
    dateFilterActive,
    filtersActive,
    resetFilters,
    activeFilters,
    formatDateRange,
    deriveWindowLabel,
  };
};

export default useDashboardState;
