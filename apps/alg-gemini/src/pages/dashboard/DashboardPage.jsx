import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw, BarChart3, Clock, Globe, Database, Info, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Compass, RefreshCcw, Lock, Sparkles, ExternalLink, ShieldCheck, MessageSquare, EyeOff } from 'lucide-react';
import { TABS, getViewsForTab, getVisibleViewCount, EMPTY_STATE_TYPES, TAB_TRUST_SENTENCES } from './dashboardCatalog';
import ViewCard from '../../components/dashboard/ViewCard';
import TalkToAlgorithmSection from '../../components/dashboard/TalkToAlgorithmSection';
import { useDashboardData } from '../../lib/dashboard/useDashboardData';
import * as dataHelpers from '../../lib/dashboard/dataHelpers';

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
const DataCoverageBar = ({ scans, scanDetails, tabId }) => {
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
      scanCount: scans.length,
      platformCount: platformSet.size,
      platforms: Array.from(platformSet),
      totalItems,
    };
  }, [scans, scanDetails]);

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
 * PoliticalLeaningToggle - Opt-in toggle for political leaning estimates
 * PHASE 6A: Political leaning requires explicit opt-in
 * UI Refoundation: Uses green accent (politics tab semantic color lane)
 */
const PoliticalLeaningToggle = ({ enabled, onToggle }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-lg border border-amber-100">
    <Info size={16} className="text-amber-600 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm text-amber-800">
        <span className="font-medium">Political leaning estimates</span> use keyword matching and are LOW confidence.
      </p>
      <p className="text-xs text-amber-600 mt-0.5">
        These are rough estimates, not facts about content or creators.
      </p>
    </div>
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
      style={{
        backgroundColor: enabled ? '#10B981' : '#E5E7EB',
        color: enabled ? 'white' : '#64748B',
      }}
    >
      {enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
      {enabled ? 'Enabled' : 'Enable'}
    </button>
  </div>
);

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
      title: 'What appeared in this scan',
      subtext: 'Topics that showed up most often in this scroll session.',
    },
    details: {
      label: 'Context',
      title: 'How content clustered',
      subtext: 'We cannot know why — only what appeared together.',
    },
    moreDetails: {
      label: 'Speculation',
      title: 'What might continue (uncertain)',
      subtext: 'If these topics recur, you may see more of them. We cannot predict.',
    },
    summary: {
      label: 'Experiments',
      title: 'What you could try',
      subtext: 'Optional actions to see if content shifts. Results may vary.',
    },
  },
  ads: {
    keyInsight: {
      label: 'Observed',
      title: 'Promotional content in this scan',
      subtext: 'Posts labeled as ads or sponsored by the platform.',
    },
    details: {
      label: 'Context',
      title: 'Ad sources and categories',
      subtext: 'We cannot know why these ads appeared — only what showed up.',
    },
    moreDetails: {
      label: 'Speculation',
      title: 'What might continue (uncertain)',
      subtext: 'If similar ads recur, they may continue. We cannot predict.',
    },
    summary: {
      label: 'Experiments',
      title: 'What you could try',
      subtext: 'Optional actions to see if ad patterns shift. Results may vary.',
    },
  },
  politics: {
    keyInsight: {
      label: 'Observed',
      title: 'Political keywords in this scan',
      subtext: 'Content that matched political keyword patterns.',
    },
    details: {
      label: 'Context',
      title: 'Sources of political content',
      subtext: 'Accounts that posted political content in this scan.',
    },
    moreDetails: {
      label: 'Speculation',
      title: 'What might continue (uncertain)',
      subtext: 'If these sources recur, political content may persist. We cannot predict.',
    },
    summary: {
      label: 'Experiments',
      title: 'What you could try',
      subtext: 'Optional actions to see if political balance shifts. Results may vary.',
    },
  },
  patterns: {
    keyInsight: {
      label: 'Observed',
      title: 'Topics in this scan',
      subtext: 'Topics detected in this scroll session.',
    },
    details: {
      label: 'Context',
      title: 'How topics distributed',
      subtext: 'We cannot know why — only what appeared.',
    },
    moreDetails: {
      label: 'Speculation',
      title: 'What might continue (uncertain)',
      subtext: 'If topics recur across scans, they may persist. We cannot predict.',
    },
    summary: {
      label: 'Experiments',
      title: 'What you could try',
      subtext: 'Optional actions to see if variety changes. Results may vary.',
    },
  },
  creators: {
    keyInsight: {
      label: 'Observed',
      title: 'Accounts that appeared',
      subtext: 'Sources that showed up most often in this scan.',
    },
    details: {
      label: 'Context',
      title: 'Source concentration',
      subtext: 'How content was distributed across accounts.',
    },
    moreDetails: {
      label: 'Speculation',
      title: 'What might continue (uncertain)',
      subtext: 'If these sources recur, they may dominate. We cannot predict.',
    },
    summary: {
      label: 'Experiments',
      title: 'What you could try',
      subtext: 'Optional actions to see if source diversity changes. Results may vary.',
    },
  },
};

// Legacy alias for backward compatibility
const ALGORITHM_TAB_HEADERS = TAB_STORY_HEADERS.algorithm;

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
const ViewsGridWithCollapsing = ({ views, viewDataResults, scanCount, platformCount, tabName, tabId }) => {
  // Get story-driven headers for current tab (all tabs now use them)
  const tabHeaders = TAB_STORY_HEADERS[tabId] || TAB_STORY_HEADERS.algorithm;
  // Check if we're on the Algorithm tab for special two-column layout
  const isAlgorithmTab = tabId === 'algorithm';
  // All tabs now use story-driven structure
  const useStoryStructure = true;

  // Track which sections are expanded
  // Change 3: moreDetails expanded by default on Algorithm tab
  const [expandedSections, setExpandedSections] = useState({
    keyInsightEvidence: false,
    moreDetails: false,
    summaryMore: false,
  });

  // Reset expanded state when tab changes
  useEffect(() => {
    setExpandedSections({
      keyInsightEvidence: false,
      moreDetails: false, // On Algorithm tab, content is always visible, not dependent on this state
      summaryMore: false,
    });
  }, [tabId]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Group views by sortOrder AND data availability
  const groupedViews = {
    primary: { withData: [], collapsed: [] },
    supporting: { withData: [], collapsed: [] },
    summary: { withData: [] },
  };

  views.forEach((view) => {
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
  const secondaryCards = groupedViews.supporting.withData.slice(0, 2);
  const collapsedCards = [
    ...groupedViews.primary.collapsed,
    ...groupedViews.supporting.collapsed,
    ...groupedViews.supporting.withData.slice(2),
  ];
  const summaryCards = groupedViews.summary.withData;

  // Check if sections have content
  const hasPrimaryContent = primaryCards.length > 0;
  const hasSecondaryContent = secondaryCards.length > 0;
  const hasCollapsedContent = collapsedCards.length > 0;
  const hasSummaryContent = summaryCards.length > 0;

  // Wrapper for chapter containers - NOW on ALL tabs (Part 2: Apply design system)
  const MaybeChapter = ({ children, variant = 'default' }) => {
    return <ChapterContainer variant={variant}>{children}</ChapterContainer>;
  };

  return (
    <div className="space-y-10">
      {/* KEY INSIGHT - Part 3 Module Type 1: Declarative + Collapsible Evidence */}
      {hasPrimaryContent && (
        <section>
          <MaybeChapter variant="primary">
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
                const topicsData = viewDataResults?.['algo-topics-liked']?.data || [];
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
                      <span className="text-xs text-slate-400">
                        Based on {scanCount} scan{scanCount !== 1 ? 's' : ''}
                      </span>
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
                          <ViewCard
                            view={view}
                            dataResult={dataResult}
                            scanCount={scanCount}
                            platformCount={platformCount}
                            accentColor="blue"
                            isInline={true}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </MaybeChapter>
        </section>
      )}

      {/* DETAILS - Part 3: Softer backgrounds, headline + takeaway */}
      {hasSecondaryContent && (
        <section>
          <MaybeChapter variant="default">
            {/* All tabs now use story-driven headers */}
            <SectionHeader
              label={tabHeaders.details.label}
              title={tabHeaders.details.title}
              subtext={tabHeaders.details.subtext}
            />
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {secondaryCards.map((view, idx) => {
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
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </MaybeChapter>
        </section>
      )}

      {/* MORE DETAILS - Forecast section */}
      {hasCollapsedContent && (
        <section>
          <MaybeChapter variant="accent">
            {/* All tabs now use story-driven headers */}
            <SectionHeader
              label={tabHeaders.moreDetails.label}
              title={tabHeaders.moreDetails.title}
              subtext={tabHeaders.moreDetails.subtext}
            />

            <div
              className="rounded-xl overflow-hidden mt-5 transition-all duration-200 hover:shadow-md"
              style={{
                background: 'white',
                border: '1px solid #E2E8F0',
              }}
            >
              {/* Content: Always visible now that all tabs have proper headers */}
              <div
                className="px-6 pb-6"
                style={{ paddingTop: '1.5rem' }}
              >
                  {/* Structured Forecast module - now applies to ALL tabs */}
                  <div className="space-y-0">
                      {/* Show up to 3 insights as structured forecast lines with pill labels */}
                      {collapsedCards.slice(0, 3).map((view, idx) => {
                        const dataResult = viewDataResults[view.id];
                        const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                          ? view.takeaway(dataResult?.data)
                          : null;

                        // Forecast label pills with dividers
                        const forecastLabels = [
                          { text: 'Likely next', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
                          { text: 'If this continues', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
                          { text: 'What may shift it', bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
                        ];
                        const label = forecastLabels[idx] || { text: 'Also', bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' };

                        return (
                          <div
                            key={view.id}
                            className="py-5 flex items-start gap-4 transition-colors hover:bg-slate-50/50 -mx-2 px-2 rounded-lg"
                            style={{
                              borderBottom: idx < Math.min(collapsedCards.length, 3) - 1 ? '1px solid #E2E8F0' : 'none',
                            }}
                          >
                            {/* Pill label badge */}
                            <div
                              className="flex-shrink-0 text-[11px] font-semibold rounded-full px-3 py-1"
                              style={{
                                background: label.bg,
                                color: label.color,
                                border: `1px solid ${label.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {label.text}
                            </div>

                            {/* Forecast line text */}
                            <div className="flex-1 pt-0.5">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {takeawayText || view.title}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* "More" link if there are additional insights */}
                      {collapsedCards.length > 3 && (
                        <button
                          onClick={() => toggleSection('moreDetails')}
                          className="text-sm font-medium flex items-center gap-1 mt-3 pt-4 hover:text-blue-700 transition-colors"
                          style={{ color: '#2563EB', borderTop: '1px solid #E2E8F0' }}
                          aria-expanded={expandedSections.moreDetails}
                          aria-label={expandedSections.moreDetails ? 'Collapse additional insights' : `Expand to show ${collapsedCards.length - 3} more insight${collapsedCards.length - 3 === 1 ? '' : 's'}`}
                        >
                          <ChevronDown
                            size={14}
                            className="transition-transform"
                            style={{
                              transform: expandedSections.moreDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                            aria-hidden="true"
                          />
                          {expandedSections.moreDetails
                            ? 'Show less'
                            : `${collapsedCards.length - 3} more insight${collapsedCards.length - 3 === 1 ? '' : 's'}`
                          }
                        </button>
                      )}

                      {/* Show additional insights when expanded */}
                      {expandedSections.moreDetails && collapsedCards.length > 3 && (
                        <div className="pt-2">
                          {collapsedCards.slice(3).map((view) => {
                            const dataResult = viewDataResults[view.id];
                            const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                              ? view.takeaway(dataResult?.data)
                              : null;

                            return (
                              <div
                                key={view.id}
                                className="py-4 flex items-start gap-4"
                                style={{
                                  borderTop: '1px solid #E2E8F0',
                                }}
                              >
                                <div
                                  className="flex-shrink-0 text-[11px] font-semibold rounded-full px-3 py-1"
                                  style={{
                                    background: '#F1F5F9',
                                    color: '#64748B',
                                    border: '1px solid #E2E8F0',
                                  }}
                                >
                                  Also
                                </div>
                                <div className="flex-1 pt-0.5">
                                  <p className="text-sm text-slate-700 leading-relaxed">
                                    {takeawayText || view.title}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                </div>
            </div>
          </MaybeChapter>
        </section>
      )}

      {/* SUMMARY - Calm Closing Chapter with Action Cards */}
      {hasSummaryContent && (
        <section>
          <MaybeChapter variant="default">
            {/* All tabs now use story-driven headers */}
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
                                    {typeof item === 'string' ? item : item.text || item.topic || item}
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
                      {Array.isArray(dataResult?.data) && dataResult.data.length > 3 && (
                        <button
                          onClick={() => toggleSection('summaryMore')}
                          className="mt-5 text-sm font-medium flex items-center gap-1 hover:text-blue-700 transition-colors"
                          style={{ color: '#2563EB' }}
                          aria-expanded={expandedSections.summaryMore}
                          aria-label={expandedSections.summaryMore ? 'Collapse additional ideas' : `Expand to show ${dataResult.data.length - 3} more ideas`}
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
                            : `More ideas (${dataResult.data.length - 3} more)`
                          }
                        </button>
                      )}

                      {expandedSections.summaryMore && Array.isArray(dataResult?.data) && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                          {dataResult.data.slice(3).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm text-slate-500">
                              <span className="text-slate-300">•</span>
                              <span>{typeof item === 'string' ? item : item.text || item.topic || item}</span>
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
                        <span className="font-medium text-slate-700">Remember:</span> small shifts matter. This is about awareness, not blame—your feed is shaped by invisible systems, and even gentle changes can make a difference over time.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </MaybeChapter>
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
 * AlgorithmTabHero - Summary for "Observed Patterns" tab
 *
 * ACCURACY CONTRACT COMPLIANT:
 * - No claims about what algorithm "thinks"
 * - All language anchored to "this scan"
 * - No identity claims or preference inference
 * - Explicit uncertainty where appropriate
 */
const AlgorithmTabHero = ({ scans, viewDataResults }) => {
  // Get top topics from the primary view data
  const topicsData = viewDataResults?.['algo-topics-liked']?.data || [];
  const topTopic = topicsData[0]?.topic || 'certain topics';
  const secondTopic = topicsData[1]?.topic || '';
  const topicCount = topicsData.length || 0;

  // Get profile breadth
  const breadthData = viewDataResults?.['algo-profile-breadth']?.data;
  const breadth = breadthData?.breadth?.toLowerCase() || 'moderate';

  const scanCount = scans?.length || 0;
  const platformCount = scans?.length > 0
    ? [...new Set(scans.map(s => s.platform))].length
    : 0;

  // Highlighted emphasis word component with subtle underline effect
  const EmphasisWord = ({ children }) => (
    <span
      className="relative inline-block"
      style={{
        color: '#1D4ED8',
        background: 'linear-gradient(180deg, transparent 60%, rgba(37, 99, 235, 0.12) 60%)',
        paddingLeft: '0.125rem',
        paddingRight: '0.125rem',
      }}
    >
      {children}
    </span>
  );

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
        {/* Subtle decorative gradient overlay at top-left */}
        <div
          className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at top left, rgba(37, 99, 235, 0.08) 0%, transparent 60%)',
          }}
        />

        {/* Hero Header Row - self-contained label + meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative">
          {/* Left: Editorial kicker label - grounded in observation */}
          <p
            style={{
              fontSize: '11px',
              color: '#2563EB',
              letterSpacing: '0.14em',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Observed patterns in this scan
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
            <span>{scanCount} scan{scanCount !== 1 ? 's' : ''} · {platformCount} platform{platformCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Main headline - grounded in observation, not identity */}
        <div
          className="relative mb-6"
          style={{
            marginLeft: '-1rem',
            paddingLeft: '1rem',
          }}
        >
          {/* Blue accent bar - slightly thicker */}
          <div
            className="absolute left-0 top-0 bottom-0 rounded-r-lg"
            style={{
              width: '6px',
              background: 'linear-gradient(180deg, #2563EB 0%, #60A5FA 100%)',
            }}
          />
          {/* Main headline - observation-based */}
          <h2
            className="font-extrabold text-slate-900"
            style={{
              fontFamily: 'var(--font-headline, system-ui)',
              letterSpacing: '-0.035em',
              fontSize: 'clamp(2rem, 5.5vw, 3rem)',
              lineHeight: 1.15,
              maxWidth: '100%',
            }}
          >
            In this scan, <EmphasisWord>{topTopic}</EmphasisWord>
            {secondTopic && (
              <>
                {' '}and <EmphasisWord>{secondTopic}</EmphasisWord>
              </>
            )}
            {' '}appeared most often.
          </h2>
        </div>

        {/* Supporting context - explicit epistemic limits */}
        <p
          className="text-slate-600 mb-5"
          style={{
            fontSize: '17px',
            lineHeight: 1.75,
            maxWidth: '680px',
          }}
        >
          This is what showed up when we captured this scroll session.
          We cannot know why these topics appeared or how platforms categorize you.
        </p>

        {/* Lede line - grounded */}
        <p
          className="text-slate-500 italic"
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            maxWidth: '600px',
          }}
        >
          Below: what we observed, possible context, and experiments you could try.
        </p>
      </div>

      {/* Two supporting context cards - OBSERVATION-BASED */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        {/* Topic breadth card */}
        <div
          className="rounded-xl relative overflow-hidden transition-all duration-200 hover:border-slate-400 hover:shadow-md group"
          style={{
            background: SURFACES.SUPPORT_WHITE.background,
            border: SURFACES.SUPPORT_WHITE.border,
            boxShadow: SURFACES.SUPPORT_WHITE.shadow,
            padding: 'clamp(1.75rem, 3vw, 2.25rem)',
            minHeight: '140px',
          }}
        >
          {/* Strong blue left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
            style={{ background: 'linear-gradient(180deg, #2563EB 0%, #3B82F6 100%)' }}
          />
          <div className="pl-5">
            {/* Icon badge + title row */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                }}
              >
                <Compass size={16} className="text-blue-600" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Topic breadth</h4>
            </div>
            {/* Takeaway line - observation-based */}
            <p className="text-sm font-medium text-slate-700 mb-2">
              In this scan, topic variety appeared <span className="font-semibold text-blue-700">{breadth}</span>.
            </p>
            {/* Explanation - muted */}
            <p className="text-sm text-slate-500 leading-relaxed">
              {breadth === 'narrow'
                ? 'A few topics dominated this scan. Other scans may differ.'
                : breadth === 'broad'
                ? 'A wide range of topics appeared in this scan.'
                : 'Topics were moderately distributed in this scan.'}
            </p>
          </div>
        </div>

        {/* What we cannot know card */}
        <div
          className="rounded-xl relative overflow-hidden transition-all duration-200 hover:border-slate-400 hover:shadow-md group"
          style={{
            background: SURFACES.SUPPORT_WHITE.background,
            border: SURFACES.SUPPORT_WHITE.border,
            boxShadow: SURFACES.SUPPORT_WHITE.shadow,
            padding: 'clamp(1.75rem, 3vw, 2.25rem)',
            minHeight: '140px',
          }}
        >
          {/* Strong blue left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
            style={{ background: 'linear-gradient(180deg, #2563EB 0%, #3B82F6 100%)' }}
          />
          <div className="pl-5">
            {/* Icon badge + title row */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                }}
              >
                <ShieldCheck size={16} className="text-blue-600" />
              </div>
              <h4 className="text-base font-bold text-slate-800">What we cannot know</h4>
            </div>
            {/* Explicit limits */}
            <p className="text-sm font-medium text-slate-700 mb-2">
              Why this content appeared, or how you interacted with it.
            </p>
            {/* Explanation - muted */}
            <p className="text-sm text-slate-500 leading-relaxed">
              We see what showed up, not why. Platform algorithms are opaque. This scan is one snapshot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


/**
 * TAB_HERO_CONFIG - Configuration for each tab's hero section
 * ACCURACY CONTRACT COMPLIANT:
 * - All language anchored to "this scan"
 * - No claims about platform intent or user identity
 * - Explicit epistemic limits
 */
const TAB_HERO_CONFIG = {
  ads: {
    kicker: 'Promotional content observed',
    getHeadline: (data) => {
      const pct = data?.['ads-percentage']?.data?.currentPercent;
      const total = data?.['ads-percentage']?.data?.totalPosts || 0;
      if (pct === undefined) return "In this scan, we detected promotional content.";
      if (pct < 10) return `In this scan, approximately ${pct}% of posts were labeled as ads.`;
      if (pct < 25) return `In this scan, roughly 1 in ${Math.round(100/pct)} posts was labeled as an ad.`;
      return `In this scan, a substantial portion (~${pct}%) was labeled as ads.`;
    },
    interpretation: "These are posts the platform explicitly labeled as ads or sponsored. We cannot know why these ads were shown to you.",
    lede: "Below: what promotional content appeared, the categories observed, and experiments you could try.",
    supportCards: [
      {
        icon: 'target',
        title: 'Ad source diversity',
        getContent: (data) => {
          const concentration = data?.['ads-concentration']?.data?.qualitativeLabel;
          return concentration
            ? `In this scan, ad source diversity: ${concentration.toLowerCase()}.`
            : 'We counted unique advertisers in this scan.';
        },
        explanation: 'We cannot know why specific advertisers appeared.',
      },
      {
        icon: 'repeat',
        title: 'Product categories',
        getContent: (data) => {
          const products = data?.['ads-products']?.data;
          if (products?.length > 0) return `${products[0].name} appeared frequently in ads in this scan.`;
          return 'We detected product categories in labeled ads.';
        },
        explanation: 'Categories observed in ads — does not indicate your interests.',
      },
    ],
  },
  politics: {
    kicker: 'Political content observed',
    getHeadline: (data) => {
      const pct = data?.['politics-share']?.data?.currentPercent;
      if (pct === undefined) return "In this scan, we detected content matching political keywords.";
      if (pct < 10) return `In this scan, approximately ${pct}% matched political keywords.`;
      if (pct < 30) return `In this scan, roughly 1 in ${Math.round(100/pct)} posts matched political keywords.`;
      return `In this scan, a substantial portion (~${pct}%) matched political keywords.`;
    },
    interpretation: "Political classification uses keyword matching. We cannot know what you believe or support — only what appeared.",
    lede: "Below: political keywords detected, sources observed, and experiments you could try.",
    supportCards: [
      {
        icon: 'scale',
        title: 'Keyword balance (low confidence)',
        getContent: (data) => {
          const balance = data?.['politics-balance']?.data?.message;
          return balance ? `${balance} (Low confidence estimate.)` : 'Keyword balance was measured using simple matching.';
        },
        explanation: 'Simple keyword matching — cannot detect nuance or irony.',
      },
      {
        icon: 'users',
        title: 'Political content sources',
        getContent: (data) => {
          const creators = data?.['politics-creators']?.data;
          if (creators?.length > 0) return `In this scan, political content came from ${Math.min(creators.length, 5)} accounts.`;
          return 'We counted accounts that posted political content in this scan.';
        },
        explanation: 'Accounts that posted political keywords in this scan.',
      },
    ],
  },
  patterns: {
    kicker: 'Topic distribution observed',
    getHeadline: (data) => {
      const variety = data?.['patterns-topic-variety']?.data;
      const top = variety?.topTopics?.[0]?.label;
      if (top) return `In this scan, ${top} appeared most often.`;
      return "In this scan, we observed topic distribution.";
    },
    interpretation: "These are topics detected in this scroll session. We cannot know why they appeared or what you prefer.",
    lede: "Below: topics observed, concentration levels, and experiments you could try.",
    supportCards: [
      {
        icon: 'layers',
        title: 'Topic concentration',
        getContent: (data) => {
          const echo = data?.['patterns-echo-risk']?.data?.riskLevel;
          return echo ? `In this scan: ${echo}` : 'We measured how topics were distributed in this scan.';
        },
        explanation: 'Measures topic spread in this scan only.',
      },
      {
        icon: 'activity',
        title: 'What we cannot know',
        getContent: (data) => {
          return 'Why these topics appeared, or how they compare to other sessions.';
        },
        explanation: 'One scan is one snapshot. Other sessions may differ.',
      },
    ],
  },
  creators: {
    kicker: 'Sources observed',
    getHeadline: (data) => {
      const top = data?.['creators-top']?.data?.[0]?.creator;
      if (top) return `In this scan, ${top} appeared most often.`;
      return "In this scan, we observed account distribution.";
    },
    interpretation: "These are accounts that appeared in this scroll session. We cannot know why they were shown.",
    lede: "Below: sources observed, concentration levels, and experiments you could try.",
    supportCards: [
      {
        icon: 'users',
        title: 'Source concentration',
        getContent: (data) => {
          const concentration = data?.['creators-concentration']?.data?.qualitativeLabel;
          return concentration ? `In this scan: ${concentration}` : 'We measured source distribution in this scan.';
        },
        explanation: 'How content was distributed across accounts.',
      },
      {
        icon: 'shuffle',
        title: 'Source diversity',
        getContent: (data) => {
          const diversity = data?.['creators-voice-diversity']?.data?.diversity;
          if (diversity === 'Low') return "In this scan, a narrow set of accounts appeared.";
          if (diversity === 'High') return "In this scan, a wide range of accounts appeared.";
          return 'Source diversity was moderate in this scan.';
        },
        explanation: 'Counted unique accounts in this scan.',
      },
    ],
  },
};

/**
 * GenericTabHero - Hero component for non-algorithm tabs
 * Follows the same structure as AlgorithmTabHero
 * Part 2: Apply design system to all tabs
 */
const GenericTabHero = ({ tabId, scans, viewDataResults }) => {
  const config = TAB_HERO_CONFIG[tabId];
  if (!config) return null;

  const scanCount = scans?.length || 0;
  const platformCount = scans?.length > 0
    ? [...new Set(scans.map(s => s.platform))].length
    : 0;

  const headline = config.getHeadline(viewDataResults);

  // Icon mapping for support cards
  const iconMap = {
    target: <Compass size={16} className="text-blue-600" />,
    repeat: <RefreshCcw size={16} className="text-blue-600" />,
    scale: <Database size={16} className="text-blue-600" />,
    users: <Globe size={16} className="text-blue-600" />,
    layers: <BarChart3 size={16} className="text-blue-600" />,
    activity: <Clock size={16} className="text-blue-600" />,
    shuffle: <RefreshCw size={16} className="text-blue-600" />,
  };

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
              color: '#2563EB',
              letterSpacing: '0.14em',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {config.kicker}
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
            <span>{scanCount} scan{scanCount !== 1 ? 's' : ''} · {platformCount} platform{platformCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Main headline */}
        <div
          className="relative mb-6"
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
            className="font-extrabold text-slate-900"
            style={{
              fontFamily: 'var(--font-headline, system-ui)',
              letterSpacing: '-0.035em',
              fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
              lineHeight: 1.2,
              maxWidth: '100%',
            }}
          >
            {headline}
          </h2>
        </div>

        {/* Supporting interpretation */}
        <p
          className="text-slate-600 mb-5"
          style={{
            fontSize: '17px',
            lineHeight: 1.75,
            maxWidth: '680px',
          }}
        >
          {config.interpretation}
        </p>

        {/* Lede line */}
        <p
          className="text-slate-500 italic"
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            maxWidth: '600px',
          }}
        >
          {config.lede}
        </p>
      </div>

      {/* Two supporting context cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        {config.supportCards.map((card, idx) => (
          <div
            key={idx}
            className="rounded-xl relative overflow-hidden transition-all duration-200 hover:border-slate-400 hover:shadow-md group"
            style={{
              background: SURFACES.SUPPORT_WHITE.background,
              border: SURFACES.SUPPORT_WHITE.border,
              boxShadow: SURFACES.SUPPORT_WHITE.shadow,
              padding: 'clamp(1.75rem, 3vw, 2.25rem)',
              minHeight: '140px',
            }}
          >
            {/* Strong blue left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
              style={{ background: 'linear-gradient(180deg, #2563EB 0%, #3B82F6 100%)' }}
            />
            <div className="pl-5">
              {/* Icon badge + title row */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(37, 99, 235, 0.1)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                  }}
                >
                  {iconMap[card.icon] || <Info size={16} className="text-blue-600" />}
                </div>
                <h4 className="text-base font-bold text-slate-800">{card.title}</h4>
              </div>
              {/* Takeaway line */}
              <p className="text-sm font-medium text-slate-700 mb-2">
                {card.getContent(viewDataResults)}
              </p>
              {/* Explanation */}
              <p className="text-sm text-slate-500 leading-relaxed">
                {card.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * SecondVisualAnchor - Chapter opener that transitions into the analysis
 * ACCURACY CONTRACT COMPLIANT: All language grounded in observation
 */
const SecondVisualAnchor = ({ tabId }) => {
  // Tab-specific anchor messages - grounded in observation, not intent
  const anchorMessages = {
    algorithm: "Below: the details of what we observed in this scan, with context and possible experiments.",
    ads: "Below: the promotional content we detected, categories observed, and experiments you could try.",
    politics: "Below: political keywords detected, sources observed, and experiments you could try.",
    patterns: "Below: topics detected in this scan, concentration levels, and experiments you could try.",
    creators: "Below: sources observed in this scan, concentration levels, and experiments you could try.",
  };

  return (
    <div
      className="mb-10 mt-4"
      style={{
        paddingLeft: '1rem',
        borderLeft: '4px solid #2563EB',
      }}
    >
      <p
        className="text-lg font-medium text-slate-700 leading-relaxed"
        style={{ maxWidth: '600px' }}
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

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  // PHASE 6A: Political leaning toggle state (default OFF)
  const [politicalLeaningEnabled, setPoliticalLeaningEnabled] = useState(false);
  const {
    scans,
    scanDetails,
    loading,
    error,
    fetchScans,
    fetchAllScanDetails,
    hasScans,
    platforms,
  } = useDashboardData();

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

  // Get views for current tab - Phase 4B: Memoized to prevent unnecessary re-renders
  const currentViews = useMemo(() => getViewsForTab(activeTab), [activeTab]);

  // Compute data for all views in current tab
  // PHASE 6A: Pass options like politicalLeaningEnabled to relevant data functions
  const viewDataResults = useMemo(() => {
    if (!detailsLoaded) return {};

    const results = {};
    for (const view of currentViews) {
      const dataFn = dataHelpers[view.dataFn];
      if (typeof dataFn === 'function') {
        try {
          // Pass options for views that require opt-in
          if (view.requiresOptIn && activeTab === 'politics') {
            results[view.id] = dataFn(scans, scanDetails, { enabled: politicalLeaningEnabled });
          } else {
            results[view.id] = dataFn(scans, scanDetails);
          }
        } catch (err) {
          console.error(`Error computing data for ${view.id}:`, err);
          results[view.id] = { hasData: false, data: null, missing: 'Error loading data.' };
        }
      } else {
        results[view.id] = { hasData: false, data: null, missing: 'Data function not found.' };
      }
    }
    return results;
  }, [currentViews, scans, scanDetails, detailsLoaded, activeTab, politicalLeaningEnabled]);

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
    return (
      <div className="min-h-screen bg-bg-page pt-24 md:pt-28 pb-16 px-4 md:px-6">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => {
                setDetailsLoaded(false);
                fetchScans();
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
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
    <div className="min-h-screen bg-bg-page pt-24 md:pt-28 pb-16 px-4 md:px-6">
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
              <p className="text-text-muted">
                Explore insights from your {scans.length} scan{scans.length !== 1 ? 's' : ''} across {[...new Set(scans.map(s => s.platform))].length} platform{[...new Set(scans.map(s => s.platform))].length !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
          <div className="flex gap-3">
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
            <Link
              to="/start"
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              New Scan
            </Link>
          </div>
        </div>

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
          {/* PHASE 6A: Political Leaning Toggle (only on politics tab) - shown above hero */}
          {activeTab === 'politics' && (
            <div className="mb-6">
              <PoliticalLeaningToggle
                enabled={politicalLeaningEnabled}
                onToggle={() => setPoliticalLeaningEnabled(!politicalLeaningEnabled)}
              />
            </div>
          )}

          {/* Feature Moment - Editorial centerpiece for ALL tabs (Part 2: Design System Application) */}
          <FeatureMomentWrapper>
            {/* Editorial Hero - Algorithm tab uses special hero, others use GenericTabHero */}
            {activeTab === 'algorithm' ? (
              <AlgorithmTabHero
                scans={scans}
                viewDataResults={viewDataResults}
              />
            ) : (
              <GenericTabHero
                tabId={activeTab}
                scans={scans}
                viewDataResults={viewDataResults}
              />
            )}

            {/* Talk to Your Algorithm - Premium invitation (GREEN theme) - SAME placement for ALL tabs */}
            <div className="mt-10">
              <TalkToAlgorithmSection
                feedData={{
                  scans,
                  scanDetails,
                  viewDataResults,
                }}
                tabId={activeTab}
              />
            </div>
          </FeatureMomentWrapper>

          {/* Second Visual Anchor - Chapter opener after Talk - NOW for ALL tabs */}
          <SecondVisualAnchor tabId={activeTab} />

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
                scanCount={scans.length}
                platformCount={platforms.length}
                tabName={TABS.find((t) => t.id === activeTab)?.label || 'insights'}
                tabId={activeTab}
              />
            )}
          </ReadingColumnWrapper>
        </div>

        {/* Phase 8: Minimal footer - Softer, less competing */}
        <div className="text-center py-8 mt-12">
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
