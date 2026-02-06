import React, { useEffect } from 'react';
import { TrendingUp, X } from 'lucide-react';

/**
 * TrendsStubPanel - Honest placeholder for trends feature
 *
 * Shows for Plus users when they click "View Trends" CTA.
 * Displays honest message about needing multiple scans for trends.
 *
 * Props:
 * - scanCount: number of saved scans
 * - onClose: callback to close panel
 */
const TrendsStubPanel = ({ scanCount, onClose }) => {
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
            <TrendingUp size={20} className="text-primary-blue" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Trends over time</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded"
          aria-label="Close trends panel"
        >
          <X size={20} />
        </button>
      </div>

      {/* Message */}
      <div className="space-y-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          Trend charts will appear here once you have multiple saved scans.
        </p>

        {/* Scan count status */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-700">
            <span className="font-medium">You currently have {scanCount} saved scan{scanCount !== 1 ? 's' : ''}.</span>
            {' '}
            {scanCount < 2 ? 'Trends require at least 2 scans.' : 'Trend analysis is coming soon.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrendsStubPanel;
