import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboard, ScanDetail } from '../../src/hooks/useDashboard';
import { router } from 'expo-router';
import { Zap, Users, Clock, ScanSearch, Radio } from 'lucide-react-native';
import { Skeleton, Text } from '../../src/components/glue';
import { ContentFadeIn } from '../../src/components/glue';
import { useTheme } from '../../src/context/ThemeContext';
import { SPACING, RADIUS, PLATFORMS, MIN_TOUCH_TARGET } from '../../src/lib/theme';
import { getQualityLevel } from '../../src/config/thresholds';
import { withAlpha } from '../../src/lib/utils';
import { formatDuration } from '../../src/lib/formatDuration';
import { ComparePill } from '../../src/design-system';

// H-08 FIX: Consistent platform icon labels across all scan history entries.
// Every platform always uses the same abbreviation; no more mismatched icons.
const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'IG',
  twitter: 'X',
  youtube: 'YT',
  tiktok: 'TT',
  facebook: 'FB',
  reddit: 'Re',
};

// Estimated height for each scan item in the list (used for virtual scrolling optimization)
const SCAN_ITEM_ESTIMATED_HEIGHT = 130;

export default function HistoryScreen() {
  const { scans, loading, refresh, error: fetchError } = useDashboard();
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // L-5: Date formatting duplication. formatDate also appears in groupScansByDay.
  // Future refactor: extract date formatting helpers to a utility module.
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateStr: string) => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(dateStr);
  };

  // Group scans by day for section headers
  const groupScansByDay = useCallback((scanList: ScanDetail[]): { title: string; data: ScanDetail[] }[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 86400000);

    const groups: Record<string, ScanDetail[]> = {};
    const groupOrder: string[] = [];

    for (const scan of scanList) {
      const scanDate = new Date(scan.created_at);
      const scanDay = new Date(scanDate.getFullYear(), scanDate.getMonth(), scanDate.getDate());
      let label: string;

      if (scanDay.getTime() === today.getTime()) {
        label = 'Today';
      } else if (scanDay.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      } else if (scanDay.getTime() >= thisWeekStart.getTime()) {
        label = 'This Week';
      } else {
        label = scanDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      }

      if (!groups[label]) {
        groups[label] = [];
        groupOrder.push(label);
      }
      groups[label]?.push(scan);
    }

    return groupOrder.map((title) => ({ title, data: groups[title] ?? [] }));
  }, []);

  // Apply platform filter
  const filteredScans = useMemo(() => {
    if (!filterPlatform) return scans;
    return scans.filter((s) => s.platform?.toLowerCase() === filterPlatform);
  }, [scans, filterPlatform]);

  const sections = useMemo(() => groupScansByDay(filteredScans), [filteredScans, groupScansByDay]);

  // Get unique platforms for filter
  const availablePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    scans.forEach((s) => { if (s.platform) platforms.add(s.platform.toLowerCase()); });
    return Array.from(platforms);
  }, [scans]);

  // Anchor for the Compare pill: most recent scan overall. Disabled when
  // fewer than 2 scans exist (nothing to compare against).
  const canCompare = scans.length >= 2;
  const handleComparePress = useCallback(() => {
    const anchor = scans[0];
    if (!anchor) return;
    router.push({
      pathname: '/compare/[anchorScanId]',
      params: { anchorScanId: anchor.id },
    });
  }, [scans]);

  const renderScanItem = ({ item }: { item: ScanDetail }) => {
    const platformKey = (item.platform || '').toLowerCase();
    const platformInfo = PLATFORMS[platformKey as keyof typeof PLATFORMS];
    const platformColor = platformInfo?.color || colors.platformDefault;
    const platformName = platformInfo?.name || item.platform;
    const platformLabel = PLATFORM_LABELS[platformKey] || '?';
    const postCount = item.post_count || 0;
    const adPercentage = Math.round(item.ad_percentage || 0);

    // Calculate suggested % from raw_data if available
    const rawPosts = (item.raw_data as Record<string, unknown> | undefined)?.posts as Record<string, unknown>[] | undefined || [];
    const suggestedCount = rawPosts.filter((p: Record<string, unknown>) => p.is_suggested).length;
    const suggestedPct = postCount > 0 ? Math.round((suggestedCount / postCount) * 100) : 0;

    // Broadcast mode detection.
    // Build #44: source_type and duration_seconds were previously top-level
    // columns on the 'scans' table, but the live Supabase schema doesn't
    // have those columns. Both signals are now read from raw_data.
    const rawData = (item.raw_data as Record<string, unknown> | undefined) || {};
    const broadcastCapture = rawData.broadcast_capture as Record<string, unknown> | undefined;
    const derivedSourceType =
      (rawData.source_type as string | undefined)
      || item.source_type
      || (broadcastCapture ? 'MOBILE_BROADCAST' : 'MOBILE_APP');
    const isBroadcast = derivedSourceType === 'MOBILE_BROADCAST';
    const durationSecs =
      (rawData.duration_seconds as number | undefined)
      ?? (broadcastCapture?.duration_seconds as number | undefined)
      ?? item.duration_seconds
      ?? 0;

    // Use centralized quality threshold
    const qualityLevel = getQualityLevel(postCount);

    const handlePress = () => {
      router.push({ pathname: '/(tabs)', params: { scanId: item.id } });
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`${platformName} scan, ${postCount} posts, ${adPercentage}% ads, ${suggestedPct}% suggested${isBroadcast ? ', broadcast' : ''}`}
        accessibilityRole="button"
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.md,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...shadows.card,
        }}
      >
        {/* Top row: platform badge + name + time */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
          <View
            style={{
              width: SPACING['4xl'],
              height: SPACING['4xl'],
              backgroundColor: withAlpha(platformColor, 0.08),
              borderRadius: RADIUS.md,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: SPACING.md,
            }}
          >
            <Text
              variant="label"
              color={platformColor}
              style={{ fontWeight: '700' }}
            >
              {platformLabel}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <Text
                variant="h3"
                color={colors.textMain}
              >
                {platformName}
              </Text>
              {isBroadcast && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.blue50,
                    paddingHorizontal: SPACING.xs,
                    paddingVertical: SPACING.xxs,
                    borderRadius: RADIUS.xs,
                    gap: SPACING.xxs,
                  }}
                >
                  <Radio size={10} color={colors.primaryBlue} strokeWidth={2.5} />
                  <Text variant="captionSmall" color={colors.primaryBlue}>
                    Broadcast
                  </Text>
                </View>
              )}
            </View>
            <Text variant="small" color={colors.textSecondary} style={{ marginTop: SPACING.xxs }}>
              {getRelativeTime(item.created_at)}, {postCount} posts
              {isBroadcast && durationSecs > 0 ? ` · ${formatDuration(durationSecs)}` : ''}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
          {/* Ad % chip */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.blue50,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.xs,
              borderRadius: RADIUS.md,
              gap: SPACING.xs,
            }}
          >
            <Zap size={13} color={colors.primaryBlue} strokeWidth={2} />
            <Text
              variant="labelBold"
              color={colors.blue700}
            >
              {adPercentage}% ads
            </Text>
          </View>

          {/* Suggested % chip */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.green50,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.xs,
              borderRadius: RADIUS.md,
              gap: SPACING.xs,
            }}
          >
            <Users size={13} color={colors.green600} strokeWidth={2} />
            <Text
              variant="labelBold"
              color={colors.green700}
            >
              {suggestedPct}% suggested
            </Text>
          </View>

          {/* Quality indicator chip; neutral blue styling (non-judgmental, no traffic-light colors) */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: qualityLevel.colorKey === 'accentGreen' ? colors.blue50
                : qualityLevel.colorKey === 'warning' ? colors.warningLight
                : colors.errorLight,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.xs,
              borderRadius: RADIUS.md,
              gap: SPACING.xs,
            }}
          >
            <Text
              variant="labelBold"
              color={qualityLevel.colorKey === 'accentGreen' ? colors.primaryBlue
                : qualityLevel.colorKey === 'warning' ? colors.warning
                : colors.error}
            >
              {/* M-04 FIX: Show threshold hint to explain what quality means */}
              {qualityLevel.labelWithHint}
            </Text>
          </View>
        </View>

        {/* Mini composition bar */}
        <View
          style={{
            marginTop: SPACING.md,
            height: 4,
            borderRadius: RADIUS.full,
            backgroundColor: colors.bgSecondary,
            flexDirection: 'row',
            overflow: 'hidden',
          }}
          accessible={true}
          accessibilityLabel={`Composition: ${adPercentage}% ads, ${suggestedPct}% suggested, ${100 - adPercentage - suggestedPct}% organic`}
        >
          {adPercentage > 0 && (
            <View style={{ width: `${adPercentage}%`, backgroundColor: colors.iconAds, height: '100%' }} />
          )}
          {suggestedPct > 0 && (
            <View style={{ width: `${suggestedPct}%`, backgroundColor: colors.accentGreen, height: '100%' }} />
          )}
          <View style={{ flex: 1, backgroundColor: colors.primaryBlue, height: '100%' }} />
        </View>

        {/* M-03 FIX: Legend explaining composition bar colors */}
        <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xs, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: colors.primaryBlue }} />
            <Text variant="captionSmall" color={colors.textTertiary}>Followed</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: colors.accentGreen }} />
            <Text variant="captionSmall" color={colors.textTertiary}>Suggested</Text>
          </View>
          {adPercentage > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={{ width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: colors.iconAds }} />
              <Text variant="captionSmall" color={colors.textTertiary}>Ads</Text>
            </View>
          )}
          {/* L-16 FIX: Indicate dashboard is viewable */}
          <Text variant="captionSmall" color={colors.primaryBlue} style={{ marginLeft: 'auto' }}>
            View Results →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const SkeletonCard = () => (
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
        <Skeleton width={40} height={40} borderRadius={RADIUS.sm} style={{ marginRight: SPACING.md }} />
        <View style={{ flex: 1 }}>
          <Skeleton width={120} height={16} borderRadius={RADIUS.xs} style={{ marginBottom: SPACING.xs }} />
          <Skeleton width={180} height={12} borderRadius={RADIUS.xs} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <Skeleton width={80} height={28} borderRadius={RADIUS.sm} />
        <Skeleton width={110} height={28} borderRadius={RADIUS.sm} />
      </View>
    </View>
  );

  const emptyComponent = (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING['6xl'],
        paddingHorizontal: SPACING.xl,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          backgroundColor: colors.blue50,
          borderRadius: RADIUS.full,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: SPACING.xl,
        }}
      >
        {/* Hi-2 FIX: Increased icon size for better visibility */}
        <Clock size={32} color={colors.primaryBlue} strokeWidth={1.5} />
      </View>
      <Text
        variant="h2"
        color={colors.textMain}
        style={{ marginBottom: SPACING.sm }}
      >
        Your history starts here
      </Text>
      <Text
        variant="body"
        color={colors.textMuted}
        align="center"
        style={{ marginBottom: SPACING.xl }}
      >
        Each scan adds a new snapshot of your feed. Over time you can compare them to spot patterns and changes.
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/scan')}
        accessibilityRole="button"
        accessibilityLabel="Start a scan"
        style={{
          backgroundColor: colors.primaryBlue,
          borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.xl,
          paddingVertical: SPACING.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          ...shadows.medium,
        }}
      >
        <ScanSearch size={18} color={colors.white} strokeWidth={2} />
        <Text variant="h3" color={colors.white}>
          Start a Scan
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ContentFadeIn ready={!loading || scans.length > 0} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Header. H-06 FIX: ensure right-side elements have adequate safe-area padding and don't clip. */}
        <View style={{ paddingHorizontal: SPACING.lg, paddingRight: Math.max(SPACING.lg, insets.right + SPACING.sm), paddingVertical: SPACING.xl, overflow: 'visible' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: SPACING.sm }}>
              <Text
                variant="heroTitle"
                color={colors.textMain}
                style={{ marginBottom: SPACING.xs }}
              >
                Scan History
              </Text>
              {/* Hi-3 FIX: Added subtitle to orient users */}
              {scans.length > 0 && (
                <Text variant="label" color={colors.textSecondary}>
                  Review your past feed analyses · {scans.length} scan{scans.length !== 1 ? 's' : ''} total
                </Text>
              )}
              {scans.length === 0 && (
                <Text variant="label" color={colors.textSecondary}>
                  Review your past feed analyses
                </Text>
              )}
            </View>

            {/* Compare pill: opens the Compare picker with the most recent scan as the anchor. */}
            <ComparePill
              label="Compare"
              onPress={canCompare ? handleComparePress : undefined}
              disabled={!canCompare}
            />
          </View>
        </View>

        {/* Platform filter. H-06 FIX: add right padding to prevent clipping. */}
        {availablePlatforms.length > 1 && (
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: SPACING.lg,
              paddingRight: Math.max(SPACING.lg, insets.right + SPACING.sm),
              marginBottom: SPACING.md,
              gap: SPACING.sm,
              flexWrap: 'wrap',
            }}
            accessibilityRole="radiogroup"
            accessible={true}
          >
            <TouchableOpacity
              onPress={() => setFilterPlatform(null)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: SPACING.sm,
                borderRadius: RADIUS.pill,
                backgroundColor: !filterPlatform ? colors.primaryBlue : 'transparent',
                borderWidth: 1.5,
                borderColor: !filterPlatform ? colors.primaryBlue : colors.borderSlate200,
                minHeight: MIN_TOUCH_TARGET,
                minWidth: 44,
                justifyContent: 'center',
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: !filterPlatform }}
              accessibilityLabel="All platforms"
            >
              <Text variant="buttonSm" color={!filterPlatform ? colors.white : colors.textMain}>
                All platforms
              </Text>
            </TouchableOpacity>
            {availablePlatforms.map((p) => {
              const isActive = filterPlatform === p;
              const pName = PLATFORMS[p as keyof typeof PLATFORMS]?.name || p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setFilterPlatform(isActive ? null : p)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: SPACING.sm,
                    borderRadius: RADIUS.pill,
                    backgroundColor: isActive ? colors.primaryBlue : 'transparent',
                    borderWidth: 1.5,
                    borderColor: isActive ? colors.primaryBlue : colors.borderSlate200,
                    minHeight: MIN_TOUCH_TARGET,
                    minWidth: 44,
                    justifyContent: 'center',
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Filter by ${pName}`}
                >
                  <Text variant="buttonSm" color={isActive ? colors.white : colors.textMain}>
                    {pName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Fetch error banner */}
        {fetchError && (
          <View
            style={{
              marginHorizontal: SPACING.lg,
              marginBottom: SPACING.md,
              backgroundColor: colors.warningLight,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              borderWidth: 1,
              borderColor: colors.warningBorder,
            }}
          >
            <Text variant="body" color={colors.warning} align="center">
              {fetchError}
            </Text>
          </View>
        )}

        {loading && scans.length === 0 ? (
          <View style={{ paddingTop: SPACING.sm }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderScanItem}
            renderSectionHeader={({ section: { title } }: { section: { title: string } }) => (
              /* L-03 FIX: Add marginBottom for proper header spacing */
              <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm, marginBottom: SPACING.sm }}>
                <Text variant="overline" color={colors.textTertiary} accessibilityRole="header">
                  {title}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            getItemLayout={(_data: unknown, index: number) => {
              return { length: SCAN_ITEM_ESTIMATED_HEIGHT, offset: SCAN_ITEM_ESTIMATED_HEIGHT * index, index };
            }}
            windowSize={10}
            maxToRenderPerBatch={10}
            contentContainerStyle={{ paddingVertical: SPACING.xs, paddingBottom: SPACING['6xl'], flexGrow: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
            }
            ListEmptyComponent={emptyComponent}
            scrollEventThrottle={16}
            extraData={[filterPlatform]}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
      </ContentFadeIn>
    </SafeAreaView>
  );
}
