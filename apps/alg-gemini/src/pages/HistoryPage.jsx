import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { useUserProfile } from '../context/UserProfileContext';

/**
 * Determine if a scan is from Desktop (Chrome extension) or Mobile (video upload).
 *
 * Detection logic (in order of priority):
 * 1. source_type === "DESKTOP_EXTENSION" → Desktop
 * 2. scan.id starts with "desktop-" → Desktop (fallback heuristic)
 * 3. Otherwise → Mobile upload
 *
 * TODO: If the backend adds an explicit `source` field, update this function.
 */
const getScanSource = (scan) => {
  if (scan.source_type === 'DESKTOP_EXTENSION') {
    return 'desktop';
  }
  if (scan.id?.startsWith('desktop-')) {
    return 'desktop';
  }
  // Default to mobile upload for video-based scans
  return 'mobile';
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

const HistoryPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useUserProfile();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch scans on mount
  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/scans');
      if (!response.ok) {
        throw new Error(`Failed to fetch scans: ${response.status}`);
      }
      const data = await response.json();
      setScans(data.scans || []);
    } catch (err) {
      console.error('Error fetching scans:', err);
      setError(err.message || 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (scanId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this scan?')) {
      return;
    }
    
    setDeletingId(scanId);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/scans/${scanId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`Failed to delete scan: ${response.status}`);
      }
      setScans(scans.filter(s => s.id !== scanId));
    } catch (err) {
      console.error('Error deleting scan:', err);
      alert('Failed to delete scan: ' + err.message);
    } finally {
      setDeletingId(null);
    }
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Loader2 size={48} className="animate-spin text-primary-blue mx-auto mb-4" />
          <p className="text-text-muted">Loading history...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-bg-page py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading History</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={fetchScans}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
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
      <div className="min-h-screen bg-bg-page py-24 px-6">
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
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
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
    <div className="min-h-screen bg-bg-page py-24 px-6">
      <div className="max-w-4xl mx-auto">
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
          {scans.map((scan) => {
            const platformConfig = getPlatformConfig(scan.platform);
            const isDeleting = deletingId === scan.id;
            
            return (
              <Link
                key={scan.id}
                to={`/scan/results/${scan.id}`}
                className={`block bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:border-primary-blue/20 transition-all ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Platform Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${platformConfig.bgColor} flex items-center justify-center`}>
                    <span className="text-xl">{platformConfig.icon}</span>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <PlatformBadge platform={scan.platform} size="sm" />
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
                          ? 'text-red-600' 
                          : (scan.ad_percentage || 0) > 0.15 
                            ? 'text-amber-600' 
                            : 'text-accent-green'
                      }`}>
                        {formatPercent(scan.ad_percentage)} ads
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      onClick={(e) => deleteScan(scan.id, e)}
                      disabled={isDeleting}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete scan"
                    >
                      {isDeleting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                    <ArrowRight size={20} className="text-slate-400" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats Summary */}
        {scans.length > 0 && (
          <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-3">
              Quick Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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
  );
};

export default HistoryPage;



