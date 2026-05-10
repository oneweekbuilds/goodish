/**
 * SourcesTab — redesigned "Who Shapes Your Feed" tab.
 *
 * Wires existing data hooks (useDashboard / computeDashboardData) to the
 * design system primitives in `src/design-system/`. Mirrors the structure
 * established by OverviewTab.tsx in builds #48-50.
 *
 * Section order:
 *   1. Hero stat (top-5 concentration, top-creator share, or unique-source fallback)
 *   2. Top creators (InfluencerRow stack, displayName ?? @name fallback)
 *   3. Source concentration (ExpandableCard with StackedBar)
 *   4. About this measurement (ExpandableCard, How We Measure prose)
 *   5. Plus: creator breakdowns (LockedOverlayCard wrapping ExpandableCard)
 *   6. About this analysis (DisclosureRow)
 *
 * Data integrity (lessons from build #50):
 *   - Apply `displayName ?? @name` fallback to every CreatorStat render
 *   - Apply `toSentenceCase` to any data-layer-derived display strings
 *
 * Out of scope (preserved as-is):
 *   - useDashboard / computeDashboardData / data layer
 *   - LockedOverlayCard (legacy, kept until cross-tab cleanup)
 *   - sourcesInsight builder (kept; we consume title/meaning/whyCare/meta
 *     through the new primitives)
 */
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import type { DashboardData } from '../../lib/computeDashboardData';
import { LockedOverlayCard } from '../../components/plan/LockedOverlayCard';
import {
  Card,
  CategoryRow,
  DisclosureRow,
  ExpandableCard,
  HeroStatCard,
  InfluencerRow,
  SectionHeader,
  StackedBar,
} from '../../design-system';
import { colors, layout, spacing, type as typeTokens } from '../../design-tokens/tokens';
// `toSentenceCase` from `lib/string-utils` is deliberately NOT imported here:
// Sources doesn't render any data-layer-derived enum strings (no contentTypes,
// no topics, no Gemini-classified labels). All strings on this tab are either
// human-shaped from `sourcesInsight` (already sentence-cased upstream) or
// hard-coded copy. If Sources ever grows a Gemini-classified field, import
// it then.

// ────────────────────────────────────────────────────────────
// Hero priority
// ────────────────────────────────────────────────────────────
//
// Three-tier priority chain per the build #51 spec:
//   1. top5Pct >= 70 AND topCreators.length >= 5 → top-5 concentration
//   2. topCreators.length >= 1 → top-creator share, with displayName label
//   3. Else → uniqueCreatorCount fallback
//
// Caution badge layered onto whichever tier wins when totalPosts < 12.

interface HeroStat {
  value: string;
  unit: string;
  label: string;
  description?: string;
  /** Identifier — currently informational; reserved for any future
   *  supporting-metric-suppression logic. */
  key: 'top5' | 'topCreator' | 'uniqueSources';
}

function pickHeroStat(data: DashboardData): HeroStat {
  if (data.top5Pct >= 70 && data.topCreators.length >= 5) {
    return {
      value: String(data.top5Pct),
      unit: '%',
      label: 'of your feed comes from your top 5 sources',
      description: 'A small number of accounts dominate this session.',
      key: 'top5',
    };
  }
  if (data.topCreators.length >= 1 && data.totalPosts > 0) {
    const top = data.topCreators[0]!;
    const share = Math.round((top.count / data.totalPosts) * 100);
    // displayName ?? @name fallback (the canonical pattern from
    // OverviewTab.tsx). For YouTube channels this prefers "Fox News"
    // over "@FoxNews"/"UC..."-style raw handles.
    const display =
      top.displayName ?? (top.name.startsWith('@') ? top.name : `@${top.name}`);
    return {
      value: String(share),
      unit: '%',
      label: 'from your top source',
      description: `${display} dominates this session.`,
      key: 'topCreator',
    };
  }
  return {
    value: String(data.uniqueCreatorCount),
    unit: '',
    label: data.uniqueCreatorCount === 1 ? 'unique source' : 'unique sources',
    description: 'Your feed pulled from this many distinct accounts.',
    key: 'uniqueSources',
  };
}

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
  isPlus: boolean;
  onUpgrade: () => void;
}

export function SourcesTab({ data, isPlus, onUpgrade }: SourcesTabProps) {
  const hero = useMemo(() => pickHeroStat(data), [data]);

  // Concentration breakdown derivations — preserved from legacy SourcesContent.
  const top5Count = useMemo(
    () => data.topCreators.slice(0, 5).reduce((sum, c) => sum + c.count, 0),
    [data.topCreators]
  );
  const top6to10Count = useMemo(
    () => data.topCreators.slice(5, 10).reduce((sum, c) => sum + c.count, 0),
    [data.topCreators]
  );
  const othersCount = Math.max(0, data.totalPosts - top5Count - top6to10Count);
  const top5ConcPct = data.top5Pct;
  const top6to10Pct =
    data.totalPosts > 0 ? Math.round((top6to10Count / data.totalPosts) * 100) : 0;
  const othersPct = Math.max(0, 100 - top5ConcPct - top6to10Pct);

  const heroCaution =
    data.totalPosts < 12 ? `Based on ${data.totalPosts} posts. Interpret with care.` : undefined;

  const visibleCreators = data.topCreators.slice(0, isPlus ? 10 : 5);

  return (
    <View
      style={{
        paddingHorizontal: layout.screenPaddingX,
        paddingTop: layout.screenPaddingY,
        paddingBottom: spacing.s7,
      }}
    >
      {/* ── 1. Hero ────────────────────────────────────────────── */}
      <HeroStatCard
        value={hero.value}
        unit={hero.unit}
        label={hero.label}
        description={hero.description}
        caution={heroCaution}
      />

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
              // OverviewTab's top-influencers list.
              const display =
                c.displayName ?? (c.name.startsWith('@') ? c.name : `@${c.name}`);
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
