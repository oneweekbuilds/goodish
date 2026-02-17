import React from 'react';
import { Database } from 'lucide-react';

/**
 * MasterNumbersLine - PREMIER QUALITY
 * Footer context at bottom of each tab.
 * Refined with icon, subtle background pill, and better typography.
 */
const MasterNumbersLine = ({ scanCount, platformCount, postCount }) => {
  if (postCount === 0) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Database size={13} className="text-slate-300 flex-shrink-0" />
        <p className="text-[13px] text-slate-400">
          This view will populate once posts are scanned.
        </p>
      </div>
    );
  }

  const parts = [];
  parts.push(`${postCount.toLocaleString()} posts`);
  if (scanCount > 1) parts.push(`${scanCount} scans`);
  if (platformCount > 1) parts.push(`${platformCount} platforms`);

  return (
    <div
      className="flex items-center gap-2.5 py-3 px-4 rounded-xl"
      style={{
        background: 'rgba(37, 99, 235, 0.02)',
        border: '1px solid rgba(37, 99, 235, 0.06)',
      }}
    >
      <Database size={13} className="flex-shrink-0" style={{ color: 'rgba(37, 99, 235, 0.35)' }} />
      <p className="text-[13px] text-slate-500 font-medium">
        Based on {parts.join(' · ')}
      </p>
    </div>
  );
};

export default MasterNumbersLine;
