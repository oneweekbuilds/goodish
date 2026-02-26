import React from 'react';
import { Globe, Clock } from 'lucide-react';
import { THEME } from './dashboardConstants';

/**
 * PremiumFiltersBar - Filter UI for premium users
 * Platform dropdown and date range inputs
 */
const PremiumFiltersBar = ({
  platformFilter,
  setPlatformFilter,
  dateRange,
  setDateRange,
  filtersActive,
  resetFilters,
}) => {
  // Check if end date is before start date
  const hasInvalidDateRange = dateRange.startDate && dateRange.endDate &&
    new Date(dateRange.endDate) < new Date(dateRange.startDate);

  return (
    <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Filters</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          {/* Platform dropdown */}
          <div className="flex flex-col gap-1">
            <label htmlFor="platform-filter" className="text-xs text-slate-500">
              Platform
            </label>
            <select
              id="platform-filter"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none transition-colors hover:border-slate-400 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/20"
            >
              <option value="all">All platforms</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="x">X</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Start date */}
          <div className="flex flex-col gap-1">
            <label htmlFor="start-date-filter" className="text-xs text-slate-500">
              Start date
            </label>
            <input
              id="start-date-filter"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none transition-colors hover:border-slate-400 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/20"
            />
          </div>

          {/* End date */}
          <div className="flex flex-col gap-1">
            <label htmlFor="end-date-filter" className="text-xs text-slate-500">
              End date
            </label>
            <input
              id="end-date-filter"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              min={dateRange.startDate || undefined}
              className="px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none transition-colors hover:border-slate-400 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/20"
            />
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              disabled={!filtersActive}
              className="px-4 py-2 text-sm font-medium rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Premium pill */}
        <div className="shrink-0">
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600">
            Premium
          </span>
        </div>
      </div>

      {/* Date validation helper text */}
      {hasInvalidDateRange && (
        <p className="mt-2 text-xs text-slate-500">
          End date must be on or after start date.
        </p>
      )}
    </div>
  );
};

export default PremiumFiltersBar;
