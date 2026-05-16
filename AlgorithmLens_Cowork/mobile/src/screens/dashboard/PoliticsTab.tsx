/**
 * PoliticsTab — redesigned "Political Exposure" tab.
 *
 * Wires the Gemini-AI-derived political analysis (PoliticalAnalysis on
 * DashboardData) to the design system primitives in `src/design-system/`.
 * Mirrors the structure established by SourcesTab.tsx in build #51 phase 2.
 *
 * Section order (main path, hasPoliticsData true):
 *   1. Hero (HeroStatCard on politicalPct, caution badge when lowSample)
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
 *   - politicsInsight-driven explainer Card (handles both the "no AI" branch
 *     and the "AI ran but nothing political" branch — buildPoliticsInsight
 *     already shapes the copy for both)
 *   - AI disclosure
 *   - About this analysis (same gated pattern as main path)
 *
 * Data integrity / carry-forward notes:
 *   - PoliticalAnalysis.topPoliticalSource currently does NOT carry
 *     `displayName` (see displayName-fallback-inventory.md). The handle is
 *     rendered as-is with an `@` prefix for handles that don't already
 *     carry one. When the data layer is extended to include displayName
 *     for political sources, swap to the same `displayName ?? @name`
 *     fallback pattern that SourcesTab uses for top creators.
 *   - `toSentenceCase` from `lib/string-utils` is deliberately NOT imported
 *     on this tab. Politics renders no Gemini-classified enum strings —
 *     ideology bucket labels are hardcoded ("Left", "Center", "Right"),
 *     handles are not sentence-case-able, and politicsInsight prose is
 *     human-shaped upstream by buildPoliticsInsight.
 *   - The legacy `PoliticsMethodologyDisclaimer` subcomponent in
 *     dashboard.tsx is removed by this build; its prose now lives on the
 *     data layer at `data.politicsInsight.howWeMeasure` (see
 *     POLITICS_HOW_WE_MEASURE in computeDashboardData.ts) and is rendered
 *     inside the bottom "About this analysis" ExpandableCard.
 *
 * Out of scope (preserved as-is):
 *   - extractPoliticalAnalysis / buildPoliticsInsight beyond the
 *     howWeMeasure addition
 *   - LockedOverlayCard (legacy, kept until cross-tab cleanup)
 *   - The ideology threshold (knownTotal >= 10) is enforced upstream;
 *     when ideology is null we hide the entire breakdown section.
 */
import React from 'react';
import { View, Text } from 'react-native';
import type { DashboardData } from '../../lib/computeDashboardData';
import { LockedOverlayCard } from '../../components/plan/LockedOverlayCard';
import {
  Card,
  CategoryRow,
  ExpandableCard,
  HeroStatCard,
  Icon,
  InfluencerRow,
  StackedBar,
} from '../../design-system';
import { colors, layout, spacing, type as typeTokens } from '../../design-tokens/tokens';

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export interface PoliticsTabProps {
  data: DashboardData;
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

export function PoliticsTab({ data, isPlus, onUpgrade }: PoliticsTabProps) {
  const insight = data.politicsInsight;
  const analysis = data.politicalAnalysis;
  const howWeMeasure = insight.howWeMeasure;

  // ── Empty state ──────────────────────────────────────────
  // Triggered when politicalAnalysis is null (no AI) OR when AI ran but
  // politicalCount === 0. Either way, buildPoliticsInsight has already
  // shaped politicsInsight title/meaning/whyCare for the right branch.
  if (!data.hasPoliticsData) {
    return (
      <View
        style={{
          paddingHorizontal: layout.screenPaddingX,
          paddingTop: layout.screenPaddingY,
          paddingBottom: spacing.s7,
        }}
      >
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
  const politicalPct = analysis?.politicalPct ?? 0;
  const politicalCount = analysis?.politicalCount ?? 0;
  const totalAnalyzed = analysis?.totalAnalyzed ?? 0;
  const lowSample = analysis?.lowSample ?? false;
  const ideology = analysis?.ideology ?? null;
  const topPoliticalSource = analysis?.topPoliticalSource ?? null;

  const heroCaution = lowSample
    ? `Based on ${politicalCount} political posts. Interpret with care.`
    : undefined;

  return (
    <View
      style={{
        paddingHorizontal: layout.screenPaddingX,
        paddingTop: layout.screenPaddingY,
        paddingBottom: spacing.s7,
      }}
    >
      {/* ── 1. Hero ──────────────────────────────────────────── */}
      <HeroStatCard
        value={String(politicalPct)}
        unit="%"
        label="of your feed was political content"
        description={insight.meaning}
        caution={heroCaution}
      />

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
