import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import {
  Clock,
  BarChart3,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  History,
  ArrowRight,
  Search,
  Monitor,
  Smartphone
} from 'lucide-react';
import PlatformBadge, { getPlatformConfig } from '../components/PlatformBadge';
import PlatformIcon from '../components/PlatformIcon';
import Skeleton from '../components/ui/Skeleton';
import { useUserProfile } from '../context/UserProfileContext';
import { authenticatedFetch } from '../lib/api/authenticatedFetch';
import { getApiBaseUrl } from '../lib/apiConfig';
import { detectScanSource } from '../lib/dataParsing';
import { logError } from '../lib/errorLogger.js';

/**
 * HistoryPage now uses detectScanSource from dataParsing.js (#9 Deduplication).
 * This is the single source of truth for scan source detection across the app.
 */
const getScanSource = (scan) => {
  return detectScanSource(scan);
};

/**
 * SourceBadge - Shows "Desktop" or "Mobile upload" label for a scan
 */
const SourceBadge = ({ scan }) => {
  const source = getScanSource(scan);

  if (source === 'desktop') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <Monitor size={12} />
        Desktop
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <Smartphone size={12} />
      Mobile upload
    </span>
  );
};

const SCANS_PER_PAGE = 10; // (#22) Pagination: 10 scans per page

// Demo scan data for ?demo=1 mode
const DEMO_SCANS = [
  { id: 'demo-1', platform: 'instagram', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), total_items: 42, duration_seconds: 85, ad_percentage: 0.14, status: 'completed' },
  { id: 'demo-2', platform: 'tiktok', created_at: new Date(Date.now() - 26 * 3600000).toISOString(), total_items: 38, duration_seconds: 72, ad_percentage: 0.21, status: 'completed' },
  { id: 'demo-3', platform: 'instagram', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), total_items: 55, duration_seconds: 110, ad_percentage: 0.11, status: 'completed' },
  { id: 'demo-4', platform: 'tiktok', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), total_items: 31, duration_seconds: 60, ad_percentage: 0.19, status: 'completed' },
  { id: 'demo-5', platform: 'instagram', created_at: new Date(Date.now() - 8 * 86400000).toISOString(), total_items: 47, duration_seconds: 95, ad_percentage: 0.16, status: 'completed' },
];

const HistoryPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useUserProfile();
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // Inline delete confirmation
  const [deleteError, setDeleteError] = useState(null); // Styled error message
  const [currentPage, setCurrentPage] = useState(1); // (#22) Track current page

  // Fetch scans on mount (use demo data if in demo mode)
  useEffect(() => {
    if (isDemoMode) {
      setScans(DEMO_SCANS);
      setLoading(false);
      return;
    }
    fetchScans();
  }, [isDemoMode]);

  const fetchScans = async () => {
    setLoading(true);
    setError(null);
    
    const API_BASE = getApiBaseUrl();
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/scans`);
      if (!response.ok) {
        throw new Error(`Failed to fetch scans: ${response.status}`);
      }
      const data = await response.json();
      setScans(data.scans || []);
    } catch (err) {
      logError('HistoryPage', 'Error fetching scans:', err);
      setError(err.message || 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (scanId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(scanId);
    setDeleteError(null);
  };

  const handleConfirmDelete = async (scanId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(scanId);
    setConfirmDeleteId(null);

    const API_BASE = getApiBaseUrl();
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/scans/${scanId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`Failed to delete scan: ${response.status}`);
      }
      setScans(scans.filter(s => s.id !== scanId));
    } catch (err) {
      logError('HistoryPage', 'Error deleting scan:', err);
      setDeleteError(`Unable to delete scan. Please try again.`);
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const formatRelativeTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatPercent = (val) => `${Math.round((val || 0) * 100)}%`;

  // (#22) Pagination logic
  const totalPages = Math.ceil(scans.length / SCANS_PER_PAGE);
  const startIndex = (currentPage - 1) * SCANS_PER_PAGE;
  const paginatedScans = scans.slice(startIndex, startIndex + SCANS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Loading State (#21 Skeleton Loading)
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-bg-page pt-20 pb-24 md:pt-24 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Scans List Skeleton */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="w-20 h-10 flex-shrink-0 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[100dvh] bg-bg-page pt-20 pb-24 md:pt-24 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text-main mb-2">Unable to Load History</h2>
            <p className="text-text-muted mb-6">Unable to load your scan history. Make sure you're connected and try again.</p>
            <button
              onClick={fetchScans}
              className="px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (scans.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-bg-page pt-20 pb-24 md:pt-24 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-main">Scan History</h1>
            <p className="text-text-muted mt-2">View and compare your past feed analyses</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} className="text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-2">No scans yet</h2>
            <p className="text-text-muted mb-8 max-w-md mx-auto">
              Start your first scan to see insights about your social media feeds. 
              Your scan history will appear here.
            </p>
            <Link
              to="/start"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-blue text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
            >
              Start Your First Scan
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Scans List
  return (
    <>
      <SEO title="Scan History" description="View your past scans and track how your algorithmic profile has changed over time." path="/history" noIndex={true} />
      <div className="min-h-[100dvh] bg-bg-page pt-20 pb-24 md:pt-24 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">

        {/* Delete error banner */}
        {deleteError && (
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-slate-500 flex-shrink-0" />
            <p className="text-sm text-text-muted flex-1">{deleteError}</p>
            <button
              onClick={() => setDeleteError(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-main flex items-center gap-3">
              <History size={32} className="text-primary-blue" />
              Scan History
            </h1>
            {userProfile?.name && (
              <p className="text-sm text-text-muted mt-1 mb-1">
                {userProfile.name}'s scans on this device
              </p>
            )}
            <p className="text-text-muted mt-1">
              {scans.length} scan{scans.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchScans}
              className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-text-main hover:bg-white rounded-lg transition-colors border border-slate-200"
            >
              <RefreshCw size={18} />
              <span>Refresh</span>
            </button>
            <Link
              to="/start"
              className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              New Scan
            </Link>
          </div>
        </div>

        {/* Scans Grid/List */}
        <div className="space-y-4">
          {paginatedScans.map((scan) => {
            const platformConfig = getPlatformConfig(scan.platform);
            const isDeleting = deletingId === scan.id;
            
            return (
              <Link
                key={scan.id}
                to={isDemoMode ? `/dashboard?demo=1` : `/scan/results/${scan.id}`}
                className={`block bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:border-primary-blue/20 active:shadow-sm active:bg-slate-50 transition-all ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Platform Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${platformConfig.bgColor} flex items-center justify-center text-white`}>
                    <PlatformIcon platform={scan.platform} size={24} className="text-white" />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SourceBadge scan={scan} />
                      <span className="text-sm text-text-muted flex items-center gap-1">
                        <Clock size={14} />
                        {formatRelativeTime(scan.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="text-slate-600">
                        <strong className="text-text-main">{scan.total_items || 0}</strong> posts
                      </span>
                      <span className="text-slate-600">
                        <strong className="text-text-main">{scan.duration_seconds ? `${Math.round(scan.duration_seconds)}s` : 'N/A'}</strong> duration
                      </span>
                      <span className={`font-semibold ${
                        (scan.ad_percentage || 0) > 0.3
                          ? 'text-primary-blue'
                          : (scan.ad_percentage || 0) > 0.15
                            ? 'text-slate-600'
                            : 'text-accent-green'
                      }`}>
                        {formatPercent(scan.ad_percentage)} ads
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {confirmDeleteId === scan.id ? (
                      <div className="flex items-center gap-1.5" onClick={e => e.preventDefault()}>
                        <span className="text-xs text-text-muted mr-1">Delete?</span>
                        <button
                          onClick={(e) => handleConfirmDelete(scan.id, e)}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-md transition-colors min-h-[36px]"
                          aria-label="Confirm delete scan"
                        >
                          Yes
                        </button>
                        <button
                          onClick={handleCancelDelete}
                          className="px-2.5 py-1 text-xs font-medium text-text-muted hover:text-text-main border border-slate-200 rounded-md transition-colors min-h-[36px]"
                          aria-label="Cancel delete"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleDeleteClick(scan.id, e)}
                        disabled={isDeleting}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Delete this scan"
                      >
                        {isDeleting ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    )}
                    <ArrowRight size={20} className="text-slate-400" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination Controls (#22) */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-text-main hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-text-main hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}

        {/* Quick Stats Summary */}
        {scans.length > 0 && (
          <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-3">
              Quick Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-text-main">{scans.length}</div>
                <div className="text-sm text-blue-700">Total Scans</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-main">
                  {scans.reduce((sum, s) => sum + (s.total_items || 0), 0)}
                </div>
                <div className="text-sm text-blue-700">Posts Analyzed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-main">
                  {[...new Set(scans.map(s => s.platform?.toLowerCase()))].length}
                </div>
                <div className="text-sm text-blue-700">Platforms</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-main">
                  {formatPercent(
                    scans.reduce((sum, s) => sum + (s.ad_percentage || 0), 0) / scans.length
                  )}
                </div>
                <div className="text-sm text-blue-700">Avg Ads</div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default HistoryPage;
