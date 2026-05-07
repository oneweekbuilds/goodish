import React, { useState, useMemo, useRef, useCallback, memo } from 'react';
import {
  View,
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
import { RFValue } from 'react-native-responsive-fontsize';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { ContentFadeIn, Skeleton } from '../../src/components/glue';
import { useDashboard } from '../../src/hooks/useDashboard';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { computeDashboardData, DashboardData, PoliticalAnalysis, ToneAnalysis, AdvertiserStat, ToneSourceStat, ToneBySourceOrigin, CreatorNovelty, AiContentAnalysis, UnlabeledPromos, AdvertisedProductType, ToneBySelling, ToneByPolitical, BrandsAndInfluencers, ByPlatformBreakdown, CommercialComparison, TopicFrequency, ContentFormatComparison } from '../../src/lib/computeDashboardData';
import { InsightHero } from '../../src/components/dashboard/InsightHero';
import { ALBarChart, ALStackedBar, ALPieChart, ALRadarChart, ALScoreGauge } from '../../src/components/charts';
import { BigNumber } from '../../src/components/dashboard/BigNumber';
import { MetricCard } from '../../src/components/dashboard/MetricCard';
import { SectionHeader } from '../../src/components/dashboard/SectionHeader';
import { ToneComparisonCard } from '../../src/components/dashboard/ToneComparisonCard';
import { LockedOverlayCard } from '../../src/components/plan/LockedOverlayCard';
import { EvidenceBundleTeaser } from '../../src/components/plan/EvidenceBundleTeaser';
import { FreeAskTeaser } from '../../src/components/plan/FreeAskTeaser';
import { DashboardTour } from '../../src/components/dashboard/DashboardTour';
import { Text } from '../../src/components/glue';
import { SPACING, RADIUS, GL_TYPOGRAPHY } from '../../src/lib/gluestackTheme';
import { COLORS, ICON_SIZES, MIN_TOUCH_TARGET } from '../../src/lib/theme';
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
  MessageCircleQuestion,
} from 'lucide-react-native';

// ─── Animation Constants ─────────────────────────────────
const ANIMATION = {
  TAB_FADE_OUT: 80,
  TAB_FADE_IN: 150,
} as const;

// ─── Tab Definitions ─────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', accent: 'tourOverview' },
  { id: 'sources', label: 'Who Shapes Your Feed', accent: 'tourSources' },
  { id: 'ads', label: 'Ads & Promotions', accent: 'tourAds' },
  { id: 'politics', label: 'Political Exposure', accent: 'tourPolitics' },
  { id: 'tone', label: 'Emotional Tone', accent: 'tourTone' },
  { id: 'suggested_vs_followed', label: 'Suggested vs. Followed', accent: 'tourSuggested' },
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
  const [showFeedSummary, setShowFeedSummary] = useState(false);
  const [showAiContent, setShowAiContent] = useState(false);
  const [showFeedbackLoop, setShowFeedbackLoop] = useState(false);

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
      suggestions.push('Explore new creators, your feed is heavily concentrated.');
    }
    if (data.adPct > 20) {
      suggestions.push('Consider using ad-blocking features on this platform.');
    }
    if (data.adPct === 0) {
      suggestions.push('Your scan showed no detected ads, scan longer next time for more complete results.');
    }
    suggestions.push('Compare results across multiple scans to see patterns.');
  } else {
    suggestions.push('Scan at least 10 posts to see meaningful experiment suggestions.');
    suggestions.push('Compare results across multiple scans to see patterns.');
  }

  // ── Content Patterns ──
  const emotionalSummary = data.toneAnalysis
    ? data.toneAnalysis.negativePct >= 35 ? 'High intensity, notable negative tone'
    : data.toneAnalysis.positivePct >= 50 ? 'Mostly positive'
    : data.toneAnalysis.neutralPct >= 50 ? 'Mostly neutral'
    : 'Mix of positive and negative'
    : null;

  const sourceDiversitySummary = data.topCreators.length >= 5
    ? `Concentrated, top 5 creators make up ${data.top5Pct}%`
    : data.topCreators.length > 0
    ? `${data.uniqueCreatorCount} unique creators detected`
    : null;

  const hasContentPatterns = emotionalSummary || sourceDiversitySummary;

  // ── Content Patterns 6-card grid data ──
  const topInterests = data.contentTypes.length > 0
    ? data.contentTypes.slice(0, 3).map(ct => CONTENT_TYPE_LABELS[ct.label.toLowerCase()] || ct.label).join(', ')
    : 'Varied content';

  const emotionalSignal = data.toneAnalysis
    ? data.toneAnalysis.positivePct > 50 ? 'Mostly positive'
    : data.toneAnalysis.negativePct > 30 ? 'Notable negativity'
    : 'Balanced'
    : 'Not analyzed';

  const politicalExposure = data.politicalAnalysis
    ? data.politicalAnalysis.politicalPct > 30 ? 'High exposure'
    : data.politicalAnalysis.politicalPct > 15 ? 'Moderate exposure'
    : 'Light exposure'
    : 'Not analyzed';

  const contentStyle = data.suggestedPct > 60 ? 'Discovery-driven'
    : data.suggestedPct < 30 ? 'Following-driven'
    : 'Balanced';

  const sourceDiversity = data.top5Pct > 60 ? 'Concentrated'
    : data.top5Pct < 40 ? 'Diverse'
    : 'Moderate';

  const commercialPresence = data.adPct > 25 ? 'Ad-heavy'
    : data.adPct > 15 ? 'Noticeable ads'
    : 'Light ads';

  const patternCards = [
    { label: 'Top interests', value: topInterests },
    { label: 'Emotional signal', value: emotionalSignal },
    { label: 'Political exposure', value: politicalExposure },
    { label: 'Content style', value: contentStyle },
    { label: 'Source diversity', value: sourceDiversity },
    { label: 'Commercial presence', value: commercialPresence },
  ];

  // ── Feed Summary bullets ──
  const feedSummaryBullets: string[] = [];
  if (data.totalPosts >= 10) {
    feedSummaryBullets.push(`Your top 5 sources made up ${data.top5Pct}% of posts`);
    if (data.adPct > 0) {
      feedSummaryBullets.push(`Ad content was ${data.adPct}% of your feed`);
    } else {
      feedSummaryBullets.push('No ad content was detected');
    }
    if (data.suggestedPct > 0) {
      feedSummaryBullets.push(`Suggested content made up ${data.suggestedPct}% of your feed`);
    }
    if (politicalPct > 0) {
      feedSummaryBullets.push(`Political content was ${politicalPct}% of posts`);
    }
    feedSummaryBullets.push(`This scan included ${data.totalPosts} posts from ${data.platform}`);
  }

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
        counterfactual="This is what showed up during this window. It may not represent your typical feed, a single scan captures one moment, not a pattern."
        howWeMeasure={{
          what: 'A snapshot of your feed composition at the time of scanning, content types, sources, ads, and recommendations.',
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
          <Text variant="captionSmall" color={colors.textSecondary} style={{ fontStyle: "italic", marginTop: SPACING.sm  }}>
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
                <Text variant="h3" color={colors.textMain } style={{ fontWeight: "700" }}>
                  {metric.value}
                </Text>
                <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs  }}>
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── 3. EXPLORE YOUR DATA (accordion) ── */}
      <Text variant="overline" color={colors.textMuted} style={{ marginTop: SPACING['2xl'] }}>
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
                <Text variant="label" color={colors.textMain }>Content Types</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textMuted }}>
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
                <ALStackedBar
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
                <Text variant="label" color={colors.textMain }>Time Estimate</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textMuted }}>
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
                    <Text variant="h1" color={colors.textMain }>
                      {formatMinutes(adMinutes)}
                    </Text>
                    <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs  }}>
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
                    <Text variant="h1" color={colors.textMain }>
                      {formatMinutes(politicalMinutes)}
                    </Text>
                    <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs  }}>
                      min/day on political content
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs, paddingHorizontal: SPACING.xs }}>
                  <Info size={11} color={colors.textSecondary} strokeWidth={2} />
                  <Text variant="captionSmall" color={colors.textSecondary} style={{ fontStyle: "italic" }}>
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
                <Text variant="label" color={colors.textMain }>Content Patterns</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexShrink: 1, justifyContent: 'flex-end' }}>
                <Text variant="captionSmall" color={colors.textMuted} style={{ maxWidth: 160  }} numberOfLines={1}>
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
                    <Text variant="overline" color={colors.textSecondary }>
                      Emotional Signal
                    </Text>
                    <Text variant="body" color={colors.textMain} style={{ fontWeight: "600" }}>
                      {emotionalSummary}
                    </Text>
                  </View>
                )}
                {sourceDiversitySummary && (
                  <View style={{ gap: SPACING.xxs }}>
                    <Text variant="overline" color={colors.textSecondary }>
                      Source Diversity
                    </Text>
                    <Text variant="body" color={colors.textMain} style={{ fontWeight: "600" }}>
                      {sourceDiversitySummary}
                    </Text>
                  </View>
                )}
                <Text variant="captionSmall" color={colors.textSecondary} style={{ fontStyle: "italic", marginTop: SPACING.xxs  }}>
                  These labels are inferred from feed content only. Actual platform categorization may differ.
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* ── 3b. CONTENT PATTERNS (6-card grid) ── */}
      {data.totalPosts >= 10 && (
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
        }}>
          <Text variant="label" color={colors.textMain} style={{ marginBottom: SPACING.md }}>
            Content Patterns
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {patternCards.map((card, i) => (
              <View key={i} style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                padding: 12,
                flex: 1,
                minWidth: '47%',
              }}>
                <Text style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 2 }}>
                  {card.label}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary ?? colors.textMain }} numberOfLines={1}>
                  {card.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── 3c. FEED SUMMARY ── */}
      {feedSummaryBullets.length > 0 && (
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          overflow: 'hidden',
        }}>
          <TouchableOpacity
            onPress={() => setShowFeedSummary(!showFeedSummary)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={showFeedSummary ? 'Collapse feed summary' : 'Expand feed summary'}
            accessibilityState={{ expanded: showFeedSummary }}
            style={{
              paddingHorizontal: SPACING.lg,
              minHeight: 52,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Layers size={16} color={colors.primaryBlue} strokeWidth={2} />
              <Text variant="label" color={colors.textMain}>Feed Summary</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textMuted }}>
                {feedSummaryBullets.length} items
              </Text>
              <ChevronDown
                size={16}
                color={colors.textSecondary}
                strokeWidth={2}
                style={{ transform: [{ rotate: showFeedSummary ? '180deg' : '0deg' }] }}
              />
            </View>
          </TouchableOpacity>
          {showFeedSummary && (
            <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, gap: SPACING.sm }}>
              {feedSummaryBullets.map((bullet, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm }}>
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.primaryBlue,
                    marginTop: 6,
                  }} />
                  <Text variant="body" color={colors.textMain} style={{ flex: 1, fontSize: 14 }}>
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── 3d. BRANDS & INFLUENCERS (PLUS) ── */}
      {data.brandsAndInfluencers && (
        <LockedOverlayCard
          locked={!isPlus}
          title="Brands & Influencers"
          body="See which accounts are brand-driven vs. organic influencers in your feed."
          onUpgrade={onUpgrade}
        >
          <View style={{ gap: SPACING.md }}>
            {data.brandsAndInfluencers.topBrands.length > 0 && (
              <View style={{ gap: SPACING.sm }}>
                <Text variant="overline" color={colors.textMuted}>Top Brands</Text>
                {data.brandsAndInfluencers.topBrands.map((brand, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm,
                    backgroundColor: colors.bgCardGradientEnd, borderRadius: RADIUS.md,
                  }}>
                    <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textMain, fontWeight: '500' }}>
                      @{brand.handle}
                    </Text>
                    <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
                      {brand.postCount} post{brand.postCount !== 1 ? 's' : ''} · {brand.adCount} ad{brand.adCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {data.brandsAndInfluencers.topInfluencers.length > 0 && (
              <View style={{ gap: SPACING.sm }}>
                <Text variant="overline" color={colors.textMuted}>Top Influencers</Text>
                {data.brandsAndInfluencers.topInfluencers.map((inf, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm,
                    backgroundColor: colors.bgCardGradientEnd, borderRadius: RADIUS.md,
                  }}>
                    <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textMain, fontWeight: '500' }}>
                      @{inf.handle}
                    </Text>
                    <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
                      {inf.postCount} post{inf.postCount !== 1 ? 's' : ''} · {inf.adCount} ad{inf.adCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </LockedOverlayCard>
      )}

      {/* ── 3e. AI-MADE CONTENT ANALYSIS ── */}
      {data.totalPosts >= 10 && (
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          overflow: 'hidden',
        }}>
          <TouchableOpacity
            onPress={() => setShowAiContent(!showAiContent)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={showAiContent ? 'Collapse AI content analysis' : 'Expand AI content analysis'}
            accessibilityState={{ expanded: showAiContent }}
            style={{
              paddingHorizontal: SPACING.lg,
              minHeight: 52,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Sparkles size={16} color={colors.primaryBlue} strokeWidth={2} />
              <Text variant="label" color={colors.textMain}>AI-Made Content</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textMuted }}>
                {data.aiContentAnalysis ? `${data.aiContentAnalysis.labeledPct}% labeled` : 'No data'}
              </Text>
              <ChevronDown
                size={16}
                color={colors.textSecondary}
                strokeWidth={2}
                style={{ transform: [{ rotate: showAiContent ? '180deg' : '0deg' }] }}
              />
            </View>
          </TouchableOpacity>
          {showAiContent && (
            <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, gap: SPACING.md }}>
              {data.aiContentAnalysis ? (
                <>
                  <ALStackedBar
                    segments={[
                      {
                        label: 'AI-labeled',
                        percentage: data.aiContentAnalysis.labeledPct,
                        count: data.aiContentAnalysis.labeledCount,
                        color: '#F59E0B',
                      },
                      {
                        label: 'No strong AI signals',
                        percentage: 100 - data.aiContentAnalysis.labeledPct,
                        count: data.aiContentAnalysis.noSignalsCount,
                        color: '#94A3B8',
                      },
                    ]}
                  />
                  <Text variant="bodySmall" color={colors.textSecondary} style={{ fontStyle: 'italic' }}>
                    {data.aiContentAnalysis.labeledPct >= 5
                      ? `About ${data.aiContentAnalysis.labeledPct}% of visual content shows signs of being AI-made`
                      : 'Very little content shows strong signs of being AI-made'}
                  </Text>
                </>
              ) : (
                <View style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: RADIUS.md,
                  padding: SPACING.lg,
                }}>
                  <Text variant="bodySmall" color={colors.textSecondary}>
                    AI content detection data is not available for this scan. Future scans will include AI disclosure analysis for visual content.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ── 3e. HOW THE FEEDBACK LOOP WORKS ── */}
      <View style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        overflow: 'hidden',
      }}>
        <TouchableOpacity
          onPress={() => setShowFeedbackLoop(!showFeedbackLoop)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={showFeedbackLoop ? 'Collapse feedback loop explanation' : 'Expand feedback loop explanation'}
          accessibilityState={{ expanded: showFeedbackLoop }}
          style={{
            paddingHorizontal: SPACING.lg,
            minHeight: 52,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Info size={16} color={colors.primaryBlue} strokeWidth={2} />
            <Text variant="label" color={colors.textMain}>How the Feedback Loop Works</Text>
          </View>
          <ChevronDown
            size={16}
            color={colors.textSecondary}
            strokeWidth={2}
            style={{ transform: [{ rotate: showFeedbackLoop ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
        {showFeedbackLoop && (
          <View style={{
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.lg,
            gap: SPACING.md,
          }}>
            <View style={{
              backgroundColor: '#F8FAFC',
              borderRadius: RADIUS.md,
              padding: SPACING.lg,
              gap: SPACING.lg,
            }}>
              {[
                { step: 1, title: 'Your behavior', desc: 'What you pause on, like, share, and skip sends signals to the platform' },
                { step: 2, title: 'Patterns accumulate', desc: 'Over time, recurring topics and content types form observable patterns in your feed' },
                { step: 3, title: 'Content is tailored', desc: 'Your feed composition reflects what has appeared \u2014 we cannot know why specific content was selected' },
                { step: 4, title: 'Your media diet evolves', desc: 'Each interaction reinforces or shifts the cycle. Small changes can move the needle' },
              ].map((item) => (
                <View key={item.step} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.primaryBlue,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                      {item.step}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="labelBold" color={colors.textMain}>
                      {item.title}
                    </Text>
                    <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 2 }}>
                      {item.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
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
          <Text variant="label" color={colors.textMain} style={{ marginBottom: SPACING.sm }}>
            Ideas to explore
          </Text>
          <Text variant="bodySmall" color={colors.textMuted }>
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
                <Text variant="labelBold" color={colors.primaryBlue }>
                  {showAllIdeas ? 'Hide ideas' : 'See all ideas'}
                </Text>
              </TouchableOpacity>
              {showAllIdeas && (
                <View style={{ marginTop: SPACING.sm, gap: SPACING.sm }}>
                  {suggestions.slice(1).map((suggestion, i) => (
                    <Text key={i} variant="bodySmall" color={colors.textMuted }>
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
        <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
          {data.platform}
        </Text>
        <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>{'\u00B7'}</Text>
        <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
          {data.totalPosts} posts
        </Text>
        {data.scanDate && (
          <>
            <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>{'\u00B7'}</Text>
            <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
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
            <Text variant="overline" color={colors.textSecondary }>
              Top 5
            </Text>
            <Text style={{ ...GL_TYPOGRAPHY.h2, color: colors.textMain, marginTop: SPACING.xxs }}>
              {data.top5Pct}%
            </Text>
            <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs  }}>
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
            <Text variant="overline" color={colors.textSecondary }>
              Top Source
            </Text>
            <Text variant="labelBold" color={colors.textMain} style={{ marginTop: SPACING.xxs }} numberOfLines={1}>
              @{data.topCreators[0]?.name ?? '—'}
            </Text>
            <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs  }}>
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
            <Text variant="overline" color={colors.textSecondary }>
              Sources
            </Text>
            <Text style={{ ...GL_TYPOGRAPHY.h2, color: colors.textMain, marginTop: SPACING.xxs }}>
              {data.uniqueCreatorCount}
            </Text>
            <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs  }}>
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
          <ALBarChart
            data={data.topCreators.slice(0, isPlus ? 10 : 5).map((creator) => ({
              label: `@${creator.name}`,
              value: creator.count,
              percentage: creator.percentage,
            }))}
          />
          {!isPlus && data.topCreators.length > 5 && (
            <Text variant="captionSmall" color={colors.textTertiary} style={{ fontStyle: 'italic', marginTop: SPACING.sm, textAlign: 'center' }}>
              See all 10 with Plus
            </Text>
          )}
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
          <Text variant="label" color={colors.textMuted }>
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
            <Text variant="captionSmall" color={colors.textSecondary} style={{ marginTop: SPACING.xxs  }}>
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
            <ALStackedBar
              segments={[
                { label: 'Top 5', percentage: top5ConcPct, count: top5Count, color: colors.primaryBlue },
                ...(top6to10Pct > 0 ? [{ label: 'Top 6–10', percentage: top6to10Pct, count: top6to10Count, color: colors.blue200 }] : []),
                { label: 'Others', percentage: othersPct, count: othersCount, color: colors.textTertiary },
              ]}
            />
            <Text variant="captionSmall" color={colors.textSecondary} style={{ fontStyle: "italic", marginTop: SPACING.sm  }}>
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

      {/* Plus teasers for free users */}
      {!isPlus && (
        <>
          <EvidenceBundleTeaser text="Plus provides detailed creator analysis and source diversity tracking" onUpgrade={onUpgrade} />
          <FreeAskTeaser exampleQuestion="Which creators dominate my feed the most?" onUpgrade={onUpgrade} />
        </>
      )}

      {/* ── Footer Context ── */}
      <View style={{ paddingVertical: SPACING.lg, alignItems: 'center' }}>
        <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary, textAlign: 'center' }}>
          Based on {data.totalPosts} posts · {data.platform}{data.scanDate ? ` · Scanned ${new Date(data.scanDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
        </Text>
      </View>
    </View>
  );
});

const AdsContent = memo(({ data, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  const [showAdvertisers, setShowAdvertisers] = useState(false);
  const [showProductTypes, setShowProductTypes] = useState(false);

  // Compute composition segments — 3-segment when unlabeled promo data exists
  const hasUnlabeledPromos = data.unlabeledPromos !== null && data.unlabeledPromos.count > 0;
  const unlabeledCount = hasUnlabeledPromos ? data.unlabeledPromos!.count : 0;
  const unlabeledPct = hasUnlabeledPromos ? data.unlabeledPromos!.percentage : 0;
  const labeledAdCount = data.adCount;
  const labeledAdPct = data.adPct;
  const notAdCount = data.totalPosts - labeledAdCount - unlabeledCount;
  const notAdPct = 100 - labeledAdPct - unlabeledPct;

  // Fallback 2-segment version
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
          <Text variant="overline" color={colors.textSecondary }>
            Ad Posts
          </Text>
          <Text style={{ ...GL_TYPOGRAPHY.h2, color: colors.textMain, marginTop: SPACING.xxs }}>
            {data.adCount}
          </Text>
          <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs  }}>
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
            <Text variant="overline" color={colors.textSecondary }>
              Top Advertiser
            </Text>
            <Text variant="labelBold" color={colors.textMain} style={{ marginTop: SPACING.xxs }} numberOfLines={1}>
              @{data.topAdvertisers[0]?.name ?? '—'}
            </Text>
            <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs  }}>
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
            <Text variant="overline" color={colors.textSecondary }>
              Ad Density
            </Text>
            <Text style={{ ...GL_TYPOGRAPHY.h2, color: colors.textMain, marginTop: SPACING.xxs }}>
              1:{data.adPct > 0 ? Math.round(100 / data.adPct) : '—'}
            </Text>
            <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs  }}>
              post ratio
            </Text>
          </View>
        )}
      </View>

      {/* CD-005 FIX: Only show Ad Composition chart when there are both sponsored and non-sponsored segments */}
      {data.adCount > 0 && (
        <>
          <SectionHeader title="Ad Composition" subtitle={hasUnlabeledPromos ? "Labeled ads, unlabeled promos, and organic content" : "Content labeled as sponsored"} />
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
          }}>
            <ALStackedBar
              segments={hasUnlabeledPromos
                ? [
                    { label: 'Not ads', percentage: notAdPct, count: notAdCount, color: colors.primaryBlue },
                    { label: 'Labeled ads', percentage: labeledAdPct, count: labeledAdCount, color: colors.blue200 },
                    { label: 'Unlabeled promos', percentage: unlabeledPct, count: unlabeledCount, color: '#F59E0B' },
                  ]
                : [
                    { label: 'Non-sponsored', percentage: organicPct, count: organicCount, color: colors.primaryBlue },
                    { label: 'Sponsored', percentage: data.adPct, count: data.adCount, color: colors.blue200 },
                  ]
              }
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
          <Text variant="body" color={colors.textMain} style={{ fontWeight: "600" }}>
            No labeled ads appeared in this scan
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} style={{ lineHeight: 20 }}>
            We look for platform-provided ad labels (like "Sponsored" or "Ad" badges). Some promotional content doesn't carry visible labels.
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} style={{ lineHeight: 20 }}>
            Native advertising, influencer partnerships, and product placements may not have standard ad markers.
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} style={{ lineHeight: 20 }}>
            Scan longer and scroll through more content, ads may appear at different points in your feed.
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
            accessibilityRole="button"
            accessibilityLabel={showAdvertisers ? 'Hide top advertised companies' : 'Show top advertised companies'}
            accessibilityState={{ expanded: showAdvertisers }}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: SPACING.md,
            }}
          >
            <Text variant="label" color={colors.textMuted }>
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
                  <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textMain, fontWeight: '500' }}>
                    @{advertiser.name}
                  </Text>
                  <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
                    {advertiser.percent}% of ads ({advertiser.count})
                  </Text>
                </View>
              ))}
              <Text variant="captionSmall" color={colors.textSecondary} style={{ fontStyle: "italic", marginTop: SPACING.xxs  }}>
                Based on {data.adCount} labeled ad posts
              </Text>
            </View>
          )}
        </>
      )}

      {/* ── Top Advertised Product Types (collapsible) ── */}
      {data.topAdvertisedProductTypes.length > 0 && (
        <>
          <TouchableOpacity
            onPress={() => setShowProductTypes(!showProductTypes)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={showProductTypes ? 'Hide top product types' : 'Show top product types'}
            accessibilityState={{ expanded: showProductTypes }}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: SPACING.md,
            }}
          >
            <Text variant="label" color={colors.textMuted}>
              Top product types
            </Text>
            <ChevronDown
              size={16}
              color={colors.textSecondary}
              strokeWidth={2}
              style={{
                transform: [{ rotate: showProductTypes ? '180deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>

          {showProductTypes && (
            <View style={{
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              ...shadows.card,
              gap: SPACING.sm,
            }}>
              {/* Header row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: SPACING.xxs }}>
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600', flex: 2 }}>
                  Theme
                </Text>
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600', flex: 1, textAlign: 'right' }}>
                  % of ads
                </Text>
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600', flex: 1, textAlign: 'right' }}>
                  Count
                </Text>
              </View>
              {data.topAdvertisedProductTypes.map((pt, idx) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textMain, fontWeight: '500', flex: 2 }}>
                    {pt.theme}
                  </Text>
                  <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, flex: 1, textAlign: 'right' }}>
                    {pt.percentage}%
                  </Text>
                  <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, flex: 1, textAlign: 'right' }}>
                    {pt.count}
                  </Text>
                </View>
              ))}
              <Text variant="captionSmall" color={colors.textSecondary} style={{ fontStyle: "italic", marginTop: SPACING.xxs }}>
                Based on {data.adCount} labeled ad posts
              </Text>
            </View>
          )}
        </>
      )}

      {/* ── Unlabeled Promotional Content ── */}
      {hasUnlabeledPromos && (
        <>
          <SectionHeader title="Unlabeled Promotions" subtitle="Posts with promotional signals but no ad label" />
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
            gap: SPACING.md,
          }}>
            <View style={{ alignItems: 'center' }}>
              <BigNumber
                value={data.unlabeledPromos!.percentage}
                label="of posts showed promotional signals without ad labels"
                suffix="%"
              />
            </View>

            {/* Top triggers */}
            {data.unlabeledPromos!.topTriggers.length > 0 && (
              <View style={{ gap: SPACING.xs }}>
                <Text variant="label" color={colors.textSecondary}>
                  Top triggers
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
                  {data.unlabeledPromos!.topTriggers.map((trigger, idx) => (
                    <View key={idx} style={{
                      backgroundColor: colors.blue50,
                      borderRadius: RADIUS.md,
                      paddingHorizontal: SPACING.sm,
                      paddingVertical: SPACING.xxs,
                      borderWidth: 1,
                      borderColor: colors.blue200,
                    }}>
                      <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textMain }}>
                        {trigger.name} ({trigger.count})
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Example accounts */}
            {data.unlabeledPromos!.exampleAccounts.length > 0 && (
              <View style={{ gap: SPACING.xs }}>
                <Text variant="label" color={colors.textSecondary}>
                  Example accounts
                </Text>
                {data.unlabeledPromos!.exampleAccounts.map((handle, idx) => (
                  <Text key={idx} style={{ ...GL_TYPOGRAPHY.body, color: colors.textMain }}>
                    @{handle}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {/* ── Tone: Selling vs Not Selling ── */}
      {data.toneBySelling && (
        <>
          <SectionHeader title="Tone: Selling vs Not Selling" subtitle="Emotional tone comparison" />
          <ToneComparisonCard
            title="How does tone differ?"
            leftLabel="Selling posts"
            rightLabel="Non-selling posts"
            leftSegments={[
              { label: 'Positive', percentage: data.toneBySelling.selling.positivePct, count: Math.round(data.toneBySelling.selling.total * data.toneBySelling.selling.positivePct / 100), color: '#22C55E' },
              { label: 'Neutral', percentage: data.toneBySelling.selling.neutralPct, count: Math.round(data.toneBySelling.selling.total * data.toneBySelling.selling.neutralPct / 100), color: colors.blue200 },
              { label: 'Negative', percentage: data.toneBySelling.selling.negativePct, count: Math.round(data.toneBySelling.selling.total * data.toneBySelling.selling.negativePct / 100), color: '#EF4444' },
            ]}
            rightSegments={[
              { label: 'Positive', percentage: data.toneBySelling.notSelling.positivePct, count: Math.round(data.toneBySelling.notSelling.total * data.toneBySelling.notSelling.positivePct / 100), color: '#22C55E' },
              { label: 'Neutral', percentage: data.toneBySelling.notSelling.neutralPct, count: Math.round(data.toneBySelling.notSelling.total * data.toneBySelling.notSelling.neutralPct / 100), color: colors.blue200 },
              { label: 'Negative', percentage: data.toneBySelling.notSelling.negativePct, count: Math.round(data.toneBySelling.notSelling.total * data.toneBySelling.notSelling.negativePct / 100), color: '#EF4444' },
            ]}
            leftDenominator={`${data.toneBySelling.selling.total} selling posts with known tone`}
            rightDenominator={`${data.toneBySelling.notSelling.total} non-selling posts with known tone`}
            deltaInsight={data.toneBySelling.biggestDifference ? `This pattern may suggest: ${data.toneBySelling.biggestDifference}` : null}
          />
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

      {/* Plus teasers for free users */}
      {!isPlus && (
        <>
          <EvidenceBundleTeaser text="Plus analyzes which advertisers appeared most and how ad patterns change" onUpgrade={onUpgrade} />
          <FreeAskTeaser exampleQuestion="Why am I seeing so many ads from the same companies?" onUpgrade={onUpgrade} />
        </>
      )}

      {/* ── Footer Context ── */}
      <View style={{ paddingVertical: SPACING.lg, alignItems: 'center' }}>
        <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary, textAlign: 'center' }}>
          Based on {data.totalPosts} posts · {data.platform}{data.scanDate ? ` · Scanned ${new Date(data.scanDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
        </Text>
      </View>
    </View>
  );
});

const SuggestedContent = memo(({ data, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
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
        how: 'Each post is classified as "following" or "suggested" based on platform indicators, labels like "Suggested for you," "Recommended," or the absence of a follow relationship.',
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
      <ALStackedBar
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
      <Text variant="bodySmall" color={colors.textMuted }>
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
              <Text style={{ ...GL_TYPOGRAPHY.h3, color: colors.textMain }}>
                {data.creatorNovelty.suggestedCreatorCount}
              </Text>
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.xxs }}>
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
              <Text style={{ ...GL_TYPOGRAPHY.h3, color: colors.textMain }}>
                {data.creatorNovelty.overlapCount}
              </Text>
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.xxs }}>
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
              <Text style={{ ...GL_TYPOGRAPHY.h3, color: colors.textMain }}>
                {data.creatorNovelty.followedCreatorCount}
              </Text>
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.xxs }}>
                Followed{'\n'}creators
              </Text>
            </View>
          </View>

          {/* Contextual interpretation */}
          <Text variant="bodySmall" color={colors.textMuted} style={{ lineHeight: 19 }}>
            {data.creatorNovelty.noveltyPercent >= 60
              ? 'Most suggested content appeared to come from creators you don\'t follow, lots of new voices in the mix.'
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
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic', flex: 1 }}>
                Follow detection is limited on some platforms. These numbers are approximate.
              </Text>
            </View>
          )}
        </View>
      </>
    )}

    {/* ── By Platform Breakdown (multi-platform only) ── */}
    {data.byPlatform && data.byPlatform.length > 1 && (
      <>
        <SectionHeader title="By Platform" subtitle="Content origin per platform" />
        {data.byPlatform.map((bp, idx) => (
          <View key={idx} style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
            gap: SPACING.xs,
          }}>
            <Text variant="labelBold" color={colors.textMain}>
              {bp.platform}
            </Text>
            <ALStackedBar
              segments={[
                { label: 'Following', percentage: bp.followedPct, count: bp.followedCount, color: colors.primaryBlue },
                { label: 'Suggested', percentage: bp.suggestedPct, count: bp.suggestedCount, color: colors.blue200 },
              ]}
            />
            <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
              Followed: {bp.followedCount} ({bp.followedPct}%) · Suggested: {bp.suggestedCount} ({bp.suggestedPct}%)
            </Text>
          </View>
        ))}
      </>
    )}

    {/* ── Commercial Content: Suggested vs Followed ── */}
    {data.commercialComparison && (
      <>
        <SectionHeader title="Commercial Content" subtitle="Ad presence in suggested vs followed" />
        <ToneComparisonCard
          title="Where do ads appear?"
          leftLabel="Suggested posts"
          rightLabel="Followed posts"
          leftSegments={[
            { label: 'Ads', percentage: data.commercialComparison.suggested.adPct, count: Math.round(data.commercialComparison.suggested.total * data.commercialComparison.suggested.adPct / 100), color: '#F59E0B' },
            { label: 'Non-ads', percentage: 100 - data.commercialComparison.suggested.adPct, count: data.commercialComparison.suggested.total - Math.round(data.commercialComparison.suggested.total * data.commercialComparison.suggested.adPct / 100), color: colors.primaryBlue },
          ]}
          rightSegments={[
            { label: 'Ads', percentage: data.commercialComparison.followed.adPct, count: Math.round(data.commercialComparison.followed.total * data.commercialComparison.followed.adPct / 100), color: '#F59E0B' },
            { label: 'Non-ads', percentage: 100 - data.commercialComparison.followed.adPct, count: data.commercialComparison.followed.total - Math.round(data.commercialComparison.followed.total * data.commercialComparison.followed.adPct / 100), color: colors.primaryBlue },
          ]}
          leftDenominator={`${data.commercialComparison.suggested.total} suggested posts`}
          rightDenominator={`${data.commercialComparison.followed.total} followed posts`}
          deltaInsight={data.commercialComparison.biggestDifference ? `Based on observable data: ${data.commercialComparison.biggestDifference}` : null}
        />
      </>
    )}

    {/* ── Top Topics: Suggested vs Followed ── */}
    {(data.topTopicsBySuggested.length > 0 || data.topTopicsByFollowed.length > 0) && (
      <>
        <SectionHeader title="Top Topics" subtitle="Most common themes by content origin" />
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
          gap: SPACING.md,
        }}>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            {/* Left: In Suggested */}
            <View style={{ flex: 1, gap: SPACING.sm }}>
              <Text variant="label" color={colors.textSecondary}>In Suggested</Text>
              {data.topTopicsBySuggested.length > 0 ? (
                data.topTopicsBySuggested.map((t, idx) => (
                  <View key={idx} style={{ gap: SPACING.xxs }}>
                    <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textMain }} numberOfLines={1}>
                      {t.topic}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                      <View style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.blue200,
                        width: `${Math.max(t.percentage, 5)}%`,
                      }} />
                      <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
                        {t.percentage}%
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary, fontStyle: 'italic' }}>
                  No topic data
                </Text>
              )}
            </View>
            {/* Right: In Followed */}
            <View style={{ flex: 1, gap: SPACING.sm }}>
              <Text variant="label" color={colors.textSecondary}>In Followed</Text>
              {data.topTopicsByFollowed.length > 0 ? (
                data.topTopicsByFollowed.map((t, idx) => (
                  <View key={idx} style={{ gap: SPACING.xxs }}>
                    <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textMain }} numberOfLines={1}>
                      {t.topic}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                      <View style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.primaryBlue,
                        width: `${Math.max(t.percentage, 5)}%`,
                      }} />
                      <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
                        {t.percentage}%
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary, fontStyle: 'italic' }}>
                  No topic data
                </Text>
              )}
            </View>
          </View>
        </View>
      </>
    )}

    {/* ── Content Formats: Suggested vs Followed ── */}
    {data.contentFormatComparison.length > 0 && (
      <>
        <SectionHeader title="Content Formats" subtitle="How format preferences differ" />
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
          gap: SPACING.sm,
        }}>
          {/* Header row */}
          <View style={{ flexDirection: 'row', paddingBottom: SPACING.xxs }}>
            <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600', flex: 2 }}>Format</Text>
            <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600', flex: 1, textAlign: 'right' }}>Suggested</Text>
            <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600', flex: 1, textAlign: 'right' }}>Followed</Text>
            <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600', flex: 1, textAlign: 'right' }}>Diff</Text>
          </View>
          {data.contentFormatComparison.map((cf, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textMain, fontWeight: '500', flex: 2 }}>
                {cf.format}
              </Text>
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, flex: 1, textAlign: 'right' }}>
                {cf.suggestedPct}%
              </Text>
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, flex: 1, textAlign: 'right' }}>
                {cf.followedPct}%
              </Text>
              <Text style={{
                ...GL_TYPOGRAPHY.captionSmall,
                color: cf.delta > 0 ? '#F59E0B' : cf.delta < 0 ? colors.primaryBlue : colors.textTertiary,
                fontWeight: '600',
                flex: 1,
                textAlign: 'right',
              }}>
                {cf.delta > 0 ? '+' : ''}{cf.delta}
              </Text>
            </View>
          ))}
          <Text variant="captionSmall" color={colors.textTertiary} style={{ fontStyle: 'italic', marginTop: SPACING.xxs }}>
            Positive difference = more common in suggested; negative = more common in followed
          </Text>
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
      <Text variant="label" color={colors.textMuted }>
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
          <Text variant="body" color={colors.textMain} style={{ fontWeight: "600" }}>
            Diversify your follows
          </Text>
          <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs, lineHeight: 17  }}>
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
          <Text variant="body" color={colors.textMain} style={{ fontWeight: "600" }}>
            Try chronological mode
          </Text>
          <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs, lineHeight: 17  }}>
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
          <Text variant="body" color={colors.textMain} style={{ fontWeight: "600" }}>
            Engage intentionally
          </Text>
          <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs, lineHeight: 17  }}>
            Platforms often describe engagement (likes, shares, comments) as a factor in feed ranking, though the exact effect is not publicly documented.
          </Text>
        </View>
      </View>
    </View>
    )}

    {/* Plus teasers for free users */}
    {!isPlus && (
      <>
        <EvidenceBundleTeaser text="Plus analyzes the balance between content you chose and platform suggestions" onUpgrade={onUpgrade} />
        <FreeAskTeaser exampleQuestion="How much of my feed was content I chose to follow versus suggestions?" onUpgrade={onUpgrade} />
      </>
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
      <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
        {data.platform}
      </Text>
      <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>{'\u00B7'}</Text>
      <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
        {data.totalPosts} posts
      </Text>
      {data.scanDate && (
        <>
          <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>{'\u00B7'}</Text>
          <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
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
const PoliticsContent = memo(({ data, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  const [showIdeology, setShowIdeology] = useState(false);
  const analysis = data.politicalAnalysis;
  const totalAnalyzed = analysis?.totalAnalyzed ?? data.totalPosts;
  const isLowPostCount = totalAnalyzed < 20;

  // ── No political data → per-section empty state ──
  if (!data.hasPoliticsData) {
    return (
      <View style={{ gap: SPACING['2xl'] }}>
        <View style={{
          backgroundColor: '#FAFBFE',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(37, 99, 235, 0.06)',
          padding: 24,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
            {isLowPostCount
              ? 'Political exposure was light in this scan. Scan more content to see a full breakdown.'
              : 'Political keywords and themes weren\'t prominent in this scan. Each scan captures a different moment, try scanning at a different time.'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Sparkles size={12} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={{ fontSize: 11, color: colors.textTertiary }}>
            Political classification by Google Gemini AI · Your data is not used to train models
          </Text>
        </View>
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
          limitations: 'AI classification is approximate. Short posts may be misclassified. Ideological alignment is based on keyword signals, not nuanced understanding. This describes what appeared, not your views or the platform\'s intent.',
          learnMoreUrl: 'https://algorithmlens.com/dashboard#politics',
        }}
      />

      {/* Gemini AI disclosure */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Sparkles size={12} color={colors.textTertiary} strokeWidth={1.5} />
        <Text style={{ fontSize: 11, color: colors.textTertiary }}>
          Political classification by Google Gemini AI · Your data is not used to train models
        </Text>
      </View>

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
          <Text style={{ ...GL_TYPOGRAPHY.caption, color: colors.warning, flex: 1 }}>
            Low sample, fewer than 10 political posts. Results may not reflect typical patterns.
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
        <Text variant="captionSmall" color={colors.textSecondary} style={{ marginTop: SPACING.xxs  }}>
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
            <Text style={{ ...GL_TYPOGRAPHY.h2, color: colors.textMain }}>
              @{analysis.topPoliticalSource.handle}
            </Text>
            <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textMuted }}>
              {analysis.topPoliticalSource.count} of {analysis.politicalCount} political posts ({analysis.topPoliticalSource.pctOfPolitical}%)
            </Text>
            {/* Progress bar */}
            <View style={{ gap: SPACING.xxs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600' }}>
                  Share of political posts
                </Text>
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '600' }}>
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
          <Text variant="bodySmall" color={colors.textMuted} style={{ lineHeight: 20, fontStyle: 'italic' }}>
            {data.politicalSummary}
          </Text>
        </View>
      )}

      {/* Section: Ideological Distribution (collapsible, matches main site) */}
      <TouchableOpacity
        onPress={() => setShowIdeology(!showIdeology)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={showIdeology ? 'Hide ideological breakdown' : 'Show ideological breakdown'}
        accessibilityState={{ expanded: showIdeology }}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: SPACING.md,
        }}
      >
        <Text variant="label" color={colors.textMuted }>
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
              <ALStackedBar
                segments={[
                  { label: 'Left', percentage: analysis.ideology.left, count: analysis.ideology.leftCount, color: colors.ideologyLeft },
                  { label: 'Center', percentage: analysis.ideology.center, count: analysis.ideology.centerCount, color: colors.ideologyCenter },
                  { label: 'Right', percentage: analysis.ideology.right, count: analysis.ideology.rightCount, color: colors.ideologyRight },
                ]}
              />
              <Text variant="captionSmall" color={colors.textSecondary} style={{ fontStyle: "italic" }}>
                Each segment shows what share of political posts showed keywords associated with that direction. This is approximate and may not capture nuance.
              </Text>
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textMuted }}>
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
              <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }}>
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

      {/* Plus teasers for free users */}
      {!isPlus && (
        <>
          <EvidenceBundleTeaser text="Plus breaks down political content patterns across your scans" onUpgrade={onUpgrade} />
          <FreeAskTeaser exampleQuestion="How much of my feed contains political content compared to other categories?" onUpgrade={onUpgrade} />
        </>
      )}

      {/* ── Footer Context ── */}
      <View style={{ paddingVertical: SPACING.lg, alignItems: 'center' }}>
        <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary, textAlign: 'center' }}>
          Based on {data.totalPosts} posts · {data.platform}{data.scanDate ? ` · Scanned ${new Date(data.scanDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
        </Text>
      </View>
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
    <Text variant="overline" color={colors.textMuted} style={{ marginBottom: SPACING.xxs }}>
      How We Measure
    </Text>
    <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
      Political classification uses Google's Gemini AI to identify posts containing political keywords and themes. Ideological alignment (left/center/right) is approximate, based on stance keywords found in post text. This analysis describes what appeared in your feed, it does not infer your personal views or the platform's intent.
    </Text>
  </View>
);

// Tone tab — renders emotional tone analysis from Gemini AI classification.
// Shows tone composition bar, methodology disclaimer, and quality gating.
// Matches the main site's ToneTab pattern with epistemic restraint.
// Gates are mutually exclusive: only ONE state renders at a time.
const ToneContent = memo(({ data, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
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

  // ── No tone data → per-section empty state ──
  if (!data.hasToneData) {
    return (
      <View style={{ gap: SPACING['2xl'] }}>
        <View style={{
          backgroundColor: '#FAFBFE',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(37, 99, 235, 0.06)',
          padding: 24,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
            Tone analysis needs more data. Try scanning again to see emotional patterns.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Sparkles size={12} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={{ fontSize: 11, color: colors.textTertiary }}>
            Tone classification by Google Gemini AI · Your data is not used to train models
          </Text>
        </View>
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
          what: 'The emotional character of posts in your feed, categorized as positive, neutral, or negative.',
          how: 'Post text is analyzed by Google\'s Gemini AI to classify emotional tone based on language patterns. Each post receives one valence label.',
          limitations: 'Sentiment analysis is approximate, tone is subjective, and short posts may be misclassified. Sarcasm and irony are difficult to detect. This describes what appeared, not your emotional state or the platform\'s intent.',
          learnMoreUrl: 'https://algorithmlens.com/dashboard#tone',
        }}
      />

      {/* Gemini AI disclosure */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Sparkles size={12} color={colors.textTertiary} strokeWidth={1.5} />
        <Text style={{ fontSize: 11, color: colors.textTertiary }}>
          Tone classification by Google Gemini AI · Your data is not used to train models
        </Text>
      </View>

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
          <Text style={{ ...GL_TYPOGRAPHY.caption, color: colors.warning, flex: 1 }}>
            Low sample, fewer than 10 posts with tone data. Results may not reflect typical patterns.
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
        <ALStackedBar
          segments={[
            { label: 'Positive', percentage: analysis?.positivePct ?? 0, count: analysis?.positiveCount ?? 0, color: TONE_COLORS.positive },
            { label: 'Neutral', percentage: analysis?.neutralPct ?? 0, count: analysis?.neutralCount ?? 0, color: TONE_COLORS.neutral },
            { label: 'Negative', percentage: analysis?.negativePct ?? 0, count: analysis?.negativeCount ?? 0, color: TONE_COLORS.negative },
          ]}
        />
        <Text variant="captionSmall" color={colors.textSecondary} style={{ fontStyle: "italic", marginTop: SPACING.xxs  }}>
          Each segment shows what share of posts fell into that emotional category.
        </Text>
        <Text variant="captionSmall" color={colors.textMuted} style={{ marginTop: SPACING.xxs  }}>
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
        <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textMuted }}>
          {(analysis?.negativePct ?? 0) >= 35
            ? `Negative or conflict-focused tone appeared in ${analysis?.negativePct}% of posts. In a 60-minute session, that would represent about ${Math.round(60 * (analysis?.negativePct ?? 0) / 100)} minutes of negatively-framed content.`
            : (analysis?.positivePct ?? 0) >= 35
            ? `Positive or upbeat tone appeared in ${analysis?.positivePct}% of posts. Your scrolling experience leaned toward optimistic content.`
            : (analysis?.neutralPct ?? 0) >= 35
            ? `Neutral or informational tone appeared in ${analysis?.neutralPct}% of posts. Most content appeared factual or balanced rather than emotionally charged.`
            : `Your feed showed a mix of emotional tones, ${analysis?.positivePct}% positive, ${analysis?.neutralPct}% neutral, and ${analysis?.negativePct}% negative.`
          }
        </Text>
      </View>

      {/* PD-001 FIX: Collapsible detail sections */}
      {/* A-004 FIX: MIN_TOUCH_TARGET ensures accessible tap target */}
      {(data.topPositiveSources.length > 0 || data.topNegativeSources.length > 0 || data.toneBySourceOrigin || data.toneByPolitical || data.toneBySelling) && (
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
          <Text variant="label" color={colors.textMuted }>
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
              <Text variant="overline" color={colors.textMuted} style={{ marginBottom: SPACING.xxs }}>
                Most Positive Sources
              </Text>
              {data.topPositiveSources.map((source, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textMain, fontWeight: '500' }}>
                    @{source.handle}
                  </Text>
                  <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
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
              <Text variant="overline" color={colors.textMuted} style={{ marginBottom: SPACING.xxs }}>
                Most Negative Sources
              </Text>
              {data.topNegativeSources.map((source, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textMain, fontWeight: '500' }}>
                    @{source.handle}
                  </Text>
                  <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
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
              <Text variant="overline" color={colors.textMuted }>
                Tone of Suggested Content
              </Text>
              <View style={{ height: 20, flexDirection: 'row', borderRadius: RADIUS.md, overflow: 'hidden' }}>
                <View style={{ width: `${data.toneBySourceOrigin.suggested.positivePct}%`, backgroundColor: colors.tonePositive }} />
                <View style={{ width: `${data.toneBySourceOrigin.suggested.neutralPct}%`, backgroundColor: colors.toneNeutral }} />
                <View style={{ width: `${data.toneBySourceOrigin.suggested.negativePct}%`, backgroundColor: colors.toneNegative }} />
              </View>
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
                {data.toneBySourceOrigin.suggested.positivePct}% pos · {data.toneBySourceOrigin.suggested.neutralPct}% neut · {data.toneBySourceOrigin.suggested.negativePct}% neg ({data.toneBySourceOrigin.suggested.total} posts)
              </Text>
            </View>

            {/* Followed tone mini bar */}
            <View style={{ gap: SPACING.xxs }}>
              <Text variant="overline" color={colors.textMuted }>
                Tone of Followed Content
              </Text>
              <View style={{ height: 20, flexDirection: 'row', borderRadius: RADIUS.md, overflow: 'hidden' }}>
                <View style={{ width: `${data.toneBySourceOrigin.followed.positivePct}%`, backgroundColor: colors.tonePositive }} />
                <View style={{ width: `${data.toneBySourceOrigin.followed.neutralPct}%`, backgroundColor: colors.toneNeutral }} />
                <View style={{ width: `${data.toneBySourceOrigin.followed.negativePct}%`, backgroundColor: colors.toneNegative }} />
              </View>
              <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
                {data.toneBySourceOrigin.followed.positivePct}% pos · {data.toneBySourceOrigin.followed.neutralPct}% neut · {data.toneBySourceOrigin.followed.negativePct}% neg ({data.toneBySourceOrigin.followed.total} posts)
              </Text>
            </View>

            {/* Legend */}
            <View style={{ flexDirection: 'row', gap: SPACING.md, justifyContent: 'center', paddingTop: SPACING.xxs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <View style={{ width: ICON_SIZES.dot, height: ICON_SIZES.dot, borderRadius: ICON_SIZES.dot / 2, backgroundColor: colors.tonePositive }} />
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>Positive</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <View style={{ width: ICON_SIZES.dot, height: ICON_SIZES.dot, borderRadius: ICON_SIZES.dot / 2, backgroundColor: colors.toneNeutral }} />
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>Neutral</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <View style={{ width: ICON_SIZES.dot, height: ICON_SIZES.dot, borderRadius: ICON_SIZES.dot / 2, backgroundColor: colors.toneNegative }} />
                <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>Negative</Text>
              </View>
            </View>

            <Text variant="captionSmall" color={colors.textSecondary} style={{ fontStyle: "italic" }}>
              Based on observable tone signals. This comparison may not be available for all scans.
            </Text>
          </View>
        </>
      )}

      {/* Section: Tone — Political vs Non-Political */}
      {showToneDetails && data.toneByPolitical && (
        <>
          <SectionHeader title="Tone: Political vs Non-Political" subtitle="Emotional tone by content type" />
          <ToneComparisonCard
            title="How does tone differ?"
            leftLabel="Political posts"
            rightLabel="Non-political posts"
            leftSegments={[
              { label: 'Positive', percentage: data.toneByPolitical.political.positivePct, count: Math.round(data.toneByPolitical.political.total * data.toneByPolitical.political.positivePct / 100), color: '#22C55E' },
              { label: 'Neutral', percentage: data.toneByPolitical.political.neutralPct, count: Math.round(data.toneByPolitical.political.total * data.toneByPolitical.political.neutralPct / 100), color: colors.blue200 },
              { label: 'Negative', percentage: data.toneByPolitical.political.negativePct, count: Math.round(data.toneByPolitical.political.total * data.toneByPolitical.political.negativePct / 100), color: '#EF4444' },
            ]}
            rightSegments={[
              { label: 'Positive', percentage: data.toneByPolitical.nonPolitical.positivePct, count: Math.round(data.toneByPolitical.nonPolitical.total * data.toneByPolitical.nonPolitical.positivePct / 100), color: '#22C55E' },
              { label: 'Neutral', percentage: data.toneByPolitical.nonPolitical.neutralPct, count: Math.round(data.toneByPolitical.nonPolitical.total * data.toneByPolitical.nonPolitical.neutralPct / 100), color: colors.blue200 },
              { label: 'Negative', percentage: data.toneByPolitical.nonPolitical.negativePct, count: Math.round(data.toneByPolitical.nonPolitical.total * data.toneByPolitical.nonPolitical.negativePct / 100), color: '#EF4444' },
            ]}
            leftDenominator={`${data.toneByPolitical.political.total} political posts with known tone`}
            rightDenominator={`${data.toneByPolitical.nonPolitical.total} non-political posts with known tone`}
            deltaInsight={data.toneByPolitical.biggestDifference ? `Based on observable data: ${data.toneByPolitical.biggestDifference}` : null}
          />
        </>
      )}

      {/* Section: Tone — Selling vs Not Selling */}
      {showToneDetails && data.toneBySelling && (
        <>
          <SectionHeader title="Tone: Selling vs Not Selling" subtitle="Emotional tone by commercial intent" />
          <ToneComparisonCard
            title="How does tone differ?"
            leftLabel="Selling posts"
            rightLabel="Non-selling posts"
            leftSegments={[
              { label: 'Positive', percentage: data.toneBySelling.selling.positivePct, count: Math.round(data.toneBySelling.selling.total * data.toneBySelling.selling.positivePct / 100), color: '#22C55E' },
              { label: 'Neutral', percentage: data.toneBySelling.selling.neutralPct, count: Math.round(data.toneBySelling.selling.total * data.toneBySelling.selling.neutralPct / 100), color: colors.blue200 },
              { label: 'Negative', percentage: data.toneBySelling.selling.negativePct, count: Math.round(data.toneBySelling.selling.total * data.toneBySelling.selling.negativePct / 100), color: '#EF4444' },
            ]}
            rightSegments={[
              { label: 'Positive', percentage: data.toneBySelling.notSelling.positivePct, count: Math.round(data.toneBySelling.notSelling.total * data.toneBySelling.notSelling.positivePct / 100), color: '#22C55E' },
              { label: 'Neutral', percentage: data.toneBySelling.notSelling.neutralPct, count: Math.round(data.toneBySelling.notSelling.total * data.toneBySelling.notSelling.neutralPct / 100), color: colors.blue200 },
              { label: 'Negative', percentage: data.toneBySelling.notSelling.negativePct, count: Math.round(data.toneBySelling.notSelling.total * data.toneBySelling.notSelling.negativePct / 100), color: '#EF4444' },
            ]}
            leftDenominator={`${data.toneBySelling.selling.total} selling posts with known tone`}
            rightDenominator={`${data.toneBySelling.notSelling.total} non-selling posts with known tone`}
            deltaInsight={data.toneBySelling.biggestDifference ? `This pattern may suggest: ${data.toneBySelling.biggestDifference}` : null}
          />
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

      {/* Plus teasers for free users */}
      {!isPlus && (
        <>
          <EvidenceBundleTeaser text="Plus explains emotional patterns and how they shift over time" onUpgrade={onUpgrade} />
          <FreeAskTeaser exampleQuestion="What is the overall emotional tone of my feed and how does it break down?" onUpgrade={onUpgrade} />
        </>
      )}

      {/* ── Footer Context ── */}
      <View style={{ paddingVertical: SPACING.lg, alignItems: 'center' }}>
        <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary, textAlign: 'center' }}>
          Based on {data.totalPosts} posts · {data.platform}{data.scanDate ? ` · Scanned ${new Date(data.scanDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
        </Text>
      </View>
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
    <Text variant="overline" color={colors.textMuted} style={{ marginBottom: SPACING.xxs }}>
      How We Measure
    </Text>
    <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textSecondary }}>
      Emotional tone classification uses Google's Gemini AI to categorize posts as positive, neutral, or negative based on language patterns. Sentiment analysis is approximate, tone is subjective, and short posts may be misclassified. This analysis describes what appeared in your feed, it does not infer your emotional state or the platform's intent.
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
    <Text style={{ ...GL_TYPOGRAPHY.h3, color: colors.textMain, textAlign: 'center' }}>
      This section couldn't load
    </Text>
    <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center' }}>
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
    <Text variant="bodySmall" color={colors.textSecondary} style={{ textAlign: 'center' }}>
      {message}
    </Text>
  </View>
);

// AiConsentCard and AiProcessingCard removed — AI analysis is always on

const PlusTierBanner = ({ isPlus, colors, shadows }: { isPlus: boolean; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  if (isPlus) return null;
  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/settings')}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Unlock trend analysis with Plus"
      style={{
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          minHeight: MIN_TOUCH_TARGET,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
        }}
      >
        <View style={{
          width: 32, height: 32, borderRadius: RADIUS.md,
          backgroundColor: 'rgba(255,255,255,0.18)',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <TrendingUp size={16} color={colors.textInverse} strokeWidth={2.5} />
        </View>
        <Text style={{
          ...GL_TYPOGRAPHY.label, fontWeight: '600',
          color: colors.textInverse, flex: 1, letterSpacing: -0.1,
        }}>
          Unlock trend analysis with Plus
        </Text>
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: RADIUS.full,
          paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
        }}>
          <Text style={{ ...GL_TYPOGRAPHY.caption, fontWeight: '700', color: colors.textInverse, letterSpacing: 0.3 }}>Try Free</Text>
        </View>
      </LinearGradient>
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
      case 'politics': content = <PoliticsContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'tone': content = <ToneContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'suggested_vs_followed': content = <SuggestedContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
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
        {/* Header with scan button */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
          paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md,
          gap: SPACING.md,
        }}>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <Text variant="h1" color={colors.textMain} style={{ marginBottom: SPACING.xxs }} accessibilityRole="header">
              Your Dashboard
            </Text>
            {activeScan ? (
              <Text style={{ ...GL_TYPOGRAPHY.caption, color: colors.textMuted }}>
                {new Date(activeScan.created_at).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}{', '}
                {getPlatformDisplayName(activeScan.platform)}{' '}
                ({activeScan.post_count} posts)
              </Text>
            ) : (
              <Text style={{ ...GL_TYPOGRAPHY.caption, color: colors.textSecondary }}>
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
              <Text style={{ ...GL_TYPOGRAPHY.buttonSm, color: colors.white }}>Scan</Text>
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
            <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.warning, flex: 1 }}>
              {fetchError}
            </Text>
          </View>
        )}

                {/* Dashboard compute error */}
        {dashboardComputeError && (
          <View style={{ paddingHorizontal: SPACING.xl, paddingVertical: SPACING['4xl'], alignItems: 'center' }}>
            <View style={{
              width: 56, height: 56, backgroundColor: colors.warningLight, borderRadius: RADIUS['2xl'],
              justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
            }}>
              <Info size={24} color={colors.warning} strokeWidth={1.5} />
            </View>
            <Text style={{ ...GL_TYPOGRAPHY.h3, color: colors.textMain, marginBottom: SPACING.sm }}>
              This scan couldn't be displayed
            </Text>
            <Text style={{
              ...GL_TYPOGRAPHY.body, color: colors.textMuted, textAlign: 'center', marginBottom: SPACING.xl,
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
              <Text style={{ ...GL_TYPOGRAPHY.buttonSm, color: colors.white }}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

                {/* Empty state */}
        {!loading && !hasData && (
          <>
            {/* Show tab strip in empty state so users understand dashboard structure */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: SPACING.lg,
                gap: SPACING.sm,
                paddingVertical: SPACING.xs,
                marginBottom: SPACING.md,
              }}
              scrollEnabled={false}
              style={{ opacity: 0.4 }}
            >
              {TABS.map((tab) => (
                <View
                  key={tab.id}
                  style={{
                    paddingVertical: SPACING.sm + 2,
                    paddingHorizontal: SPACING.lg,
                    borderRadius: RADIUS.full,
                    borderWidth: 1.5,
                    borderColor: colors.borderSlate200,
                    backgroundColor: 'transparent',
                  }}
                >
                  <Text style={{
                    ...GL_TYPOGRAPHY.buttonSm,
                    fontSize: RFValue(13),
                    color: colors.textTertiary,
                  }}>
                    {tab.label}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* D-5 FIX: Position empty state in upper portion instead of centered */}
            <View style={{ paddingHorizontal: SPACING['2xl'], paddingTop: SPACING['2xl'], paddingBottom: SPACING['4xl'], alignItems: 'center' }}>
            {/* D-4 FIX: Use AlgorithmLens Eye icon instead of generic search icon */}
            <View style={{
              width: 56, height: 56, backgroundColor: colors.blue50, borderRadius: RADIUS['2xl'],
              justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
            }}>
              <Search size={24} color={colors.primaryBlue} strokeWidth={1.5} />
            </View>
            {/* D-3 FIX: Improved empty state subtitle */}
            <Text style={{ ...GL_TYPOGRAPHY.h3, color: colors.textMain, marginBottom: SPACING.sm }}>
              No scans yet
            </Text>
            <Text style={{
              ...GL_TYPOGRAPHY.body, color: colors.textMuted, textAlign: 'center', marginBottom: SPACING.xl,
            }}>
              Complete your first scan to unlock insights about your feed, ads, suggested content, top sources, and more.
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
              <Text style={{ ...GL_TYPOGRAPHY.buttonSm, color: colors.white }}>Start Your First Scan</Text>
            </TouchableOpacity>
          </View>
          </>
        )}

        {/* Tab bar + content */}
        {hasData && (
          <>
            {/* Plus banner — visible on all tabs for free-tier users */}
            <PlusTierBanner isPlus={isPlus} colors={colors} shadows={shadows} />

            {/* Horizontally scrollable tab strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: SPACING.lg,
                paddingRight: SPACING['3xl'],
                gap: SPACING.sm,
                paddingVertical: SPACING.xs,
                marginBottom: SPACING.lg,
              }}
              accessibilityRole="tablist"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => switchTab(tab.id)}
                    activeOpacity={0.75}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${tab.label} tab`}
                    style={{
                      paddingVertical: SPACING.sm + 2,
                      paddingHorizontal: SPACING.lg,
                      minHeight: 36,
                      borderRadius: RADIUS.full,
                      backgroundColor: isActive ? (colors as any)[tab.accent] : 'transparent',
                      borderWidth: 1.5,
                      borderColor: isActive ? (colors as any)[tab.accent] : colors.borderSlate200,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0,
                      ...(isActive ? shadows.soft : {}),
                    }}
                  >
                    <Text style={{
                      ...GL_TYPOGRAPHY.buttonSm,
                      fontSize: RFValue(13),
                      color: isActive ? colors.white : colors.textSecondary,
                    }}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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
