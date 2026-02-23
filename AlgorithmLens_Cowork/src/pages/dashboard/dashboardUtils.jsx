import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Globe, Clock, Database, Compass, RefreshCcw, Lock } from 'lucide-react';
import ViewCard from '../../components/dashboard/ViewCard';
import { THEME, SURFACES } from './dashboardConstants';
import { EMPTY_STATE_TYPES } from './dashboardCatalog';

/**
 * CollapsedEmptyStateCard - Shows a composite placeholder when 3+ cards share the same empty state
 */
export const CollapsedEmptyStateCard = ({ emptyStateType, count, tabName }) => {
  const configs = {
    [EMPTY_STATE_TYPES.NEEDS_MORE_SCANS]: {
      icon: <BarChart3 size={24} className="text-slate-400" />,
      title: `${count} More Insights Available`,
      message: `More insights about ${tabName.toLowerCase()} will appear as you scan more content.`,
      cta: { label: 'Run Another Scan', to: '/start' },
    },
    [EMPTY_STATE_TYPES.NEEDS_BROADER_BEHAVIOR]: {
      icon: <Globe size={24} className="text-slate-400" />,
      title: `${count} Cross-Platform Insights`,
      message: `These insights appear when you scan across more platforms.`,
      cta: { label: 'Scan Another Platform', to: '/start' },
    },
    [EMPTY_STATE_TYPES.FUTURE_FEATURE]: {
      icon: <Clock size={24} className="text-slate-400" />,
      title: `${count} Features Coming Soon`,
      message: `These insights require features that are still in development.`,
      cta: null,
    },
  };

  const config = configs[emptyStateType] || configs[EMPTY_STATE_TYPES.NEEDS_MORE_SCANS];

  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 col-span-full">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-600 mb-1">
            {config.title}
          </h3>
          <p className="text-sm text-slate-500 mb-3">
            {config.message}
          </p>
          {config.cta && (
            <Link
              to={config.cta.to}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-blue hover:underline"
            >
              {config.cta.label}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * TabTrustSentence - Phase 10: Quiet, integrated trust note
 */
export const TabTrustSentence = ({ tabId, TAB_TRUST_SENTENCES }) => {
  const sentence = TAB_TRUST_SENTENCES[tabId];
  if (!sentence) return null;

  return (
    <div className="mb-5">
      <p className="text-xs text-slate-400 leading-relaxed italic">
        {sentence}
      </p>
    </div>
  );
};

/**
 * SectionHeader - Part 3: Editorial section headers
 * More magazine-like, less dashboard-like
 * Always uses blue accent (Part 1 Rule A)
 *
 * Improvement 5:
 * - Increased title size by one step
 * - Taller, thicker accent bar
 * - Faint horizontal divider line extending right
 * - Enhanced visual prominence
 */
export const SectionHeader = ({ title, subtitle, label, subtext }) => (
  <div className="mb-5 mt-12 first:mt-0"> {/* Increased top margin */}
    <div className="flex items-start gap-4">
      {/* Improvement 5: Taller, thicker blue vertical accent bar */}
      <div
        className="rounded-full flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, #2563EB, rgba(37, 99, 235, 0.35))',
          width: label ? '5px' : '4px', /* Thicker */
          height: label ? '56px' : '28px', /* Taller */
          marginTop: '2px',
        }}
      />
      <div className="flex-1 min-w-0">
        {/* Uppercase label */}
        {label && (
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: 'rgba(37, 99, 235, 0.65)' }}
          >
            {label}
          </p>
        )}
        {/* Main title - Improvement 5: Increased size */}
        <h3
          className={label ? "text-xl font-semibold text-slate-800 mb-1.5" : "text-sm font-semibold uppercase tracking-wider"}
          style={!label ? { color: 'rgba(37, 99, 235, 0.7)' } : undefined}
        >
          {title}
        </h3>
        {/* Subtext */}
        {subtext && (
          <p className="text-sm text-slate-500 leading-relaxed">
            {subtext}
          </p>
        )}
        {subtitle && !subtext && (
          <span className="text-xs text-slate-400">{subtitle}</span>
        )}
      </div>
    </div>
    {/* Improvement 5: Faint horizontal divider extending right */}
    {label && (
      <div
        className="mt-4 ml-9"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.15) 0%, rgba(226, 232, 240, 0.4) 30%, transparent 100%)',
        }}
      />
    )}
  </div>
);

/**
 * DataCoverageBar - Shows data coverage stats for a tab
 * PHASE 6A: Tab-level data coverage line
 */
export const DataCoverageBar = ({ scans, scanDetails, tabId, totalScanCount }) => {
  // Calculate aggregate stats
  const stats = useMemo(() => {
    if (!scans || scans.length === 0) return null;

    let totalItems = 0;
    const platformSet = new Set();

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (detail) {
        const data = detail.result || detail.scan || detail;
        const items = data?.feed_items || [];
        totalItems += items.length;
      }
      if (scan.platform) {
        platformSet.add(scan.platform.toLowerCase());
      }
    }

    return {
      scanCount: totalScanCount || 0, // Use unified scan count
      platformCount: platformSet.size,
      platforms: Array.from(platformSet),
      totalItems,
    };
  }, [scans, scanDetails, totalScanCount]);

  if (!stats) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400">
      <Database size={12} className="text-slate-300" />
      <span>
        {stats.scanCount} scan{stats.scanCount !== 1 ? 's' : ''} · {stats.platformCount} platform{stats.platformCount !== 1 ? 's' : ''} · {stats.totalItems} posts
      </span>
    </div>
  );
};

/**
 * HowToUnlockBox - Shows when a tab has insufficient data
 * PHASE 6A: Friendly guidance for sparse data
 */
export const HowToUnlockBox = ({ tabId }) => {
  const tips = {
    ads: [
      'Run more scans to see promotional patterns',
      'Scan different platforms to compare ad loads',
      'Scan feeds with sponsored content for better detection',
    ],
    politics: [
      'Scan feeds that contain political content',
      'Run multiple scans over time to see trends',
      'Enable political leaning estimates for detailed analysis',
    ],
    patterns: [
      'Run at least 2-3 scans to see patterns emerge',
      'Scan different platforms to compare topic variety',
      'Give it time - patterns become clearer with more data',
    ],
    creators: [
      'Scan feeds with diverse creator content',
      'Run multiple scans to track which creators appear most',
      'Scan multiple platforms to find cross-platform creators',
    ],
    algorithm: [
      'Run more scans to build a clearer algorithmic profile',
      'Scan consistently over days/weeks for best results',
      'Diverse platform scans reveal more about targeting',
    ],
  };

  const tabTips = tips[tabId] || tips.patterns;

  return (
    <div className="col-span-full px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
      <p className="text-sm font-medium text-blue-800 mb-2">What will appear here:</p>
      <ul className="text-sm text-blue-700 space-y-1">
        {tabTips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * ExpandableDetailRow - Inline expandable row replacing "View" buttons
 * UI Refoundation: No "View" buttons allowed - use inline expand
 */
export const ExpandableDetailRow = ({ view, dataResult, isExpanded, onToggle, accentColor }) => {
  const hasData = dataResult?.hasData;
  const takeawayText = hasData && typeof view.takeaway === 'function'
    ? view.takeaway(dataResult?.data)
    : null;

  return (
    <div
      className="first:border-t-0"
      style={{ borderTop: '1px solid rgba(226, 232, 240, 0.4)' }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/30 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded"
      >
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-600">
            {view.title}
          </h4>
          {!isExpanded && takeawayText && (
            <p className="text-xs text-slate-400 mt-1 truncate">
              {takeawayText}
            </p>
          )}
        </div>
        <span
          className="text-xs font-medium transition-colors"
          style={{
            color: accentColor === 'green'
              ? 'rgba(16, 185, 129, 0.75)'
              : 'rgba(37, 99, 235, 0.7)',
          }}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </span>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
          <ViewCard
            view={view}
            dataResult={dataResult}
            scanCount={0}
            platformCount={0}
            accentColor={accentColor}
            isInline={true}
            hideTitle={true}
            hideDescription={true}
          />
        </div>
      )}
    </div>
  );
};

/**
 * ChapterContainer - Wraps each major story chapter in a designed container
 * Creates visual rhythm and reduces "random header + card" feeling
 *
 * Features:
 * - Subtle slate background tint
 * - Border with rounded corners
 * - Generous padding
 * - Section header inside container
 * - Subtle shadow lift effect
 */
export const ChapterContainer = ({ children, variant = 'default' }) => {
  const variants = {
    default: {
      background: '#F8FAFC',
      border: '1px solid #E2E8F0',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
    },
    primary: {
      background: '#FAFBFC',
      border: '1px solid #CBD5E1',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
    },
    accent: {
      background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
      border: '1px solid #E2E8F0',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-md"
      style={{
        background: style.background,
        border: style.border,
        boxShadow: style.shadow,
        padding: 'clamp(1rem, 4vw, 2.5rem)',
      }}
    >
      {children}
    </div>
  );
};
