/**
 * OverviewTab — redesigned Dashboard Overview tab.
 *
 * Wires the existing data hooks (useDashboard / computeDashboardData) to
 * the new design system primitives in `src/design-system/`. This file is
 * the presentation layer ONLY — no Supabase, no Sentry, no analysis logic.
 *
 * Section order (matches `design-handoff/ui_kits/ios_app/app.jsx`):
 *   1. Hero stat
 *   2. "Explore your data": Content types · Time estimate · Content patterns
 *   3. Top influencers
 *   4. How the feedback loop works (collapsed by default)
 *   5. AI-made content (collapsed)
 *   6. Trends over time (collapsed; Plus-gated via LockedOverlayCard)
 *   7. Ideas to explore (collapsed)
 *   8. About this analysis (DisclosureRow)
 *
 * Hero priority logic and supporting-metric derivation are preserved
 * from the previous OverviewContent (suggested>60 → ads>15 → top5>70 →
 * total posts) — the design renders only the suggested-pct hero, but
 * the project's existing rule is to pick the most informative one.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import type { DashboardData } from '../../lib/computeDashboardData';
import { toSentenceCase } from '../../lib/string-utils';
import { LockedOverlayCard } from '../../components/plan/LockedOverlayCard';
import {
  AttributeCard,
  CategoryRow,
  DisclosureRow,
  ExpandableCard,
  FeedbackLoopStep,
  HeroStatCard,
  InfluencerRow,
  SectionHeader,
} from '../../design-system';
import { Card } from '../../design-system/Card';
import { colors, layout, spacing, type as typeTokens } from '../../design-tokens/tokens';
import { Text } from 'react-native';

// ────────────────────────────────────────────────────────────
// Hero priority — preserved from the previous OverviewContent.
// ────────────────────────────────────────────────────────────

interface HeroStat {
  value: string;
  unit: string;
  label: string;
  description: string;
  /** Identifier used to suppress the same metric from the supporting list. */
  key: 'suggested' | 'ads' | 'top5' | 'topCreator' | 'total';
}

function pickHeroStat(data: DashboardData): HeroStat | null {
  if (data.suggestedPct > 60) {
    return {
      value: String(data.suggestedPct),
      unit: '%',
      label: "came from accounts you don't follow",
      description: `Suggested-to-followed ratio across ${data.totalPosts} posts in this session.`,
      key: 'suggested',
    };
  }
  if (data.adPct > 15) {
    const adWord = data.adCount === 1 ? 'ad' : 'ads';
    return {
      value: String(data.adPct),
      unit: '%',
      label: 'of your feed was sponsored content',
      description: `${data.adCount} ${adWord} in ${data.totalPosts} posts scanned.`,
      key: 'ads',
    };
  }
  if (data.top5Pct > 70 && data.topCreators.length >= 5) {
    return {
      value: String(data.top5Pct),
      unit: '%',
      label: 'of your feed came from just 5 accounts',
      description: 'A small number of sources dominate what you see.',
      key: 'top5',
    };
  }
  // Top-creator-share fallback. When none of the broader patterns trigger,
  // it's still useful to surface single-creator concentration — that's a
  // real signal even when the suggested/ads/top-5 thresholds aren't met.
  //
  // Phrasing keeps the label short and scannable ("from your top source")
  // while the longer creator name lives in the description below, where
  // verbose handles like "@Home Hacks & Easy Snacks" look natural rather
  // than overflowing the hero's prominent label line.
  if (data.topCreators.length >= 1 && data.totalPosts > 0) {
    const top = data.topCreators[0]!;
    const share = Math.round((top.count / data.totalPosts) * 100);
    const displayName =
      top.displayName ?? (top.name.startsWith('@') ? top.name : `@${top.name}`);
    return {
      value: String(share),
      unit: '%',
      label: 'from your top source',
      description: `${displayName} dominates this session.`,
      key: 'topCreator',
    };
  }
  // Defensive floor — should be unreachable when totalPosts > 0 and at
  // least one creator was identified. Kept so an unusual scan doesn't
  // produce a null hero.
  if (data.totalPosts > 0) {
    return {
      value: String(data.totalPosts),
      unit: '',
      label: 'posts scanned',
      description: 'A snapshot of your feed composition from this session.',
      key: 'total',
    };
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// Time estimate.
//
// The 45-minute daily-social-media baseline is hardcoded as a presentation
// constant. TODO: surface as a user setting (or server-driven default)
// once the corresponding settings UI exists. Per the design's worked
// example: "4 min/day on ads. Based on average daily usage of 45 minutes."
// ────────────────────────────────────────────────────────────

const DAILY_USAGE_MINUTES = 45;

function timeEstimateForPercent(pct: number): number {
  // Round to whole minutes per design treatment (no fractional).
  return Math.round((pct / 100) * DAILY_USAGE_MINUTES);
}

// ────────────────────────────────────────────────────────────
// Content patterns — derive 6 attributes from existing fields.
// Matches the labels used in the design's prototype.
// ────────────────────────────────────────────────────────────

interface ContentPattern {
  label: string;
  value: string;
  /** When true, the value renders in brand-accent (positive interpretive). */
  accent?: boolean;
}

function deriveContentPatterns(data: DashboardData): ContentPattern[] {
  const out: ContentPattern[] = [];

  // Top interests — read from the real topic-frequency arrays
  // (data.topTopicsBySuggested and data.topTopicsByFollowed). These are
  // subject-matter topics extracted by the Gemini analysis (food, news,
  // sports, etc.), NOT content formats (Photo / Video). Combine the two
  // arrays, dedupe by topic, sort by count descending, and take the top 2.
  // Both arrays must have ≥1 entry — when either is empty, we don't have
  // enough cross-cutting signal to claim a "Top interests" pattern.
  const sug = data.topTopicsBySuggested ?? [];
  const fol = data.topTopicsByFollowed ?? [];
  let topInterests: string;
  if (sug.length >= 1 && fol.length >= 1) {
    const merged = new Map<string, number>();
    for (const t of [...sug, ...fol]) {
      merged.set(t.topic, (merged.get(t.topic) ?? 0) + t.count);
    }
    const top2 = [...merged.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([topic]) => toSentenceCase(topic));
    topInterests = top2.length > 0 ? top2.join(', ') : 'Not enough data';
  } else {
    topInterests = 'Not enough data';
  }
  out.push({ label: 'Top interests', value: topInterests });

  // Emotional signal — pulled from toneAnalysis when present.
  if (data.toneAnalysis && !data.toneAnalysis.lowSample) {
    const t = data.toneAnalysis;
    let value = 'Balanced';
    let accent = true;
    if (t.positivePct >= 60) {
      value = 'Mostly positive';
    } else if (t.negativePct >= 40) {
      value = 'Negative-leaning';
      accent = false;
    } else if (t.neutralPct >= 60) {
      value = 'Mostly neutral';
    }
    out.push({ label: 'Emotional signal', value, accent });
  } else {
    out.push({ label: 'Emotional signal', value: 'Not enough data' });
  }

  // Political exposure — derived from politicalAnalysis.
  if (data.politicalAnalysis && !data.politicalAnalysis.lowSample) {
    const pp = data.politicalAnalysis.politicalPct;
    let value: string;
    let accent: boolean | undefined;
    if (pp >= 30) {
      value = 'Heavy';
    } else if (pp >= 10) {
      value = 'Moderate';
    } else {
      value = 'Light';
      accent = true;
    }
    out.push({ label: 'Political exposure', value, accent });
  } else {
    out.push({ label: 'Political exposure', value: 'Not enough data' });
  }

  // Content style — from suggested-vs-followed ratio.
  let style: string;
  let styleAccent: boolean | undefined;
  if (data.suggestedPct >= 60) {
    style = 'Suggestion-driven';
  } else if (data.followedPct >= 60) {
    style = 'Following-driven';
    styleAccent = true;
  } else {
    style = 'Mixed';
  }
  out.push({ label: 'Content style', value: style, accent: styleAccent });

  // Source diversity — from top5 concentration.
  let diversity: string;
  let diversityAccent: boolean | undefined;
  if (data.top5Pct >= 70) {
    diversity = 'Concentrated';
  } else if (data.top5Pct >= 40) {
    diversity = 'Moderate';
  } else {
    diversity = 'Diverse';
    diversityAccent = true;
  }
  out.push({ label: 'Source diversity', value: diversity, accent: diversityAccent });

  // Commercial presence — from adPct.
  let commercial: string;
  let commercialAccent: boolean | undefined;
  if (data.adPct >= 20) {
    commercial = 'Heavy ads';
  } else if (data.adPct >= 10) {
    commercial = 'Moderate ads';
  } else {
    commercial = 'Light ads';
    commercialAccent = true;
  }
  out.push({ label: 'Commercial presence', value: commercial, accent: commercialAccent });

  return out;
}

// ────────────────────────────────────────────────────────────
// AI-made content headline.
// Per defaults: "No data" when aiContentAnalysis is null,
// else "${labeledCount} of ${totalVisualPosts}" derived headline.
// ────────────────────────────────────────────────────────────

function aiHeadline(data: DashboardData): string {
  const ai = data.aiContentAnalysis;
  if (!ai || ai.totalVisualPosts === 0) {
    return 'No data';
  }
  return `${ai.labeledCount} of ${ai.totalVisualPosts}`;
}

// ────────────────────────────────────────────────────────────
// Static "Ideas to explore" prompts — design ships exactly these three.
// ────────────────────────────────────────────────────────────

const IDEAS_TO_EXPLORE: readonly string[] = [
  'Try following five accounts that post outside your top three categories. Re-scan in a week.',
  'Mute one source from your top five and see whether the suggested ratio shifts.',
  'Compare this session against a scan from a different platform to see whether patterns hold.',
];

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export interface OverviewTabProps {
  data: DashboardData;
  isPlus: boolean;
  onUpgrade: () => void;
  /** Tap handler for the bottom "About this analysis" row. */
  onAboutPress?: () => void;
}

export function OverviewTab({ data, isPlus, onUpgrade, onAboutPress }: OverviewTabProps) {
  const heroStat = useMemo(() => pickHeroStat(data), [data]);
  const adsMinPerDay = useMemo(() => timeEstimateForPercent(data.adPct), [data.adPct]);
  const politicalPct = data.politicalAnalysis?.politicalPct ?? 0;
  const politicalMinPerDay = useMemo(
    () => timeEstimateForPercent(politicalPct),
    [politicalPct]
  );
  const patterns = useMemo(() => deriveContentPatterns(data), [data]);
  const topInfluencers = data.topCreators.slice(0, 5);

  // Caution copy on hero when sample is small.
  const heroCaution = data.totalPosts < 12 ? `Based on ${data.totalPosts} posts. Interpret with care.` : undefined;

  return (
    <View
      style={{
        paddingHorizontal: layout.screenPaddingX,
        paddingTop: layout.screenPaddingY,
        paddingBottom: spacing.s7,
      }}
    >
      {/* ── 1. Hero stat ───────────────────────────────────────── */}
      {heroStat ? (
        <HeroStatCard
          value={heroStat.value}
          unit={heroStat.unit}
          label={heroStat.label}
          description={heroStat.description}
          caution={heroCaution}
        />
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
            No scan data yet. Run a scan to see your feed composition.
          </Text>
        </Card>
      )}

      {/* ── 2. Explore your data ───────────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <SectionHeader>Explore your data</SectionHeader>
        <View style={{ gap: spacing.s3 }}>
          {/* Content types — defaultOpen */}
          <ExpandableCard
            icon="bar-chart-3"
            title="Content types"
            headline={`${data.contentTypes.length} types`}
            defaultOpen
          >
            {data.contentTypes.length === 0 ? (
              <Text
                style={{
                  fontSize: typeTokens.body.fontSize,
                  lineHeight: typeTokens.body.lineHeight,
                  color: colors.textSecondary,
                }}
              >
                Content type data not available for this scan.
              </Text>
            ) : (
              data.contentTypes.map((t, i) => (
                <CategoryRow
                  key={t.label}
                  label={toSentenceCase(t.label)}
                  value={`${t.percentage}%`}
                  last={i === data.contentTypes.length - 1}
                />
              ))
            )}
          </ExpandableCard>

          {/* Time estimate */}
          <ExpandableCard
            icon="clock"
            title="Time estimate"
            headline={`${adsMinPerDay} min ads/day`}
          >
            <View style={{ flexDirection: 'row', gap: spacing.s3 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.bgSecondary,
                  borderRadius: 10,
                  paddingVertical: spacing.s4,
                  paddingHorizontal: spacing.s4,
                }}
              >
                <Text
                  style={{
                    fontSize: typeTokens.display.fontSize,
                    lineHeight: 36,
                    fontWeight: typeTokens.display.fontWeight,
                    color: colors.textPrimary,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {adsMinPerDay}
                </Text>
                <Text
                  style={{
                    fontSize: typeTokens.caption.fontSize,
                    lineHeight: typeTokens.caption.lineHeight,
                    fontWeight: typeTokens.caption.fontWeight,
                    color: colors.textSecondary,
                    marginTop: spacing.s1,
                  }}
                >
                  min/day on ads
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.bgSecondary,
                  borderRadius: 10,
                  paddingVertical: spacing.s4,
                  paddingHorizontal: spacing.s4,
                }}
              >
                <Text
                  style={{
                    fontSize: typeTokens.display.fontSize,
                    lineHeight: 36,
                    fontWeight: typeTokens.display.fontWeight,
                    color: colors.textPrimary,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {politicalMinPerDay}
                </Text>
                <Text
                  style={{
                    fontSize: typeTokens.caption.fontSize,
                    lineHeight: typeTokens.caption.lineHeight,
                    fontWeight: typeTokens.caption.fontWeight,
                    color: colors.textSecondary,
                    marginTop: spacing.s1,
                  }}
                >
                  min/day on political content
                </Text>
              </View>
            </View>
            <Text
              style={{
                fontSize: typeTokens.caption.fontSize,
                lineHeight: typeTokens.caption.lineHeight,
                color: colors.textSecondary,
                marginTop: spacing.s3,
              }}
            >
              Based on average daily social media usage of {DAILY_USAGE_MINUTES} minutes.
            </Text>
          </ExpandableCard>

          {/* Content patterns */}
          <ExpandableCard
            icon="trending-up"
            title="Content patterns"
            headline={data.toneAnalysis?.positivePct && data.toneAnalysis.positivePct >= 60 ? 'Mostly positive' : 'Mostly neutral'}
          >
            {/* 2-col grid: render two rows each containing two cells. */}
            <View style={{ gap: spacing.s3 - 2 }}>
              {[0, 2, 4].map((startIdx) => (
                <View
                  key={startIdx}
                  style={{ flexDirection: 'row', gap: spacing.s3 - 2 }}
                >
                  {patterns.slice(startIdx, startIdx + 2).map((p) => (
                    <AttributeCard
                      key={p.label}
                      label={p.label}
                      value={p.value}
                      accent={p.accent}
                    />
                  ))}
                </View>
              ))}
            </View>
            <Text
              style={{
                fontSize: typeTokens.caption.fontSize,
                lineHeight: typeTokens.caption.lineHeight,
                color: colors.textSecondary,
                marginTop: spacing.s3,
              }}
            >
              Labels are inferred from feed content only. Actual platform categorization may differ.
            </Text>
          </ExpandableCard>
        </View>
      </View>

      {/* ── 3. Top influencers ─────────────────────────────────── */}
      {topInfluencers.length > 0 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <SectionHeader>Top influencers</SectionHeader>
          <View
            style={{
              backgroundColor: colors.bgPrimary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {topInfluencers.map((c, i) => {
              // CreatorStat uses `name` (the raw handle) and `displayName`
              // (the human-readable title, e.g. for YouTube channels).
              // Prefer displayName when present so "Fox News" reads better
              // than "@FoxNews"; fall back to the @-handle otherwise.
              const display = c.displayName ?? (c.name.startsWith('@') ? c.name : `@${c.name}`);
              return (
                <InfluencerRow
                  key={`${c.name}-${i}`}
                  handle={display}
                  posts={c.count}
                  ads={0}
                  last={i === topInfluencers.length - 1}
                />
              );
            })}
          </View>
        </View>
      ) : null}

      {/* ── 4. How the feedback loop works ─────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <ExpandableCard icon="info" title="How the feedback loop works">
          <FeedbackLoopStep
            n={1}
            title="Your behavior"
            body="What you pause on, like, share, and skip sends signals to the platform."
          />
          <FeedbackLoopStep
            n={2}
            title="Patterns accumulate"
            body="Over time, recurring topics and content types form observable patterns in your feed."
          />
          <FeedbackLoopStep
            n={3}
            title="Content is tailored"
            body="Your feed composition reflects what has appeared. We cannot know why specific content was selected."
          />
          <FeedbackLoopStep
            n={4}
            title="Your media diet evolves"
            body="Each interaction reinforces or shifts the cycle. Small changes can move the needle."
            last
          />
        </ExpandableCard>
      </View>

      {/* ── 5. AI-made content ─────────────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <ExpandableCard icon="sparkles" title="AI-made content" headline={aiHeadline(data)}>
          <Text
            style={{
              fontSize: typeTokens.body.fontSize,
              lineHeight: typeTokens.body.lineHeight,
              color: colors.textSecondary,
              // Tabular for the embedded "X of Y" / "N had no signals" counts.
              fontVariant: ['tabular-nums'],
            }}
          >
            {data.aiContentAnalysis && data.aiContentAnalysis.totalVisualPosts > 0
              ? `${data.aiContentAnalysis.labeledCount} of ${data.aiContentAnalysis.totalVisualPosts} visual posts carried an AI-disclosure label. ${data.aiContentAnalysis.noSignalsCount} had no detectable signals.`
              : 'AI content detection is not available for this scan. Future scans will include AI disclosure analysis for visual content.'}
          </Text>
        </ExpandableCard>
      </View>

      {/* ── 6. Trends over time ────────────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <LockedOverlayCard locked={!isPlus} onUpgrade={onUpgrade}>
          <ExpandableCard icon="trending-up" title="Trends over time" headline="Not yet">
            <View style={{ gap: spacing.s3 - 2 }}>
              <View
                style={{
                  backgroundColor: colors.bgSecondary,
                  borderRadius: 10,
                  padding: spacing.s4,
                }}
              >
                <Text
                  style={{
                    fontSize: typeTokens.caption.fontSize,
                    lineHeight: typeTokens.caption.lineHeight,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: spacing.s1,
                  }}
                >
                  Source concentration over time
                </Text>
                <Text
                  style={{
                    fontSize: typeTokens.caption.fontSize,
                    lineHeight: typeTokens.caption.lineHeight,
                    color: colors.textSecondary,
                  }}
                >
                  This data appears after scanning more content.
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.bgSecondary,
                  borderRadius: 10,
                  padding: spacing.s4,
                }}
              >
                <Text
                  style={{
                    fontSize: typeTokens.caption.fontSize,
                    lineHeight: typeTokens.caption.lineHeight,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: spacing.s1,
                  }}
                >
                  Ad density over time
                </Text>
                <Text
                  style={{
                    fontSize: typeTokens.caption.fontSize,
                    lineHeight: typeTokens.caption.lineHeight,
                    color: colors.textSecondary,
                  }}
                >
                  This data appears after scanning more content.
                </Text>
              </View>
            </View>
          </ExpandableCard>
        </LockedOverlayCard>
      </View>

      {/* ── 7. Ideas to explore ────────────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <ExpandableCard icon="lightbulb" title="Ideas to explore" headline={`${IDEAS_TO_EXPLORE.length} prompts`}>
          <View style={{ gap: spacing.s3 - 2 }}>
            {IDEAS_TO_EXPLORE.map((s, i) => (
              <View
                key={i}
                style={{ flexDirection: 'row', gap: spacing.s3, alignItems: 'flex-start' }}
              >
                <Text
                  style={{
                    width: 16,
                    fontSize: typeTokens.caption.fontSize,
                    lineHeight: typeTokens.caption.lineHeight,
                    fontWeight: '600',
                    color: colors.brandPrimary,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: typeTokens.body.fontSize,
                    lineHeight: typeTokens.body.lineHeight,
                    color: colors.textPrimary,
                  }}
                >
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </ExpandableCard>
      </View>

      {/* ── 8. About this analysis ─────────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <DisclosureRow label="About this analysis" onPress={onAboutPress} />
      </View>
    </View>
  );
}
