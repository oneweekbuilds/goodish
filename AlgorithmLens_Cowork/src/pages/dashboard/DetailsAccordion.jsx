import React from 'react';
import { ChevronDown } from 'lucide-react';
import ViewCard from '../../components/dashboard/ViewCard';
import { SectionHeader } from './dashboardUtils';

/**
 * DetailsAccordion - Extracted "MORE DETAILS" accordion section
 *
 * Renders optional supporting details in an accordion pattern:
 * - supportingOverflow: Additional detail cards beyond top 4
 * - speculationCards: Collapsed by default cards
 * - Special handling for Politics tab
 */
const DetailsAccordion = ({
  expandedSections,
  toggleSection,
  supportingOverflow,
  speculationCards,
  tabId,
  tabHeaders,
  viewDataResults,
  scanCount,
  platformCount,
  scopeLabel,
  moreDetailsSubtitle,
  hasMoreDetailsContent,
}) => {
  // Only render if there's content or if it's the Politics tab
  if (!hasMoreDetailsContent && tabId !== 'politics') {
    return null;
  }

  return (
    <section>
      <div>
        <button
          onClick={() => toggleSection('moreDetails')}
          className="w-full flex items-center justify-between rounded-xl px-4 py-3.5 sm:px-5 sm:py-4 text-left transition-all duration-200"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFE 100%)',
            border: '1px solid rgba(37, 99, 235, 0.08)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.14)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.08)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)'; }}
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
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {supportingOverflow.map((view) => {
                    const dataResult = viewDataResults[view.id];
                    const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                      ? view.takeaway(dataResult?.data)
                      : null;

                    return (
                      <div
                        key={view.id}
                        className="rounded-xl p-3 sm:p-5 transition-all duration-200 hover:shadow-sm hover:border-slate-200"
                        style={{
                          background: 'white',
                          border: '1px solid rgba(226, 232, 240, 0.6)',
                        }}
                      >
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
                          className="rounded-xl p-3 sm:p-4 transition-all duration-200 hover:shadow-sm hover:border-slate-200"
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
      </div>
    </section>
  );
};

export default DetailsAccordion;
