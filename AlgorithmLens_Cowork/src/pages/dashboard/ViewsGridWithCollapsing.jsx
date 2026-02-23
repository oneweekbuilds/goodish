import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import ViewCard from '../../components/dashboard/ViewCard';
import { isHeadlineExcludedLabel } from '../../lib/dashboard/headlineSafety';
import { THEME, SURFACES, TAB_STORY_HEADERS, CURATED_SUPPORTING_BY_TAB } from './dashboardConstants';
import { SectionHeader, ChapterContainer } from './dashboardUtils';
import ViewsSummarySection from './ViewsSummarySection';
import DetailsAccordion from './DetailsAccordion';

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
                    <div className="p-4 sm:p-6 md:p-9">
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
                      className="px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-6 flex justify-between items-center"
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
                        className="px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8"
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
                    className="rounded-xl p-4 sm:p-5 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFE 100%)',
                      border: '1px solid rgba(37, 99, 235, 0.08)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(15, 23, 42, 0.03)',
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
      {(hasMoreDetailsContent || tabId === 'politics') && (
        <ChapterContainer variant="accent">
          <DetailsAccordion
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            supportingOverflow={supportingOverflow}
            speculationCards={speculationCards}
            tabId={tabId}
            tabHeaders={tabHeaders}
            viewDataResults={viewDataResults}
            scanCount={scanCount}
            platformCount={platformCount}
            scopeLabel={scopeLabel}
            moreDetailsSubtitle={moreDetailsSubtitle}
            hasMoreDetailsContent={hasMoreDetailsContent}
          />
        </ChapterContainer>
      )}

      <ViewsSummarySection
        hasSummaryContent={hasSummaryContent}
        tabId={tabId}
        summaryCards={summaryCards}
        viewDataResults={viewDataResults}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        formatSummaryItemLabel={formatSummaryItemLabel}
        isAlgorithmTab={isAlgorithmTab}
      />
    </div>
  );
};

export default ViewsGridWithCollapsing;
