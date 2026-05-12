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
// Redesigned Overview tab — built against the new design system
// (src/design-system/) and tokens (src/design-tokens/tokens.ts). The
// other four tabs (Sources/Ads/Politics/Tone) continue to use the
// legacy theme until they are redesigned.
import { OverviewTab } from '../../src/screens/dashboard/OverviewTab';
// Build #51: Sources tab redesigned against the new design system.
// Other tabs (Ads/Suggested/Tone) continue to use the legacy theme until
// their own redesigns land.
import { SourcesTab } from '../../src/screens/dashboard/SourcesTab';
// Build #51 phase 3: Politics tab redesigned against the new design system.
// Methodology prose now lives on `data.politicsInsight.howWeMeasure`
// (see POLITICS_HOW_WE_MEASURE in computeDashboardData.ts), so the
// legacy inline `PoliticsMethodologyDisclaimer` subcomponent has been
// removed in this commit.
import { PoliticsTab } from '../../src/screens/dashboard/PoliticsTab';
// Build #52: Ads tab redesigned against the new design system. Methodology
// prose lives on `data.adsInsight.howWeMeasure` (see ADS_HOW_WE_MEASURE in
// computeDashboardData.ts). The legacy #F59E0B unlabeled-promo orange is
// replaced with token-only colors per the brand "no hardcoded hex" rule.
import { AdsTab } from '../../src/screens/dashboard/AdsTab';
// Build #52: Suggested vs. Followed tab redesigned against the new design
// system. Methodology prose lives on `data.suggestedInsight.howWeMeasure`
// (see SUGGESTED_HOW_WE_MEASURE in computeDashboardData.ts). The legacy
// #F59E0B commercial-comparison orange is gone.
import { SuggestedTab } from '../../src/screens/dashboard/SuggestedTab';
// Build #53: Tone tab redesigned against the new design system. Methodology
// prose lives on `data.toneInsight.howWeMeasure` (see TONE_HOW_WE_MEASURE
// in computeDashboardData.ts). The legacy #22C55E / #EF4444 tone-bucket
// hex are gone; canonical tone-color mapping (success / textTertiary /
// textSecondary) applied throughout. Inline ToneMethodologyDisclaimer
// subcomponent removed in this commit.
import { ToneTab } from '../../src/screens/dashboard/ToneTab';
import { Text } from '../../src/components/glue';
import { SPACING, RADIUS, GL_TYPOGRAPHY } from '../../src/lib/gluestackTheme';
import { COLORS, ICON_SIZES, MIN_TOUCH_TARGET } from '../../src/lib/theme';
import { triggerSelection } from '../../src/lib/haptics';
import { captureError } from '../../src/lib/sentry';
import { getPlatformDisplayName } from '../../src/lib/utils';
import { formatHandle } from '../../src/lib/formatHandle';
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

// ─── OverviewContent ─────────────────────────────────────
//
// The Overview tab body lives in `src/screens/dashboard/OverviewTab.tsx`,
// built against the new design system (`src/design-system/`) and tokens
// (`src/design-tokens/tokens.ts`). This thin wrapper preserves the
// `memo({ data, isPlus, onUpgrade, colors, shadows })` signature the
// surrounding DashboardScreen still uses for the other four tabs.
//
// `colors` and `shadows` are accepted but unused — the Overview tab is
// fully styled via design tokens. The other tabs (SourcesContent etc.)
// continue to use the legacy theme.
const OverviewContent = memo(({ data, isPlus, onUpgrade, onAboutPress }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; onAboutPress?: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  return <OverviewTab data={data} isPlus={isPlus} onUpgrade={onUpgrade} onAboutPress={onAboutPress} />;
});

// ─── SourcesContent ──────────────────────────────────────
//
// Build #51: the Sources tab body lives in `src/screens/dashboard/SourcesTab.tsx`,
// built against the new design system. This thin wrapper preserves the
// `memo({ data, isPlus, onUpgrade, colors, shadows })` signature so the
// surrounding DashboardScreen render path stays unchanged. `colors` and
// `shadows` are accepted but unused — the redesigned tab is fully styled
// via design tokens, same approach as OverviewContent.
const SourcesContent = memo(({ data, isPlus, onUpgrade }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  return <SourcesTab data={data} isPlus={isPlus} onUpgrade={onUpgrade} />;
});

// ─── AdsContent ──────────────────────────────────────────
//
// Build #52: the Ads tab body lives in
// `src/screens/dashboard/AdsTab.tsx`, built against the new design
// system. This thin wrapper preserves the
// `memo({ data, isPlus, onUpgrade, colors, shadows })` signature so the
// surrounding DashboardScreen render path stays unchanged. `colors` and
// `shadows` are accepted but unused — the redesigned tab is fully styled
// via design tokens, same approach as the other redesigned tabs.
const AdsContent = memo(({ data, isPlus, onUpgrade }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  return <AdsTab data={data} isPlus={isPlus} onUpgrade={onUpgrade} />;
});

// ─── SuggestedContent ────────────────────────────────────
//
// Build #52: the Suggested vs. Followed tab body lives in
// `src/screens/dashboard/SuggestedTab.tsx`, built against the new design
// system. Thin wrapper preserves the
// `memo({ data, isPlus, onUpgrade, colors, shadows })` signature so the
// surrounding DashboardScreen render path stays unchanged. `colors` and
// `shadows` are accepted but unused — the redesigned tab is fully styled
// via design tokens, same approach as the other redesigned tabs.
const SuggestedContent = memo(({ data, isPlus, onUpgrade }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  return <SuggestedTab data={data} isPlus={isPlus} onUpgrade={onUpgrade} />;
});

// ─── PoliticsContent ─────────────────────────────────────
//
// Build #51 phase 3: the Politics tab body lives in
// `src/screens/dashboard/PoliticsTab.tsx`, built against the new design
// system. This thin wrapper preserves the
// `memo({ data, isPlus, onUpgrade, colors, shadows })` signature so the
// surrounding DashboardScreen render path stays unchanged. `colors` and
// `shadows` are accepted but unused — the redesigned tab is fully styled
// via design tokens, same approach as OverviewContent and SourcesContent.
//
// The legacy `PoliticsMethodologyDisclaimer` subcomponent that lived
// directly below has been deleted in this commit; its prose now lives on
// the data layer at `data.politicsInsight.howWeMeasure` (see
// POLITICS_HOW_WE_MEASURE in computeDashboardData.ts) and is rendered
// inside the bottom "About this analysis" ExpandableCard.
const PoliticsContent = memo(({ data, isPlus, onUpgrade }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  return <PoliticsTab data={data} isPlus={isPlus} onUpgrade={onUpgrade} />;
});

// ─── ToneContent ─────────────────────────────────────────
//
// Build #53: the Tone tab body lives in
// `src/screens/dashboard/ToneTab.tsx`, built against the new design
// system. Thin wrapper preserves the
// `memo({ data, isPlus, onUpgrade, colors, shadows })` signature so the
// surrounding DashboardScreen render path stays unchanged. `colors` and
// `shadows` are accepted but unused — the redesigned tab is fully styled
// via design tokens, same approach as the other redesigned tabs.
//
// The legacy `ToneMethodologyDisclaimer` subcomponent that lived
// directly below has been deleted in this commit; its prose now lives
// on the data layer at `data.toneInsight.howWeMeasure` (see
// TONE_HOW_WE_MEASURE in computeDashboardData.ts) and is rendered
// inside the bottom "About this measurement" ExpandableCard.
const ToneContent = memo(({ data, isPlus, onUpgrade }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  return <ToneTab data={data} isPlus={isPlus} onUpgrade={onUpgrade} />;
});

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
  const handleAboutPress = useCallback(() => {
    if (!activeScan) return;
    router.push({
      pathname: '/about/[scanId]',
      params: { scanId: activeScan.id },
    });
  }, [activeScan]);

  const renderTabContent = () => {
    if (!dashboardData) return null;
    const tabLabel = TABS.find(t => t.id === activeTab)?.label ?? 'this';
    const fallback = <TabErrorFallback tabLabel={tabLabel} colors={colors} />;
    let content: React.ReactNode;
    switch (activeTab) {
      case 'overview': content = <OverviewContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} onAboutPress={handleAboutPress} colors={colors} shadows={shadows} />; break;
      case 'sources': content = <SourcesContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'ads': content = <AdsContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'politics': content = <PoliticsContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'tone': content = <ToneContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      case 'suggested_vs_followed': content = <SuggestedContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />; break;
      default: content = <OverviewContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} onAboutPress={handleAboutPress} colors={colors} shadows={shadows} />; break;
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
