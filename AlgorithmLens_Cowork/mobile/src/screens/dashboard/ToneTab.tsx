/**
 * ToneTab — redesigned "Emotional Tone" tab.
 *
 * Wires the Gemini-AI-derived tone signals on DashboardData to the
 * design system primitives in `src/design-system/`. The final of five
 * dashboard tabs to migrate off the legacy InsightHero +
 * ToneComparisonCard renderers. Mirrors the structure of SourcesTab,
 * PoliticsTab, AdsTab, and SuggestedTab from builds #51-52.
 *
 * Section order (main path, hasToneData true):
 *   1. Hero (HeroStatCard with dominant-tone bucket — "Mostly
 *      positive (X%)" / "Mostly negative (X%)" / "Mostly neutral
 *      (X%)" / "Mixed tone" — CautionBadge when toneAnalysis.lowSample)
 *   2. AI disclosure (inline Sparkles + caption, passive informational
 *      line — same component pattern as PoliticsTab)
 *   3. Tone distribution (ExpandableCard, defaultOpen, with StackedBar
 *      + 3 CategoryRow rows + caveat caption)
 *   4. Most positive sources (ExpandableCard, hidden when array empty)
 *   5. Most negative sources (ExpandableCard, hidden when array empty)
 *   6. Tone: suggested vs followed (ExpandableCard with ComparisonPair,
 *      hidden when toneBySourceOrigin lacks data)
 *   7. Tone: political vs non-political (ExpandableCard with
 *      ComparisonPair, hidden when toneByPolitical is null)
 *   8. Tone: selling vs not selling (ExpandableCard with ComparisonPair,
 *      hidden when toneBySelling is null)
 *   9. Plus: Rare content detection (LockedOverlayCard wrapping
 *      placeholder ExpandableCard)
 *   10. About this measurement (ExpandableCard, hide-when-absent) —
 *       consumes data.toneInsight.howWeMeasure
 *   11. About this analysis (DisclosureRow chrome closer)
 *
 * Empty state (!hasToneData):
 *   - toneInsight-driven explainer Card (the no-AI-consent branch or
 *     the no-tone-detected branch — buildToneInsight shapes the copy
 *     for both)
 *   - AI disclosure
 *   - About this analysis (same hide-when-absent ExpandableCard)
 *
 * Canonical tone-color mapping (locked from build #52, carried forward
 * here as the last tone-rendering tab):
 *   - Positive: `success` (#20A888 brand green)
 *   - Neutral:  `textTertiary` (#A0A0A5)
 *   - Negative: `textSecondary` (#6B6B70)
 *
 * Why grey for negative (not `destructive` red): high-emotion negative
 * content is sometimes appropriate (journalism, social commentary).
 * Using `destructive` would editorialize "negative = warning" against
 * the brand's epistemic-restraint voice. Grey reads as a third
 * neutral-toned category, not an alarm bell.
 *
 * Data integrity / carry-forward notes:
 *   - ToneSourceStat carries `handle` + `count` only; NO displayName
 *     (matches displayName-fallback-inventory.md). Handles render
 *     with `@` prefix via formatToneHandle, mirroring the
 *     formatPoliticalHandle / formatAdHandle pattern in
 *     PoliticsTab/AdsTab. When the data layer is extended with
 *     displayName for tone sources, swap to the same
 *     `displayName ?? formatToneHandle(handle)` fallback that
 *     SourcesTab uses for top creators.
 *   - ToneByPolitical and ToneBySelling do NOT carry a `hasData`
 *     field; they're null at the DashboardData level when absent.
 *     ToneBySourceOrigin DOES carry `hasData` (and per-side nullables
 *     for `suggested` / `followed`). All three sections use the
 *     appropriate guard.
 *   - ToneBySourceOrigin does NOT carry a `biggestDifference` string
 *     (unlike ToneBySelling and ToneByPolitical). We derive a simple
 *     delta caption in the presentation layer
 *     (deriveToneBySourceDelta below) — surfacing only when both
 *     sides have > 5 posts AND any abs(suggested - followed) on
 *     positive/neutral/negative >= 10 percentage points.
 *   - `toSentenceCase` from `lib/string-utils` is deliberately NOT
 *     imported here. Tone bucket labels are hardcoded ("Positive" /
 *     "Neutral" / "Negative"); handles aren't sentence-case-able;
 *     toneInsight prose is human-shaped by buildToneInsight upstream.
 *
 * Out of scope:
 *   - extractToneAnalysis / extractToneBySourceOrigin /
 *     extractToneBySelling / extractToneByPolitical beyond consumption
 *   - LockedOverlayCard (legacy, kept until cross-tab cleanup)
 *   - The legacy "Deeper analysis" master toggle (dropped this build —
 *     each section is its own ExpandableCard, all collapsed by default)
 *   - The legacy EvidenceBundleTeaser + FreeAskTeaser components are
 *     dropped consistent with Sources/Politics/Ads/Suggested
 *   - The legacy footer "Master numbers line" — covered by the
 *     toneInsight.meta string consumed via the hero description
 */
import React from 'react';
import { View, Text } from 'react-native';
import type {
  DashboardData,
  ToneBySourceOrigin,
} from '../../lib/computeDashboardData';
import { LockedOverlayCard } from '../../components/plan/LockedOverlayCard';
import {
  Card,
  CategoryRow,
  ComparisonPair,
  DisclosureRow,
  ExpandableCard,
  HeroStatCard,
  Icon,
  StackedBar,
} from '../../design-system';
import { colors, layout, spacing, type as typeTokens } from '../../design-tokens/tokens';

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export interface ToneTabProps {
  data: DashboardData;
  isPlus: boolean;
  onUpgrade: () => void;
}

/** Render `@handle` if missing the prefix; otherwise pass through.
 *  Mirrors the fallback half from SourcesTab; the `displayName ??`
 *  half isn't reachable here because ToneSourceStat doesn't carry
 *  displayName (see file-level data-integrity note). */
function formatToneHandle(handle: string): string {
  if (!handle) return '';
  return handle.startsWith('@') ? handle : `@${handle}`;
}

/**
 * Derive a short delta caption for the suggested-vs-followed
 * ComparisonPair.
 *
 * Returns a string when both sides have > 5 posts AND at least one of
 * the three tone percentages differs by >= 10 percentage points
 * between sides. Picks the largest absolute delta. Returns null when
 * conditions aren't met — caller passes the result directly to the
 * ComparisonPair `deltaInsight` prop (which already treats null as
 * "omit the caption entirely").
 *
 * Phrasing is epistemic-restraint-style: states the observation
 * neutrally without interpreting cause.
 */
function deriveToneBySourceDelta(tbso: ToneBySourceOrigin): string | null {
  const { suggested, followed } = tbso;
  if (!suggested || !followed) return null;
  if (suggested.total <= 5 || followed.total <= 5) return null;

  const deltas: Array<{ tone: 'positive' | 'neutral' | 'negative'; delta: number }> = [
    { tone: 'positive', delta: suggested.positivePct - followed.positivePct },
    { tone: 'neutral', delta: suggested.neutralPct - followed.neutralPct },
    { tone: 'negative', delta: suggested.negativePct - followed.negativePct },
  ];

  // Keep only deltas with magnitude >= 10pp.
  const significant = deltas.filter((d) => Math.abs(d.delta) >= 10);
  if (significant.length === 0) return null;

  // Pick the largest-magnitude delta (multiple may qualify).
  const biggest = significant.reduce((a, b) =>
    Math.abs(a.delta) >= Math.abs(b.delta) ? a : b
  );

  const side = biggest.delta > 0 ? 'Suggested' : 'Followed';
  const points = Math.abs(biggest.delta);
  const pointWord = points === 1 ? 'percentage point' : 'percentage points';
  return `${side} posts contained ${points} ${pointWord} more ${biggest.tone} content.`;
}

export function ToneTab({ data, isPlus, onUpgrade }: ToneTabProps) {
  const insight = data.toneInsight;
  const howWeMeasure = insight.howWeMeasure;
  const analysis = data.toneAnalysis;

  // ── Empty state ──────────────────────────────────────────
  // Triggered when toneAnalysis is null (no AI) OR when AI ran but
  // knownValenceTotal === 0 (no tone signals detected). Either way,
  // buildToneInsight has already shaped toneInsight title/meaning/
  // whyCare for the appropriate branch.
  if (!data.hasToneData) {
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

  // ── Main path (hasToneData true) ─────────────────────────
  // Narrowing: hasToneData implies toneAnalysis !== null AND
  // knownValenceTotal > 0. We still use optional chaining + defaults
  // on the rare path where TS can't follow the narrowing through the
  // boolean `data.hasToneData`.
  const positivePct = analysis?.positivePct ?? 0;
  const neutralPct = analysis?.neutralPct ?? 0;
  const negativePct = analysis?.negativePct ?? 0;
  const positiveCount = analysis?.positiveCount ?? 0;
  const neutralCount = analysis?.neutralCount ?? 0;
  const negativeCount = analysis?.negativeCount ?? 0;
  const knownValenceTotal = analysis?.knownValenceTotal ?? 0;
  const lowSample = analysis?.lowSample ?? false;

  // Hero bucket logic — show the dominant-tone label when one bucket
  // hits 50%+, otherwise "Mixed tone".
  let heroValue: number;
  let heroLabel: string;
  let heroDescription: string;

  if (positivePct >= 50) {
    heroValue = positivePct;
    heroLabel = 'Mostly positive';
    heroDescription = 'Most posts felt positive or supportive.';
  } else if (negativePct >= 50) {
    heroValue = negativePct;
    heroLabel = 'Mostly negative';
    heroDescription = 'Most posts felt critical or negative.';
  } else if (neutralPct >= 50) {
    heroValue = neutralPct;
    heroLabel = 'Mostly neutral';
    heroDescription = 'Most posts appeared balanced or factual.';
  } else {
    // Mixed: surface the dominant tone's number but label as mixed.
    heroValue = Math.max(positivePct, neutralPct, negativePct);
    heroLabel = 'Mixed tone';
    heroDescription = `${positivePct}% positive, ${neutralPct}% neutral, ${negativePct}% negative.`;
  }

  const heroCaution = lowSample
    ? `Based on ${knownValenceTotal} posts with identifiable tone. Interpret with care.`
    : undefined;

  // Headline for the tone-distribution card: show the dominant pct so
  // the collapsed-card surface communicates state without expanding.
  const distributionHeadline =
    positivePct >= neutralPct && positivePct >= negativePct
      ? `${positivePct}% positive`
      : negativePct >= neutralPct
        ? `${negativePct}% negative`
        : `${neutralPct}% neutral`;

  // Derive the suggested-vs-followed delta caption ahead of render so
  // the presentation reads cleanly.
  const toneBySourceDelta = data.toneBySourceOrigin?.hasData
    ? deriveToneBySourceDelta(data.toneBySourceOrigin)
    : null;

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
        value={String(heroValue)}
        unit="%"
        label={heroLabel}
        description={heroDescription}
        caution={heroCaution}
      />

      {/* ── 2. AI disclosure ─────────────────────────────────── */}
      <AIDisclosure />

      {/* ── 3. Tone distribution ────────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <ExpandableCard
          icon="bar-chart-3"
          title="Tone distribution"
          headline={distributionHeadline}
          defaultOpen
        >
          <StackedBar
            segments={[
              { label: 'Positive', value: positivePct, color: 'success' },
              { label: 'Neutral', value: neutralPct, color: 'textTertiary' },
              { label: 'Negative', value: negativePct, color: 'textSecondary' },
            ]}
            accessibilityLabel={`Tone distribution: positive ${positivePct}%, neutral ${neutralPct}%, negative ${negativePct}%`}
          />
          <View style={{ marginTop: spacing.s3 }}>
            <CategoryRow
              label="Positive"
              value={`${positivePct}% (${positiveCount})`}
            />
            <CategoryRow
              label="Neutral"
              value={`${neutralPct}% (${neutralCount})`}
            />
            <CategoryRow
              label="Negative"
              value={`${negativePct}% (${negativeCount})`}
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
            Sentiment analysis is approximate. Sarcasm and irony are difficult to detect.
          </Text>
        </ExpandableCard>
      </View>

      {/* ── 4. Most positive sources ────────────────────────── */}
      {data.topPositiveSources.length > 0 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Most positive sources"
            headline={`${data.topPositiveSources.length} ${data.topPositiveSources.length === 1 ? 'source' : 'sources'}`}
          >
            {data.topPositiveSources.map((source, i) => (
              <CategoryRow
                key={`pos-${source.handle}-${i}`}
                label={formatToneHandle(source.handle)}
                value={String(source.count)}
                last={i === data.topPositiveSources.length - 1}
              />
            ))}
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 5. Most negative sources ────────────────────────── */}
      {data.topNegativeSources.length > 0 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Most negative sources"
            headline={`${data.topNegativeSources.length} ${data.topNegativeSources.length === 1 ? 'source' : 'sources'}`}
          >
            {data.topNegativeSources.map((source, i) => (
              <CategoryRow
                key={`neg-${source.handle}-${i}`}
                label={formatToneHandle(source.handle)}
                value={String(source.count)}
                last={i === data.topNegativeSources.length - 1}
              />
            ))}
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 6. Tone: suggested vs followed ──────────────────── */}
      {/* Gated on hasData AND both sides populated. The deltaInsight
          is derived above in `toneBySourceDelta`; null when the
          difference is too small or sample too small. */}
      {data.toneBySourceOrigin?.hasData &&
      data.toneBySourceOrigin.suggested &&
      data.toneBySourceOrigin.followed ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Tone: suggested vs followed"
          >
            <ComparisonPair
              left={{
                label: 'Suggested posts',
                denominator: `Based on ${data.toneBySourceOrigin.suggested.total} suggested ${data.toneBySourceOrigin.suggested.total === 1 ? 'post' : 'posts'} with known tone`,
                segments: [
                  { label: 'Positive', value: data.toneBySourceOrigin.suggested.positivePct, color: 'success' },
                  { label: 'Neutral', value: data.toneBySourceOrigin.suggested.neutralPct, color: 'textTertiary' },
                  { label: 'Negative', value: data.toneBySourceOrigin.suggested.negativePct, color: 'textSecondary' },
                ],
                accessibilityLabel: `Suggested posts tone: positive ${data.toneBySourceOrigin.suggested.positivePct}%, neutral ${data.toneBySourceOrigin.suggested.neutralPct}%, negative ${data.toneBySourceOrigin.suggested.negativePct}%`,
              }}
              right={{
                label: 'Followed posts',
                denominator: `Based on ${data.toneBySourceOrigin.followed.total} followed ${data.toneBySourceOrigin.followed.total === 1 ? 'post' : 'posts'} with known tone`,
                segments: [
                  { label: 'Positive', value: data.toneBySourceOrigin.followed.positivePct, color: 'success' },
                  { label: 'Neutral', value: data.toneBySourceOrigin.followed.neutralPct, color: 'textTertiary' },
                  { label: 'Negative', value: data.toneBySourceOrigin.followed.negativePct, color: 'textSecondary' },
                ],
                accessibilityLabel: `Followed posts tone: positive ${data.toneBySourceOrigin.followed.positivePct}%, neutral ${data.toneBySourceOrigin.followed.neutralPct}%, negative ${data.toneBySourceOrigin.followed.negativePct}%`,
              }}
              deltaInsight={toneBySourceDelta}
            />
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 7. Tone: political vs non-political ─────────────── */}
      {/* ToneByPolitical has no `hasData` field — null at the
          DashboardData level when absent. Null-check is the guard. */}
      {data.toneByPolitical ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Tone: political vs non-political"
          >
            <ComparisonPair
              left={{
                label: 'Political posts',
                denominator: `Based on ${data.toneByPolitical.political.total} political ${data.toneByPolitical.political.total === 1 ? 'post' : 'posts'} with known tone`,
                segments: [
                  { label: 'Positive', value: data.toneByPolitical.political.positivePct, color: 'success' },
                  { label: 'Neutral', value: data.toneByPolitical.political.neutralPct, color: 'textTertiary' },
                  { label: 'Negative', value: data.toneByPolitical.political.negativePct, color: 'textSecondary' },
                ],
                accessibilityLabel: `Political posts tone: positive ${data.toneByPolitical.political.positivePct}%, neutral ${data.toneByPolitical.political.neutralPct}%, negative ${data.toneByPolitical.political.negativePct}%`,
              }}
              right={{
                label: 'Non-political posts',
                denominator: `Based on ${data.toneByPolitical.nonPolitical.total} non-political ${data.toneByPolitical.nonPolitical.total === 1 ? 'post' : 'posts'} with known tone`,
                segments: [
                  { label: 'Positive', value: data.toneByPolitical.nonPolitical.positivePct, color: 'success' },
                  { label: 'Neutral', value: data.toneByPolitical.nonPolitical.neutralPct, color: 'textTertiary' },
                  { label: 'Negative', value: data.toneByPolitical.nonPolitical.negativePct, color: 'textSecondary' },
                ],
                accessibilityLabel: `Non-political posts tone: positive ${data.toneByPolitical.nonPolitical.positivePct}%, neutral ${data.toneByPolitical.nonPolitical.neutralPct}%, negative ${data.toneByPolitical.nonPolitical.negativePct}%`,
              }}
              deltaInsight={
                data.toneByPolitical.biggestDifference
                  ? `Based on observable data: ${data.toneByPolitical.biggestDifference}`
                  : null
              }
            />
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 8. Tone: selling vs not selling ─────────────────── */}
      {/* ToneBySelling has no `hasData` field — null at the
          DashboardData level when absent. Null-check is the guard. */}
      {data.toneBySelling ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Tone: selling vs not selling"
          >
            <ComparisonPair
              left={{
                label: 'Selling posts',
                denominator: `Based on ${data.toneBySelling.selling.total} selling ${data.toneBySelling.selling.total === 1 ? 'post' : 'posts'} with known tone`,
                segments: [
                  { label: 'Positive', value: data.toneBySelling.selling.positivePct, color: 'success' },
                  { label: 'Neutral', value: data.toneBySelling.selling.neutralPct, color: 'textTertiary' },
                  { label: 'Negative', value: data.toneBySelling.selling.negativePct, color: 'textSecondary' },
                ],
                accessibilityLabel: `Selling posts tone: positive ${data.toneBySelling.selling.positivePct}%, neutral ${data.toneBySelling.selling.neutralPct}%, negative ${data.toneBySelling.selling.negativePct}%`,
              }}
              right={{
                label: 'Non-selling posts',
                denominator: `Based on ${data.toneBySelling.notSelling.total} non-selling ${data.toneBySelling.notSelling.total === 1 ? 'post' : 'posts'} with known tone`,
                segments: [
                  { label: 'Positive', value: data.toneBySelling.notSelling.positivePct, color: 'success' },
                  { label: 'Neutral', value: data.toneBySelling.notSelling.neutralPct, color: 'textTertiary' },
                  { label: 'Negative', value: data.toneBySelling.notSelling.negativePct, color: 'textSecondary' },
                ],
                accessibilityLabel: `Non-selling posts tone: positive ${data.toneBySelling.notSelling.positivePct}%, neutral ${data.toneBySelling.notSelling.neutralPct}%, negative ${data.toneBySelling.notSelling.negativePct}%`,
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

      {/* ── 9. Plus: Rare content detection ─────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <LockedOverlayCard locked={!isPlus} onUpgrade={onUpgrade}>
          <ExpandableCard
            icon="trending-up"
            title="Rare content detection"
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
                Plus surfaces topics and emotional themes that rarely appear in your feed across scans. Useful for spotting blind spots in what the platform shows you.
              </Text>
            </Card>
          </ExpandableCard>
        </LockedOverlayCard>
      </View>

      {/* ── 10. About this measurement ──────────────────────── */}
      {howWeMeasure ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard icon="info" title="About this measurement">
            <MethodologySections howWeMeasure={howWeMeasure} />
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 11. About this analysis ─────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <DisclosureRow label="About this analysis" />
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Local: AI disclosure
//
// Passive informational line shown beneath the hero. Sparkles icon
// plus caption-sized text in textSecondary. No chevron, no tap target,
// no interactive accessibility role — purely declarative provenance
// for the Gemini-AI-derived tone signals. Used in both the main path
// and the empty state so the disclosure travels with the screen
// regardless of whether tone data was found.
//
// Copy is slightly more specific than the other tabs' AIDisclosure
// (mentions sentiment approximation explicitly) because tone is the
// most subjective of the AI-classified dimensions.
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
        Tone classification by Google Gemini AI. Sentiment analysis is approximate.
      </Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Local: methodology sub-sections renderer
//
// Same shape as PoliticsTab/AdsTab/SuggestedTab's MethodologySections.
// Duplicated rather than shared so each redesigned tab stays
// self-contained; the design system can promote this to a shared
// primitive in a follow-up sweep now that all five tabs use the
// identical contract.
// ────────────────────────────────────────────────────────────

interface MethodologySectionsProps {
  howWeMeasure: NonNullable<DashboardData['toneInsight']['howWeMeasure']>;
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
