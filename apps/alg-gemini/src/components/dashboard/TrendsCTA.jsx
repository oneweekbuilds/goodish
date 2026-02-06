import React from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * TrendsCTA - Trends over time call-to-action row
 *
 * Appears near the top of each dashboard tab to invite users to see trends.
 * For free users: opens paywall modal
 * For plus users: opens trends panel (stub for now)
 *
 * Props:
 * - onClick: callback when clicked
 * - isPlusUser: boolean
 */
const TrendsCTA = ({ onClick, isPlusUser }) => {
  return (
    <div className="bg-gradient-to-r from-primary-blue/5 to-primary-blue/10 border border-primary-blue/20 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={20} className="text-primary-blue" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {isPlusUser ? 'View trends over time' : 'See how your feed changes over time'}
          </h3>
          <p className="text-xs text-slate-600">
            {isPlusUser
              ? 'Track changes and patterns across multiple scans'
              : 'Unlock trends, comparisons, and deeper insights with Plus'}
          </p>
        </div>
      </div>
      <button
        onClick={onClick}
        className="px-4 py-2 bg-primary-blue text-white rounded-full font-semibold text-sm hover:bg-blue-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 whitespace-nowrap"
      >
        {isPlusUser ? 'View Trends' : 'Unlock Plus'}
      </button>
    </div>
  );
};

export default TrendsCTA;
