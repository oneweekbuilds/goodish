import React, { useState, useMemo, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { ContentFadeIn } from '../../src/components/ui/ContentFadeIn';
import { useDashboard } from '../../src/hooks/useDashboard';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { computeDashboardData, DashboardData, PoliticalAnalysis, ToneAnalysis, AdvertiserStat, ToneSourceStat, ToneBySourceOrigin, CreatorNovelty } from '../../src/lib/computeDashboardData';
import { InsightHero } from '../../src/components/dashboard/InsightHero';
import { BarChart } from '../../src/components/dashboard/BarChart';
import { StackedBar100 } from '../../src/components/dashboard/StackedBar100';
import { BigNumber } from '../../src/components/dashboard/BigNumber';
import { MetricCard } from '../../src/components/dashboard/MetricCard';
import { SectionHeader } from '../../src/components/dashboard/SectionHeader';
import { LockedOverlayCard } from '../../src/components/plan/LockedOverlayCard';
import { DashboardTour } from '../../src/components/dashboard/DashboardTour';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { SPACING, RADIUS, TYPOGRAPHY, COLORS, ICON_SIZES, MIN_TOUCH_TARGET } from '../../src/lib/theme';
import { triggerSelection } from '../../src/lib/haptics';
import { captureError } from '../../src/lib/sentry';
import { getPlatformDisplayName } from '../../src/lib/utils';
import {
  Search,
  Sparkles,
  TrendingUp,
  Settings,
  ScanSearch,
  Info,
  ChevronDown,
  ShoppingBag,
  Users,
  Layers,
  BarChart3,
  Clock,
} from 'lucide-react-native';

// ─── Animation Constants ─────────────────────────────────
const ANIMATION = {
  TAB_FADE_OUT: 80,
  TAB_FADE_IN: 150,
} as const;

// ─── Tab Definitions ─────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', needsAi: false },
  { id: 'sources', label: 'Who Shapes Your Feed', needsAi: false },
  { id: 'ads', label: 'Ads & Promotions', needsAi: false },
  { id: 'politics', label: 'Political Exposure', needsAi: true },
  { id: 'tone', label: 'Emotional Tone', needsAi: true },
  { id: 'suggested_vs_followed', label: 'Suggested vs. Followed', needsAi: false },
];

// Friendly content type labels
const CONTENT_TYPE_LABELS: Record<string, string> = {
  reel: 'Videos / Reels',
  photo: 'Photos',
  carousel: 'Multi-image',
  video: 'Videos',
  short: 'Shorts',
  text: 'Text Posts',
  link: 'Links',
  unknown: 'Other',
};

// ─── Tab Content Components ──────────────────────────────

const OverviewContent = memo(({ data, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  // ── Accordion states for "Explore Your Data" rows ──
  const [showContentTypes, setShowContentTypes] = useState(false);
  const [showTimeEstimate, setShowTimeEstimate] = useState(false);
  const [showContentPatterns, setShowContentPatterns] = useState(false);
  const [showAllIdeas, setShowAllIdeas] = useState(false);

  // ── Feed in Minutes calculations ──
  const DAILY_MINUTES = 45;
  const adMinutes = data.totalPosts >= 10 ? (data.adPct / 100) * DAILY_MINUTES : null;
  const politicalPct = data.politicalAnalysis?.politicalPct ?? 0;
  const politicalMinutes = data.totalPosts >= 10 ? (politicalPct / 100) * DAILY_MINUTES : null;

  const formatMinutes = (mins: number | null): string => {
    if (mins === null) return '—';
    if (mins === 0) return '0';
    if (mins < 1) return '< 1';
    return String(Math.round(mins));
  };

  // ── Experiment Suggestions ──
  const suggestions: string[] = [];
  if (data.totalPosts >= 10) {
    if (data.suggestedPct > 60) {
      suggestions.push('Try using chronological feed mode to see more from accounts you follow.');
    }
    if (data.top5Pct > 70) {
      suggestions.push('Explore new creators — your feed is heavily concentrated.');
    }
    if (data.adPct > 20) {
      suggestions.push('Consider using ad-blocking features on this platform.');
    }
    if (data.adPct === 0) {
      suggestions.push('Your scan showed no detected ads — scan longer next time for more complete results.');
    }
    suggestions.push('Compare results across multiple scans to see patterns.');
  } else {
    suggestions.push('Scan at least 10 posts to see meaningful experiment suggestions.');
    suggestions.push('Compare results across multiple scans to see patterns.');
  }

  // ── Content Patterns ──
  const emotionalSummary = data.toneAnalysis
    ? data.toneAnalysis.negativePct >= 35 ? 'High intensity — notable negative tone'
    : data.toneAnalysis.positivePct >= 50 ? 'Mostly positive'
    : data.toneAnalysis.neutralPct >= 50 ? 'Mostly neutral'
    : 'Mix of positive and negative'
    : null;

  const sourceDiversitySummary = data.topCreators.length >= 5
    ? `Concentrated — top 5 creators make up ${data.top5Pct}%`
    : data.topCreators.length > 0
    ? `${data.uniqueCreatorCount} unique creators detected`
    : null;

  const hasContentPatterns = emotionalSummary || sourceDiversitySummary;

  // ── Hero stat priority logic ──
  // Determine which single metric gets hero treatment
  type HeroStat = { value: number; label: string; suffix: string; caption: string; key: string };
  let heroStat: HeroStat | null = null;

  if (data.suggestedPct > 60) {
    heroStat = {
      value: data.suggestedPct,
      label: 'of your feed is from accounts you don\'t follow',
      suffix: '%',
      caption: 'Most of what you scrolled past was chosen for you, not by you.',
      key: 'suggested',
    };
  } else if (data.adPct > 15) {
    heroStat = {
      value: data.adPct,
      label: 'of your feed is sponsored content',
      suffix: '%',
      caption: `That\'s ${data.adCount} ad${data.adCount !== 1 ? 's' : ''} in ${data.totalPosts} posts scanned.`,
      key: 'ads',
    };
  } else if (data.top5Pct > 70 && data.topCreators.length >= 5) {
    heroStat = {
      value: data.top5Pct,
      label: 'of your feed from just 5 accounts',
      suffix: '%',
      caption: 'A small number of sources dominate what you see.',
      key: 'top5',
    };
  } else if (data.totalPosts > 0) {
    heroStat = {
      value: data.totalPosts,
      label: 'posts scanned',
      suffix: '',
      caption: 'A snapshot of your feed composition from this session.',
      key: 'total',
    };
  }

  // ── Supporting metrics: the 3 that weren't chosen as hero ──
  const supportingMetrics: { value: string; label: string }[] = [];
  if (heroStat?.key !== 'suggested' && data.totalPosts > 0) {
    supportingMetrics.push({ value: `${data.suggestedPct}%`, label: 'Suggested' });
  }
  if (heroStat?.key !== 'ads' && data.totalPosts > 0) {
    supportingMetrics.push({ value: `${data.adPct}%`, label: 'Ads' });
  }
  if (heroStat?.key !== 'top5' && data.topCreators.length >= 5) {
    supportingMetrics.push({ value: `${data.top5Pct}%`, label: 'Top 5' });
  }
  if (heroStat?.key !== 'total') {
    supportingMetrics.push({ value: String(data.totalPosts), label: 'Posts' });
  }

  return (
    <View style={{ gap: SPACING['2xl'] }}>
      {/* ── 1. HERO ZONE ── */}
      <InsightHero
        title={data.overviewInsight.title}
        meaning={data.overviewInsight.meaning}
        whyCare={data.overviewInsight.whyCare}
        meta={data.overviewInsight.meta}
        accent={colors.primaryBlue}
        counterfactual="This is what showed up during this window. It may not represent your typical feed — a single scan captures one moment, not a pattern."
        howWeMeasure={{
          what: 'A snapshot of your feed composition at the time of scanning — content types, sources, ads, and recommendations.',
          how: 'Posts are captured from the visible feed via scrolling, then categorized by platform-provided signals (creator handles, ad labels, recommendation indicators).',
          limitations: 'Feed composition changes between sessions. A single scan shows one moment in time, not a persistent pattern. Re-scan to see how your feed evolves.',
          learnMoreUrl: 'https://algorithmlens.com/dashboard#overview',
        }}
      />

      {/* Primary stat card */}
      {heroStat && (
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
        }}>
          <BigNumber
            value={heroStat.value}
            label={heroStat.label}
            suffix={heroStat.suffix}
          />
          <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic', marginTop: SPACING.sm }}>
            {heroStat.caption}
          </Text>
        </View>
      )}

      {/* ── 2. SUPPORTING METRICS ── */}
      {supportingMetrics.length > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: colors.borderSoft, marginVertical: SPACING.lg }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {supportingMetrics.map((metric, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <Text style={{ ...TYPOGRAPHY.h3, fontWeight: '700', color: colors.textMain }}>
                  {metric.value}
                </Text>
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs }}>
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── 3. EXPLORE YOUR DATA (accordion) ── */}
      <Text style={{ ...TYPOGRAPHY.overline, color: colors.textMuted, marginTop: SPACING['2xl'] }}>
        EXPLORE YOUR DATA
      </Text>
      <View style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        overflow: 'hidden',
      }}>
        {/* Row 1: Content Types */}
        {data.contentTypes.length > 0 && (
          <>
            <TouchableOpacity
              onPress={() => setShowContentTypes(!showContentTypes)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={showContentTypes ? 'Collapse content types' : 'Expand content types'}
              accessibilityState={{ expanded: showContentTypes }}
              style={{
                paddingHorizontal: SPACING.lg,
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <BarChart3 size={16} color={colors.primaryBlue} strokeWidth={2} />
                <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain }}>Content Types</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted }}>
                  {data.contentTypes.length} types
                </Text>
                <ChevronDown
                  size={16}
                  color={colors.textSecondary}
                  strokeWidth={2}
                  style={{ transform: [{ rotate: showContentTypes ? '180deg' : '0deg' }] }}
                />
              </View>
            </TouchableOpacity>
            {showContentTypes && (
              <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg }}>
                <StackedBar100
                  segments={data.contentTypes.map((ct, i) => ({
                    label: CONTENT_TYPE_LABELS[ct.label] || ct.label,
                    percentage: ct.percentage,
                    count: ct.count,
                    color: colors.chartPalette[i % colors.chartPalette.length] ?? colors.accent,
                  }))}
                />
              </View>
            )}
          </>
        )}

        {/* Divider between rows */}
        {data.contentTypes.length > 0 && data.totalPosts >= 10 && (
          <View style={{ height: 1, backgroundColor: colors.borderSoft }} />
        )}

        {/* Row 2: Time Estimate */}
        {data.totalPosts >= 10 && (
          <>
            <TouchableOpacity
              onPress={() => setShowTimeEstimate(!showTimeEstimate)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={showTimeEstimate ? 'Collapse time estimate' : 'Expand time estimate'}
              accessibilityState={{ expanded: showTimeEstimate }}
              style={{
                paddingHorizontal: SPACING.lg,
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Clock size={16} color={colors.primaryBlue} strokeWidth={2} />
                <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain }}>Time Estimate</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted }}>
                  {formatMinutes(adMinutes)} min ads/day
                </Text>
                <ChevronDown
                  size={16}
                  color={colors.textSecondary}
                  strokeWidth={2}
                  style={{ transform: [{ rotate: showTimeEstimate ? '180deg' : '0deg' }] }}
                />
              </View>
            </TouchableOpacity>
            {showTimeEstimate && (
              <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, gap: SPACING.sm }}>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.blue50,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.lg,
                    borderWidth: 1,
                    borderColor: colors.blue200,
                  }}>
                    <Text style={{ ...TYPOGRAPHY.h1, color: colors.textMain }}>
                      {formatMinutes(adMinutes)}
                    </Text>
                    <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs }}>
                      min/day on ads
                    </Text>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.bgCardGradientEnd,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.lg,
                    borderWidth: 1,
                    borderColor: colors.borderSoft,
                  }}>
                    <Text style={{ ...TYPOGRAPHY.h1, color: colors.textMain }}>
                      {formatMinutes(politicalMinutes)}
                    </Text>
                    <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs }}>
                      min/day on political content
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs, paddingHorizontal: SPACING.xs }}>
                  <Info size={11} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic' }}>
                    Based on average daily social media usage of 45 minutes
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Divider between rows */}
        {data.totalPosts >= 10 && hasContentPatterns && (
          <View style={{ height: 1, backgroundColor: colors.borderSoft }} />
        )}

        {/* Row 3: Content Patterns */}
        {hasContentPatterns && data.totalPosts >= 10 && (
          <>
            <TouchableOpacity
              onPress={() => setShowContentPatterns(!showContentPatterns)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={showContentPatterns ? 'Collapse content patterns' : 'Expand content patterns'}
              accessibilityState={{ expanded: showContentPatterns }}
              style={{
                paddingHorizontal: SPACING.lg,
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <TrendingUp size={16} color={colors.primaryBlue} strokeWidth={2} />
                <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain }}>Content Patterns</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexShrink: 1, justifyContent: 'flex-end' }}>
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, maxWidth: 160 }} numberOfLines={1}>
                  {emotionalSummary ?? sourceDiversitySummary ?? ''}
                </Text>
                <ChevronDown
                  size={16}
                  color={colors.textSecondary}
                  strokeWidth={2}
                  style={{ transform: [{ rotate: showContentPatterns ? '180deg' : '0deg' }] }}
                />
              </View>
            </TouchableOpacity>
            {showContentPatterns && (
              <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, gap: SPACING.sm }}>
                {emotionalSummary && (
                  <View style={{ gap: SPACING.xxs }}>
                    <Text style={{ ...TYPOGRAPHY.overline, color: colors.textSecondary }}>
                      Emotional Signal
                    </Text>
                    <Text style={{ ...TYPOGRAPHY.body, color: colors.textMain, fontWeight: '600' }}>
                      {emotionalSummary}
                    </Text>
                  </View>
                )}
                {sourceDiversitySummary && (
                  <View style={{ gap: SPACING.xxs }}>
                    <Text style={{ ...TYPOGRAPHY.overline, color: colors.textSecondary }}>
                      Source Diversity
                    </Text>
                    <Text style={{ ...TYPOGRAPHY.body, color: colors.textMain, fontWeight: '600' }}>
                      {sourceDiversitySummary}
                    </Text>
                  </View>
                )}
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic', marginTop: SPACING.xxs }}>
                  These labels are inferred from feed content only. Actual platform categorization may differ.
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* ── 4. IDEAS TO EXPLORE (simplified) ── */}
      {suggestions.length > 0 && (
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
        }}>
          <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain, marginBottom: SPACING.sm }}>
            Ideas to explore
          </Text>
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted }}>
            {suggestions[0]}
          </Text>
          {suggestions.length > 1 && (
            <>
              <TouchableOpacity
                onPress={() => setShowAllIdeas(!showAllIdeas)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={showAllIdeas ? 'Hide ideas' : 'See all ideas'}
                accessibilityState={{ expanded: showAllIdeas }}
                style={{ marginTop: SPACING.sm, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
              >
                <Text style={{ ...TYPOGRAPHY.labelBold, color: colors.primaryBlue }}>
                  {showAllIdeas ? 'Hide ideas' : 'See all ideas'}
                </Text>
              </TouchableOpacity>
              {showAllIdeas && (
                <View style={{ marginTop: SPACING.sm, gap: SPACING.sm }}>
                  {suggestions.slice(1).map((suggestion, i) => (
                    <Text key={i} style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted }}>
                      {'\u2022'} {suggestion}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* ── 5. PREMIUM + FOOTER ── */}
      <LockedOverlayCard
        locked={!isPlus}
        title="Trend analysis"
        body="See how your feed composition changes over time. Track ad percentages, source concentration, and content themes across scans."
        onUpgrade={onUpgrade}
      >
        <View style={{ gap: SPACING.sm }}>
          <SectionHeader title="Trends Over Time" subtitle="How your feed is changing" />
          <View style={{
            backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
            borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card, minHeight: 120,
          }}>
            <MetricCard headline="Ad trend" value="—" microLine="Across recent scans" hasData={false} />
          </View>
          <View style={{
            backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
            borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card, minHeight: 120,
          }}>
            <MetricCard headline="Source diversity trend" value="—" microLine="Across recent scans" hasData={false} />
          </View>
        </View>
      </LockedOverlayCard>

      {/* ── Master Numbers Line ── */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
        marginTop: SPACING.sm,
      }}>
        <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
          {data.platform}
        </Text>
        <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>{'\u00B7'}</Text>
        <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
          {data.totalPosts} posts
        </Text>
        {data.scanDate && (
          <>
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>{'\u00B7'}</Text>
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
              {new Date(data.scanDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </>
        )}
      </View>
    </View>
  );
});

const SourcesContent = memo(({ data, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  // PD-004 FIX: Collapse concentration section behind expandable header
  const [showConcentration, setShowConcentration] = useState(false);
  // Concentration composition data for stacked bar
  const top5Count = data.topCreators.slice(0, 5).reduce((sum, c) => sum + c.count, 0);
  const top6to10Count = data.topCreators.slice(5, 10).reduce((sum, c) => sum + c.count, 0);
  const othersCount = Math.max(0, data.totalPosts - top5Count - top6to10Count);
  const top5ConcPct = data.top5Pct;
  const top6to10Pct = data.totalPosts > 0 ? Math.round((top6to10Count / data.totalPosts) * 100) : 0;
  const othersPct = Math.max(0, 100 - top5ConcPct - top6to10Pct);

  return (
    <View style={{ gap: SPACING['2xl'] }}>
      <InsightHero
        title={data.sourcesInsight.title}
        meaning={data.sourcesInsight.meaning}
        whyCare={data.sourcesInsight.whyCare}
        meta={data.sourcesInsight.meta}
        accent={colors.primaryBlue}
        counterfactual="A few sources appearing frequently could reflect your following choices, recent posting activity by those creators, or algorithmic amplification. This analysis describes what appeared, not why."
        howWeMeasure={{
          what: 'Which accounts created the content you scrolled past, and how concentrated your feed is among a few sources.',
          how: 'We extract the creator handle from each post and rank by frequency. Top-5 concentration is the percentage of all posts from your five most-shown accounts.',
          limitations: 'Some posts may not have identifiable creators (e.g., promoted content without a visible handle). These are excluded from source analysis.',
          learnMoreUrl: 'https://algorithmlens.com/dashboard#sources',
        }}
      />

      {/* ── 3-column summary stat cards ── */}
      {data.topCreators.length > 0 && (
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <View style={{
            flex: 1,
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
          }}>
            <Text style={{ ...TYPOGRAPHY.overline, color: colors.textSecondary }}>
              Top 5
            </Text>
            <Text style={{ ...TYPOGRAPHY.h2, color: colors.textMain, marginTop: SPACING.xxs }}>
              {data.top5Pct}%
            </Text>
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs }}>
              of posts from top 5
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
          }}>
            <Text style={{ ...TYPOGRAPHY.overline, color: colors.textSecondary }}>
              Top Source
            </Text>
            <Text style={{ ...TYPOGRAPHY.labelBold, color: colors.textMain, marginTop: SPACING.xxs }} numberOfLines={1}>
              @{data.topCreators[0]?.name ?? '—'}
            </Text>
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs }}>
              most frequent
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
          }}>
            <Text style={{ ...TYPOGRAPHY.overline, color: colors.textSecondary }}>
              Sources
            </Text>
            <Text style={{ ...TYPOGRAPHY.h2, color: colors.textMain, marginTop: SPACING.xxs }}>
              {data.uniqueCreatorCount}
            </Text>
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs }}>
              unique creators
            </Text>
          </View>
        </View>
      )}

      <SectionHeader title="Top Creators" subtitle="Who appeared most" />

      {data.topCreators.length > 0 ? (
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
        }}>
          <BarChart
            items={data.topCreators.slice(0, 8).map((creator) => ({
              label: `@${creator.name}`,
              value: creator.count,
              percentage: creator.percentage,
            }))}
          />
        </View>
      ) : (
        <EmptySection message="Creator information builds up as you scan. Try scrolling through more content to capture source data." colors={colors} />
      )}

      {/* PD-004 FIX: Concentration section collapsed by default */}
      {/* A-004 FIX: minHeight 44 ensures accessible tap target */}
      {data.topCreators.length >= 5 && (
        <TouchableOpacity
          onPress={() => setShowConcentration(!showConcentration)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            minHeight: MIN_TOUCH_TARGET,
            borderRadius: RADIUS.lg,
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: colors.borderSoft,
          }}
          accessibilityRole="button"
          accessibilityLabel={showConcentration ? 'Hide concentration analysis' : 'How concentrated is your feed?'}
          accessibilityState={{ expanded: showConcentration }}
        >
          <Text style={{ ...TYPOGRAPHY.label, color: colors.textMuted }}>
            How concentrated is your feed?
          </Text>
          <ChevronDown
            size={16}
            color={colors.textSecondary}
            strokeWidth={2}
            style={{ transform: [{ rotate: showConcentration ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      )}
      {showConcentration && data.topCreators.length >= 5 && (
        <>
          <SectionHeader title="Source Concentration" />
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
            alignItems: 'center',
          }}>
            <BigNumber
              value={data.top5Pct}
              label="of your feed from top 5 accounts"
              suffix="%"
            />
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, marginTop: SPACING.xxs }}>
              Typical range: 40–60%
            </Text>
          </View>
        </>
      )}

      {/* ── Concentration Composition Bar (PD-004: also collapsed) ── */}
      {showConcentration && data.topCreators.length >= 5 && (
        <>
          <SectionHeader title="Concentration Breakdown" subtitle="How your feed is distributed" />
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
          }}>
            <StackedBar100
              segments={[
                { label: 'Top 5', percentage: top5ConcPct, count: top5Count, color: colors.primaryBlue },
                ...(top6to10Pct > 0 ? [{ label: 'Top 6–10', percentage: top6to10Pct, count: top6to10Count, color: colors.blue200 }] : []),
                { label: 'Others', percentage: othersPct, count: othersCount, color: colors.textTertiary },
              ]}
            />
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic', marginTop: SPACING.sm }}>
              Higher values for top sources indicate a more concentrated feed.
            </Text>
          </View>
        </>
      )}

      {/* Premium: Creator-specific breakdowns — locked for free users */}
      <LockedOverlayCard
        locked={!isPlus}
        title="Creator breakdowns"
        body="See which creators drive ad content, political posts, and specific topics in your feed."
        onUpgrade={onUpgrade}
      >
        <View style={{ gap: SPACING.sm }}>
          <SectionHeader title="Creator Breakdowns" subtitle="Who drives what content" />
          <View style={{
            backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
            borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card, minHeight: 120,
          }}>
            <MetricCard headline="Top ad creators" value="—" microLine="Who promotes most" hasData={false} />
          </View>
          <View style={{
            backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
            borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card, minHeight: 120,
          }}>
            <MetricCard headline="Top political creators" value="—" microLine="Who drives political content" hasData={false} />
          </View>
        </View>
      </LockedOverlayCard>
    </View>
  );
});

const AdsContent = memo(({ data, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  const [showAdvertisers, setShowAdvertisers] = useState(false);
  const organicCount = data.totalPosts - data.adCount;
  const organicPct = 100 - data.adPct;

  return (
    <View style={{ gap: SPACING['2xl'] }}>
      <InsightHero
        title={data.adsInsight.title}
        meaning={data.adsInsight.meaning}
        whyCare={data.adsInsight.whyCare}
        meta={data.adsInsight.meta}
        accent={colors.primaryBlue}
        counterfactual="This may not match your perception. Some ads blend in with regular content, and some promotional posts (influencer partnerships, native ads) may not carry visible labels."
        howWeMeasure={{
          what: 'The share of your feed that contains labeled ads and likely promotional content.',
          how: 'We identify ads based on platform-provided labels (e.g., "Sponsored," "Ad") and promotional URL patterns. Each post is checked for these signals.',
          limitations: 'Some native advertising or influencer partnerships may not be detected if they lack standard ad labels. Only explicitly labeled content is counted.',
          learnMoreUrl: 'https://algorithmlens.com/dashboard#ads',
        }}
      />

      {/* ── 3-column summary stat cards ── */}
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{
          flex: 1,
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
        }}>
          <Text style={{ ...TYPOGRAPHY.overline, color: colors.textSecondary }}>
            Ad Posts
          </Text>
          <Text style={{ ...TYPOGRAPHY.h2, color: colors.textMain, marginTop: SPACING.xxs }}>
            {data.adCount}
          </Text>
          <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs }}>
            {data.adPct}% of posts
          </Text>
        </View>
        {data.topAdvertisers.length > 0 && (
          <View style={{
            flex: 1,
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
          }}>
            <Text style={{ ...TYPOGRAPHY.overline, color: colors.textSecondary }}>
              Top Advertiser
            </Text>
            <Text style={{ ...TYPOGRAPHY.labelBold, color: colors.textMain, marginTop: SPACING.xxs }} numberOfLines={1}>
              @{data.topAdvertisers[0]?.name ?? '—'}
            </Text>
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs }}>
              {data.topAdvertisers[0]?.percent ?? 0}% of ads
            </Text>
          </View>
        )}
        {data.adCount > 0 && (
          <View style={{
            flex: 1,
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
          }}>
            <Text style={{ ...TYPOGRAPHY.overline, color: colors.textSecondary }}>
              Ad Density
            </Text>
            <Text style={{ ...TYPOGRAPHY.h2, color: colors.textMain, marginTop: SPACING.xxs }}>
              1:{data.adPct > 0 ? Math.round(100 / data.adPct) : '—'}
            </Text>
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs }}>
              post ratio
            </Text>
          </View>
        )}
      </View>

      {/* CD-005 FIX: Only show Ad Composition chart when there are both sponsored and non-sponsored segments */}
      {data.adCount > 0 && (
        <>
          <SectionHeader title="Ad Composition" subtitle="Content labeled as sponsored" />
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
          }}>
            <StackedBar100
              segments={[
                { label: 'Non-sponsored', percentage: organicPct, count: organicCount, color: colors.primaryBlue },
                { label: 'Sponsored', percentage: data.adPct, count: data.adCount, color: colors.blue200 },
              ]}
            />
          </View>
        </>
      )}

      {data.adCount === 0 ? (
        /* ── Enhanced Ad Detection Note (0% ads) ── */
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
          gap: SPACING.sm,
        }}>
          <Text style={{ ...TYPOGRAPHY.body, color: colors.textMain, fontWeight: '600' }}>
            No labeled ads appeared in this scan
          </Text>
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, lineHeight: 20 }}>
            We look for platform-provided ad labels (like "Sponsored" or "Ad" badges). Some promotional content doesn't carry visible labels.
          </Text>
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, lineHeight: 20 }}>
            Native advertising, influencer partnerships, and product placements may not have standard ad markers.
          </Text>
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, lineHeight: 20 }}>
            Scan longer and scroll through more content — ads may appear at different points in your feed.
          </Text>
        </View>
      ) : (
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
          alignItems: 'center',
        }}>
          <BigNumber
            value={data.adCount}
            label={`sponsored post${data.adCount !== 1 ? 's' : ''} in ${data.totalPosts} items`}
            suffix=""
          />
        </View>
      )}

      {/* ── Top Advertised Companies (collapsible) ── */}
      {data.topAdvertisers.length > 0 && (
        <>
          <TouchableOpacity
            onPress={() => setShowAdvertisers(!showAdvertisers)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: SPACING.md,
            }}
          >
            <Text style={{ ...TYPOGRAPHY.label, color: colors.textMuted }}>
              Top advertised companies
            </Text>
            <ChevronDown
              size={16}
              color={colors.textSecondary}
              strokeWidth={2}
              style={{
                transform: [{ rotate: showAdvertisers ? '180deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>

          {showAdvertisers && (
            <View style={{
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              ...shadows.card,
              gap: SPACING.sm,
            }}>
              {data.topAdvertisers.map((advertiser, idx) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...TYPOGRAPHY.body, color: colors.textMain, fontWeight: '500' }}>
                    @{advertiser.name}
                  </Text>
                  <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
                    {advertiser.percent}% of ads ({advertiser.count})
                  </Text>
                </View>
              ))}
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic', marginTop: SPACING.xxs }}>
                Based on {data.adCount} labeled ad posts
              </Text>
            </View>
          )}
        </>
      )}

      {/* Premium: Ad trend over time — locked for free users */}
      <LockedOverlayCard
        locked={!isPlus}
        title="Ad trends over time"
        body="Track how advertising in your feed changes across scans. See if ad percentages are rising, falling, or steady."
        onUpgrade={onUpgrade}
      >
        <View style={{ gap: SPACING.sm }}>
          <SectionHeader title="Changes Over Time" subtitle="Ad percentage trend" />
          <View style={{
            backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
            borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card, minHeight: 120,
          }}>
            <MetricCard headline="Ad trend" value="—" microLine="Across recent scans" hasData={false} />
          </View>
        </View>
      </LockedOverlayCard>
    </View>
  );
});

const SuggestedContent = memo(({ data, colors, shadows }: { data: DashboardData; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  // PD-002/MC-004 FIX: "What You Can Do" collapsed by default, reframed as optional
  const [showIdeas, setShowIdeas] = useState(false);

  return (
  <View style={{ gap: SPACING['2xl'] }}>
    <InsightHero
      title={data.suggestedInsight.title}
      meaning={data.suggestedInsight.meaning}
      whyCare={data.suggestedInsight.whyCare}
      meta={data.suggestedInsight.meta}
      accent={colors.primaryBlue}
      counterfactual="The balance of followed vs. suggested content can vary by time of day, how recently you scrolled, and what content creators have posted. This snapshot reflects one session."
      howWeMeasure={{
        what: 'How much of your feed comes from accounts you follow versus content recommended by the platform.',
        how: 'Each post is classified as "following" or "suggested" based on platform indicators — labels like "Suggested for you," "Recommended," or the absence of a follow relationship.',
        limitations: 'Platform indicators vary and may not always be present. Some platforms mix followed and suggested content without clear labels. Classification is based on observable signals only.',
        learnMoreUrl: 'https://algorithmlens.com/dashboard#suggested',
      }}
    />

    <SectionHeader title="Content Origin" subtitle="Followed vs. recommended" />

    <View style={{
      backgroundColor: colors.bgCard,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      ...shadows.card,
    }}>
      <StackedBar100
        segments={[
          { label: 'Following', percentage: data.followedPct, count: data.followedCount, color: colors.primaryBlue },
          { label: 'Suggested', percentage: data.suggestedPct, count: data.suggestedCount, color: colors.blue200 },
        ]}
      />
    </View>

    <View style={{
      backgroundColor: colors.bgCard,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      ...shadows.card,
    }}>
      <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted }}>
        {data.suggestedPct >= 50
          ? `${data.suggestedPct}% of the posts in your feed came from accounts you don't follow. Most of what appeared in your feed came from accounts you don't follow.`
          : data.suggestedPct >= 20
          ? `Your feed contained a mix of content from accounts you follow and recommendations. Your follow choices drove the majority of what appeared.`
          : `Your feed was mostly content from accounts you follow. Relatively little was introduced through platform recommendations.`
        }
      </Text>
    </View>

    {/* Section: Are These New Voices? */}
    {data.creatorNovelty?.hasData && (
      <>
        <SectionHeader title="Are These New Voices?" subtitle="Creator novelty in suggested content" />
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
          gap: SPACING.sm,
        }}>
          {/* BigNumber: novelty percent */}
          <View style={{ alignItems: 'center' }}>
            <BigNumber
              value={data.creatorNovelty.noveltyPercent}
              label="of suggested posts appeared to be from creators you don't follow"
              suffix="%"
            />
          </View>

          {/* Three stat cards in a row */}
          <View style={{ flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.xs }}>
            <View style={{
              flex: 1,
              backgroundColor: colors.bgCardGradientEnd,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              alignItems: 'center',
            }}>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textMain }}>
                {data.creatorNovelty.suggestedCreatorCount}
              </Text>
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.xxs }}>
                Suggested{'\n'}creators
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: colors.bgCardGradientEnd,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              alignItems: 'center',
            }}>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textMain }}>
                {data.creatorNovelty.overlapCount}
              </Text>
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.xxs }}>
                Overlap
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: colors.bgCardGradientEnd,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              alignItems: 'center',
            }}>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textMain }}>
                {data.creatorNovelty.followedCreatorCount}
              </Text>
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.xxs }}>
                Followed{'\n'}creators
              </Text>
            </View>
          </View>

          {/* Contextual interpretation */}
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, lineHeight: 19 }}>
            {data.creatorNovelty.noveltyPercent >= 60
              ? 'Most suggested content appeared to come from creators you don\'t follow — lots of new voices in the mix.'
              : data.creatorNovelty.noveltyPercent >= 40
              ? 'A mix of new and familiar creators appeared in suggested content.'
              : 'Most suggested content appeared to come from creators you already follow.'
            }
          </Text>

          {/* Approximate data warning */}
          {data.creatorNovelty.approximate && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.xs,
              paddingTop: SPACING.xxs,
            }}>
              <Info size={12} color={colors.textSecondary} strokeWidth={2} />
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic', flex: 1 }}>
                Follow detection is limited on some platforms. These numbers are approximate.
              </Text>
            </View>
          )}
        </View>
      </>
    )}

    {/* PD-002/MC-004 FIX: Collapsible "Ideas to explore" with softer framing */}
    {/* A-004 FIX: MIN_TOUCH_TARGET ensures accessible tap target */}
    <TouchableOpacity
      onPress={() => setShowIdeas(!showIdeas)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        minHeight: MIN_TOUCH_TARGET,
        borderRadius: RADIUS.lg,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.borderSoft,
      }}
      accessibilityRole="button"
      accessibilityLabel={showIdeas ? 'Hide ideas to explore' : 'Show ideas to explore'}
      accessibilityState={{ expanded: showIdeas }}
    >
      <Text style={{ ...TYPOGRAPHY.label, color: colors.textMuted }}>
        Ideas to explore
      </Text>
      <ChevronDown
        size={16}
        color={colors.textSecondary}
        strokeWidth={2}
        style={{ transform: [{ rotate: showIdeas ? '180deg' : '0deg' }] }}
      />
    </TouchableOpacity>

    {showIdeas && (
    <View style={{
      backgroundColor: colors.bgCard,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      ...shadows.card,
      gap: SPACING.sm,
    }}>
      {/* Reframed as optional reflections instead of imperative commands */}
      <View style={{
        flexDirection: 'row',
        gap: SPACING.sm,
        alignItems: 'flex-start',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: colors.blue50,
        borderWidth: 1,
        borderColor: colors.blue200,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...TYPOGRAPHY.body, color: colors.textMain, fontWeight: '600' }}>
            Diversify your follows
          </Text>
          <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs, lineHeight: 17 }}>
            Some people find that following a wider range of accounts changes what their feed recommends over time.
          </Text>
        </View>
      </View>

      <View style={{
        flexDirection: 'row',
        gap: SPACING.sm,
        alignItems: 'flex-start',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: colors.blue50,
        borderWidth: 1,
        borderColor: colors.blue200,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...TYPOGRAPHY.body, color: colors.textMain, fontWeight: '600' }}>
            Try chronological mode
          </Text>
          <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs, lineHeight: 17 }}>
            Some platforms offer a "Following" or "Latest" feed mode that shows only posts from accounts you follow, in chronological order.
          </Text>
        </View>
      </View>

      <View style={{
        flexDirection: 'row',
        gap: SPACING.sm,
        alignItems: 'flex-start',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: colors.blue50,
        borderWidth: 1,
        borderColor: colors.blue200,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...TYPOGRAPHY.body, color: colors.textMain, fontWeight: '600' }}>
            Engage intentionally
          </Text>
          <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs, lineHeight: 17 }}>
            Platforms often describe engagement (likes, shares, comments) as a factor in feed ranking, though the exact effect is not publicly documented.
          </Text>
        </View>
      </View>
    </View>
    )}

    {/* ── Master Numbers Line ── */}
    <View style={{
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderSoft,
      marginTop: SPACING.sm,
    }}>
      <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
        {data.platform}
      </Text>
      <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>{'\u00B7'}</Text>
      <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
        {data.totalPosts} posts
      </Text>
      {data.scanDate && (
        <>
          <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>{'\u00B7'}</Text>
          <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
            {new Date(data.scanDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </>
      )}
    </View>
  </View>
  );
});

// Politics tab — renders political analysis from Gemini AI classification.
// Shows political share, top political source, ideological distribution,
// and methodology disclaimer matching the main site's PoliticsTab.
// Gates are mutually exclusive: only ONE state renders at a time.
const PoliticsContent = memo(({ data, aiConsent, onGoToSettings, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; aiConsent: boolean; onGoToSettings: () => void; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  const [showIdeology, setShowIdeology] = useState(false);
  const analysis = data.politicalAnalysis;
  const totalAnalyzed = analysis?.totalAnalyzed ?? data.totalPosts;
  const isLowPostCount = totalAnalyzed < 20;

  // ── Gate 1: No AI consent → show ONLY the consent card, nothing else ──
  if (!aiConsent) {
    return (
      <View style={{ gap: SPACING.sm }}>
        <AiConsentCard
          title="Enable AI Insights"
          description="Turn on AI analysis in Settings to see how much political content appears in your feed."
          buttonLabel="Go to Settings"
          onPress={onGoToSettings}
          colors={colors}
          shadows={shadows}
        />
      </View>
    );
  }

  // ── Gate 2: AI consent given but no political data ──
  if (!data.hasPoliticsData) {
    return (
      <View style={{ gap: SPACING.sm }}>
        <AiProcessingCard
          title="Political content wasn't prominent in this scan"
          message={`Political keywords and themes weren't prominent among the ${totalAnalyzed} posts in this scan.${isLowPostCount ? ' Try scanning during peak news hours or scrolling through more content for a fuller picture.' : ' Each scan captures a different moment — try scanning at a different time.'}`}
          subtitle={isLowPostCount ? undefined : 'Try scanning at a different time of day to see how results vary.'}
          colors={colors}
          shadows={shadows}
        />
        <PoliticsMethodologyDisclaimer colors={colors} />
      </View>
    );
  }

  // ── Gate 3: Has political data — render full analysis ──
  return (
    <View style={{ gap: SPACING['2xl'] }}>
      <InsightHero
        title={data.politicsInsight.title}
        meaning={data.politicsInsight.meaning}
        whyCare={data.politicsInsight.whyCare}
        meta={data.politicsInsight.meta}
        accent={colors.primaryBlue}
        counterfactual="This measures exposure, not belief formation. Political content may be more memorable than other topics, making it feel more present than the numbers show. The presence of political content could reflect current events, your interests, or platform recommendations."
        howWeMeasure={{
          what: 'The share of your feed that contains political keywords and themes, and the approximate ideological distribution.',
          how: 'Post text is analyzed by Google\'s Gemini AI to detect political content and approximate ideological alignment (left/center/right) based on stance keywords.',
          limitations: 'AI classification is approximate. Short posts may be misclassified. Ideological alignment is based on keyword signals, not nuanced understanding. This describes what appeared — not your views or the platform\'s intent.',
          learnMoreUrl: 'https://algorithmlens.com/dashboard#politics',
        }}
      />

      {/* Low sample indicator */}
      {analysis?.lowSample && (
        <View style={{
          backgroundColor: colors.lowSampleBg,
          borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderWidth: 1,
          borderColor: colors.lowSampleBorder,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
        }}>
          <Info size={14} color={colors.warning} strokeWidth={2} />
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.warning, flex: 1 }}>
            Low sample — fewer than 10 political posts. Results may not reflect typical patterns.
          </Text>
        </View>
      )}

      {/* Section: Political Share */}
      <SectionHeader title="Political Share" subtitle="Posts containing political keywords" />
      <View style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        ...shadows.card,
        alignItems: 'center',
      }}>
        <BigNumber
          value={analysis?.politicalPct ?? 0}
          label="of your feed contained political content"
          suffix="%"
        />
        <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, marginTop: SPACING.xxs }}>
          {analysis?.politicalCount ?? 0} of {analysis?.totalAnalyzed ?? 0} posts
        </Text>
      </View>

      {/* Section: Top Political Source */}
      {analysis?.topPoliticalSource && (
        <>
          <SectionHeader title="Top Political Source" />
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
            gap: SPACING.sm,
          }}>
            <Text style={{ ...TYPOGRAPHY.h2, color: colors.textMain }}>
              @{analysis.topPoliticalSource.handle}
            </Text>
            <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted }}>
              {analysis.topPoliticalSource.count} of {analysis.politicalCount} political posts ({analysis.topPoliticalSource.pctOfPolitical}%)
            </Text>
            {/* Progress bar */}
            <View style={{ gap: SPACING.xxs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600' }}>
                  Share of political posts
                </Text>
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600' }}>
                  {analysis.topPoliticalSource.pctOfPolitical}%
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.borderSoft, borderRadius: RADIUS.xs, overflow: 'hidden' }}>
                <View style={{
                  height: 8,
                  backgroundColor: colors.primaryBlue,
                  borderRadius: RADIUS.xs,
                  width: `${analysis.topPoliticalSource.pctOfPolitical}%`,
                }} />
              </View>
            </View>
          </View>
        </>
      )}

      {/* Political Summary Sentence */}
      {data.politicalSummary && (
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
        }}>
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, lineHeight: 20, fontStyle: 'italic' }}>
            {data.politicalSummary}
          </Text>
        </View>
      )}

      {/* Section: Ideological Distribution (collapsible, matches main site) */}
      <TouchableOpacity
        onPress={() => setShowIdeology(!showIdeology)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: SPACING.md,
        }}
      >
        <Text style={{ ...TYPOGRAPHY.label, color: colors.textMuted }}>
          Show ideological breakdown
        </Text>
        <ChevronDown
          size={16}
          color={colors.textSecondary}
          strokeWidth={2}
          style={{
            transform: [{ rotate: showIdeology ? '180deg' : '0deg' }],
          }}
        />
      </TouchableOpacity>

      {showIdeology && (
        <>
          {analysis?.ideology ? (
            <View style={{
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              ...shadows.card,
              gap: SPACING.sm,
            }}>
              <StackedBar100
                segments={[
                  { label: 'Left', percentage: analysis.ideology.left, count: analysis.ideology.leftCount, color: colors.ideologyLeft },
                  { label: 'Center', percentage: analysis.ideology.center, count: analysis.ideology.centerCount, color: colors.ideologyCenter },
                  { label: 'Right', percentage: analysis.ideology.right, count: analysis.ideology.rightCount, color: colors.ideologyRight },
                ]}
              />
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic' }}>
                Each segment shows what share of political posts showed keywords associated with that direction. This is approximate and may not capture nuance.
              </Text>
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted }}>
                Based on {analysis.ideology.knownTotal} political posts with identifiable alignment
              </Text>
            </View>
          ) : (
            <View style={{
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              alignItems: 'center',
            }}>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }}>
                Not enough political posts with identifiable alignment to show a reliable distribution.
              </Text>
            </View>
          )}
        </>
      )}

      {/* Premium: Political trend over time — locked for free users */}
      <LockedOverlayCard
        locked={!isPlus}
        title="Political exposure trends"
        body="Track how political content in your feed changes across scans. See if exposure is rising, falling, or steady."
        onUpgrade={onUpgrade}
      >
        <View style={{ gap: SPACING.sm }}>
          <SectionHeader title="Changes Over Time" subtitle="Political exposure trend" />
          <View style={{
            backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
            borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card, minHeight: 120,
          }}>
            <MetricCard headline="Political trend" value="—" microLine="Across recent scans" hasData={false} />
          </View>
        </View>
      </LockedOverlayCard>

      {/* PD-003 FIX: Removed redundant methodology disclaimer — InsightHero's
          "How we measure" section already provides this via progressive disclosure */}
    </View>
  );
});

// Methodology disclaimer matching the main site's epistemic restraint pattern
const PoliticsMethodologyDisclaimer = ({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) => (
  <View style={{
    backgroundColor: colors.bgCardGradientEnd,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  }}>
    <Text style={{ ...TYPOGRAPHY.overline, color: colors.textMuted, marginBottom: SPACING.xxs }}>
      How We Measure
    </Text>
    <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
      Political classification uses Google's Gemini AI to identify posts containing political keywords and themes. Ideological alignment (left/center/right) is approximate, based on stance keywords found in post text. This analysis describes what appeared in your feed — it does not infer your personal views or the platform's intent.
    </Text>
  </View>
);

// Tone tab — renders emotional tone analysis from Gemini AI classification.
// Shows tone composition bar, methodology disclaimer, and quality gating.
// Matches the main site's ToneTab pattern with epistemic restraint.
// Gates are mutually exclusive: only ONE state renders at a time.
const ToneContent = memo(({ data, aiConsent, onGoToSettings, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; aiConsent: boolean; onGoToSettings: () => void; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  const analysis = data.toneAnalysis;
  const totalAnalyzed = analysis?.totalAnalyzed ?? data.totalPosts;
  const isLowPostCount = totalAnalyzed < 20;
  // PD-001 FIX: Collapse secondary tone sections by default
  const [showToneDetails, setShowToneDetails] = useState(false);

  // Tone colors from theme palette
  const TONE_COLORS = {
    positive: colors.tonePositive,
    neutral: colors.toneNeutral,
    negative: colors.toneNegative,
  };

  // ── Gate 1: No AI consent → show ONLY the consent card, nothing else ──
  if (!aiConsent) {
    return (
      <View style={{ gap: SPACING.sm }}>
        <AiConsentCard
          title="Enable AI Insights"
          description="Turn on AI analysis in Settings to unlock emotional tone classification for your feed content."
          buttonLabel="Go to Settings"
          onPress={onGoToSettings}
          colors={colors}
          shadows={shadows}
        />
      </View>
    );
  }

  // ── Gate 2: AI consent given but no tone data ──
  if (!data.hasToneData) {
    return (
      <View style={{ gap: SPACING.sm }}>
        <AiProcessingCard
          title="Emotional tone wasn't prominent in this scan"
          message={`Clear emotional tone signals weren't prominent among the ${totalAnalyzed} posts in this scan.${isLowPostCount ? ' Short video titles may not contain enough text for tone analysis. Try scanning longer or on a platform with more text-based posts.' : ' Each scan captures a different moment — try scanning at a different time.'}`}
          subtitle={isLowPostCount ? undefined : 'Try scanning at a different time of day to see how results vary.'}
          colors={colors}
          shadows={shadows}
        />
        <ToneMethodologyDisclaimer colors={colors} />
      </View>
    );
  }

  // ── Gate 3: Has tone data — render full analysis ──
  return (
    <View style={{ gap: SPACING['2xl'] }}>
      <InsightHero
        title={data.toneInsight.title}
        meaning={data.toneInsight.meaning}
        whyCare={data.toneInsight.whyCare}
        meta={data.toneInsight.meta}
        accent={colors.primaryBlue}
        counterfactual="Tone classification reflects the language used in posts, not their actual impact on you. Sarcasm, irony, and cultural context can make tone analysis imprecise. Your emotional experience of a feed may differ from what language analysis shows."
        howWeMeasure={{
          what: 'The emotional character of posts in your feed — categorized as positive, neutral, or negative.',
          how: 'Post text is analyzed by Google\'s Gemini AI to classify emotional tone based on language patterns. Each post receives one valence label.',
          limitations: 'Sentiment analysis is approximate — tone is subjective, and short posts may be misclassified. Sarcasm and irony are difficult to detect. This describes what appeared — not your emotional state or the platform\'s intent.',
          learnMoreUrl: 'https://algorithmlens.com/dashboard#tone',
        }}
      />

      {/* Low sample indicator */}
      {analysis?.lowSample && (
        <View style={{
          backgroundColor: colors.lowSampleBg,
          borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderWidth: 1,
          borderColor: colors.lowSampleBorder,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
        }}>
          <Info size={14} color={colors.warning} strokeWidth={2} />
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.warning, flex: 1 }}>
            Low sample — fewer than 10 posts with tone data. Results may not reflect typical patterns.
          </Text>
        </View>
      )}

      {/* Section: Tone Composition */}
      <SectionHeader title="Tone Distribution" subtitle="Emotional character of posts" />
      <View style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        ...shadows.card,
      }}>
        <StackedBar100
          segments={[
            { label: 'Positive', percentage: analysis?.positivePct ?? 0, count: analysis?.positiveCount ?? 0, color: TONE_COLORS.positive },
            { label: 'Neutral', percentage: analysis?.neutralPct ?? 0, count: analysis?.neutralCount ?? 0, color: TONE_COLORS.neutral },
            { label: 'Negative', percentage: analysis?.negativePct ?? 0, count: analysis?.negativeCount ?? 0, color: TONE_COLORS.negative },
          ]}
        />
        <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic', marginTop: SPACING.xxs }}>
          Each segment shows what share of posts fell into that emotional category.
        </Text>
        <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted, marginTop: SPACING.xxs }}>
          Based on {analysis?.knownValenceTotal ?? 0} posts with identifiable tone
        </Text>
      </View>

      {/* Section: Summary Stats */}
      <View style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        ...shadows.card,
      }}>
        <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted }}>
          {(analysis?.negativePct ?? 0) >= 35
            ? `Negative or conflict-focused tone appeared in ${analysis?.negativePct}% of posts. In a 60-minute session, that would represent about ${Math.round(60 * (analysis?.negativePct ?? 0) / 100)} minutes of negatively-framed content.`
            : (analysis?.positivePct ?? 0) >= 35
            ? `Positive or upbeat tone appeared in ${analysis?.positivePct}% of posts. Your scrolling experience leaned toward optimistic content.`
            : (analysis?.neutralPct ?? 0) >= 35
            ? `Neutral or informational tone appeared in ${analysis?.neutralPct}% of posts. Most content appeared factual or balanced rather than emotionally charged.`
            : `Your feed showed a mix of emotional tones — ${analysis?.positivePct}% positive, ${analysis?.neutralPct}% neutral, and ${analysis?.negativePct}% negative.`
          }
        </Text>
      </View>

      {/* PD-001 FIX: Collapsible detail sections */}
      {/* A-004 FIX: MIN_TOUCH_TARGET ensures accessible tap target */}
      {(data.topPositiveSources.length > 0 || data.topNegativeSources.length > 0 || data.toneBySourceOrigin) && (
        <TouchableOpacity
          onPress={() => setShowToneDetails(!showToneDetails)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            minHeight: MIN_TOUCH_TARGET,
            borderRadius: RADIUS.lg,
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: colors.borderSoft,
          }}
          accessibilityRole="button"
          accessibilityLabel={showToneDetails ? 'Hide tone details' : 'Show tone details'}
          accessibilityState={{ expanded: showToneDetails }}
        >
          <Text style={{ ...TYPOGRAPHY.label, color: colors.textMuted }}>
            Deeper analysis
          </Text>
          <ChevronDown
            size={16}
            color={colors.textSecondary}
            strokeWidth={2}
            style={{ transform: [{ rotate: showToneDetails ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      )}

      {/* Section: Top Sources by Tone */}
      {showToneDetails && (data.topPositiveSources.length > 0 || data.topNegativeSources.length > 0) && (
        <>
          <SectionHeader title="Top Sources by Tone" subtitle="Based on observable signals" />

          {data.topPositiveSources.length > 0 && (
            <View style={{
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              ...shadows.card,
              gap: SPACING.xs,
            }}>
              <Text style={{ ...TYPOGRAPHY.overline, color: colors.textMuted, marginBottom: SPACING.xxs }}>
                Most Positive Sources
              </Text>
              {data.topPositiveSources.map((source, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...TYPOGRAPHY.body, color: colors.textMain, fontWeight: '500' }}>
                    @{source.handle}
                  </Text>
                  <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
                    {source.count} positive post{source.count !== 1 ? 's' : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {data.topNegativeSources.length > 0 && (
            <View style={{
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              ...shadows.card,
              gap: SPACING.xs,
            }}>
              <Text style={{ ...TYPOGRAPHY.overline, color: colors.textMuted, marginBottom: SPACING.xxs }}>
                Most Negative Sources
              </Text>
              {data.topNegativeSources.map((source, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...TYPOGRAPHY.body, color: colors.textMain, fontWeight: '500' }}>
                    @{source.handle}
                  </Text>
                  <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
                    {source.count} negative post{source.count !== 1 ? 's' : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Section: Tone Comparison — Suggested vs Followed (PD-001: collapsible) */}
      {showToneDetails && data.toneBySourceOrigin?.hasData && data.toneBySourceOrigin.suggested && data.toneBySourceOrigin.followed && (
        <>
          <SectionHeader title="Tone: Suggested vs Followed" subtitle="Comparing emotional character by origin" />
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
            gap: SPACING.md,
          }}>
            {/* Suggested tone mini bar */}
            <View style={{ gap: SPACING.xxs }}>
              <Text style={{ ...TYPOGRAPHY.overline, color: colors.textMuted }}>
                Tone of Suggested Content
              </Text>
              <View style={{ height: 20, flexDirection: 'row', borderRadius: RADIUS.md, overflow: 'hidden' }}>
                <View style={{ width: `${data.toneBySourceOrigin.suggested.positivePct}%`, backgroundColor: colors.tonePositive }} />
                <View style={{ width: `${data.toneBySourceOrigin.suggested.neutralPct}%`, backgroundColor: colors.toneNeutral }} />
                <View style={{ width: `${data.toneBySourceOrigin.suggested.negativePct}%`, backgroundColor: colors.toneNegative }} />
              </View>
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
                {data.toneBySourceOrigin.suggested.positivePct}% pos · {data.toneBySourceOrigin.suggested.neutralPct}% neut · {data.toneBySourceOrigin.suggested.negativePct}% neg ({data.toneBySourceOrigin.suggested.total} posts)
              </Text>
            </View>

            {/* Followed tone mini bar */}
            <View style={{ gap: SPACING.xxs }}>
              <Text style={{ ...TYPOGRAPHY.overline, color: colors.textMuted }}>
                Tone of Followed Content
              </Text>
              <View style={{ height: 20, flexDirection: 'row', borderRadius: RADIUS.md, overflow: 'hidden' }}>
                <View style={{ width: `${data.toneBySourceOrigin.followed.positivePct}%`, backgroundColor: colors.tonePositive }} />
                <View style={{ width: `${data.toneBySourceOrigin.followed.neutralPct}%`, backgroundColor: colors.toneNeutral }} />
                <View style={{ width: `${data.toneBySourceOrigin.followed.negativePct}%`, backgroundColor: colors.toneNegative }} />
              </View>
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
                {data.toneBySourceOrigin.followed.positivePct}% pos · {data.toneBySourceOrigin.followed.neutralPct}% neut · {data.toneBySourceOrigin.followed.negativePct}% neg ({data.toneBySourceOrigin.followed.total} posts)
              </Text>
            </View>

            {/* Legend */}
            <View style={{ flexDirection: 'row', gap: SPACING.md, justifyContent: 'center', paddingTop: SPACING.xxs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.tonePositive }} />
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>Positive</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.toneNeutral }} />
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>Neutral</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.toneNegative }} />
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>Negative</Text>
              </View>
            </View>

            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic' }}>
              Based on observable tone signals. This comparison may not be available for all scans.
            </Text>
          </View>
        </>
      )}

      {/* Premium: Rare content detection — locked for free users */}
      <LockedOverlayCard
        locked={!isPlus}
        title="Rare content detection"
        body="See which topics rarely appear in your feed and discover underrepresented content themes across your scans."
        onUpgrade={onUpgrade}
      >
        <View style={{ gap: SPACING.sm }}>
          <SectionHeader title="Underrepresented Topics" subtitle="What rarely shows up" />
          <View style={{
            backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
            borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card, minHeight: 120,
          }}>
            <MetricCard headline="Rare topics" value="—" microLine="Topics that rarely appear" hasData={false} />
          </View>
        </View>
      </LockedOverlayCard>

      {/* PD-003 FIX: Removed redundant methodology disclaimer — InsightHero's
          "How we measure" section already provides this via progressive disclosure */}
    </View>
  );
});

// Methodology disclaimer matching the main site's epistemic restraint pattern
const ToneMethodologyDisclaimer = ({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) => (
  <View style={{
    backgroundColor: colors.bgCardGradientEnd,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  }}>
    <Text style={{ ...TYPOGRAPHY.overline, color: colors.textMuted, marginBottom: SPACING.xxs }}>
      How We Measure
    </Text>
    <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
      Emotional tone classification uses Google's Gemini AI to categorize posts as positive, neutral, or negative based on language patterns. Sentiment analysis is approximate — tone is subjective, and short posts may be misclassified. This analysis describes what appeared in your feed — it does not infer your emotional state or the platform's intent.
    </Text>
  </View>
);

// ─── Shared Sub-Components ───────────────────────────────

/** Per-tab error fallback — shows inline error instead of crashing the whole dashboard */
const TabErrorFallback = ({ tabLabel, colors }: { tabLabel: string; colors: ReturnType<typeof useTheme>['colors'] }) => (
  <View style={{
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    gap: SPACING.sm,
  }}>
    <View style={{
      width: ICON_SIZES.touch, height: ICON_SIZES.touch, borderRadius: ICON_SIZES.touch / 2,
      backgroundColor: colors.warningLight, justifyContent: 'center', alignItems: 'center',
    }}>
      <Info size={20} color={colors.warning} strokeWidth={1.5} />
    </View>
    <Text style={{ ...TYPOGRAPHY.h3, color: colors.textMain, textAlign: 'center' }}>
      This section couldn't load
    </Text>
    <Text style={{ ...TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center' }}>
      The {tabLabel} tab ran into an issue. Try switching to another tab or refreshing the dashboard.
    </Text>
  </View>
);

const EmptySection = ({ message, colors }: { message: string; colors: ReturnType<typeof useTheme>['colors'] }) => (
  <View style={{
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
  }}>
    <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textSecondary, textAlign: 'center' }}>
      {message}
    </Text>
  </View>
);

// H8 FIX: Replaced red AiRequiredCard with blue-themed AiConsentCard
const AiConsentCard = ({
  title, description, buttonLabel, onPress, colors, shadows,
}: {
  title: string; description: string; buttonLabel: string; onPress: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'];
}) => (
  <View style={{
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.card,
    alignItems: 'center',
    gap: SPACING.sm,
  }}>
    <View style={{
      width: ICON_SIZES.touch, height: ICON_SIZES.touch, borderRadius: ICON_SIZES.touch / 2,
      backgroundColor: colors.blue50, justifyContent: 'center', alignItems: 'center',
    }}>
      <Sparkles size={20} color={colors.primaryBlue} strokeWidth={1.5} />
    </View>
    <Text style={{ ...TYPOGRAPHY.h3, color: colors.textMain, textAlign: 'center' }}>
      {title}
    </Text>
    <Text style={{ ...TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center' }}>
      {description}
    </Text>
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={buttonLabel}
      style={{
        backgroundColor: colors.primaryBlue, borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
        minHeight: MIN_TOUCH_TARGET,
      }}
    >
      <Settings size={13} color={colors.white} strokeWidth={2} />
      <Text style={{ ...TYPOGRAPHY.buttonSm, color: colors.white }}>{buttonLabel}</Text>
    </TouchableOpacity>
  </View>
);

// New: card for when AI is on but data isn't available yet
const AiProcessingCard = ({
  message,
  title = 'Coming Soon',
  subtitle,
  colors,
  shadows,
}: {
  message: string;
  title?: string;
  subtitle?: string;
  colors: ReturnType<typeof useTheme>['colors'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}) => (
  <View style={{
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.card,
    alignItems: 'center',
    gap: SPACING.sm,
  }}>
    <View style={{
      width: ICON_SIZES.touch, height: ICON_SIZES.touch, borderRadius: ICON_SIZES.touch / 2,
      backgroundColor: colors.blue50, justifyContent: 'center', alignItems: 'center',
    }}>
      <Info size={20} color={colors.primaryBlue} strokeWidth={1.5} />
    </View>
    <Text style={{ ...TYPOGRAPHY.h3, color: colors.textMain, textAlign: 'center' }}>
      {title}
    </Text>
    <Text style={{ ...TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center' }}>
      {message}
    </Text>
    {subtitle && (
      <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, textAlign: 'center' }}>
        {subtitle}
      </Text>
    )}
  </View>
);

const PlusTierBanner = ({ isPlus, colors }: { isPlus: boolean; colors: ReturnType<typeof useTheme>['colors'] }) => {
  if (isPlus) return null;
  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/settings')}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Unlock trend analysis with Plus"
      style={{
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        backgroundColor: colors.blue800,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        minHeight: MIN_TOUCH_TARGET,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
      }}
    >
      <TrendingUp size={16} color={colors.white} strokeWidth={2} />
      <Text style={{ ...TYPOGRAPHY.small, fontWeight: '600', color: colors.white, flex: 1 }}>
        Unlock trend analysis with Plus
      </Text>
      <View style={{
        backgroundColor: colors.accentGreen, borderRadius: RADIUS.sm,
        paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
      }}>
        <Text style={{ ...TYPOGRAPHY.captionSmall, fontWeight: '700', color: colors.white }}>Try Free</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const { scanId } = useLocalSearchParams<{ scanId?: string }>();
  const { scans, latestScan, loading, refresh, error: fetchError } = useDashboard();
  const { userProfile, isPlus } = useAuth();
  const { colors, shadows } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const aiConsent = userProfile?.ai_analysis_consent === true;

  // C-03 FIX: Refresh scan data when this tab gains focus.
  // This ensures the dashboard always shows the newest scan data,
  // especially when navigating from Scan Complete → Dashboard.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // L4: If a specific scanId was passed (from history), use that scan
  const activeScan = useMemo(() => {
    if (scanId && scans.length > 0) {
      return scans.find((s) => s.id === scanId) || latestScan;
    }
    return latestScan;
  }, [scanId, scans, latestScan]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const dashboardData = useMemo(() => {
    if (!activeScan) return null;
    try {
      return computeDashboardData(activeScan);
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)), 'dashboard:compute_data');
      return null;
    }
  }, [activeScan]);

  // Show error if scan exists but data couldn't be computed
  const dashboardComputeError = activeScan && !dashboardData && !loading;

  const hasData = dashboardData !== null && dashboardData.hasData;

  const goToSettings = () => router.push('/(tabs)/settings');

  // Tab switch with fade animation and haptic feedback
  const switchTab = useCallback((tabId: string) => {
    if (tabId === activeTab) return;
    triggerSelection();

    // Check for reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled().then((isReduceMotionEnabled: boolean) => {
      if (isReduceMotionEnabled) {
        // Skip animation if reduce motion is enabled
        setActiveTab(tabId);
      } else {
        // Play fade animation
        Animated.timing(fadeAnim, { toValue: 0, duration: ANIMATION.TAB_FADE_OUT, useNativeDriver: true }).start(() => {
          setActiveTab(tabId);
          Animated.timing(fadeAnim, { toValue: 1, duration: ANIMATION.TAB_FADE_IN, useNativeDriver: true }).start();
        });
      }
    }).catch(() => {
      // If API not available, default to no animation skip
      Animated.timing(fadeAnim, { toValue: 0, duration: ANIMATION.TAB_FADE_OUT, useNativeDriver: true }).start(() => {
        setActiveTab(tabId);
        Animated.timing(fadeAnim, { toValue: 1, duration: ANIMATION.TAB_FADE_IN, useNativeDriver: true }).start();
      });
    });
  }, [activeTab, fadeAnim]);

  const handleUpgrade = () => router.push('/(tabs)/settings');

  const renderTabContent = () => {
    if (!dashboardData) return null;
    const tabLabel = TABS.find(t => t.id === activeTab)?.label ?? 'this';
    const fallback = <TabErrorFallback tabLabel={tabLabel} colors={colors} />;
    let content: React.ReactNode;
    switch (activeTab) {
      case 'overview': content = <OverviewContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'sources': content = <SourcesContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'ads': content = <AdsContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'politics': content = <PoliticsContent data={dashboardData} aiConsent={aiConsent} onGoToSettings={goToSettings} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'tone': content = <ToneContent data={dashboardData} aiConsent={aiConsent} onGoToSettings={goToSettings} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'suggested_vs_followed': content = <SuggestedContent data={dashboardData} colors={colors} shadows={shadows} />; break;
      default: content = <OverviewContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
    }
    return (
      <ErrorBoundary key={activeTab} fallback={fallback}>
        {content}
      </ErrorBoundary>
    );
  };

  // Tour tab-switch handler (no haptics during tour)
  const tourSwitchTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      {/* Dashboard tooltip tour — shows once after first scan */}
      {hasData && (
        <DashboardTour
          onComplete={() => {}}
          onSwitchTab={tourSwitchTab}
        />
      )}

      <ContentFadeIn ready={!loading || scans.length > 0} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
        }
        scrollEventThrottle={16}
      >
        {/* Header with scan button — M-07 FIX: Added gap + marginRight to prevent overlap */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
          paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xs,
          gap: SPACING.md,
        }}>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <Text style={{ ...TYPOGRAPHY.h1, color: colors.textMain, marginBottom: SPACING.xxs }} accessibilityRole="header">
              Your Dashboard
            </Text>
            {activeScan ? (
              <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }}>
                {new Date(activeScan.created_at).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}{' — '}
                {getPlatformDisplayName(activeScan.platform)}{' '}
                ({activeScan.post_count} posts)
              </Text>
            ) : (
              <Text style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary }}>
                {loading ? 'Loading...' : 'No scans yet'}
              </Text>
            )}
          </View>
          {/* D-1 FIX: Unified scan CTA color — primary blue */}
          {hasData && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/scan')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Scan your feed"
              style={{
                backgroundColor: colors.primaryBlue, borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
                minHeight: MIN_TOUCH_TARGET,
                flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
              }}
            >
              <ScanSearch size={14} color={colors.white} strokeWidth={2} />
              <Text style={{ ...TYPOGRAPHY.buttonSm, color: colors.white }}>Scan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading — Skeleton shimmer matching dashboard layout */}
        {loading && !refreshing && scans.length === 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl, gap: SPACING.lg }}
            accessible={true} accessibilityLabel="Loading dashboard" accessibilityRole="none">
            {/* Skeleton: tab bar placeholder */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Skeleton width={80} height={40} borderRadius={RADIUS.full} />
              <Skeleton width={70} height={40} borderRadius={RADIUS.full} />
              <Skeleton width={90} height={40} borderRadius={RADIUS.full} />
            </View>
            {/* Skeleton: insight card placeholder */}
            <Skeleton height={140} borderRadius={RADIUS.lg} />
            {/* Skeleton: metrics row */}
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <Skeleton height={100} borderRadius={RADIUS.lg} />
              </View>
              <View style={{ flex: 1 }}>
                <Skeleton height={100} borderRadius={RADIUS.lg} />
              </View>
            </View>
            {/* Skeleton: chart placeholder */}
            <Skeleton height={80} borderRadius={RADIUS.lg} />
            {/* Skeleton: section header */}
            <Skeleton width={120} height={16} borderRadius={RADIUS.sm} />
            {/* Skeleton: detail rows */}
            <Skeleton height={56} borderRadius={RADIUS.md} />
            <Skeleton height={56} borderRadius={RADIUS.md} />
          </View>
        )}

        {/* Fetch error banner */}
        {fetchError && !loading && (
          <View style={{
            marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
            backgroundColor: colors.warningLight, borderRadius: RADIUS.md,
            padding: SPACING.lg, borderWidth: 1, borderColor: colors.warningBorder,
            flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
          }} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            <Info size={16} color={colors.warning} strokeWidth={2} />
            <Text style={{ ...TYPOGRAPHY.body, color: colors.warning, flex: 1 }}>
              {fetchError}
            </Text>
          </View>
        )}

                {/* Dashboard compute error */}
        {dashboardComputeError && (
          <View style={{ paddingHorizontal: SPACING.xl, paddingVertical: SPACING['4xl'], alignItems: 'center' }}>
            <View style={{
              width: 56, height: 56, backgroundColor: colors.warningLight, borderRadius: 28,
              justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
            }}>
              <Info size={24} color={colors.warning} strokeWidth={1.5} />
            </View>
            <Text style={{ ...TYPOGRAPHY.h3, color: colors.textMain, marginBottom: SPACING.sm }}>
              This scan couldn't be displayed
            </Text>
            <Text style={{
              ...TYPOGRAPHY.body, color: colors.textMuted, textAlign: 'center', marginBottom: SPACING.xl,
            }}>
              We had trouble reading this scan's data. Try refreshing, or start a new scan to get fresh results.
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
              accessibilityRole="button"
              accessibilityLabel="Refresh dashboard"
              style={{
                backgroundColor: colors.primaryBlue, borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
                minHeight: MIN_TOUCH_TARGET,
                justifyContent: 'center', alignItems: 'center',
              }}
            >
              <Text style={{ ...TYPOGRAPHY.buttonSm, color: colors.white }}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

                {/* Empty state */}
        {!loading && !hasData && (
          <>
            {/* D-2 FIX: Show tab strip even in empty state so users understand dashboard structure */}
            <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xs, marginBottom: SPACING.sm, opacity: 0.5 }}>
              {[TABS.slice(0, 3), TABS.slice(3, 6)].map((row, rowIdx) => (
                <View key={rowIdx} style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                  {row.map((tab) => (
                    <View
                      key={tab.id}
                      style={{
                        flex: 1,
                        paddingVertical: SPACING.md,
                        minHeight: 48,
                        borderRadius: RADIUS.md,
                        backgroundColor: colors.bgCard,
                        borderWidth: 1,
                        borderColor: colors.borderSlate200,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{
                        ...TYPOGRAPHY.buttonSm,
                        color: colors.textTertiary,
                        textAlign: 'center',
                      }}>
                        {tab.label}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* D-5 FIX: Position empty state in upper portion instead of centered */}
            <View style={{ paddingHorizontal: SPACING['2xl'], paddingTop: SPACING['2xl'], paddingBottom: SPACING['4xl'], alignItems: 'center' }}>
            {/* D-4 FIX: Use AlgorithmLens Eye icon instead of generic search icon */}
            <View style={{
              width: 56, height: 56, backgroundColor: colors.blue50, borderRadius: 28,
              justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
            }}>
              <Search size={24} color={colors.primaryBlue} strokeWidth={1.5} />
            </View>
            {/* D-3 FIX: Improved empty state subtitle */}
            <Text style={{ ...TYPOGRAPHY.h3, color: colors.textMain, marginBottom: SPACING.sm }}>
              No scans yet
            </Text>
            <Text style={{
              ...TYPOGRAPHY.body, color: colors.textMuted, textAlign: 'center', marginBottom: SPACING.xl,
            }}>
              Complete your first scan to unlock insights about your feed — ads, suggested content, top sources, and more.
            </Text>
            {/* D-1 FIX: Unified scan CTA color — primary blue instead of teal/green */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/scan')}
              accessibilityRole="button"
              accessibilityLabel="Start your first scan"
              style={{
                backgroundColor: colors.primaryBlue, borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
              }}
            >
              <Text style={{ ...TYPOGRAPHY.buttonSm, color: colors.white }}>Start Your First Scan</Text>
            </TouchableOpacity>
          </View>
          </>
        )}

        {/* Tab bar + content */}
        {hasData && (
          <>
            {/* H-05 FIX: Plus banner only shows on Overview tab, not all 6 */}
            {activeTab === 'overview' && <PlusTierBanner isPlus={isPlus} colors={colors} />}

            {/* Horizontally scrollable tab bar — single row, no wrapping */}
            <View style={{ position: 'relative' }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: SPACING.lg,
                  paddingRight: SPACING.lg + SPACING.sm,
                  gap: SPACING.sm,
                  marginTop: SPACING.xs,
                  marginBottom: SPACING.sm,
                }}
                accessibilityRole="tablist"
              >
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => switchTab(tab.id)}
                      activeOpacity={0.7}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`${tab.label} tab`}
                      style={{
                        paddingVertical: SPACING.md,
                        paddingHorizontal: SPACING.lg,
                        minHeight: MIN_TOUCH_TARGET,
                        borderRadius: RADIUS.full,
                        backgroundColor: isActive ? colors.primaryBlue : colors.bgSecondary,
                        borderWidth: isActive ? 0 : 1,
                        borderColor: isActive ? 'transparent' : colors.borderLight,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: tab.needsAi ? 4 : 0,
                        ...(isActive ? shadows.soft : {}),
                      }}
                    >
                      {tab.needsAi && (
                        <View style={{
                          backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.blue50,
                          borderRadius: RADIUS.xs,
                          paddingHorizontal: SPACING.xxs,
                          paddingVertical: 1,
                        }}>
                          <Text style={{
                            ...TYPOGRAPHY.captionSmall,
                            fontWeight: '700',
                            color: isActive ? colors.white : colors.primaryBlue,
                            letterSpacing: 0.5,
                          }}>AI</Text>
                        </View>
                      )}
                      <Text style={{
                        ...TYPOGRAPHY.buttonSm,
                        color: isActive ? colors.white : colors.textMuted,
                      }}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {/* Left fade */}
              <LinearGradient
                colors={[colors.bgPage, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 20,
                  pointerEvents: 'none',
                }}
              />
              {/* Right fade */}
              <LinearGradient
                colors={['transparent', colors.bgPage]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 20,
                  pointerEvents: 'none',
                }}
              />
            </View>

            {/* Tab Content with fade */}
            <Animated.View style={{
              paddingHorizontal: SPACING.lg,
              paddingBottom: SPACING['6xl'],
              opacity: fadeAnim,
            }} accessibilityLiveRegion="polite">
              {renderTabContent()}
            </Animated.View>
          </>
        )}
      </ScrollView>
      </ContentFadeIn>
    </SafeAreaView>
  );
}
