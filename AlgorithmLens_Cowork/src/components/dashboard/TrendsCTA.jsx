import React from 'react';
import { TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { PRICING } from '../../lib/plan/pricingConfig';

/**
 * TrendsCTA - Trends over time call-to-action row - PREMIER QUALITY
 *
 * Appears near the top of each dashboard tab to invite users to see trends.
 * For free users: opens paywall modal
 * For plus users: opens trends panel
 *
 * Features: gradient background, refined icon treatment, polished button.
 * Conversion optimization: contextual messaging based on tab, stronger CTA copy.
 *
 * Props:
 * - onClick: callback when clicked
 * - isPlusUser: boolean
 * - tabName: optional string for contextual messaging
 * - scanCount: optional number of scans the user has taken
 */
const TrendsCTA = ({ onClick, isPlusUser, tabName, scanCount }) => {
  // Contextual free-user messaging based on tab and scan count
  const getFreeUserMessage = () => {
    if (scanCount && scanCount >= 2) {
      return {
        title: `You have ${scanCount} scans — compare them with Plus`,
        subtitle: 'See what changed between scans: ad volume, source diversity, and content shifts',
      };
    }
    if (tabName === 'ads') {
      return {
        title: 'Are your ads increasing over time?',
        subtitle: 'Plus tracks ad volume across scans so you can spot patterns',
      };
    }
    if (tabName === 'sources') {
      return {
        title: 'Is your feed narrowing to fewer sources?',
        subtitle: 'Plus tracks source diversity across scans to reveal concentration shifts',
      };
    }
    if (tabName === 'politics') {
      return {
        title: 'Does your political content shift after news events?',
        subtitle: 'Plus tracks political content over time so you can see the patterns',
      };
    }
    if (tabName === 'tone') {
      return {
        title: 'Is the tone of your feed changing?',
        subtitle: 'Plus tracks tone shifts across scans so nothing slips by unnoticed',
      };
    }
    return {
      title: 'Understand the full picture of your feed',
      subtitle: 'Evidence-based analysis, AI-powered Q&A, and trend tracking with Plus',
    };
  };

  const freeMsg = getFreeUserMessage();

  return (
    <div
      className="rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4"
      style={{
        background: isPlusUser
          ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%)'
          : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.08) 100%)',
        border: isPlusUser
          ? '1px solid rgba(16, 185, 129, 0.15)'
          : '1px solid rgba(37, 99, 235, 0.12)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: isPlusUser
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0.06) 100%)',
            border: isPlusUser
              ? '1px solid rgba(16, 185, 129, 0.15)'
              : '1px solid rgba(37, 99, 235, 0.12)',
          }}
        >
          {isPlusUser ? (
            <TrendingUp size={18} className="text-accent-green" aria-hidden="true" />
          ) : (
            <Sparkles size={18} className="text-primary-blue" aria-hidden="true" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900" style={{ letterSpacing: '-0.01em' }}>
            {isPlusUser ? 'View trends over time' : freeMsg.title}
          </h3>
          <p className="text-sm text-slate-500">
            {isPlusUser
              ? 'Track changes and patterns across multiple scans'
              : freeMsg.subtitle}
          </p>
        </div>
      </div>
      <button
        onClick={onClick}
        className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex items-center gap-1.5"
        style={{
          background: isPlusUser
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          color: '#FFFFFF',
          boxShadow: isPlusUser
            ? '0 2px 8px rgba(16, 185, 129, 0.3)'
            : '0 2px 8px rgba(37, 99, 235, 0.3)',
          focusVisibleRingColor: isPlusUser ? 'rgba(16, 185, 129, 0.6)' : 'rgba(37, 99, 235, 0.6)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = isPlusUser
            ? '0 4px 16px rgba(16, 185, 129, 0.4)'
            : '0 4px 16px rgba(37, 99, 235, 0.4)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = isPlusUser
            ? '0 2px 8px rgba(16, 185, 129, 0.3)'
            : '0 2px 8px rgba(37, 99, 235, 0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {isPlusUser ? 'View Trends' : `Try free for ${PRICING.trial.days} days`}
        <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default TrendsCTA;
