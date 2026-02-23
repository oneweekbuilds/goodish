import React, { useMemo } from 'react';
import { ChevronDown, Database } from 'lucide-react';
import ViewCard from '../../components/dashboard/ViewCard';
import { HERO_VIEW_ID_BY_TAB } from './dashboardConstants';
import { TAB_TRUST_SENTENCES } from './dashboardCatalog';
import { logError } from '../../lib/errorLogger.js';

/**
 * FeatureMomentWrapper - Premium editorial wrapper for Algorithm tab centerpiece
 * Part 2: Enhanced to feel more premium with subtle gradient, increased border radius,
 * soft shadow, and increased visual breathing room
 */
const FeatureMomentWrapper = ({ children }) => (
  <div
    className="relative mb-12 sm:mb-16 md:mb-20 -mx-2 sm:-mx-4 md:-mx-8"
    style={{
      background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(239, 246, 255, 0.5) 40%, rgba(239, 246, 255, 0.3) 70%, #FFFFFF 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(37, 99, 235, 0.08)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 40px rgba(37, 99, 235, 0.05)',
      marginTop: '2rem',
      padding: 'clamp(2rem, 5vw, 3.5rem) clamp(2rem, 5vw, 3rem)',
    }}
  >
    {/* Subtle decorative element at top */}
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2"
      style={{
        width: '48px',
        height: '3px',
        background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.35), rgba(37, 99, 235, 0.1))',
        borderRadius: '0 0 3px 3px',
      }}
    />
    {/* Premium inner glow effect */}
    <div
      className="absolute inset-0 rounded-[24px] pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at top center, rgba(37, 99, 235, 0.03) 0%, transparent 50%)',
      }}
    />
    <div className="relative">{children}</div>
  </div>
);

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
      logError('TabHero', `Error computing hero takeaway for ${heroView?.id}:`, err);
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
      {/* Hero Insight Card - PREMIER SURFACE with refined gradient */}
      <div
        className="w-full rounded-2xl mb-6 relative overflow-hidden transition-shadow duration-300 hover:shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F5FF 40%, #EFF6FF 70%, #F0F5FF 100%)',
          border: '1px solid rgba(37, 99, 235, 0.15)',
          padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.75rem, 4vw, 3rem)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 40px rgba(37, 99, 235, 0.08)',
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

export { FeatureMomentWrapper, TabHero, SecondVisualAnchor, ReadingColumnWrapper };
export default TabHero;
