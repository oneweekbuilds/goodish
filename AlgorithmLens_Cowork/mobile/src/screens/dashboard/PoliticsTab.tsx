/**
 * PoliticsTab — redesigned "Political Exposure" tab.
 *
 * Wires the Gemini-AI-derived political analysis (PoliticalAnalysis on
 * DashboardData) to the design system primitives in `src/design-system/`
 * AND to the 2.x interpretation engine for the headline verdict zone.
 * Mirrors the structure established by SourcesTab/AdsTab/ToneTab in
 * Phase 6.1–6.3.
 *
 * Section order (main path, hasPoliticsData true):
 *   1. Verdict zone (engine-driven) — VerdictEyebrow + VerdictText +
 *      SublineRow stack from dashboard.politics interpretation.
 *      Optionally followed by a SupportingCard with FactRows when the
 *      template emits any.
 *   2. AI disclosure (inline Sparkles icon + caption, passive)
 *   3. Top political source (ExpandableCard wrapping InfluencerRow)
 *   4. Political summary (Card with politicalSummary prose, not italic)
 *   5. Ideological breakdown (ExpandableCard — populated when ideology
 *      exists, "Not enough data" empty state otherwise; layout always
 *      present so the page doesn't shift between scans)
 *   6. Plus: trends (LockedOverlayCard wrapping placeholder ExpandableCard)
 *   7. About this analysis (ExpandableCard with howWeMeasure prose)
 *
 * Empty state (!hasPoliticsData):
 *   - Verdict zone STILL renders (engine's calm-case
 *     enrichment-not-available variant fires when politicalAnalysis is
 *     null; no-political-content variant fires when AI ran but
 *     politicalCount === 0). Honest "isn't available" / "didn't include
 *     political content" headline appears at the top of the tab.
 *   - politicsInsight-driven explainer Card retained beneath the engine
 *     verdict zone (kept from 1.1.x for AI opt-in / no-political-detection
 *     tab-specific context the engine can't carry).
 *   - AI disclosure
 *   - About this analysis (same gated pattern as main path)
 *
 * Engine wiring (Phase 6.4.4):
 *   - useMemo chain: activeScan → context → interpretation
 *   - dashboard.politics surface: 3 templates (political_creator_dominance
 *     at priority 70, political_trajectory at priority 60, calm-case at
 *     priority 10 with 4 variants).
 *   - SupportingCard filters supportingRows to 'fact' variant only;
 *     other variants warn via console.warn (Phase 7+ primitives).
 *   - When activeScan === null (no scan history at all), interpretation
 *     is null and a Politics-specific tab-empty-state Card renders at
 *     the verdict-zone slot ("Run a scan to see your political content
 *     exposure.").
 *
 * What was removed in Phase 6.4.4:
 *   - HeroStatCard with politicalPct → replaced by VerdictEyebrow +
 *     VerdictText + SublineRow at the verdict zone.
 *   - lowSample heroCaution badge → deferred to future CaveatNote
 *     supporting-row variant (same discipline as Phases 5.1.4 / 6.1.4 /
 *     6.2.4 / 6.3.4).
 *
 * Data integrity / carry-forward notes:
 *   - PoliticalAnalysis.topPoliticalSource currently does NOT carry
 *     `displayName` (see displayName-fallback-inventory.md). The handle
 *     is rendered as-is with an `@` prefix for handles that don't
 *     already carry one. When the data layer is extended to include
 *     displayName for political sources, swap to the same `displayName
 *     ?? @name` fallback pattern that SourcesTab uses for top creators.
 *   - `toSentenceCase` from `lib/string-utils` is deliberately NOT
 *     imported. Politics renders no Gemini-classified enum strings —
 *     ideology bucket labels are hardcoded ("Left", "Center", "Right"),
 *     handles aren't sentence-case-able, and politicsInsight prose is
 *     human-shaped upstream by buildPoliticsInsight.
 *   - The legacy `PoliticsMethodologyDisclaimer` subcomponent in
 *     dashboard.tsx was removed in build #51; its prose now lives on
 *     the data layer at `data.politicsInsight.howWeMeasure` and renders
 *     inside the bottom "About this analysis" ExpandableCard.
 *
 * Out of scope (preserved as-is):
 *   - extractPoliticalAnalysis / buildPoliticsInsight beyond consumption
 *   - LockedOverlayCard (legacy, kept until cross-tab cleanup)
 *   - The ideology threshold (knownTotal >= 10) is enforced upstream;
 *     when ideology is null we hide the entire breakdown section.
 */
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import type { DashboardData } from '../../lib/computeDashboardData';
import type { ScanDetail } from '../../hooks/useDashboard';
import { LockedOverlayCard } from '../../components/plan/LockedOverlayCard';
import {
  Card,
  CategoryRow,
  ExpandableCard,
  FactRow,
  Icon,
  InfluencerRow,
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

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export interface PoliticsTabProps {
  data: DashboardData;
  /** All prior scans for this user. Used by the interpretation engine
   *  for political-creator-recurrence and political-trajectory
   *  detection. Starts as [] during the useDashboard fetch; engine
   *  handles empty array gracefully (dominance/trajectory predicates
   *  fall through to calm-case). */
  scans: ScanDetail[];
  /** The scan currently driving `data`. Null only when no scan history
   *  exists at all (first launch); in that case we render an empty
   *  state instead of the engine output. */
  activeScan: ScanDetail | null;
  isPlus: boolean;
  onUpgrade: () => void;
}

/** Render `@handle` if missing the prefix; otherwise pass the handle through.
 *  Mirrors the fallback in SourcesTab; the `displayName` half of that
 *  fallback isn't reachable here yet (see file-level data-integrity note). */
function formatPoliticalHandle(handle: string): string {
  if (!handle) return '';
  return handle.startsWith('@') ? handle : `@${handle}`;
}

export function PoliticsTab({
  data,
  scans,
  activeScan,
  isPlus,
  onUpgrade,
}: PoliticsTabProps) {
  const insight = data.politicsInsight;
  const analysis = data.politicalAnalysis;
  const howWeMeasure = insight.howWeMeasure;

  // ── Engine wiring (Phase 6.4.4) ──────────────────────────────
  //
  // Engine runs in BOTH paths (main and !hasPoliticsData empty
  // branch). On the empty branch the engine's calm-case
  // enrichment-not-available variant (politicalAnalysis === null) or
  // no-political-content variant (politicalCount === 0) fires and
  // produces honest verdict copy at the top. The existing
  // politicsInsight-driven explainer Card stays beneath — engine
  // handles the headline; existing prose adds AI opt-in / detection
  // tab-specific context the engine can't carry.
  const platform = activeScan?.platform ?? 'unknown';

  const context = useMemo<InterpretationContext | null>(() => {
    if (!activeScan) return null;
    return { activeScan, scans, dashboardData: data, platform };
  }, [activeScan, scans, data, platform]);

  const interpretation = useMemo(
    () => (context ? interpretScan(context, 'dashboard.politics') : null),
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
          `[2x] supporting row variant not yet implemented on Dashboard Politics: ${row.variant}`,
        );
      }
    }
    return out;
  }, [interpretation]);

  // Shared verdict-zone fragment rendered at the top of BOTH the
  // empty and main paths. When activeScan is null (no scan history
  // at all), interpretation is null and a Politics-specific empty-
  // state Card renders instead.
  const verdictZone = interpretation ? (
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
              surface="Dashboard Politics"
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
        Run a scan to see your political content exposure.
      </Text>
    </Card>
  );

  // ── Empty state ──────────────────────────────────────────
  // Triggered when politicalAnalysis is null (no AI) OR when AI ran
  // but politicalCount === 0. Either way, buildPoliticsInsight has
  // already shaped politicsInsight title/meaning/whyCare for the
  // right branch — kept beneath the engine verdict zone for tab-
  // specific context (AI opt-in messaging, etc.) the engine can't
  // carry.
  if (!data.hasPoliticsData) {
    return (
      <View
        style={{
          paddingHorizontal: layout.screenPaddingX,
          paddingTop: layout.screenPaddingY,
          paddingBottom: spacing.s7,
        }}
      >
        {verdictZone}

        <View style={{ marginTop: spacing.s7 }}>
          <Card>
            <Text
              style={{
                fontSize: typeTokens.subheading.fontSize,
                lineHeight: typeTokens.subheading.lineHeight,
                fontWeight: typeTokens.subheading.fontWeight,
                color: colors.textPrimary,
              }}
            >
              {insight.title}
            </Text>
            <Text
              style={{
                fontSize: typeTokens.body.fontSize,
                lineHeight: typeTokens.body.lineHeight,
                color: colors.textSecondary,
                marginTop: spacing.s3,
              }}
            >
              {insight.meaning}
            </Text>
            {insight.whyCare ? (
              <Text
                style={{
                  fontSize: typeTokens.body.fontSize,
                  lineHeight: typeTokens.body.lineHeight,
                  color: colors.textSecondary,
                  marginTop: spacing.s3,
                }}
              >
                {insight.whyCare}
              </Text>
            ) : null}
          </Card>
        </View>

        <AIDisclosure />

        {howWeMeasure ? (
          <View style={{ marginTop: spacing.s7 }}>
            <ExpandableCard icon="info" title="About this analysis">
              <MethodologySections howWeMeasure={howWeMeasure} />
            </ExpandableCard>
          </View>
        ) : null}
      </View>
    );
  }

  // ── Main path (hasPoliticsData true) ─────────────────────
  // Narrowing: hasPoliticsData implies politicalAnalysis !== null AND
  // politicalCount > 0. Use the non-null branch confidently.
  // (Defensive `?? 0` on the rare path where TS can't follow the narrowing
  // through the boolean `data.hasPoliticsData`.)
  const politicalCount = analysis?.politicalCount ?? 0;
  const ideology = analysis?.ideology ?? null;
  const topPoliticalSource = analysis?.topPoliticalSource ?? null;

  // 1.1.x HeroStatCard + lowSample caution removed in Phase 6.4.4 —
  // the engine's dashboard.politics surface (political_creator_dominance
  // template + political_trajectory template + calm-case variants)
  // produces the verdict zone above. Caution copy for low-sample scans
  // defers to the future CaveatNote supporting-row variant (same
  // discipline as Phases 5.1.4 / 6.1.4 / 6.2.4 / 6.3.4).

  return (
    <View
      style={{
        paddingHorizontal: layout.screenPaddingX,
        paddingTop: layout.screenPaddingY,
        paddingBottom: spacing.s7,
      }}
    >
      {/* ── 1. Verdict zone (engine-driven) ─────────────────── */}
      {verdictZone}

      {/* ── 2. AI disclosure ─────────────────────────────────── */}
      {/* Passive informational line. Sparkles icon + caption text in
          textSecondary. No chevron, no tap target, no interactive
          accessibility role — purely declarative provenance. */}
      <AIDisclosure />

      {/* ── 3. Top political source ─────────────────────────── */}
      {/* Headline is count-based ("X of Y political posts") — concrete and
          unambiguous, no math required of the reader. The expanded body
          surfaces the percent for users who want the share framing. */}
      {topPoliticalSource ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Top political source"
            headline={`${topPoliticalSource.count} of ${politicalCount} political posts`}
          >
            {/* Single-row container so InfluencerRow's hairline border
                renders cleanly inside the expanded body. */}
            <View
              style={{
                backgroundColor: colors.bgPrimary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <InfluencerRow
                handle={formatPoliticalHandle(topPoliticalSource.handle)}
                posts={topPoliticalSource.count}
                ads={0}
                last
              />
            </View>
            <Text
              style={{
                fontSize: typeTokens.caption.fontSize,
                lineHeight: typeTokens.caption.lineHeight,
                color: colors.textSecondary,
                marginTop: spacing.s3,
              }}
            >
              That's {topPoliticalSource.pctOfPolitical}% of all political posts in this scan.
            </Text>
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 4. Political summary ────────────────────────────── */}
      {/* Spec: NOT italic. Legacy used italic; we deliberately render in
          regular weight so the prose reads as a primary statement, not a
          stage whisper. */}
      {data.politicalSummary ? (
        <View style={{ marginTop: spacing.s7 }}>
          <Card>
            <Text
              style={{
                fontSize: typeTokens.body.fontSize,
                lineHeight: typeTokens.body.lineHeight,
                color: colors.textPrimary,
              }}
            >
              {data.politicalSummary}
            </Text>
          </Card>
        </View>
      ) : null}

      {/* ── 5. Ideological breakdown ────────────────────────── */}
      {/* Always rendered so the page layout doesn't shift scan-to-scan.
          Populated state shows the bar + CategoryRows + caveat; empty
          state surfaces an honest explanation of why the breakdown
          isn't shown (knownTotal < MIN_POLITICAL_FOR_IDEOLOGY = 10). */}
      <View style={{ marginTop: spacing.s7 }}>
        <ExpandableCard
          icon="bar-chart-3"
          title="Ideological breakdown"
          headline={ideology ? `${ideology.knownTotal} posts` : 'Not enough data'}
        >
          {ideology ? (
            <>
              <StackedBar
                segments={[
                  { label: 'Left', value: ideology.left, color: 'brandPrimary' },
                  { label: 'Center', value: ideology.center, color: 'textSecondary' },
                  { label: 'Right', value: ideology.right, color: 'textTertiary' },
                ]}
                accessibilityLabel={`Ideological breakdown: Left ${ideology.left}%, Center ${ideology.center}%, Right ${ideology.right}%`}
              />
              <View style={{ marginTop: spacing.s3 }}>
                <CategoryRow
                  label="Left"
                  value={`${ideology.left}% (${ideology.leftCount})`}
                />
                <CategoryRow
                  label="Center"
                  value={`${ideology.center}% (${ideology.centerCount})`}
                />
                <CategoryRow
                  label="Right"
                  value={`${ideology.right}% (${ideology.rightCount})`}
                  last
                />
              </View>
              <Text
                style={{
                  fontSize: typeTokens.caption.fontSize,
                  lineHeight: typeTokens.caption.lineHeight,
                  color: colors.textSecondary,
                  marginTop: spacing.s3,
                }}
              >
                Ideological alignment is approximate, based on stance keywords in {ideology.knownTotal} political posts. Keyword signals can miss nuance.
              </Text>
            </>
          ) : (
            <Text
              style={{
                fontSize: typeTokens.body.fontSize,
                lineHeight: typeTokens.body.lineHeight,
                color: colors.textSecondary,
              }}
            >
              Not enough political posts with identifiable alignment to show a breakdown. Ideological breakdown requires at least 10 political posts where Gemini could classify the stance.
            </Text>
          )}
        </ExpandableCard>
      </View>

      {/* ── 6. Plus: trends ─────────────────────────────────── */}
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
                Plus tracks how the political share of your feed shifts across scans, surfacing whether exposure is rising, falling, or steady.
              </Text>
            </Card>
          </ExpandableCard>
        </LockedOverlayCard>
      </View>

      {/* ── 7. About this analysis ──────────────────────────── */}
      {/* Same hide-when-absent gating as SourcesTab. If a future builder
          forgets to populate howWeMeasure, the card disappears rather
          than rendering empty section headers. */}
      {howWeMeasure ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard icon="info" title="About this analysis">
            <MethodologySections howWeMeasure={howWeMeasure} />
          </ExpandableCard>
        </View>
      ) : null}
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Local: AI disclosure
//
// Passive informational line shown beneath the hero. Sparkles icon plus a
// caption-sized text in textSecondary. No chevron, no tap target, no
// interactive accessibility role — purely declarative provenance for the
// Gemini-AI-derived political signals. Used in both the main path and
// the empty state so the disclosure travels with the screen regardless
// of whether political content was found.
// ────────────────────────────────────────────────────────────

function AIDisclosure() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.s2,
        marginTop: spacing.s4,
        paddingHorizontal: spacing.s2,
      }}
    >
      <View style={{ paddingTop: 2 }}>
        <Icon name="sparkles" size={12} color={colors.textSecondary} />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: typeTokens.caption.fontSize,
          lineHeight: typeTokens.caption.lineHeight,
          color: colors.textSecondary,
        }}
      >
        Political content detected by Google Gemini AI. AI classification is approximate.
      </Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Local: methodology sub-sections renderer
//
// Extracted so the empty-state and main-path About cards share the same
// render code without prop-drilling.
// ────────────────────────────────────────────────────────────

interface MethodologySectionsProps {
  howWeMeasure: NonNullable<DashboardData['politicsInsight']['howWeMeasure']>;
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
