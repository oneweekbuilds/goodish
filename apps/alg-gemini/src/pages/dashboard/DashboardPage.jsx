import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw, BarChart3, Clock, Globe, Database, ChevronDown, ChevronUp, Compass, RefreshCcw, Lock, Sparkles, ExternalLink, ShieldCheck, MessageSquare, EyeOff } from 'lucide-react';
import { TABS, getViewsForTab, getVisibleViewCount, EMPTY_STATE_TYPES, TAB_TRUST_SENTENCES } from './dashboardCatalog';
import ViewCard from '../../components/dashboard/ViewCard';
import OverviewTab from './tabs/OverviewTab';
import SourcesTab from './tabs/SourcesTab';
import AdsTab from './tabs/AdsTab';
import PoliticsTab from './tabs/PoliticsTab';
import ToneTab from './tabs/ToneTab';
import SuggestedVsFollowedTab from './tabs/SuggestedVsFollowedTab';
import { useDashboardData } from '../../lib/dashboard/useDashboardData';
import { generateDemoData } from '../../lib/dashboard/demoData';
import * as dataHelpers from '../../lib/dashboard/dataHelpers';
import { isHeadlineExcludedLabel } from '../../lib/dashboard/headlineSafety';
import { submitWaitlistEmail } from '../../lib/waitlist/submitWaitlistEmail';

/**
 * THEME CONSTANTS - Part 1 Color System
 * Rule A: All 5 dashboard tabs use BLUE theme
 * Rule B: Talk to Your Algorithm module uses GREEN theme everywhere
 */
export const THEME = {
  // Blue theme for all tabs (consistent, calm editorial product)
  blue: {
    accent: '#2563EB',
    accentLight: 'rgba(37, 99, 235, 0.1)',
    accentMedium: 'rgba(37, 99, 235, 0.15)',
    gradient: 'linear-gradient(180deg, rgba(37, 99, 235, 0.03) 0%, rgba(37, 99, 235, 0.06) 50%, rgba(37, 99, 235, 0.02) 100%)',
    border: 'rgba(37, 99, 235, 0.12)',
    shadow: '0 4px 24px rgba(37, 99, 235, 0.06)',
  },
  // Green theme ONLY for Talk to Your Algorithm module (premium standout)
  green: {
    accent: '#10B981',
    accentLight: 'rgba(16, 185, 129, 0.1)',
    accentMedium: 'rgba(16, 185, 129, 0.15)',
    gradient: 'linear-gradient(165deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(16, 185, 129, 0.07) 100%)',
    border: 'rgba(16, 185, 129, 0.15)',
    shadow: '0 4px 32px rgba(16, 185, 129, 0.1)',
  },
};

/**
 * SOLID SURFACE TOKENS - Solid Surfaces Strategy
 * Replace translucent everywhere with solid, intentional surfaces
 */
export const SURFACES = {
  // Hero chapter - solid light blue background
  HERO_BLUE: {
    background: '#EFF6FF', // solid light blue
    border: '1px solid #BFDBFE',
    shadow: '0 4px 24px rgba(37, 99, 235, 0.08)',
  },
  // Support cards in hero - solid white with clear border
  SUPPORT_WHITE: {
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  // Talk chapter - solid light green background
  TALK_GREEN: {
    background: '#ECFDF5', // solid light green
    border: '1px solid #A7F3D0',
    shadow: '0 4px 24px rgba(16, 185, 129, 0.1)',
  },
  // Content sections - solid white with border
  SECTION_WHITE: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    shadow: 'none',
  },
  // Alternating tint for visual rhythm
  SECTION_TINT: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    shadow: 'none',
  },
};

/**
 * CollapsedEmptyStateCard - Shows a composite placeholder when 3+ cards share the same empty state
 */
const CollapsedEmptyStateCard = ({ emptyStateType, count, tabName }) => {
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
const TabTrustSentence = ({ tabId }) => {
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
const SectionHeader = ({ title, subtitle, label, subtext }) => (
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
const DataCoverageBar = ({ scans, scanDetails, tabId, totalScanCount }) => {
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
    <div className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-400">
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
const HowToUnlockBox = ({ tabId }) => {
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
      <p className="text-sm font-medium text-blue-800 mb-2">How to unlock more insights:</p>
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
const ExpandableDetailRow = ({ view, dataResult, isExpanded, onToggle, accentColor }) => {
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
        className="w-full px-6 py-5 flex items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors text-left"
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
        <div className="px-6 pb-6 pt-2">
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
const ChapterContainer = ({ children, variant = 'default' }) => {
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
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
      }}
    >
      {children}
    </div>
  );
};

/**
 * Story-driven section header config for ALL tabs
 * These headers guide the reader through observations, NOT predictions
 * All language grounded in "this scan" and observation, not identity or intent
 */
const TAB_STORY_HEADERS = {
  algorithm: {
    keyInsight: {
      label: 'Observed',
      title: 'System interpretation during this window',
      subtext: 'How the algorithm appears to be reading your signals based on what surfaced.',
    },
    details: {
      label: 'Context',
      title: 'What the system is reinforcing',
      subtext: 'Themes that recurred, suggesting persistent associations.',
    },
    moreDetails: {
      label: 'Speculation',
      title: 'Extrapolated future associations',
      subtext: 'If patterns continue, the system might associate you with these themes. Pure speculation.',
    },
    summary: {
      label: 'Summary',
      title: 'Current algorithmic interpretation',
      subtext: 'How the system appears to be categorizing you based on observed patterns.',
    },
  },
  ads: {
    keyInsight: {
      label: 'Observed',
      title: 'What your feed is trying to sell you',
      subtext: 'How strongly the feed is steering you toward sponsored content, based on labeled ads.',
    },
    details: {
      label: 'Context',
      title: 'Where the selling comes from',
      subtext: 'Which advertisers and platforms are doing the most selling during this window.',
    },
    moreDetails: {
      label: 'Speculation',
      title: 'Additional detail from the same window',
      subtext: 'Optional deeper cuts from the same window. We cannot predict.',
    },
    summary: {
      label: 'Experiments',
      title: 'What you could try',
      subtext: 'Optional actions if you want to test changes in upcoming scans.',
    },
  },
  politics: {
    keyInsight: {
      label: 'Observed',
      title: 'Political keywords during this window',
      subtext: 'Measures exposure to political content, not belief formation.',
    },
    details: {
      label: 'Context',
      title: 'Where political exposure comes from',
      subtext: 'Which accounts and platforms drove political keywords during this window.',
    },
    moreDetails: {
      label: 'Additional detail',
      title: 'How this is measured',
      subtext: 'We look for political terms in post text and captions within your scans. We count how often those terms appear and which accounts they appear from. This does not estimate your viewpoint. It only summarizes what appeared in the feed content you scanned.',
    },
    summary: {
      label: 'Summary',
      title: 'Political keyword patterns',
      subtext: 'Observed patterns during this window.',
    },
  },
  patterns: {
    keyInsight: {
      label: 'Observed',
      title: 'Topics during this window',
      subtext: 'What surfaced. Patterns in exposure, not preference.',
    },
    details: {
      label: 'Context',
      title: 'How topics distributed',
      subtext: 'Where repetition formed and where variety emerged.',
    },
    moreDetails: {
      label: 'Additional detail',
      title: 'Pattern movement from this window',
      subtext: 'How themes shifted. Narrowing, broadening, or stabilizing.',
    },
    summary: {
      label: 'Summary',
      title: 'Topic patterns observed',
      subtext: 'Movement detected during this window.',
    },
  },
  // FIX C9: Clarified "More details" organization with specific labels
  creators: {
    keyInsight: {
      label: 'Observed',
      title: 'Influence during this window',
      subtext: 'Which accounts shaped what you saw. What appeared, not who you are.',
    },
    details: {
      label: 'Context',
      title: 'How influence concentrated',
      subtext: 'Whether a few voices dominated or many contributed.',
    },
    moreDetails: {
      label: 'Cross-platform presence',
      title: 'Accounts that appeared in multiple spaces',
      subtext: 'Voices that reached you across different platforms.',
    },
    summary: {
      label: 'Summary',
      title: 'Which creators dominate your feed',
      subtext: 'This section summarizes recurring patterns in which accounts dominate your scanned feed, such as repeated appearances or tight clustering around a small set of creators. It does not judge quality or intent.',
    },
  },
};

// Legacy alias for backward compatibility
const ALGORITHM_TAB_HEADERS = TAB_STORY_HEADERS.algorithm;

// Curated supporting view whitelists per tab (deterministic)
const CURATED_SUPPORTING_BY_TAB = {
  ads: ['ads-concentration', 'ads-by-platform', 'ads-products'],
  politics: ['politics-creators', 'politics-platform-compare', 'politics-profile'],
  patterns: ['patterns-echo-risk', 'manipulative-patterns', 'patterns-repeated-themes'],
  creators: ['creators-concentration', 'creators-voice-diversity', 'creators-new-vs-familiar'],
  algorithm: ['algorithm-profile-breadth', 'algorithm-recurring-themes', 'algorithm-future-recommendations'],
};

/**
 * ViewsGridWithCollapsing - Part 3: Editorial Stack Redesign
 *
 * Structure per tab (magazine-style, not dashboard):
 * - KEY INSIGHT: Declarative statement + collapsible evidence
 * - DETAILS: Softer backgrounds, headline + takeaway, 2 columns
 * - MORE DETAILS: Editorial drawer "Where this is heading"
 * - SUMMARY: Paragraph + 3 "Try this" actions max
 *
 * Part 1 Rule A: ALL tabs use BLUE accent
 *
 * Change 1: Stronger borders on all non-feature cards
 * Change 2: Story-driven headers for Algorithm tab
 * Change 3: "Where this is heading" uncollapsed by default
 */
const ViewsGridWithCollapsing = ({ views, viewDataResults, scanCount, platformCount, tabName, tabId, heroViewId, scopeLabel }) => {
  // Get story-driven headers for current tab (all tabs now use them)
  const tabHeaders = TAB_STORY_HEADERS[tabId] || TAB_STORY_HEADERS.algorithm;
  // Check if we're on the Algorithm tab for special two-column layout
  const isAlgorithmTab = tabId === 'algorithm';
  // All tabs now use story-driven structure
  const useStoryStructure = true;

  // Track which sections are expanded
  // Change 3: moreDetails expanded by default on Algorithm tab
  const [expandedSections, setExpandedSections] = useState({
    heroEvidence: false,
    keyInsightEvidence: false,
    moreDetails: false,
    tryThis: false,
    summaryMore: false,
  });

  // Reset expanded state when tab changes
  useEffect(() => {
    setExpandedSections({
      heroEvidence: false,
      keyInsightEvidence: false,
      moreDetails: false,
      tryThis: false,
      summaryMore: false,
    });
  }, [tabId]);

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      // Fix null/undefined handling to prevent crashes
      if (!prev || typeof prev !== 'object') {
        return { [section]: true };
      }
      if (!section || typeof section !== 'string') {
        return prev;
      }
      return {
        ...prev,
        [section]: !prev[section],
      };
    });
  };

  // Render-safe label for summary list items (avoids rendering raw objects)
  const formatSummaryItemLabel = (item) => {
    if (item == null) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);

    // Creator summary objects from getInfluentialCreatorsData()
    if (typeof item === 'object' && item.creator) {
      const creator = String(item.creator);

      // `share` may be a number (e.g. 12) or a string (e.g. "12%")
      const shareRaw = item.share;
      const share =
        typeof shareRaw === 'number'
          ? `${Math.round(shareRaw)}%`
          : typeof shareRaw === 'string'
            ? shareRaw
            : null;

      // `contributions` is a derived string like "promotions, politics"
      const contributions =
        typeof item.contributions === 'string' && item.contributions.trim().length > 0
          ? item.contributions.trim()
          : null;

      const parts = [creator, share, contributions].filter(Boolean);
      return parts.join(' • ');
    }

    // Generic structured items used elsewhere (tips, topics, etc.)
    if (typeof item === 'object') {
      return String(item.text || item.topic || item.label || '[item]');
    }

    return String(item);
  };

  // Hero is rendered above. Exclude it here to avoid duplicate "key insight" rendering.
  const viewsForGrouping = heroViewId ? views.filter(v => v.id !== heroViewId) : views;

  // Group views by sortOrder AND data availability
  const groupedViews = {
    primary: { withData: [], collapsed: [] },
    supporting: { withData: [], collapsed: [] },
    summary: { withData: [] },
  };

  viewsForGrouping.forEach((view) => {
    const result = viewDataResults[view.id] || { hasData: false };
    const group = view.sortOrder || 'supporting';

    // Skip views without data entirely (cleaner UI)
    if (!result.hasData) return;

    const targetGroup = groupedViews[group] || groupedViews.supporting;

    if (view.collapsedByDefault) {
      targetGroup.collapsed.push(view);
    } else {
      targetGroup.withData.push(view);
    }
  });

  // Get views for each section
  const primaryCards = groupedViews.primary.withData;
  const supportingCards = groupedViews.supporting.withData;
  const whitelist = CURATED_SUPPORTING_BY_TAB[tabId];
  const supportingIdSet = new Set(supportingCards.map(v => v.id));
  const whitelistValid = Array.isArray(whitelist) && whitelist.every(id => supportingIdSet.has(id));

  let visibleSupportingCards = supportingCards.slice(0, 4);
  let supportingOverflow = supportingCards.slice(4);

  if (whitelistValid) {
    const whitelistSet = new Set(whitelist);
    visibleSupportingCards = supportingCards.filter(v => whitelistSet.has(v.id));
    supportingOverflow = supportingCards.filter(v => !whitelistSet.has(v.id));
  }
  const speculationCards = [
    ...groupedViews.primary.collapsed,
    ...groupedViews.supporting.collapsed,
  ];
  const summaryCards = groupedViews.summary.withData;

  // Check if sections have content
  const hasPrimaryContent = primaryCards.length > 0;
  const hasObservedSupportingContent = visibleSupportingCards.length > 0;
  const hasMoreDetailsContent = supportingOverflow.length > 0 || speculationCards.length > 0;
  const hasSummaryContent = summaryCards.length > 0;

  const evidenceLabel = scopeLabel || null;
  
  // Generate a dynamic preview for More Details based on what's actually inside
  // FIX A8: Use user-centered language describing value, not internal labels
  let moreDetailsSubtitle = 'Optional extra metrics and deeper cuts.';
  if (tabId === 'ads') {
    moreDetailsSubtitle = hasMoreDetailsContent
      ? 'What products are being pitched and where ads are concentrated.'
      : 'Additional ad analysis from this window.';
  } else if (tabId === 'politics') {
    moreDetailsSubtitle = hasMoreDetailsContent
      ? 'Platform-by-platform breakdown and additional analysis.'
      : 'No political terms were detected in your scanned posts yet. If that changes, this section will explain what was detected and how it was counted.';
  }

  return (
    <div className="space-y-10">
      {/* KEY INSIGHT - Part 3 Module Type 1: Declarative + Collapsible Evidence */}
      {/* NOTE: Hero is rendered above by TabHero, so we skip hero rendering here */}
      {/* Only render primary section if hero doesn't exist OR if primary cards are different from hero */}
      {hasPrimaryContent && (
        <section>
          <ChapterContainer variant="primary">
            {/* All tabs now use story-driven headers */}
            <SectionHeader
              label={tabHeaders.keyInsight.label}
              title={tabHeaders.keyInsight.title}
              subtext={tabHeaders.keyInsight.subtext}
            />
            <div className="mt-6 mb-2">
              {primaryCards.map((view) => {
                const dataResult = viewDataResults[view.id];
                const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                  ? view.takeaway(dataResult?.data)
                  : null;

                // Get top topics for two-column layout
                const topicsDataRaw = viewDataResults?.['algo-topics-liked']?.data || [];
                const topicsData = Array.isArray(topicsDataRaw)
                  ? topicsDataRaw.filter((t) => !isHeadlineExcludedLabel(t?.topic))
                  : [];
                const hasTopics = topicsData.length > 0;

                return (
                  <div
                    key={view.id}
                    className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg"
                    style={{
                      background: 'white',
                      border: '1px solid rgba(148, 163, 184, 0.8)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    {/* Two-column layout for Algorithm tab */}
                    <div className="p-7 md:p-9">
                      <div className={isAlgorithmTab && hasTopics ? 'md:flex md:gap-8' : ''}>
                        {/* Left column: Takeaway + explanation */}
                        <div className={isAlgorithmTab && hasTopics ? 'md:flex-1' : ''}>
                          {/* "In plain terms" label */}
                          {isAlgorithmTab && takeawayText && (
                            <p
                              className="mb-3"
                              style={{
                                fontSize: '11px',
                                color: 'rgba(37, 99, 235, 0.55)',
                                letterSpacing: '0.1em',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                              }}
                            >
                              In plain terms
                            </p>
                          )}

                          {/* Main takeaway */}
                          {takeawayText && (
                            <p
                              className="text-xl md:text-2xl font-semibold text-text-main leading-snug mb-4"
                              style={{ maxWidth: '600px' }}
                            >
                              {takeawayText}
                            </p>
                          )}

                          {/* Description */}
                          <p
                            className="text-sm text-slate-500 leading-relaxed"
                            style={{ maxWidth: '500px' }}
                          >
                            {view.description}
                          </p>
                        </div>

                        {/* Right column: Top topics list (Algorithm tab only) */}
                        {isAlgorithmTab && hasTopics && (
                          <div
                            className="mt-6 md:mt-0 md:w-64 flex-shrink-0 rounded-xl p-4"
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            <p
                              className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3"
                            >
                              Top topics
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {topicsData.slice(0, 5).map((topic, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center text-xs px-2.5 py-1 rounded-full"
                                  style={{
                                    background: idx === 0 ? '#EFF6FF' : '#FFFFFF',
                                    border: `1px solid ${idx === 0 ? '#BFDBFE' : '#E2E8F0'}`,
                                    color: idx === 0 ? '#1D4ED8' : '#64748B',
                                    fontWeight: idx === 0 ? 600 : 500,
                                  }}
                                >
                                  {topic.topic}
                                  {topic.share && (
                                    <span className="ml-1 text-slate-400">{topic.share}%</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* "How we know this" disclosure - moved to top-right */}
                    <div
                      className="px-6 pb-6 md:px-8 md:pb-6 flex justify-between items-center"
                      style={{ borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}
                    >
                      {evidenceLabel && (
                        <span className="text-xs text-slate-400">
                          {evidenceLabel}
                        </span>
                      )}
                      <button
                        onClick={() => toggleSection('keyInsightEvidence')}
                        className="inline-flex items-center gap-2 text-sm font-medium transition-all rounded-full hover:bg-blue-100"
                        style={{
                          color: 'rgba(37, 99, 235, 0.8)',
                          background: 'rgba(37, 99, 235, 0.06)',
                          border: '1px solid rgba(37, 99, 235, 0.12)',
                          padding: '0.5rem 1rem',
                        }}
                        aria-expanded={expandedSections.keyInsightEvidence}
                        aria-label={expandedSections.keyInsightEvidence ? 'Hide evidence for this insight' : 'Show evidence for this insight'}
                      >
                        <ChevronDown
                          size={16}
                          className="transition-transform"
                          style={{
                            transform: expandedSections.keyInsightEvidence ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                          aria-hidden="true"
                        />
                        {expandedSections.keyInsightEvidence ? 'Hide evidence' : 'How we know this'}
                      </button>
                    </div>

                    {/* Evidence area */}
                    {/* Guard: Prevent crash when clicking "How we know this" if view/dataResult is missing or malformed */}
                    {expandedSections.keyInsightEvidence && (
                      <div
                        className="px-6 pb-6 md:px-8 md:pb-8"
                        style={{
                          background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.04) 0%, rgba(248, 250, 252, 0.8) 100%)',
                          borderTop: '1px solid rgba(37, 99, 235, 0.08)',
                        }}
                      >
                        <div className="pt-5">
                          <p
                            className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4"
                          >
                            Supporting evidence
                          </p>
                          {/* Safety check: Ensure view and dataResult exist and have valid structure before rendering ViewCard */}
                          {view && dataResult && typeof view === 'object' && typeof dataResult === 'object' ? (
                            <ViewCard
                              view={view}
                              dataResult={dataResult}
                              scanCount={scanCount}
                              platformCount={platformCount}
                              accentColor="blue"
                              isInline={true}
                              hideTitle={true}
                              hideDescription={true}
                              scopeLabel={scopeLabel}
                            />
                          ) : (
                            <p className="text-sm text-slate-500">
                              We do not have supporting evidence details for this card yet.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ChapterContainer>
        </section>
      )}

      {/* OBSERVED SUPPORTING CARDS - calm default, limited to top 4 */}
      {hasObservedSupportingContent && (
        <section>
          <ChapterContainer variant="default">
            <SectionHeader
              label={tabHeaders.keyInsight.label}
              title={tabHeaders.details.title}
              subtext={tabHeaders.details.subtext}
            />
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {visibleSupportingCards.map((view, idx) => {
                const dataResult = viewDataResults[view.id];
                const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                  ? view.takeaway(dataResult?.data)
                  : null;

                return (
                  <div
                    key={view.id}
                    className="rounded-xl p-4 transition-all duration-200 hover:shadow-sm hover:border-slate-200"
                    style={{
                      background: 'white',
                      border: '1px solid rgba(226, 232, 240, 0.6)',
                    }}
                  >
                    {/* Card title */}
                    <h4 className="text-sm font-semibold text-slate-600 mb-2.5">{view.title}</h4>

                    {/* Bold one-line takeaway */}
                    {takeawayText && (
                      <p className="text-xs font-medium text-slate-600 mb-2.5 leading-relaxed">
                        {takeawayText}
                      </p>
                    )}

                    {/* Supporting content */}
                    <div className="text-xs text-slate-500">
                      <ViewCard
                        view={view}
                        dataResult={dataResult}
                        scanCount={scanCount}
                        platformCount={platformCount}
                        accentColor="blue"
                        isInline={true}
                        hideTitle={true}
                        scopeLabel={scopeLabel}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChapterContainer>
        </section>
      )}

      {/* MORE DETAILS - Context + Speculation behind calm accordion */}
      {/* For Politics tab, always show this section to display "How this is measured" */}
      {(hasMoreDetailsContent || tabId === 'politics') && (
        <section>
          <ChapterContainer variant="accent">
            <button
              onClick={() => toggleSection('moreDetails')}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-slate-300"
              aria-expanded={expandedSections.moreDetails}
              aria-label={expandedSections.moreDetails ? 'Collapse more details' : 'Expand more details'}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">More details</p>
                <p className="text-xs text-slate-500">{moreDetailsSubtitle}</p>
              </div>
              <ChevronDown
                size={16}
                className="flex-shrink-0 text-slate-500 transition-transform"
                style={{
                  transform: expandedSections.moreDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
                aria-hidden="true"
              />
            </button>

            {expandedSections.moreDetails && (
              <div className="mt-6 space-y-8">
                {supportingOverflow.length > 0 && (
                  <div>
                    {/* FIX X5: Reduce header repetition in expanded section */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {supportingOverflow.map((view) => {
                        const dataResult = viewDataResults[view.id];
                        const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                          ? view.takeaway(dataResult?.data)
                          : null;

                        return (
                          <div
                            key={view.id}
                            className="rounded-xl p-5 transition-all duration-200 hover:shadow-sm hover:border-slate-200"
                            style={{
                              background: 'white',
                              border: '1px solid rgba(226, 232, 240, 0.6)',
                            }}
                          >
                            {/* FIX X5: Improved spacing for expanded cards */}
                            <h4 className="text-sm font-semibold text-slate-600 mb-3">{view.title}</h4>
                            {takeawayText && (
                              <p className="text-xs font-medium text-slate-600 mb-3 leading-relaxed">
                                {takeawayText}
                              </p>
                            )}
                            <div className="text-xs text-slate-500">
                              <ViewCard
                                view={view}
                                dataResult={dataResult}
                                scanCount={scanCount}
                                platformCount={platformCount}
                                accentColor="blue"
                                isInline={true}
                                hideTitle={true}
                            scopeLabel={scopeLabel}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* For Politics tab, always show the "How this is measured" explanation */}
                {(speculationCards.length > 0 || tabId === 'politics') && (
                  <div>
                    <SectionHeader
                      label={tabHeaders.moreDetails.label}
                      title={tabHeaders.moreDetails.title}
                      subtext={tabHeaders.moreDetails.subtext}
                    />
                    {speculationCards.length === 0 && tabId === 'politics' && (
                      <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-sm text-slate-600">
                          No political terms were detected in your scanned posts yet. If that changes, this section will explain what was detected and how it was counted.
                        </p>
                      </div>
                    )}
                    {speculationCards.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {speculationCards.map((view) => {
                        const dataResult = viewDataResults[view.id];
                        const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                          ? view.takeaway(dataResult?.data)
                          : null;

                        return (
                          <div
                            key={view.id}
                            className="rounded-xl p-4 transition-all duration-200 hover:shadow-sm hover:border-slate-200"
                            style={{
                              background: 'white',
                              border: '1px solid rgba(226, 232, 240, 0.6)',
                            }}
                          >
                            <h4 className="text-sm font-semibold text-slate-600 mb-2">{view.title}</h4>
                            {takeawayText && (
                              <p className="text-xs font-medium text-slate-600 mb-2 leading-relaxed">
                                {takeawayText}
                              </p>
                            )}
                            <div className="text-xs text-slate-500">
                              <ViewCard
                                view={view}
                                dataResult={dataResult}
                                scanCount={scanCount}
                                platformCount={platformCount}
                                accentColor="blue"
                                isInline={true}
                                hideTitle={true}
                                hideDescription={true}
                              scopeLabel={scopeLabel}
                              />
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </ChapterContainer>
        </section>
      )}

      {/* SUMMARY - Experiments behind calm accordion */}
      {/* Hide "Try this" section for Patterns and Creators tabs */}
      {hasSummaryContent && tabId !== 'patterns' && tabId !== 'creators' && (
        <section className="mt-4">
          <ChapterContainer variant="default">
            <button
              onClick={() => toggleSection('tryThis')}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-slate-300"
              aria-expanded={expandedSections.tryThis}
              aria-label={expandedSections.tryThis ? 'Collapse Try this actions' : 'Expand Try this actions'}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Try this</p>
                <p className="text-xs text-slate-500">Optional actions to explore change.</p>
              </div>
              <ChevronDown
                size={16}
                className="flex-shrink-0 text-slate-500 transition-transform"
                style={{
                  transform: expandedSections.tryThis ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
                aria-hidden="true"
              />
            </button>

            {expandedSections.tryThis && (
              <div className="mt-6">
                <SectionHeader
                  label={tabHeaders.summary.label}
                  title={tabHeaders.summary.title}
                  subtext={tabHeaders.summary.subtext}
                />
                <div className="mt-5">
                  {summaryCards.map((view) => {
                    const dataResult = viewDataResults[view.id];
                    const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                      ? view.takeaway(dataResult?.data)
                      : null;
                    const actionText = dataResult?.hasData && typeof view.action === 'function'
                      ? view.action(dataResult?.data)
                      : null;

                    // For list data, show max 3 items as actions
                    const listData = Array.isArray(dataResult?.data)
                      ? dataResult.data.slice(0, 3)
                      : dataResult?.data?.tips?.slice(0, 3) || [];

                    return (
                      <div
                        key={view.id}
                        className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md"
                        style={{
                          background: SURFACES.SECTION_WHITE.background,
                          border: SURFACES.SECTION_WHITE.border,
                        }}
                      >
                        <div className="p-6 md:p-8">
                          {/* Summary paragraph */}
                          {takeawayText && (
                            <p className="text-base text-slate-700 leading-relaxed mb-6" style={{ maxWidth: '600px' }}>
                              {takeawayText}
                            </p>
                          )}

                          {/* Action tiles - numbered steps */}
                          {listData.length > 0 && (
                            <div className="space-y-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                                Try this
                              </p>
                              <div className="grid gap-3">
                                {listData.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-slate-50 hover:shadow-sm"
                                    style={{
                                      background: '#FAFBFC',
                                      border: '1px solid #E2E8F0',
                                    }}
                                  >
                                    {/* Numbered badge */}
                                    <span
                                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                      style={{
                                        background: '#EFF6FF',
                                        color: '#2563EB',
                                        border: '1px solid #BFDBFE',
                                      }}
                                    >
                                      {idx + 1}
                                    </span>
                                    {/* Action text - with optional subtext */}
                                    <div className="flex-1 pt-1">
                                      <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                        {formatSummaryItemLabel(item)}
                                      </p>
                                      {/* Subtext for non-string items */}
                                      {typeof item !== 'string' && item.description && (
                                        <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Fallback to action text if no list */}
                          {listData.length === 0 && actionText && (
                            <p className="text-sm text-slate-500 italic">{actionText}</p>
                          )}

                          {/* Show more collapse for additional items */}
                          {Array.isArray(dataResult?.data) && dataResult?.data?.length > 3 && (
                            <button
                              onClick={() => toggleSection('summaryMore')}
                              className="mt-5 text-sm font-medium flex items-center gap-1 hover:text-blue-700 transition-colors"
                              style={{ color: '#2563EB' }}
                              aria-expanded={expandedSections.summaryMore}
                              aria-label={expandedSections.summaryMore ? 'Collapse additional ideas' : `Expand to show ${(dataResult?.data?.length || 0) - 3} more ideas`}
                            >
                              <ChevronDown
                                size={14}
                                className="transition-transform"
                                style={{
                                  transform: expandedSections.summaryMore ? 'rotate(180deg)' : 'rotate(0deg)',
                                }}
                                aria-hidden="true"
                              />
                              {expandedSections.summaryMore
                                ? 'Show less'
                                : `More ideas (${(dataResult?.data?.length || 0) - 3} more)`
                              }
                            </button>
                          )}

                          {expandedSections.summaryMore && Array.isArray(dataResult?.data) && (
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                              {dataResult.data.slice(3).map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 text-sm text-slate-500">
                                  <span className="text-slate-300">•</span>
                                  <span>{formatSummaryItemLabel(item)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Closing card footer - designed, not tacked on */}
                        {isAlgorithmTab && (
                          <div
                            className="px-6 py-5 md:px-8 text-center"
                            style={{
                              background: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)',
                              borderTop: '1px solid #BFDBFE',
                            }}
                          >
                            <p
                              className="text-sm text-slate-600 leading-relaxed"
                              style={{ maxWidth: '560px' }}
                            >
                              <span className="font-medium text-slate-700">Remember:</span> small shifts matter. This is about awareness, not blame. Your feed is shaped by invisible systems, and even gentle changes can make a difference over time.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ChapterContainer>
        </section>
      )}
    </div>
  );
};

/**
 * PRIMARY APP - alg-gemini
 *
 * DashboardPage - Main dashboard with 5 tabs and catalog-driven views.
 * Phase 8: UX Simplification and Product Judgment
 *
 * Key features:
 * - ONE primary card per tab - the clearest, calmest answer
 * - At most 2 secondary cards
 * - Everything else collapsed behind "See details"
 * - Increased whitespace for visual breathing room
 * - Simplified language throughout
 */

/**
 * FeatureMomentWrapper - Premium editorial wrapper for Algorithm tab centerpiece
 * Part 2: Enhanced to feel more premium with subtle gradient, increased border radius,
 * soft shadow, and increased visual breathing room
 */
const FeatureMomentWrapper = ({ children }) => (
  <div
    className="relative mb-20 -mx-6 md:-mx-8"
    style={{
      background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.025) 0%, rgba(37, 99, 235, 0.055) 40%, rgba(37, 99, 235, 0.035) 70%, rgba(37, 99, 235, 0.015) 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(37, 99, 235, 0.1)',
      boxShadow: '0 8px 40px rgba(37, 99, 235, 0.06), 0 2px 12px rgba(0, 0, 0, 0.02)',
      marginTop: '2rem',
      padding: 'clamp(2rem, 5vw, 3.5rem) clamp(2rem, 5vw, 3rem)',
    }}
  >
    {/* Subtle decorative element at top */}
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2"
      style={{
        width: '60px',
        height: '4px',
        background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.4), rgba(37, 99, 235, 0.15))',
        borderRadius: '0 0 4px 4px',
      }}
    />
    {/* Premium inner glow effect */}
    <div
      className="absolute inset-0 rounded-[20px] pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at top center, rgba(37, 99, 235, 0.04) 0%, transparent 60%)',
      }}
    />
    <div className="relative">{children}</div>
  </div>
);

/**
 * HERO_VIEW_ID_BY_TAB - Deterministic hero metric per tab (Slice 2).
 * This is the single source of truth for hero selection in v1.
 */
const HERO_VIEW_ID_BY_TAB = {
  ads: 'ads-percentage',
  politics: 'politics-share',
  patterns: 'patterns-topic-variety',
  creators: 'creators-top',
  algorithm: 'algo-topics-liked',
};

/**
 * TabHero - Oura-style hero: insight first, expandable evidence.
 *
 * Contract:
 * - Hero headline is derived from the hero view's `dataResult` (evidence-bound).
 * - "How we know this" expands to render the underlying `ViewCard` inline.
 */
const TabHero = ({
  tabId,
  scans,
  platforms,
  heroView,
  heroDataResult,
  isEvidenceExpanded,
  onToggleEvidence,
  scopeLabel,
  totalScanCount,
}) => {
  const scanCount = totalScanCount || 0;
  const platformCount = platforms?.length ?? 0;

  const hasHeroData = heroDataResult?.hasData === true;
  
  // FIX X4, A6, P10, W6, C9: Check chart quality - don't show hero if data quality is insufficient
  const heroQualityOk = !heroDataResult?.chartQuality || 
                         heroDataResult?.chartQuality?.quality === 'OK' ||
                         heroDataResult?.chartQuality?.quality === 'CHART_QUALITY_OK';

  let headline = null;
  let bodyText = null;
  
  // All tabs: insight-first - use takeaway as headline
  if (hasHeroData && heroQualityOk && typeof heroView?.takeaway === 'function') {
    try {
      headline = heroView.takeaway(heroDataResult?.data);
    } catch (err) {
      console.error(`Error computing hero takeaway for ${heroView?.id}:`, err);
      headline = null;
    }
  }
  
  // Fallback for weak signal: insight-first, not descriptive
  if (!headline) {
    headline = (hasHeroData && heroQualityOk)
      ? 'No dominant pattern emerged during this window.'
      : 'No dominant pattern emerged during this window.';
  }

  const contextLine = TAB_TRUST_SENTENCES[tabId] || null;

  const platformMeta = platformCount
    ? `${platformCount} platform${platformCount !== 1 ? 's' : ''}`
    : null;
  const metaText = scopeLabel
    ? platformMeta
      ? `${scopeLabel} • ${platformMeta}`
      : scopeLabel
    : null;
  // FIX X2, A10: Use consistent scope language - if multiple scans or explicit window, say "window"; if single scan, say "scan"
  const kickerText = scopeLabel || 'Observed during this window';

  return (
    <div className="mb-10">
      {/* Hero Insight Card - PREMIUM SURFACE with gradient */}
      <div
        className="w-full rounded-2xl mb-6 relative overflow-hidden transition-shadow duration-300 hover:shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EFF6FF 100%)',
          border: '2px solid #93C5FD',
          padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 3.5rem)',
          boxShadow: '0 8px 32px rgba(37, 99, 235, 0.12)',
        }}
      >
        {/* Subtle decorative gradient overlay */}
        <div
          className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at top left, rgba(37, 99, 235, 0.08) 0%, transparent 60%)',
          }}
        />

        {/* Hero Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative">
          {/* Left: Editorial kicker label */}
          <p
            style={{
              fontSize: '11px',
              color: '#64748B',
              letterSpacing: scopeLabel ? '0.04em' : '0.14em',
              fontWeight: 500,
              textTransform: scopeLabel ? 'none' : 'uppercase',
            }}
          >
            {kickerText}
          </p>

          {/* Right: Meta data pill */}
          <div
            className="flex items-center gap-2 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              padding: '0.375rem 0.875rem',
              fontSize: '11px',
              color: '#64748B',
              fontWeight: 500,
            }}
          >
            <Database size={12} className="text-slate-400" />
            <span>{metaText}</span>
          </div>
        </div>

        {/* Headline */}
        <div
          className="relative mb-4"
          style={{
            marginLeft: '-1rem',
            paddingLeft: '1rem',
          }}
        >
          {/* Blue accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 rounded-r-lg"
            style={{
              width: '6px',
              background: 'linear-gradient(180deg, #2563EB 0%, #60A5FA 100%)',
            }}
          />
          <h2
            className="font-bold text-slate-800"
            style={{
              fontFamily: 'var(--font-headline, system-ui)',
              letterSpacing: '-0.025em',
              fontSize: 'clamp(1.625rem, 4.5vw, 2.25rem)',
              lineHeight: 1.25,
              maxWidth: '100%',
            }}
          >
            {headline}
          </h2>
        </div>

        {/* Body text removed - insight-first approach uses headline only */}

        {/* Optional single context line */}
        {contextLine && (
          <p
            className="text-slate-600"
            style={{
              fontSize: '15px',
              lineHeight: 1.65,
              maxWidth: '680px',
            }}
          >
            {contextLine}
          </p>
        )}

        {/* Hero-level disclosure control */}
        <div
          className="mt-6 flex justify-end"
          style={{ borderTop: '1px solid rgba(226, 232, 240, 0.6)', paddingTop: '1rem' }}
        >
          <button
            onClick={onToggleEvidence}
            className="inline-flex items-center gap-2 text-sm font-medium transition-all rounded-full hover:bg-blue-100"
            style={{
              color: 'rgba(37, 99, 235, 0.85)',
              background: 'rgba(37, 99, 235, 0.06)',
              border: '1px solid rgba(37, 99, 235, 0.12)',
              padding: '0.5rem 1rem',
            }}
            aria-expanded={isEvidenceExpanded}
            aria-label={isEvidenceExpanded ? 'Hide evidence for this insight' : 'Show evidence for this insight'}
          >
            <ChevronDown
              size={16}
              className="transition-transform"
              style={{
                transform: isEvidenceExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
              aria-hidden="true"
            />
            {isEvidenceExpanded ? 'Hide details' : 'How we know this'}
          </button>
        </div>

        {/* Evidence area */}
        {/* Guard: Prevent crash when clicking "How we know this" in hero if heroView/heroDataResult is missing or malformed */}
        {isEvidenceExpanded && (
          <div
            className="mt-5 rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.04) 0%, rgba(248, 250, 252, 0.85) 100%)',
              border: '1px solid rgba(37, 99, 235, 0.10)',
              padding: '1.25rem',
            }}
          >
            {/* Safety check: Ensure heroView and heroDataResult exist and have valid structure before rendering ViewCard */}
            {heroView && heroDataResult && typeof heroView === 'object' && typeof heroDataResult === 'object' ? (
              <ViewCard
                view={heroView}
                dataResult={heroDataResult}
                scanCount={0}
                platformCount={0}
                accentColor="blue"
                isInline={true}
                hideTitle={true}
                hideDescription={true}
                scopeLabel={scopeLabel}
              />
            ) : (
              <p className="text-sm text-slate-500">
                We do not have supporting evidence details for this card yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * SecondVisualAnchor - Chapter opener that transitions into the analysis
 * ACCURACY CONTRACT COMPLIANT: All language grounded in observation
 */
const SecondVisualAnchor = ({ tabId, className = '' }) => {
  // Tab-specific anchor messages - grounded in observation, not intent
  const anchorMessages = {
    algorithm: "Below is what we observed during this window. Patterns show system interpretation, not your identity.",
    ads: "Below is what we observed during this window. All metrics use the same window.",
    politics: "Below is what we observed during this window. All metrics measure exposure, not belief formation.",
    patterns: "Below is what we observed during this window. Patterns show what surfaced, not what you seek.",
    creators: "Below is what we observed during this window. Patterns show what appeared, not who you are.",
  };

  return (
    <div
      className={`mb-10 mt-4 ${className}`}
      style={{
        paddingLeft: '1rem',
        borderLeft: '4px solid #2563EB',
      }}
    >
      <p
        className="text-lg font-medium text-slate-700 leading-relaxed"
        style={{ maxWidth: '560px' }}
      >
        {anchorMessages[tabId] || anchorMessages.algorithm}
      </p>
    </div>
  );
};

/**
 * ReadingColumnWrapper - Constrains content to a comfortable reading width
 * Used for sections after the Talk module to prevent "huge empty slabs"
 */
const ReadingColumnWrapper = ({ children }) => (
  <div
    className="mx-auto"
    style={{ maxWidth: '1024px' }} /* max-w-5xl equivalent */
  >
    {children}
  </div>
);

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

const TalkTabPanel = () => {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | submitting | success
  const [message, setMessage] = useState(null);

  const emailTrimmed = email.trim();
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const emailError = touched && !emailTrimmed
    ? 'Please enter an email address.'
    : touched && !emailLooksValid
      ? "That email doesn't look quite right."
      : null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setMessage(null);

    if (!emailTrimmed || !emailLooksValid) return;

    setStatus('submitting');
    const result = await submitWaitlistEmail({ email: emailTrimmed, source: 'talk_tab_waitlist' });
    if (result?.ok) {
      setStatus('success');
      setMessage("Thanks, you're on the list.");
      return;
    }

    setStatus('idle');
    setMessage(result?.error || 'Something went wrong. Please try again.');
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* FIX T2: Reduced padding and softened green treatment for more subtle, premium feel */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(236, 253, 245, 0.5)',
          border: '1px solid rgba(167, 243, 208, 0.4)',
          boxShadow: '0 2px 12px rgba(16, 185, 129, 0.06)',
          padding: 'clamp(1.5rem, 4vw, 2rem)',
        }}
      >
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Talk to your algorithm (coming soon)
          </h2>
        </div>

        <div className="space-y-4 mb-8" style={{ maxWidth: '720px' }}>
          <p className="text-slate-700 leading-relaxed">
            Ever wish you could ask your algorithm why it showed you what it showed you? This feature will let you ask questions about patterns in your feed using your scans as context. Join the waitlist to get access when it launches.
          </p>
        </div>

        <div
          className="mt-10 rounded-2xl"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            padding: 'clamp(1.5rem, 3vw, 2rem)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
        >
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="w-full sm:flex-1">
              <input
                id="talk-waitlist-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                disabled={status === 'success'}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="you@domain.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: status === 'success' ? '#F8FAFC' : '#FFFFFF',
                  border: emailError ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid rgba(148, 163, 184, 0.35)',
                  boxShadow: emailError ? '0 0 0 3px rgba(244, 63, 94, 0.06)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
              />
              <div className="mt-2 min-h-[18px]">
                {emailError ? (
                  <p className="text-xs" style={{ color: 'rgba(225, 29, 72, 0.85)' }}>
                    {emailError}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    We will email you when it is ready.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all w-full sm:w-auto hover:shadow-md"
              style={{
                background: status === 'success' ? 'rgba(16, 185, 129, 0.12)' : '#10B981',
                color: status === 'success' ? 'rgba(5, 150, 105, 0.95)' : '#FFFFFF',
                border: status === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : 'none',
                opacity: status === 'submitting' ? 0.9 : 1,
                height: '42px', // Match input height
              }}
            >
              {status === 'success' ? "You're on the list" : status === 'submitting' ? 'Saving…' : 'Join waitlist'}
            </button>
          </form>

          {message && (
            <div className="mt-4">
              <p
                className="text-sm"
                style={{
                  color: status === 'success' ? 'rgba(5, 150, 105, 0.95)' : 'rgba(225, 29, 72, 0.85)',
                }}
              >
                {message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  // PHASE 6A: Political leaning toggle state (default OFF)
  // Slice 2: Hero evidence expansion state (per-tab + per-hero-view)
  const [heroEvidenceExpanded, setHeroEvidenceExpanded] = useState({});
  
  // Premium gating placeholder, wire to real auth later
  const isPremiumUser = false;

  // User tier (hardcoded for now, will be wired to real auth later)
  const userTier = 'free';

  // Global filter state (for premium users)
  const [platformFilter, setPlatformFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  
  // Date filter preset state
  const [datePreset, setDatePreset] = useState('all');

  // Reset date preset to valid option for free users
  useEffect(() => {
    if (userTier === 'free') {
      const allowedPresets = ['today', 'all'];
      if (!allowedPresets.includes(datePreset)) {
        // Reset to 'all' if current preset is not allowed
        setDatePreset('all');
        setDateRange({ startDate: '', endDate: '' });
      }
    }
  }, [userTier, datePreset]);

  // Helper function to compute date ranges from presets
  const computeDateRangeFromPreset = (preset) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const endDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

    if (preset === 'all') {
      return { startDate: '', endDate: '' };
    }

    if (preset === 'today') {
      // Today only - start and end date are both today
      return { startDate: endDate, endDate: endDate };
    }

    const startDate = new Date(today);
    if (preset === '7days') {
      startDate.setDate(today.getDate() - 6); // Last 7 days (today + 6 previous)
    } else if (preset === '30days') {
      startDate.setDate(today.getDate() - 29); // Last 30 days (today + 29 previous)
    } else if (preset === '90days') {
      startDate.setDate(today.getDate() - 89); // Last 90 days (today + 89 previous)
    } else {
      return { startDate: '', endDate: '' };
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate,
    };
  };
  
  // Handle preset change
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset === 'custom') {
      // Keep existing custom dates, don't clear them
      return;
    }
    const range = computeDateRangeFromPreset(preset);
    setDateRange(range);
  };
  
  // Derived: check if any filters are active
  // For custom date range, only count as active if both dates are present
  const dateFilterActive = datePreset === 'custom' 
    ? (dateRange.startDate !== '' && dateRange.endDate !== '' && new Date(dateRange.startDate) <= new Date(dateRange.endDate))
    : (dateRange.startDate !== '' || dateRange.endDate !== '');
  const filtersActive = platformFilter !== 'all' || dateFilterActive;
  
  // Reset filters function
  const resetFilters = () => {
    setPlatformFilter('all');
    setDateRange({ startDate: '', endDate: '' });
    setDatePreset('all');
  };
  
  // Active filters object (ready for future integration with data helpers)
  // For custom date range, only include dates if both are present and valid
  const activeFilters = {
    platform: platformFilter,
    startDate: (datePreset === 'custom' && (!dateRange.startDate || !dateRange.endDate || new Date(dateRange.startDate) > new Date(dateRange.endDate)))
      ? ''
      : dateRange.startDate,
    endDate: (datePreset === 'custom' && (!dateRange.startDate || !dateRange.endDate || new Date(dateRange.startDate) > new Date(dateRange.endDate)))
      ? ''
      : dateRange.endDate,
  };

  // Check for demo mode via ?demo=1 query parameter
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';

  // Generate demo data only once (memoized to avoid re-creating on every render)
  const demoData = useMemo(() => {
    if (isDemoMode) {
      return generateDemoData();
    }
    return null;
  }, [isDemoMode]);

  // Use real data hook (skip fetch in demo mode to prevent CORS errors)
  const realData = useDashboardData(
    !isDemoMode && filtersActive
      ? { filters: activeFilters, skipFetch: isDemoMode }
      : { skipFetch: isDemoMode }
  );

  // Select data source based on mode
  const {
    scans,
    scanDetails,
    loading,
    error,
    fetchScans,
    fetchAllScanDetails,
    hasScans,
    platforms,
    totalScanCount,
    unfilteredScanCount,
  } = isDemoMode ? demoData : realData;

  // Calculate remaining scans for free tier quota
  const remainingScans = Math.max(0, 5 - scans.length);

  // Track which scan details we've loaded
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);

  // Load scan details when scans are available
  useEffect(() => {
    const loadDetails = async () => {
      if (scans.length > 0 && !detailsLoaded && !detailsLoading) {
        setDetailsLoading(true);
        await fetchAllScanDetails(scans);
        setDetailsLoading(false);
        setDetailsLoaded(true);
      }
    };
    loadDetails();
  }, [scans, detailsLoaded, detailsLoading, fetchAllScanDetails]);

  // Master count computation - single source of truth for all tabs
  const masterCounts = useMemo(() => {
    if (!scans || scans.length === 0 || !scanDetails) {
      return {
        scanCount: 0,
        platformCount: 0,
        postCount: 0,
      };
    }

    let totalPosts = 0;
    const platformSet = new Set();

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (detail) {
        const data = detail.result || detail.scan || detail;
        const items = data?.feed_items || [];
        totalPosts += items.length;
      }
      if (scan.platform) {
        platformSet.add(scan.platform.toLowerCase());
      }
    }

    return {
      scanCount: totalScanCount || 0,
      platformCount: platformSet.size,
      postCount: totalPosts,
    };
  }, [scans, scanDetails, totalScanCount]);

  // Get views for current tab - Phase 4B: Memoized to prevent unnecessary re-renders
  const currentViews = useMemo(() => getViewsForTab(activeTab), [activeTab]);

  // Compute data for all views in current tab
  const viewDataResults = useMemo(() => {
    if (!detailsLoaded) return {};

    const results = {};
    for (const view of currentViews) {
      const dataFn = dataHelpers[view.dataFn];
      if (typeof dataFn === 'function') {
        try {
          results[view.id] = dataFn(scans, scanDetails);
          // Ensure result has required structure
          if (!results[view.id] || typeof results[view.id] !== 'object') {
            results[view.id] = { hasData: false, data: null, missing: 'Invalid data structure.' };
          } else if (results[view.id].hasData === undefined) {
            // If hasData is missing, assume false for safety
            results[view.id] = { ...results[view.id], hasData: false };
          }
        } catch (err) {
          console.error(`Error computing data for ${view.id}:`, err, err.stack);
          results[view.id] = { hasData: false, data: null, missing: 'Error loading data.' };
        }
      } else {
        results[view.id] = { hasData: false, data: null, missing: 'Data function not found.' };
      }
    }
    return results;
  }, [currentViews, scans, scanDetails, detailsLoaded]);

  // Slice 2: Deterministic hero view selection for the active tab
  const heroViewId = HERO_VIEW_ID_BY_TAB[activeTab];
  const heroView =
    currentViews.find((v) => v.id === heroViewId) ||
    currentViews.find((v) => v.hero === true) ||
    null;
  const resolvedHeroViewId = heroView?.id || heroViewId;
  const heroDataResult = resolvedHeroViewId ? viewDataResults[resolvedHeroViewId] : null;

  const heroEvidenceKey = `${activeTab}:${resolvedHeroViewId || 'unknown'}`;
  const isHeroEvidenceExpanded = heroEvidenceExpanded[heroEvidenceKey] === true;
  const toggleHeroEvidence = () => {
    setHeroEvidenceExpanded((prev) => {
      // Fix null/undefined handling to prevent crashes
      if (!prev || typeof prev !== 'object') {
        return { [heroEvidenceKey]: true };
      }
      if (!heroEvidenceKey || typeof heroEvidenceKey !== 'string') {
        return prev;
      }
      return {
        ...prev,
        [heroEvidenceKey]: !prev[heroEvidenceKey],
      };
    });
  };

  const formatDateRange = (start, end) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate) || Number.isNaN(endDate)) return null;
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    const baseOptions = { month: 'short', day: 'numeric' };
    const startText = startDate.toLocaleDateString('en-US', sameYear ? baseOptions : { ...baseOptions, year: 'numeric' });
    const endText = endDate.toLocaleDateString('en-US', { ...baseOptions, year: 'numeric' });
    return `${startText} – ${endText}`;
  };

  // FIX X2/A2: Remove specific scan counts to avoid contradictory numbers across views
  // Each view has different scansUsed counts based on data availability, which creates trust issues
  // Solution: Prefer date ranges, fall back to generic "window" language without specific counts
  const deriveWindowLabel = (start, end, scansUsed) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (!Number.isNaN(startDate) && !Number.isNaN(endDate)) {
        const diffDays = Math.max(0, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
        if (diffDays >= 5 && diffDays <= 9) {
          return 'In the past 7 days';
        }
        const rangeText = formatDateRange(start, end);
        if (rangeText) return `During this window (${rangeText})`;
      }
    }
    // Avoid showing specific scan counts - they vary per-metric and create confusion
    return 'Based on your recent scans';
  };

  const adsScanWindow = useMemo(() => {
    if (activeTab !== 'ads') return null;
    const windowStart = heroDataResult?.chartQuality?.windowStart;
    const windowEnd = heroDataResult?.chartQuality?.windowEnd;
    const scansUsed = heroDataResult?.scansUsed || heroDataResult?.scansWithData?.length || 0;
    const humanLabel = deriveWindowLabel(windowStart, windowEnd, scansUsed);
    return {
      startDate: windowStart || null,
      endDate: windowEnd || null,
      scansUsed,
      humanLabel,
    };
  }, [activeTab, heroDataResult]);

  const tabScopeLabel = activeTab === 'ads' ? adsScanWindow?.humanLabel : null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page pt-28 pb-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary-blue mx-auto mb-4" />
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    // Check if this is a backend connection error
    const isBackendError = error.includes("Couldn't reach the AlgorithmLens API") || 
                          error.includes("fetch") || 
                          error.includes("Failed to fetch");
    
    return (
      <div className="min-h-screen bg-bg-page pt-24 md:pt-28 pb-16 px-4 md:px-6">
        <div className="max-w-2xl mx-auto px-6">
          <div className={`${isBackendError ? 'bg-slate-50 border border-slate-200' : 'bg-red-50 border border-red-200'} rounded-xl p-8 text-center`}>
            <h2 className={`text-xl font-bold mb-2 ${isBackendError ? 'text-slate-800' : 'text-red-800'}`}>
              {isBackendError ? 'Backend Not Available' : 'Error Loading Dashboard'}
            </h2>
            <p className={`mb-6 ${isBackendError ? 'text-slate-600' : 'text-red-600'}`}>{error}</p>
            <button
              onClick={() => {
                setDetailsLoaded(false);
                fetchScans();
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                isBackendError 
                  ? 'bg-slate-600 text-white hover:bg-slate-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No scans state
  if (!hasScans) {
    return (
      <div className="min-h-screen bg-bg-page pt-24 md:pt-28 pb-16 px-4 md:px-6">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 size={40} className="text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-text-main mb-2">No Scans Yet</h1>
            <p className="text-text-muted mb-8 max-w-md mx-auto">
              Run your first scan to see insights about your social media feeds.
              The dashboard will populate as you scan different platforms.
            </p>
            <Link
              to="/start"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Your First Scan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if on Algorithm tab for reduced header
  const isOnAlgorithmTab = activeTab === 'algorithm';

  return (
    <div className="bg-bg-page pt-24 md:pt-28 pb-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto px-6">
        {/* Page Header - reduced on Algorithm tab to let hero be the star */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${isOnAlgorithmTab ? 'mb-4' : 'mb-8'}`}>
          <div>
            {/* Smaller title on Algorithm tab */}
            <h1 className={`font-bold text-text-main ${isOnAlgorithmTab ? 'text-xl mb-1' : 'text-3xl mb-2'}`}>
              Dashboard
            </h1>
            {/* Hide subtitle on Algorithm tab - hero has this info */}
            {!isOnAlgorithmTab && (
              <div>
                <p className="text-text-muted">
                  Explore insights from your scans.
                </p>
                {/* Filter status line */}
                {filtersActive && totalScanCount !== unfilteredScanCount && (
                  <p className="text-xs text-slate-500 mt-1">
                    Showing {totalScanCount} of {unfilteredScanCount} scans.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="date-preset" className="text-sm text-text-muted whitespace-nowrap">
                Date range:
              </label>
              <select
                id="date-preset"
                value={datePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-text-main hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              >
                <option value="today">Today</option>
                <option value="all">All time</option>
                <option value="7days" disabled={userTier === 'free'}>
                  Last 7 days{userTier === 'free' ? ' (Premium)' : ''}
                </option>
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

            {/* Premium hint for free users */}
            {userTier === 'free' && (
              <span className="text-xs text-slate-500">
                Upgrade to Premium to unlock 7, 30, 90-day and custom date ranges.
              </span>
            )}

            {/* Custom date inputs (shown when Custom is selected) */}
            {datePreset === 'custom' && userTier !== 'free' && (
              <div className="flex items-center gap-2">
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
                {/* Validation messages */}
                {datePreset === 'custom' && (!dateRange.startDate || !dateRange.endDate) && (
                  <span className="text-xs text-slate-500 whitespace-nowrap">Select both dates to apply.</span>
                )}
                {datePreset === 'custom' && dateRange.startDate && dateRange.endDate && new Date(dateRange.startDate) > new Date(dateRange.endDate) && (
                  <span className="text-xs text-red-500 whitespace-nowrap">Start date must be on or before end date.</span>
                )}
              </div>
            )}

            {/* Free tier quota display */}
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
                  // Guard: prevent any action if quota exhausted
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
                  // Guard: double-check quota even if DOM is manipulated
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

        {/* Premium Filters Bar */}
        {isPremiumUser && (
          <PremiumFiltersBar
            platformFilter={platformFilter}
            setPlatformFilter={setPlatformFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            filtersActive={filtersActive}
            resetFilters={resetFilters}
          />
        )}

        {/* Tab Navigation - Part 1 Rule A: All tabs use BLUE theme */}
        <div className={`border-b border-border-card ${isOnAlgorithmTab ? 'mb-6' : 'mb-8'}`}>
          <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Dashboard tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                  border-b-2 -mb-px
                  ${activeTab === tab.id
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-text-muted hover:text-text-main hover:border-border-card'
                  }
                `}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Loading details indicator */}
        {detailsLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 text-text-muted">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading scan details...</span>
          </div>
        )}

        {/* Global orientation - Phase 8: Removed, less clutter */}

        {/* Tab Content */}
        <div className="mb-8" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'talk' ? (
            <TalkTabPanel />
          ) : activeTab === 'overview' ? (
            <OverviewTab scans={scans} scanDetails={scanDetails} />
          ) : activeTab === 'sources' ? (
            <SourcesTab scans={scans} scanDetails={scanDetails} />
          ) : activeTab === 'ads' ? (
            <AdsTab scans={scans} scanDetails={scanDetails} />
          ) : activeTab === 'politics' ? (
            <PoliticsTab scans={scans} scanDetails={scanDetails} />
          ) : activeTab === 'tone' ? (
            <ToneTab scans={scans} scanDetails={scanDetails} />
          ) : activeTab === 'suggested_vs_followed' ? (
            <SuggestedVsFollowedTab scans={scans} scanDetails={scanDetails} />
          ) : (
            <>
              {/* Feature Moment - Editorial centerpiece for ALL tabs (Part 2: Design System Application) */}
              <FeatureMomentWrapper>
                {/* Editorial Hero - Insight first, expandable evidence (Slice 2) */}
                <TabHero
                  tabId={activeTab}
                  scans={scans}
                  platforms={platforms}
                  heroView={heroView}
                  heroDataResult={heroDataResult}
                  isEvidenceExpanded={isHeroEvidenceExpanded}
                  onToggleEvidence={toggleHeroEvidence}
                  scopeLabel={tabScopeLabel}
                  totalScanCount={totalScanCount}
                />
              </FeatureMomentWrapper>

              {/* Second Visual Anchor - Chapter opener - NOW for ALL tabs */}
              <SecondVisualAnchor
                tabId={activeTab}
                className={
                  activeTab === 'politics'
                    ? 'mt-1 mb-8'
                    : activeTab === 'ads'
                      ? 'mt-10'
                      : ''
                }
              />

              {/* Views Grid with enforced section structure - ReadingColumnWrapper for ALL tabs */}
              <ReadingColumnWrapper>
                {detailsLoading ? (
                  // Phase 4A: Skeleton loading states
                  <div className="space-y-10">
                    {/* Primary card skeleton */}
                    <section>
                      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid rgba(148, 163, 184, 0.8)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)' }}>
                        <div className="p-7 md:p-9">
                          <div className="h-8 bg-slate-200 rounded w-3/4 mb-4 animate-pulse" />
                          <div className="h-4 bg-slate-200 rounded w-full mb-2 animate-pulse" />
                          <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse" />
                        </div>
                      </div>
                    </section>
                    {/* Secondary cards skeleton */}
                    <section>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[1, 2].map((i) => (
                          <div key={i} className="rounded-xl p-4" style={{ background: 'white', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
                            <div className="h-5 bg-slate-200 rounded w-2/3 mb-3 animate-pulse" />
                            <div className="h-4 bg-slate-200 rounded w-full mb-2 animate-pulse" />
                            <div className="h-4 bg-slate-200 rounded w-4/5 animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <ViewsGridWithCollapsing
                    views={currentViews}
                    viewDataResults={viewDataResults}
                    scanCount={0}
                    platformCount={0}
                    tabName={TABS.find((t) => t.id === activeTab)?.label || 'insights'}
                    tabId={activeTab}
                    heroViewId={resolvedHeroViewId}
                    scopeLabel={tabScopeLabel}
                  />
                )}
              </ReadingColumnWrapper>
            </>
          )}
        </div>

        {/* Master count line - single source of truth per tab */}
        {/* Exclude all 6 locked-spec tabs (overview, sources, ads, politics, tone, suggested_vs_followed) and talk tab - they have their own MasterNumbersLine */}
        {activeTab !== 'talk' && activeTab !== 'overview' && activeTab !== 'sources' && activeTab !== 'ads' && activeTab !== 'politics' && activeTab !== 'tone' && activeTab !== 'suggested_vs_followed' && (
          <div className="mt-8 mb-4 text-center">
            {masterCounts.postCount > 0 ? (
              <p className="text-sm text-slate-500">
                Based on {masterCounts.scanCount} scan{masterCounts.scanCount !== 1 ? 's' : ''} across {masterCounts.platformCount} platform{masterCounts.platformCount !== 1 ? 's' : ''} and {masterCounts.postCount.toLocaleString()} posts.
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Based on the selected date range, no posts were available for this tab.
              </p>
            )}
          </div>
        )}

        {/* Phase 8: Minimal footer - Softer, less competing */}
        <div className="text-center py-6 mt-8">
          <p
            className="text-[11px] italic"
            style={{ color: 'rgba(148, 163, 184, 0.7)' }}
          >
            These insights show patterns in what you're shown, not who you are.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
