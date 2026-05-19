/**
 * AdsTab — redesigned "Ads & Promotions" tab.
 *
 * Wires the ad-detection signals on DashboardData to the design system
 * primitives in `src/design-system/`. Mirrors the structure of
 * SourcesTab.tsx and PoliticsTab.tsx (build #51).
 *
 * Section order:
 *   1. Hero (HeroStatCard on adPct, CautionBadge when adCount < 5
 *      or totalPosts < 12)
 *   2. Empty-state explainer Card (only when adCount === 0)
 *   3. Ad composition (ExpandableCard with StackedBar) — 3-segment when
 *      unlabeled promos exist, 2-segment otherwise. All colors are
 *      brand-blue / textTertiary tokens; the legacy #F59E0B unlabeled-
 *      promo orange is replaced with textSecondary, satisfying the brand
 *      "no hardcoded hex" rule.
 *   4. Top ad sources (ExpandableCard wrapping CategoryRow rows; see
 *      "Data integrity" note below for why we don't use InfluencerRow).
 *      Gated behind the legacy adCount >= 5 threshold to suppress the
 *      "@FooBar = 75% of 4 ads" misclassification that surfaced in
 *      TestFlight build #45 (see legacy comment lines 182-188).
 *   5. Top product types (ExpandableCard with CategoryRow). toSentenceCase
 *      applied to each Gemini-derived theme string.
 *   6. Unlabeled promotions (ExpandableCard) — headline carries the
 *      percent, body renders prose + a CategoryRow list of top triggers
 *      (toSentenceCase-d) + example-account handles.
 *   7. Tone: selling vs not selling (ExpandableCard with ComparisonPair).
 *      Denominator populated per side ("Based on N selling posts").
 *      Tone segment colors: success (positive), textTertiary (neutral),
 *      textSecondary (negative). We deliberately avoid `destructive` for
 *      "negative" — it's reserved for destructive actions and would
 *      editorialize "negative tone = warning" against the brand voice.
 *   8. About this measurement (ExpandableCard, hide-when-absent) —
 *      consumes data.adsInsight.howWeMeasure.
 *   9. Plus: trends (LockedOverlayCard wrapping placeholder ExpandableCard).
 *   10. About this analysis (DisclosureRow chrome closer).
 *
 * Data integrity / carry-forward notes:
 *   - AdvertiserStat currently does NOT carry `displayName` (see
 *     displayName-fallback-inventory.md). The handle is rendered as-is
 *     with `@`-prefix; when the data layer is extended, swap to the
 *     `displayName ?? @name` fallback that SourcesTab uses for top
 *     creators.
 *   - Top ad sources uses CategoryRow (label = handle, value = count)
 *     rather than InfluencerRow. AdvertiserStat captures only the
 *     ad-post count per handle, so an "X posts · X ads" InfluencerRow
 *     would surface a redundant pair that reads as a data-integrity
 *     issue. CategoryRow communicates "handle → count" cleanly.
 *   - The legacy "EvidenceBundleTeaser" + "FreeAskTeaser" components are
 *     intentionally dropped (matches Sources/Politics decisions in
 *     build #51 — Plus tier visual harmonization is deferred).
 *
 * Out of scope:
 *   - extractUnlabeledPromos / extractTopAdvertisedProductTypes /
 *     extractToneBySelling beyond consumption
 *   - LockedOverlayCard (legacy, kept until cross-tab cleanup)
 *   - The 3-card stat strip from the legacy AdsContent (Ad Posts /
 *     Top Ad Source / Ad Density) — replaced by the Hero + section
 *     ExpandableCards, mirroring SourcesTab's collapse of the
 *     equivalent 3-up strip.
 */
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ScanDetail } from '../../hooks/useDashboard';
import type { DashboardData } from '../../lib/computeDashboardData';
import { LockedOverlayCard } from '../../components/plan/LockedOverlayCard';
import {
  Card,
  CategoryRow,
  ComparisonPair,
  DisclosureRow,
  ExpandableCard,
  FactRow,
  StackedBar,
  SupportingCard,
  VerdictEyebrow,
  VerdictText,
} from '../../design-system';
import { colors, layout, spacing, type as typeTokens } from '../../design-tokens/tokens';
import { toSentenceCase } from '../../lib/string-utils';
import {
  SublineRow,
  sublineGapTop,
} from '../../components/interpretation/SublineRow';
import { interpretScan } from '../../lib/interpretation/interpretationEngine';
import type { InterpretationContext } from '../../lib/interpretation/interpretation-types';

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export interface AdsTabProps {
  data: DashboardData;
  /** All prior scans for this user. Used by the interpretation engine
   *  for advertiser-recurrence and rolling-average derivations.
   *  Starts as [] during the useDashboard fetch; engine handles empty
   *  array gracefully (advertiser-persistence predicate fails on
   *  windowScanCount < 4, falls through to calm-case). */
  scans: ScanDetail[];
  /** The scan currently driving `data`. Null only when no scan
   *  history exists at all (first launch); in that case we render
   *  an empty state instead of the engine output. */
  activeScan: ScanDetail | null;
  isPlus: boolean;
  onUpgrade: () => void;
}

/** Render `@handle` if missing the prefix; otherwise pass through.
 *  Mirrors the fallback half from SourcesTab; the `displayName ??` half
 *  isn't reachable here yet because AdvertiserStat doesn't carry
 *  displayName (see file-level data-integrity note). */
function formatAdHandle(handle: string): string {
  if (!handle) return '';
  return handle.startsWith('@') ? handle : `@${handle}`;
}

export function AdsTab({
  data,
  scans,
  activeScan,
  isPlus,
  onUpgrade,
}: AdsTabProps) {
  const insight = data.adsInsight;
  const howWeMeasure = insight.howWeMeasure;

  // heroCaution removed in Phase 6.2.4 — the two-tier sample-size
  // caution copy (totalPosts < 12 OR adCount < 5) gets surfaced
  // through a future CaveatNote supporting-row variant when that
  // primitive ships. Same discipline as Phase 5.1.4 OverviewTab and
  // Phase 6.1.4 SourcesTab.

  // ── Ad composition derivations ────────────────────────────
  const hasUnlabeledPromos =
    data.unlabeledPromos !== null && data.unlabeledPromos.count > 0;
  const unlabeledPct = hasUnlabeledPromos ? data.unlabeledPromos!.percentage : 0;
  const unlabeledCount = hasUnlabeledPromos ? data.unlabeledPromos!.count : 0;
  const notAdPct = Math.max(0, 100 - data.adPct - unlabeledPct);
  const notAdCount = Math.max(0, data.totalPosts - data.adCount - unlabeledCount);
  const organicPct = Math.max(0, 100 - data.adPct);
  const organicCount = Math.max(0, data.totalPosts - data.adCount);

  // ── Engine wiring (Phase 6.2.4) ──────────────────────────────
  //
  // Same useMemo chain pattern as Phase 5.1.4 / 6.1.4. Engine
  // computes internally per the established discipline (each tab
  // owns its surface; DashboardScreen only threads scans + activeScan).
  const platform = activeScan?.platform ?? 'unknown';

  const context = useMemo<InterpretationContext | null>(() => {
    if (!activeScan) return null;
    return { activeScan, scans, dashboardData: data, platform };
  }, [activeScan, scans, data, platform]);

  const interpretation = useMemo(
    () => (context ? interpretScan(context, 'dashboard.ads') : null),
    [context],
  );

  // Filter supporting rows to 'fact' variant. Other variants
  // (CreatorRow, TrajectoryRow, BarRow, CaveatNote, MethodologyRow)
  // ship in Phase 7+ — skipped with console.warn for visibility.
  const factRows = useMemo(() => {
    const out: Array<{ label: string; value: string; anchor?: string }> = [];
    if (!interpretation) return out;
    for (const row of interpretation.supportingRows) {
      if (row.variant === 'fact') {
        out.push({ label: row.label, value: row.value, anchor: row.anchor });
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `[2x] supporting row variant not yet implemented on Dashboard Ads: ${row.variant}`,
        );
      }
    }
    return out;
  }, [interpretation]);

  return (
    <View
      style={{
        paddingHorizontal: layout.screenPaddingX,
        paddingTop: layout.screenPaddingY,
        paddingBottom: spacing.s7,
      }}
    >
      {/* ── 1. Verdict zone (engine-driven) ──────────────────── */}
      {interpretation ? (
        <View>
          <VerdictEyebrow />
          <View style={{ marginTop: spacing.s4 }}>
            <VerdictText>{interpretation.verdict}</VerdictText>
          </View>
          <View style={{ marginTop: spacing.s6 }}>
            {interpretation.sublines.map((subline, idx) => {
              const prevMode =
                idx > 0 ? interpretation.sublines[idx - 1]?.mode : undefined;
              const marginTop = sublineGapTop(prevMode, subline.mode);
              return (
                <SublineRow
                  key={idx}
                  subline={subline}
                  marginTop={marginTop}
                  surface="Dashboard Ads"
                />
              );
            })}
          </View>
          {factRows.length > 0 ? (
            <View style={{ marginTop: spacing.s6 }}>
              <SupportingCard>
                {factRows.map((row, i) => (
                  <FactRow
                    key={i}
                    label={row.label}
                    value={row.value}
                    anchor={row.anchor}
                  />
                ))}
              </SupportingCard>
            </View>
          ) : null}
        </View>
      ) : (
        <Card>
          <Text
            style={{
              fontSize: typeTokens.body.fontSize,
              lineHeight: typeTokens.body.lineHeight,
              fontWeight: typeTokens.body.fontWeight,
              color: colors.textSecondary,
            }}
          >
            No scan data yet. Run a scan to see your ad mix.
          </Text>
        </Card>
      )}

      {/* ── 2. Empty-state explainer (adCount === 0) ─────────── */}
      {data.adCount === 0 ? (
        <View style={{ marginTop: spacing.s4 }}>
          <Card>
            <Text
              style={{
                fontSize: typeTokens.body.fontSize,
                lineHeight: typeTokens.body.lineHeight,
                color: colors.textSecondary,
              }}
            >
              We look for platform-provided ad labels ("Sponsored", "Ad" badges) and promotional URL patterns. Some promotional content doesn't carry visible labels. Native advertising, influencer partnerships, and product placements may not have standard markers. Scan longer to capture more ad signals.
            </Text>
          </Card>
        </View>
      ) : null}

      {/* ── 3. Ad composition ───────────────────────────────── */}
      {/* Only renders when at least one labeled ad was captured. The
          3-segment view appears when the unlabeled-promo signal also
          fires; otherwise we collapse to a 2-segment view. Segment
          colors use brand-blue + grey tokens only — the legacy
          #F59E0B unlabeled-promo orange is gone. */}
      {data.adCount > 0 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Ad composition"
            headline={`${data.adPct}% labeled`}
          >
            {hasUnlabeledPromos ? (
              <>
                <StackedBar
                  segments={[
                    { label: 'Not ads', value: notAdPct, color: 'textTertiary' },
                    { label: 'Unlabeled promos', value: unlabeledPct, color: 'textSecondary' },
                    { label: 'Labeled ads', value: data.adPct, color: 'brandPrimary' },
                  ]}
                  accessibilityLabel={`Ad composition: Not ads ${notAdPct}%, Unlabeled promos ${unlabeledPct}%, Labeled ads ${data.adPct}%`}
                />
                <View style={{ marginTop: spacing.s3 }}>
                  <CategoryRow label="Not ads" value={`${notAdPct}% (${notAdCount})`} />
                  <CategoryRow label="Unlabeled promos" value={`${unlabeledPct}% (${unlabeledCount})`} />
                  <CategoryRow label="Labeled ads" value={`${data.adPct}% (${data.adCount})`} last />
                </View>
              </>
            ) : (
              <>
                <StackedBar
                  segments={[
                    { label: 'Not ads', value: organicPct, color: 'textTertiary' },
                    { label: 'Labeled ads', value: data.adPct, color: 'brandPrimary' },
                  ]}
                  accessibilityLabel={`Ad composition: Not ads ${organicPct}%, Labeled ads ${data.adPct}%`}
                />
                <View style={{ marginTop: spacing.s3 }}>
                  <CategoryRow label="Not ads" value={`${organicPct}% (${organicCount})`} />
                  <CategoryRow label="Labeled ads" value={`${data.adPct}% (${data.adCount})`} last />
                </View>
              </>
            )}
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 4. Top ad sources ───────────────────────────────── */}
      {/* Threshold-gated at adCount >= 5 — preserves the legacy guard
          that suppressed the "@FooBar = 75% of 4 ads" misclassification
          surfaced in TestFlight build #45.
          CategoryRow (label = handle, value = count) instead of
          InfluencerRow — see the file-level "Data integrity" note. */}
      {data.topAdvertisers.length > 0 && data.adCount >= 5 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Top ad sources"
            headline={`${data.adCount} labeled ${data.adCount === 1 ? 'ad' : 'ads'}`}
          >
            {data.topAdvertisers.map((adv, i) => (
              <CategoryRow
                key={`${adv.name}-${i}`}
                label={formatAdHandle(adv.name)}
                value={String(adv.count)}
                last={i === data.topAdvertisers.length - 1}
              />
            ))}
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 5. Top product types ────────────────────────────── */}
      {data.topAdvertisedProductTypes.length > 0 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Top product types"
            headline={`${data.topAdvertisedProductTypes.length} ${data.topAdvertisedProductTypes.length === 1 ? 'category' : 'categories'}`}
          >
            {data.topAdvertisedProductTypes.map((pt, i) => (
              <CategoryRow
                key={`${pt.theme}-${i}`}
                label={toSentenceCase(pt.theme)}
                value={`${pt.percentage}% (${pt.count})`}
                last={i === data.topAdvertisedProductTypes.length - 1}
              />
            ))}
            <Text
              style={{
                fontSize: typeTokens.caption.fontSize,
                lineHeight: typeTokens.caption.lineHeight,
                color: colors.textSecondary,
                marginTop: spacing.s3,
              }}
            >
              Based on {data.adCount} labeled {data.adCount === 1 ? 'ad post' : 'ad posts'}.
            </Text>
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 6. Unlabeled promotions ─────────────────────────── */}
      {hasUnlabeledPromos ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Unlabeled promotions"
            headline={`${data.unlabeledPromos!.percentage}%`}
          >
            <Text
              style={{
                fontSize: typeTokens.body.fontSize,
                lineHeight: typeTokens.body.lineHeight,
                color: colors.textSecondary,
                marginBottom: spacing.s4,
              }}
            >
              {data.unlabeledPromos!.count} {data.unlabeledPromos!.count === 1 ? 'post' : 'posts'} showed promotional signals (commercial URLs, product mentions) without a visible ad label.
            </Text>

            {data.unlabeledPromos!.topTriggers.length > 0 ? (
              <>
                <Text
                  style={{
                    fontSize: typeTokens.body.fontSize,
                    lineHeight: typeTokens.body.lineHeight,
                    fontWeight: typeTokens.bodyStrong.fontWeight,
                    color: colors.textPrimary,
                    marginBottom: spacing.s2,
                  }}
                >
                  Top triggers
                </Text>
                {data.unlabeledPromos!.topTriggers.map((trigger, i) => (
                  <CategoryRow
                    key={`${trigger.name}-${i}`}
                    label={toSentenceCase(trigger.name)}
                    value={String(trigger.count)}
                    last={i === data.unlabeledPromos!.topTriggers.length - 1}
                  />
                ))}
              </>
            ) : null}

            {data.unlabeledPromos!.exampleAccounts.length > 0 ? (
              <>
                <Text
                  style={{
                    fontSize: typeTokens.body.fontSize,
                    lineHeight: typeTokens.body.lineHeight,
                    fontWeight: typeTokens.bodyStrong.fontWeight,
                    color: colors.textPrimary,
                    marginTop: spacing.s4,
                    marginBottom: spacing.s2,
                  }}
                >
                  Example accounts
                </Text>
                <Text
                  style={{
                    fontSize: typeTokens.body.fontSize,
                    lineHeight: typeTokens.body.lineHeight,
                    color: colors.textSecondary,
                  }}
                >
                  {data.unlabeledPromos!.exampleAccounts.map(formatAdHandle).join(' · ')}
                </Text>
              </>
            ) : null}
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 7. Tone: selling vs not selling ─────────────────── */}
      {data.toneBySelling ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Tone: selling vs not selling"
            headline={`${data.toneBySelling.selling.total + data.toneBySelling.notSelling.total} ${data.toneBySelling.selling.total + data.toneBySelling.notSelling.total === 1 ? 'post' : 'posts'}`}
          >
            <ComparisonPair
              left={{
                label: 'Selling content',
                denominator: `Based on ${data.toneBySelling.selling.total} selling ${data.toneBySelling.selling.total === 1 ? 'post' : 'posts'} with known tone`,
                segments: [
                  { label: 'Positive', value: data.toneBySelling.selling.positivePct, color: 'success' },
                  { label: 'Neutral', value: data.toneBySelling.selling.neutralPct, color: 'textTertiary' },
                  { label: 'Negative', value: data.toneBySelling.selling.negativePct, color: 'textSecondary' },
                ],
                accessibilityLabel: `Selling content tone: Positive ${data.toneBySelling.selling.positivePct}%, Neutral ${data.toneBySelling.selling.neutralPct}%, Negative ${data.toneBySelling.selling.negativePct}%`,
              }}
              right={{
                label: 'Non-selling content',
                denominator: `Based on ${data.toneBySelling.notSelling.total} non-selling ${data.toneBySelling.notSelling.total === 1 ? 'post' : 'posts'} with known tone`,
                segments: [
                  { label: 'Positive', value: data.toneBySelling.notSelling.positivePct, color: 'success' },
                  { label: 'Neutral', value: data.toneBySelling.notSelling.neutralPct, color: 'textTertiary' },
                  { label: 'Negative', value: data.toneBySelling.notSelling.negativePct, color: 'textSecondary' },
                ],
                accessibilityLabel: `Non-selling content tone: Positive ${data.toneBySelling.notSelling.positivePct}%, Neutral ${data.toneBySelling.notSelling.neutralPct}%, Negative ${data.toneBySelling.notSelling.negativePct}%`,
              }}
              deltaInsight={
                data.toneBySelling.biggestDifference
                  ? `This pattern may suggest: ${data.toneBySelling.biggestDifference}`
                  : null
              }
            />
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 8. About this measurement ───────────────────────── */}
      {howWeMeasure ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard icon="info" title="About this measurement">
            <MethodologySections howWeMeasure={howWeMeasure} />
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 9. Plus: trends ─────────────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <LockedOverlayCard locked={!isPlus} onUpgrade={onUpgrade}>
          <ExpandableCard
            icon="trending-up"
            title="Trends over time"
            headline="Plus"
          >
            <Card padding={spacing.s4} style={{ backgroundColor: colors.bgSecondary, borderWidth: 0 }}>
              <Text
                style={{
                  fontSize: typeTokens.body.fontSize,
                  lineHeight: typeTokens.body.lineHeight,
                  color: colors.textSecondary,
                }}
              >
                Plus tracks how the labeled ad share of your feed shifts across scans, surfacing whether commercial exposure is rising, falling, or steady.
              </Text>
            </Card>
          </ExpandableCard>
        </LockedOverlayCard>
      </View>

      {/* ── 10. About this analysis ─────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <DisclosureRow label="About this analysis" />
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Local: methodology sub-sections renderer
//
// Same shape as PoliticsTab's MethodologySections. Duplicated rather
// than shared so each redesigned tab stays self-contained; the design
// system can promote this to a shared primitive once all five tabs
// land and we're sure the contract is stable.
// ────────────────────────────────────────────────────────────

interface MethodologySectionsProps {
  howWeMeasure: NonNullable<DashboardData['adsInsight']['howWeMeasure']>;
}

function MethodologySections({ howWeMeasure }: MethodologySectionsProps) {
  return (
    <>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          fontWeight: typeTokens.bodyStrong.fontWeight,
          color: colors.textPrimary,
          marginBottom: spacing.s2,
        }}
      >
        What we measure
      </Text>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          color: colors.textSecondary,
          marginBottom: spacing.s4,
        }}
      >
        {howWeMeasure.what}
      </Text>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          fontWeight: typeTokens.bodyStrong.fontWeight,
          color: colors.textPrimary,
          marginBottom: spacing.s2,
        }}
      >
        How we measure it
      </Text>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          color: colors.textSecondary,
          marginBottom: spacing.s4,
        }}
      >
        {howWeMeasure.how}
      </Text>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          fontWeight: typeTokens.bodyStrong.fontWeight,
          color: colors.textPrimary,
          marginBottom: spacing.s2,
        }}
      >
        Limitations
      </Text>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          color: colors.textSecondary,
        }}
      >
        {howWeMeasure.limitations}
      </Text>
    </>
  );
}
