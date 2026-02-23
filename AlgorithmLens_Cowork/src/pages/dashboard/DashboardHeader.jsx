import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { TOUR_STORAGE_KEY } from '../../components/onboarding/DashboardTour';

/**
 * DashboardHeader - Page header with title, filters, and action buttons
 *
 * Includes:
 * - H1 "Dashboard" title
 * - Date range filter dropdown with custom date inputs
 * - Remaining scans notice for free users
 * - Refresh button
 * - New Scan button/link
 * - Retake tour button
 */
const DashboardHeader = ({
  isOnAlgorithmTab,
  datePreset,
  handlePresetChange,
  userTier,
  dateRange,
  setDateRange,
  filtersActive,
  totalScanCount,
  unfilteredScanCount,
  remainingScans,
  detailsLoading,
  fetchScans,
  setDetailsLoaded,
  tourForceKey,
  setTourForceKey,
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 ${isOnAlgorithmTab ? 'mb-4' : 'mb-6 sm:mb-8'}`}>
      <div>
        <h1 className={`font-bold text-text-main ${isOnAlgorithmTab ? 'text-lg sm:text-xl mb-1' : 'text-2xl sm:text-3xl mb-2'}`}>
          Dashboard
        </h1>
        {!isOnAlgorithmTab && (
          <div>
            <p className="text-text-muted">
              Explore insights from your scans.
              {localStorage.getItem(TOUR_STORAGE_KEY) && (
                <button
                  onClick={() => {
                    localStorage.removeItem(TOUR_STORAGE_KEY);
                    setTourForceKey((k) => k + 1);
                  }}
                  className="ml-2 text-xs text-primary-blue/60 hover:text-primary-blue transition-colors"
                >
                  Retake tour
                </button>
              )}
            </p>
            {filtersActive && totalScanCount !== unfilteredScanCount && (
              <p className="text-xs text-slate-500 mt-1">
                Showing {totalScanCount} of {unfilteredScanCount} scans.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Date Range Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="date-preset" className="text-xs sm:text-sm text-text-muted whitespace-nowrap">
            Date range:
          </label>
          <select
            id="date-preset"
            value={datePreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-text-main hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 days</option>
            <option value="all">All time</option>
            <option value="30days" disabled={userTier === 'free'}>
              Last 30 days{userTier === 'free' ? ' (Premium)' : ''}
            </option>
            <option value="90days" disabled={userTier === 'free'}>
              Last 90 days{userTier === 'free' ? ' (Premium)' : ''}
            </option>
            <option value="custom" disabled={userTier === 'free'}>
              Custom{userTier === 'free' ? ' (Premium)' : ''}
            </option>
          </select>
        </div>

        {userTier === 'free' && (
          <span className="text-xs text-slate-500">
            Upgrade to Premium to unlock 30-day, 90-day, and custom date ranges.
          </span>
        )}

        {datePreset === 'custom' && userTier !== 'free' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-text-main hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            />
            <span className="text-sm text-text-muted">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-text-main hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            />
            {datePreset === 'custom' && (!dateRange.startDate || !dateRange.endDate) && (
              <span className="text-xs text-slate-500 whitespace-nowrap">Select both dates to apply.</span>
            )}
            {datePreset === 'custom' && dateRange.startDate && dateRange.endDate && new Date(dateRange.startDate) > new Date(dateRange.endDate) && (
              <span className="text-xs text-red-500 whitespace-nowrap">Start date must be on or before end date.</span>
            )}
          </div>
        )}

        {userTier === 'free' && (
          <>
            {remainingScans === 0 ? (
              <span className="text-xs text-slate-600">
                You have used your 5 snapshot scans for this month.
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Snapshot scans remaining this month: {remainingScans} of 5
              </span>
            )}
          </>
        )}

        <button
          onClick={() => {
            setDetailsLoaded(false);
            fetchScans();
          }}
          disabled={detailsLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-text-muted hover:text-text-main hover:bg-white rounded-lg transition-colors border border-slate-200 text-sm"
        >
          <RefreshCw size={16} className={detailsLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
        {userTier === 'free' && remainingScans === 0 ? (
          <button
            disabled
            onClick={(e) => {
              e.preventDefault();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-300 text-slate-500 rounded-lg font-semibold cursor-not-allowed text-sm"
          >
            New Scan
          </button>
        ) : (
          <Link
            to="/start"
            onClick={(e) => {
              if (userTier === 'free' && remainingScans === 0) {
                e.preventDefault();
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            New Scan
          </Link>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
