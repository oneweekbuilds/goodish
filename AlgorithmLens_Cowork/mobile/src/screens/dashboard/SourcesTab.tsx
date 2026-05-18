/**
 * SourcesTab — "Who Shapes Your Feed" tab (Phase 6.1.4: engine-wired).
 *
 * Phase 6.1.4 wired the interpretation engine into the hero zone. The
 * 1.1.x HeroStatCard + pickHeroStat cascade is gone; the engine's
 * `dashboard.sources` surface produces the verdict, sublines, and
 * supporting card. Everything below the hero (Top creators list,
 * Source concentration StackedBar, About this measurement, Plus
 * creator-breakdowns, About row) is preserved as deeper drill-down
 * content the engine doesn't yet produce.
 *
 * Section order:
 *   1. Verdict zone (engine-driven): VerdictEyebrow + VerdictText
 *      + OBSERVED/LIKELY sublines + optional SupportingCard
 *   2. Top creators (InfluencerRow stack — full ranked list,
 *      complements the engine's single Top voice supporting row)
 *   3. Source concentration (ExpandableCard with StackedBar)
 *   4. About this measurement (ExpandableCard with How We Measure prose)
 *   5. Plus: creator breakdowns (LockedOverlayCard wrapping ExpandableCard)
 *   6. About this analysis (DisclosureRow)
 *
 * Chrome treatment per the 2.x Dashboard design spec §1: the screen-
 * level chrome (DashboardScreen) carries the platform title and scan
 * caption. This tab does NOT render ResultsMetaLine.
 *
 * Loading / error behavior (matches Phase 5.1.4 OverviewTab):
 *   - `scans` is [] while useDashboard's fetch is in flight. Engine
 *     runs with no history → rolling-average anchors omitted →
 *     persistent-creator predicate fails (windowScanCount < 4) →
 *     falls through to calm-case. Anchors and Top voice fill in
 *     when scans arrive.
 *   - useDashboard sets scans to [] on fetch failure and captures
 *     to Sentry. Identical handling to the loading state — no
 *     user-facing error surface on this tab.
 */
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ScanDetail } from '../../hooks/useDashboard';
import type { DashboardData } from '../../lib/computeDashboardData';
import { LockedOverlayCard } from '../../components/plan/LockedOverlayCard';
import {
  Card,
  CategoryRow,
  DisclosureRow,
  ExpandableCard,
  FactRow,
  InfluencerRow,
  SectionHeader,
  StackedBar,
  SupportingCard,
  VerdictEyebrow,
  VerdictText,
} from '../../design-system';
import { colors, layout, spacing, type as typeTokens } from '../../design-tokens/tokens';
import {
  SublineRow,
  sublineGapTop,
} from '../../components/interpretation/SublineRow';
import { interpretScan } from '../../lib/interpretation/interpretationEngine';
import type { InterpretationContext } from '../../lib/interpretation/interpretation-types';

// pickHeroStat + HeroStat removed in Phase 6.1.4 — the interpretation
// engine's `dashboard.sources` surface (templates/dashboardSources.ts)
// produces the verdict, sublines, and supporting card that previously
// came from the cascade.

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
//
// "How we measure" prose lives on `data.sourcesInsight.howWeMeasure`
// (lifted to the data layer in build #51; previously inlined in JSX in
// the legacy SourcesContent). The "About this measurement" card below
// renders only when that field is populated, so older or alternative
// builders that don't supply it degrade gracefully by hiding the card
// rather than displaying empty section headers.

export interface SourcesTabProps {
  data: DashboardData;
  /** All prior scans for this user. Used by the interpretation engine
   *  for cross-scan recurrence and rolling-average derivations.
   *  Starts as [] during the useDashboard fetch; engine handles empty
   *  array gracefully (persistent-creator predicate fails on
   *  windowScanCount < 4, falls through to calm-case). */
  scans: ScanDetail[];
  /** The scan currently driving `data`. Null only when no scan
   *  history exists at all (first launch); in that case we render an
   *  empty state instead of the engine output. */
  activeScan: ScanDetail | null;
  isPlus: boolean;
  onUpgrade: () => void;
}

export function SourcesTab({
  data,
  scans,
  activeScan,
  isPlus,
  onUpgrade,
}: SourcesTabProps) {
  // Concentration breakdown derivations — preserved from 1.1.x.
  const top5Count = useMemo(
    () => data.topCreators.slice(0, 5).reduce((sum, c) => sum + c.count, 0),
    [data.topCreators]
  );
  const top6to10Count = useMemo(
    () => data.topCreators.slice(5, 10).reduce((sum, c) => sum + c.count, 0),
    [data.topCreators]
  );
  const top5ConcPct = data.top5Pct;
  const top6to10Pct =
    data.totalPosts > 0 ? Math.round((top6to10Count / data.totalPosts) * 100) : 0;
  const othersPct = Math.max(0, 100 - top5ConcPct - top6to10Pct);

  const visibleCreators = data.topCreators.slice(0, isPlus ? 10 : 5);

  // ── Engine wiring (Phase 6.1.4) ──────────────────────────────
  //
  // Same useMemo chain pattern as Phase 5.1.4 OverviewTab. Engine
  // runs synchronously when activeScan exists; computation happens
  // in the tab (not prop-injected from parent) so each tab's surface
  // wiring stays independent.
  const platform = activeScan?.platform ?? 'unknown';

  const context = useMemo<InterpretationContext | null>(() => {
    if (!activeScan) return null;
    return { activeScan, scans, dashboardData: data, platform };
  }, [activeScan, scans, data, platform]);

  const interpretation = useMemo(
    () => (context ? interpretScan(context, 'dashboard.sources') : null),
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
          `[2x] supporting row variant not yet implemented on Dashboard Sources: ${row.variant}`,
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
      {/* ── 1. Verdict zone (engine-driven) ─────────────────────── */}
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
                  surface="Dashboard Sources"
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
            No scan data yet. Run a scan to see who shapes your feed.
          </Text>
        </Card>
      )}

      {/* ── 2. Top creators ────────────────────────────────────── */}
      {visibleCreators.length > 0 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <SectionHeader>Top creators</SectionHeader>
          <View
            style={{
              backgroundColor: colors.bgPrimary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {visibleCreators.map((c, i) => {
              // Prefer displayName for human-readable labels
              // (e.g. "Fox News" over "@FoxNews"/"UC..."). Same pattern as
              // OverviewTab's top-influencers list. Logical OR (not
              // nullish coalescing) catches empty-string displayName;
              // final "Unidentified creator" handles the case where
              // Gemini emits empty values for both fields.
              const display =
                (c.displayName && c.displayName.length > 0)
                  ? c.displayName
                  : (c.name && c.name.length > 0)
                    ? (c.name.startsWith('@') ? c.name : `@${c.name}`)
                    : 'Unidentified creator';
              return (
                <InfluencerRow
                  key={`${c.name}-${i}`}
                  handle={display}
                  posts={c.count}
                  ads={0}
                  last={i === visibleCreators.length - 1}
                />
              );
            })}
          </View>
          {!isPlus && data.topCreators.length > 5 ? (
            <Text
              style={{
                fontSize: typeTokens.caption.fontSize,
                lineHeight: typeTokens.caption.lineHeight,
                color: colors.textSecondary,
                marginTop: spacing.s3,
                paddingHorizontal: spacing.s1,
              }}
            >
              See all {Math.min(data.topCreators.length, 10)} with Plus.
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* ── 3. Source concentration ────────────────────────────── */}
      {data.topCreators.length >= 5 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Source concentration"
            headline={`${top5ConcPct}% from top 5`}
          >
            <StackedBar
              segments={[
                { label: 'Top 5', value: top5ConcPct, color: 'brandPrimary' },
                { label: 'Top 6 to 10', value: top6to10Pct, color: 'brandPrimary12' },
                { label: 'Others', value: othersPct, color: 'textTertiary' },
              ]}
              accessibilityLabel={`Source concentration: Top 5 ${top5ConcPct}%, Top 6 to 10 ${top6to10Pct}%, Others ${othersPct}%`}
            />
            <View style={{ marginTop: spacing.s3 }}>
              <CategoryRow label="Top 5" value={`${top5ConcPct}%`} />
              <CategoryRow label="Top 6 to 10" value={`${top6to10Pct}%`} />
              <CategoryRow label="Others" value={`${othersPct}%`} last />
            </View>
            {data.sourcesInsight.meaning ? (
              <Text
                style={{
                  fontSize: typeTokens.caption.fontSize,
                  lineHeight: typeTokens.caption.lineHeight,
                  color: colors.textSecondary,
                  marginTop: spacing.s3,
                }}
              >
                {data.sourcesInsight.meaning}
              </Text>
            ) : null}
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 4. About this measurement ──────────────────────────── */}
      {/* Only renders when the data layer supplies howWeMeasure. If a
          future builder forgets to populate it, the card disappears
          rather than rendering empty section headers. */}
      {data.sourcesInsight.howWeMeasure ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard icon="info" title="About this measurement">
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
              {data.sourcesInsight.howWeMeasure.what}
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
              {data.sourcesInsight.howWeMeasure.how}
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
              {data.sourcesInsight.howWeMeasure.limitations}
            </Text>
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 5. Plus: creator breakdowns ────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <LockedOverlayCard locked={!isPlus} onUpgrade={onUpgrade}>
          <ExpandableCard
            icon="trending-up"
            title="Creator breakdowns"
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
                Plus surfaces who drives ads, who drives political content, and
                which creators are net new to your feed compared with prior scans.
              </Text>
            </Card>
          </ExpandableCard>
        </LockedOverlayCard>
      </View>

      {/* ── 6. About this analysis ─────────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <DisclosureRow label="About this analysis" />
      </View>
    </View>
  );
}
