import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useDashboard } from '../../src/hooks/useDashboard';
import { useAuth } from '../../src/context/AuthContext';
import { computeDashboardData, DashboardData } from '../../src/lib/computeDashboardData';
import { InsightHero } from '../../src/components/dashboard/InsightHero';
import { BarChart } from '../../src/components/dashboard/BarChart';
import { StackedBar100 } from '../../src/components/dashboard/StackedBar100';
import { BigNumber } from '../../src/components/dashboard/BigNumber';
import { MetricCard } from '../../src/components/dashboard/MetricCard';
import { SectionHeader } from '../../src/components/dashboard/SectionHeader';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/lib/theme';
import * as Haptics from 'expo-haptics';
import {
  Search,
  Sparkles,
  TrendingUp,
  Settings,
  ScanSearch,
  Info,
  ChevronDown,
} from 'lucide-react-native';

// ─── Tab Definitions ─────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', needsAi: false },
  { id: 'sources', label: 'Sources', needsAi: false },
  { id: 'ads', label: 'Ads', needsAi: false },
  { id: 'politics', label: 'Politics', needsAi: true },
  { id: 'tone', label: 'Tone', needsAi: true },
  { id: 'suggested', label: 'Suggested', needsAi: false },
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

const OverviewContent = ({ data }: { data: DashboardData }) => (
  <View style={{ gap: 8 }}>
    <InsightHero
      title={data.overviewInsight.title}
      meaning={data.overviewInsight.meaning}
      whyCare={data.overviewInsight.whyCare}
      meta={data.overviewInsight.meta}
      accent={COLORS.primaryBlue}
    />

    <SectionHeader title="Key Metrics" />

    <View style={{ gap: 8 }}>
      <MetricCard
        headline="Posts scanned"
        value={String(data.totalPosts)}
        microLine={`From this scan session`}
        hasData={data.totalPosts > 0}
        fallbackText="No posts captured"
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            headline="Ads detected"
            value={`${data.adPct}%`}
            microLine={`${data.adCount} of ${data.totalPosts}`}
            hasData={data.totalPosts > 0}
          />
        </View>
        <View style={{ flex: 1 }}>
          <MetricCard
            headline="Suggested"
            value={`${data.suggestedPct}%`}
            microLine={`${data.suggestedCount} of ${data.totalPosts}`}
            hasData={data.totalPosts > 0}
          />
        </View>
      </View>

      {data.topCreators.length > 0 && (
        <MetricCard
          headline="Top 5 concentration"
          value={`${data.top5Pct}%`}
          microLine={`Most from @${data.topCreators[0].name}`}
          hasData={data.topCreators.length > 0}
          fallbackText="No creator data available"
        />
      )}
    </View>

    {data.contentTypes.length > 0 && (
      <>
        <SectionHeader title="Content Types" subtitle="Formats in your feed" />
        <View style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: COLORS.borderSoft,
          ...SHADOWS.card,
        }}>
          <StackedBar100
            segments={data.contentTypes.map((ct, i) => ({
              label: CONTENT_TYPE_LABELS[ct.label] || ct.label,
              percentage: ct.percentage,
              count: ct.count,
              color: COLORS.chartPalette[i % COLORS.chartPalette.length],
            }))}
          />
        </View>
      </>
    )}
  </View>
);

const SourcesContent = ({ data }: { data: DashboardData }) => (
  <View style={{ gap: 8 }}>
    <InsightHero
      title={data.sourcesInsight.title}
      meaning={data.sourcesInsight.meaning}
      whyCare={data.sourcesInsight.whyCare}
      meta={data.sourcesInsight.meta}
      accent={COLORS.primaryBlue}
    />

    <SectionHeader title="Top Creators" subtitle="Who appeared most" />

    {data.topCreators.length > 0 ? (
      <View style={{
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.borderSoft,
        ...SHADOWS.card,
      }}>
        <BarChart
          items={data.topCreators.slice(0, 8).map((creator, i) => ({
            label: `@${creator.name}`,
            value: creator.count,
            percentage: creator.percentage,
            color: i === 0 ? '#1E40AF' : i < 3 ? COLORS.primaryBlue : COLORS.blue200,
          }))}
        />
      </View>
    ) : (
      <EmptySection message="No creator data available for this scan." />
    )}

    {data.topCreators.length >= 5 && (
      <>
        <SectionHeader title="Source Concentration" />
        <View style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: COLORS.borderSoft,
          ...SHADOWS.card,
          alignItems: 'center',
        }}>
          <BigNumber
            value={data.top5Pct}
            label="of your feed from top 5 accounts"
            suffix="%"
          />
          <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>
            Typical range: 40–60%
          </Text>
        </View>
      </>
    )}
  </View>
);

const AdsContent = ({ data }: { data: DashboardData }) => {
  const organicCount = data.totalPosts - data.adCount;
  const organicPct = 100 - data.adPct;

  return (
    <View style={{ gap: 8 }}>
      <InsightHero
        title={data.adsInsight.title}
        meaning={data.adsInsight.meaning}
        whyCare={data.adsInsight.whyCare}
        meta={data.adsInsight.meta}
        accent={COLORS.primaryBlue}
      />

      <SectionHeader title="Ad Composition" subtitle="Content labeled as sponsored" />

      <View style={{
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.borderSoft,
        ...SHADOWS.card,
      }}>
        <StackedBar100
          segments={[
            { label: 'Non-sponsored', percentage: organicPct, count: organicCount, color: COLORS.primaryBlue },
            { label: 'Sponsored', percentage: data.adPct, count: data.adCount, color: COLORS.blue200 },
          ]}
        />
      </View>

      {data.adCount === 0 ? (
        <View style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: COLORS.borderSoft,
          ...SHADOWS.card,
        }}>
          <Text style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 19, textAlign: 'center' }}>
            No content labeled as sponsored was detected in this scan. Some ads may not carry visible labels.
          </Text>
        </View>
      ) : (
        <View style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: COLORS.borderSoft,
          ...SHADOWS.card,
          alignItems: 'center',
        }}>
          <BigNumber
            value={data.adCount}
            label={`sponsored post${data.adCount !== 1 ? 's' : ''} in ${data.totalPosts} items`}
            suffix=""
          />
        </View>
      )}
    </View>
  );
};

const SuggestedContent = ({ data }: { data: DashboardData }) => (
  <View style={{ gap: 8 }}>
    <InsightHero
      title={data.suggestedInsight.title}
      meaning={data.suggestedInsight.meaning}
      whyCare={data.suggestedInsight.whyCare}
      meta={data.suggestedInsight.meta}
      accent={COLORS.primaryBlue}
    />

    <SectionHeader title="Content Origin" subtitle="Followed vs. recommended" />

    <View style={{
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
      ...SHADOWS.card,
    }}>
      <StackedBar100
        segments={[
          { label: 'Following', percentage: data.followedPct, count: data.followedCount, color: COLORS.primaryBlue },
          { label: 'Suggested', percentage: data.suggestedPct, count: data.suggestedCount, color: COLORS.blue200 },
        ]}
      />
    </View>

    <View style={{
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
      ...SHADOWS.card,
    }}>
      <Text style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 19 }}>
        {data.suggestedPct >= 50
          ? `${data.suggestedPct}% of the posts in your feed came from accounts you don't follow. Most of what appeared in your feed came from accounts you don't follow.`
          : data.suggestedPct >= 20
          ? `Your feed contained a mix of content from accounts you follow and recommendations. Your follow choices drove the majority of what appeared.`
          : `Your feed was mostly content from accounts you follow. Relatively little was introduced through platform recommendations.`
        }
      </Text>
    </View>
  </View>
);

// C1 FIX: Politics now checks aiConsent and hasPoliticsData
const PoliticsContent = ({ data, aiConsent, onGoToSettings }: { data: DashboardData; aiConsent: boolean; onGoToSettings: () => void }) => (
  <View style={{ gap: 8 }}>
    <InsightHero
      title={data.politicsInsight.title}
      meaning={data.politicsInsight.meaning}
      whyCare={data.politicsInsight.whyCare}
      meta={data.politicsInsight.meta}
      accent={COLORS.primaryBlue}
    />
    {!aiConsent ? (
      <AiConsentCard
        title="Enable AI Insights"
        description="Turn on AI analysis in Settings to see how much political content appears in your feed."
        buttonLabel="Go to Settings"
        onPress={onGoToSettings}
      />
    ) : !data.hasPoliticsData ? (
      <AiProcessingCard
        title="Political Content Analysis"
        message="You'll see a breakdown of politically-themed content here once this feature launches. Each scan will categorize posts by political relevance so you can see how much of your feed contains political topics."
        subtitle="Coming in a future update"
      />
    ) : (
      <EmptySection message="Political content analysis coming soon." />
    )}
  </View>
);

// C1 FIX: Tone now checks aiConsent and hasToneData
const ToneContent = ({ data, aiConsent, onGoToSettings }: { data: DashboardData; aiConsent: boolean; onGoToSettings: () => void }) => (
  <View style={{ gap: 8 }}>
    <InsightHero
      title={data.toneInsight.title}
      meaning={data.toneInsight.meaning}
      whyCare={data.toneInsight.whyCare}
      meta={data.toneInsight.meta}
      accent={COLORS.primaryBlue}
    />
    {!aiConsent ? (
      <AiConsentCard
        title="Enable AI Insights"
        description="Turn on AI analysis in Settings to unlock emotional tone classification for your feed content."
        buttonLabel="Go to Settings"
        onPress={onGoToSettings}
      />
    ) : !data.hasToneData ? (
      <AiProcessingCard
        title="Emotional Tone Breakdown"
        message="This tab will classify the emotional tone of posts in your feed — positive, neutral, or negative. You'll be able to see the overall emotional character of what appears in your feed."
        subtitle="Coming in a future update"
      />
    ) : (
      <EmptySection message="Tone analysis coming soon." />
    )}
  </View>
);

// ─── Shared Sub-Components ───────────────────────────────

const EmptySection = ({ message }: { message: string }) => (
  <View style={{
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    alignItems: 'center',
  }}>
    <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 }}>
      {message}
    </Text>
  </View>
);

// H8 FIX: Replaced red AiRequiredCard with blue-themed AiConsentCard
const AiConsentCard = ({
  title, description, buttonLabel, onPress,
}: {
  title: string; description: string; buttonLabel: string; onPress: () => void;
}) => (
  <View style={{
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    ...SHADOWS.card,
    alignItems: 'center',
    gap: 10,
  }}>
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: COLORS.blue50, justifyContent: 'center', alignItems: 'center',
    }}>
      <Sparkles size={20} color={COLORS.primaryBlue} strokeWidth={1.5} />
    </View>
    <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textMain, textAlign: 'center' }}>
      {title}
    </Text>
    <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 }}>
      {description}
    </Text>
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: COLORS.primaryBlue, borderRadius: RADIUS.md,
        paddingHorizontal: 14, paddingVertical: 9,
        flexDirection: 'row', alignItems: 'center', gap: 5,
      }}
    >
      <Settings size={13} color="#FFFFFF" strokeWidth={2} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>{buttonLabel}</Text>
    </TouchableOpacity>
  </View>
);

// New: card for when AI is on but data isn't available yet
const AiProcessingCard = ({
  message,
  title = 'Coming Soon',
  subtitle,
}: {
  message: string;
  title?: string;
  subtitle?: string;
}) => (
  <View style={{
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    ...SHADOWS.card,
    alignItems: 'center',
    gap: 10,
  }}>
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: COLORS.blue50, justifyContent: 'center', alignItems: 'center',
    }}>
      <Info size={20} color={COLORS.primaryBlue} strokeWidth={1.5} />
    </View>
    <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textMain, textAlign: 'center' }}>
      {title}
    </Text>
    <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 }}>
      {message}
    </Text>
    {subtitle && (
      <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 }}>
        {subtitle}
      </Text>
    )}
  </View>
);

const PlusTierBanner = ({ isPlus }: { isPlus: boolean }) => {
  if (isPlus) return null;
  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/settings')}
      activeOpacity={0.8}
      style={{
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        backgroundColor: COLORS.blue800,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <TrendingUp size={16} color="#FFFFFF" strokeWidth={2} />
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF', flex: 1 }}>
        Unlock trend analysis with Plus
      </Text>
      <View style={{
        backgroundColor: COLORS.accentGreen, borderRadius: RADIUS.sm,
        paddingHorizontal: 8, paddingVertical: 4,
      }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>Try Free</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const { scanId } = useLocalSearchParams<{ scanId?: string }>();
  const { scans, latestScan, loading, refresh } = useDashboard();
  const { userProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isPlus = userProfile?.is_user_plus === true;
  const aiConsent = userProfile?.ai_analysis_consent === true;

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
    return computeDashboardData(activeScan);
  }, [activeScan]);

  const hasData = dashboardData !== null && dashboardData.hasData;

  const goToSettings = () => router.push('/(tabs)/settings');

  // Tab switch with fade animation and haptic feedback
  const switchTab = (tabId: string) => {
    if (tabId === activeTab) return;
    Haptics.selectionAsync();
    Animated.timing(fadeAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
      setActiveTab(tabId);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  const renderTabContent = () => {
    if (!dashboardData) return null;
    switch (activeTab) {
      case 'overview': return <OverviewContent data={dashboardData} />;
      case 'sources': return <SourcesContent data={dashboardData} />;
      case 'ads': return <AdsContent data={dashboardData} />;
      case 'politics': return <PoliticsContent data={dashboardData} aiConsent={aiConsent} onGoToSettings={goToSettings} />;
      case 'tone': return <ToneContent data={dashboardData} aiConsent={aiConsent} onGoToSettings={goToSettings} />;
      case 'suggested': return <SuggestedContent data={dashboardData} />;
      default: return <OverviewContent data={dashboardData} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgPage }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryBlue} />
        }
        scrollEventThrottle={16}
      >
        {/* Header with scan button */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
          paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: 6,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.textMain, marginBottom: 2 }}>
              Your Dashboard
            </Text>
            {activeScan ? (
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                {new Date(activeScan.created_at).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}{' — '}
                {activeScan.platform.charAt(0).toUpperCase() + activeScan.platform.slice(1)}{' '}
                ({activeScan.post_count} posts)
              </Text>
            ) : (
              <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                {loading ? 'Loading...' : 'No scans yet'}
              </Text>
            )}
          </View>
          {hasData && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/scan')}
              activeOpacity={0.7}
              style={{
                backgroundColor: COLORS.accentGreen, borderRadius: RADIUS.md,
                paddingHorizontal: 14, paddingVertical: 8,
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}
            >
              <ScanSearch size={14} color="#FFFFFF" strokeWidth={2} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Scan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading */}
        {loading && !refreshing && scans.length === 0 && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primaryBlue} />
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 12 }}>
              Loading your scans...
            </Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && !hasData && (
          <View style={{ paddingHorizontal: 24, paddingVertical: 60, alignItems: 'center' }}>
            <View style={{
              width: 56, height: 56, backgroundColor: COLORS.blue50, borderRadius: 28,
              justifyContent: 'center', alignItems: 'center', marginBottom: 16,
            }}>
              <Search size={24} color={COLORS.primaryBlue} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textMain, marginBottom: 6 }}>
              No scans yet
            </Text>
            <Text style={{
              fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: 20,
            }}>
              Scan a social media feed to see what appears — ads, suggested content, top sources, and more.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/scan')}
              style={{
                backgroundColor: COLORS.accentGreen, borderRadius: RADIUS.md,
                paddingHorizontal: 20, paddingVertical: 12,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Start Your First Scan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab bar + content */}
        {hasData && (
          <>
            <PlusTierBanner isPlus={isPlus} />

            {/* Two rows of 3 tabs — all 6 always visible */}
            <View style={{ paddingHorizontal: SPACING.lg, marginTop: 4, marginBottom: SPACING.sm }}>
              {[TABS.slice(0, 3), TABS.slice(3, 6)].map((row, rowIdx) => (
                <View key={rowIdx} style={{ flexDirection: 'row', gap: 7, marginBottom: 7 }}>
                  {row.map((tab) => {
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
                          flex: 1,
                          paddingVertical: 9,
                          borderRadius: RADIUS.md,
                          backgroundColor: isActive ? COLORS.primaryBlue : COLORS.bgCard,
                          borderWidth: isActive ? 0 : 1,
                          borderColor: COLORS.borderSlate200,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: tab.needsAi ? 4 : 0,
                          ...(isActive ? SHADOWS.soft : {}),
                        }}
                      >
                        {tab.needsAi && !isActive && (
                          <Sparkles size={11} color={COLORS.textSecondary} strokeWidth={2} />
                        )}
                        {tab.needsAi && isActive && (
                          <Sparkles size={11} color="#FFFFFF" strokeWidth={2} />
                        )}
                        <Text style={{
                          fontSize: 13, fontWeight: '600',
                          color: isActive ? '#FFFFFF' : COLORS.textMuted,
                          textAlign: 'center',
                        }}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Tab Content with fade */}
            <Animated.View style={{
              paddingHorizontal: SPACING.lg,
              paddingBottom: 32,
              opacity: fadeAnim,
            }}>
              {renderTabContent()}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
