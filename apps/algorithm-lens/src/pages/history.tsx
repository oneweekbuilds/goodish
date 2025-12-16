import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  BarChart3,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Plus,
  TrendingUp,
  Megaphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlatformIcon, PlatformBadge } from '../components/PlatformBadge';
import {
  fetchScans,
  deleteScan,
  formatRelativeTime,
  formatPercent,
  formatDuration,
  PLATFORM_CONFIGS,
  type ScanListItem,
} from '../lib/scanApi';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadScans = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchScans();
      setScans(data);
    } catch (err) {
      console.error('Failed to load scans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  const handleDelete = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this scan?')) {
      return;
    }

    setDeletingId(scanId);

    try {
      await deleteScan(scanId);
      setScans(scans.filter((s) => s.id !== scanId));
    } catch (err) {
      console.error('Failed to delete scan:', err);
      alert('Failed to delete scan: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowClick = (scanId: string) => {
    navigate(`/scan/results/${scanId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className="min-h-screen px-6 pt-32 pb-16"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <div className="max-w-2xl mx-auto">
          <Card className="p-12 text-center bg-white" style={{ borderRadius: '24px' }}>
            <AlertCircle size={64} className="mx-auto text-red-500 mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Error Loading History</h1>
            <p className="text-slate-600 mb-8">{error}</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={loadScans}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Try Again
              </Button>
              <Button
                onClick={() => navigate('/start')}
                variant="outline"
                className="px-6 py-3 rounded-xl"
              >
                Start New Scan
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen px-6 pt-32 pb-16"
      style={{ backgroundColor: '#f8fafc' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Scan History</h1>
            <p className="text-slate-600 mt-2">View and compare your past feed analyses</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={loadScans}
              variant="outline"
              className="px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/start')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Plus size={18} />
              New Scan
            </Button>
          </div>
        </motion.div>

        {/* Empty State */}
        {scans.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              className="p-16 text-center bg-white"
              style={{ borderRadius: '24px' }}
            >
              <BarChart3 size={72} className="mx-auto text-slate-300 mb-6" />
              <h2 className="text-2xl font-bold text-slate-700 mb-3">You haven't run a scan yet.</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Start your first scan to see your feed analysis history here.
                We'll track patterns over time so you can understand how your feed evolves.
              </p>
              <Button
                onClick={() => navigate('/start')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg flex items-center gap-2 mx-auto"
              >
                <Plus size={20} />
                Start Your First Scan
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Scans List */}
        {scans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              className="overflow-hidden bg-white"
              style={{ borderRadius: '24px' }}
            >
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-3">Date</div>
                <div className="col-span-2">Platform</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Posts</div>
                <div className="col-span-2">Ads %</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-100">
                {scans.map((scan, index) => {
                  const config = PLATFORM_CONFIGS[scan.platform?.toLowerCase()];
                  const isDesktopSnapshot =
                    scan.source_type === 'DESKTOP_EXTENSION' &&
                    (!scan.duration_seconds || scan.duration_seconds === 0);

                  return (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleRowClick(scan.id)}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-blue-50/50 cursor-pointer transition-colors group"
                    >
                      {/* Date */}
                      <div className="md:col-span-3 flex items-center gap-2">
                        <Clock size={16} className="text-slate-400 hidden md:block" />
                        <span className="text-slate-700">{formatRelativeTime(scan.created_at)}</span>
                      </div>

                      {/* Platform */}
                      <div className="md:col-span-2">
                        <PlatformBadge platform={scan.platform} size="sm" />
                      </div>

                      {/* Duration */}
                      <div className="md:col-span-2 text-slate-600 flex items-center gap-2">
                        <span className="md:hidden text-slate-400 text-sm">Duration:</span>
                        {isDesktopSnapshot ? (
                          <span className="text-slate-400 italic text-sm">Desktop snapshot</span>
                        ) : (
                          formatDuration(scan.duration_seconds)
                        )}
                      </div>

                      {/* Posts */}
                      <div className="md:col-span-2 flex items-center gap-2">
                        <TrendingUp size={16} className="text-slate-400 hidden md:block" />
                        <span className="text-slate-700">{scan.total_items} posts</span>
                      </div>

                      {/* Ads % */}
                      <div className="md:col-span-2 flex items-center gap-2">
                        <Megaphone size={16} className="text-slate-400 hidden md:block" />
                        <span
                          className={`font-semibold ${
                            scan.ad_percentage > 0.3
                              ? 'text-red-600'
                              : scan.ad_percentage > 0.15
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {formatPercent(scan.ad_percentage)}
                        </span>
                      </div>

                      {/* Delete button */}
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          onClick={(e) => handleDelete(scan.id, e)}
                          disabled={deletingId === scan.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Delete scan"
                        >
                          {deletingId === scan.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stats Summary */}
        {scans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center text-sm text-slate-500"
          >
            <p>
              {scans.length} scan{scans.length === 1 ? '' : 's'} total ·{' '}
              {scans.reduce((acc, s) => acc + s.total_items, 0)} posts analyzed
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
