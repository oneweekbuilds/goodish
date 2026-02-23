import React from 'react';
import { ChevronDown } from 'lucide-react';
import { SURFACES, TAB_STORY_HEADERS } from './dashboardConstants';
import { SectionHeader, ChapterContainer } from './dashboardUtils';

/**
 * ViewsSummarySection - Summary section with "Try this" actions
 *
 * Renders the final section with actionable steps and experiments
 * based on summary cards. Only shown for certain tabs.
 */
const ViewsSummarySection = ({
  hasSummaryContent,
  tabId,
  summaryCards,
  viewDataResults,
  expandedSections,
  toggleSection,
  formatSummaryItemLabel,
  isAlgorithmTab,
}) => {
  const tabHeaders = TAB_STORY_HEADERS[tabId] || TAB_STORY_HEADERS.algorithm;

  // Hide "Try this" section for Patterns and Creators tabs
  if (!hasSummaryContent || tabId === 'patterns' || tabId === 'creators') {
    return null;
  }

  return (
    <section className="mt-4">
      <ChapterContainer variant="default">
        <button
          onClick={() => toggleSection('tryThis')}
          className="w-full flex items-center justify-between rounded-xl px-4 py-3.5 sm:px-5 sm:py-4 text-left transition-all duration-200"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFE 100%)',
            border: '1px solid rgba(37, 99, 235, 0.08)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.14)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.08)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)'; }}
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
                    <div className="p-4 sm:p-6 md:p-8">
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
                        className="px-4 py-4 sm:px-6 sm:py-5 md:px-8 text-center"
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
  );
};

export default ViewsSummarySection;
