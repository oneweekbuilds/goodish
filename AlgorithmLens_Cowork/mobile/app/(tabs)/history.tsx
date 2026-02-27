import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboard, ScanDetail } from '../../src/hooks/useDashboard';
import { router } from 'expo-router';
import { Zap, Users, Clock, ScanSearch, GitCompareArrows, Check, Radio, Filter, Calendar } from 'lucide-react-native';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useTheme } from '../../src/context/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, PLATFORMS, COLORS } from '../../src/lib/theme';
import { getQualityLevel } from '../../src/config/thresholds';
import ComparisonView from '../../src/components/dashboard/ComparisonView';
import { withAlpha } from '../../src/lib/utils';

// H-08 FIX: Consistent platform icon labels across all scan history entries.
// Every platform always uses the same abbreviation — no more mismatched icons.
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

  // ── Comparison mode state ──
  const [compareMode, setCompareMode] = useState(false);
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // L-5: Date formatting duplication — formatDate also appears in groupScansByDay
  // Future refactor: extract date formatting helpers to a utility module
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

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
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

  const toggleScanSelection = useCallback((scanId: string) => {
    setSelectedScans(prev => {
      if (prev.includes(scanId)) {
        return prev.filter(id => id !== scanId);
      }
      if (prev.length >= 2) {
        // Replace the oldest selection
        return [prev[1] ?? scanId, scanId];
      }
      return [...prev, scanId];
    });
  }, []);

  const handleComparePress = useCallback(() => {
    if (selectedScans.length === 2) {
      setShowComparison(true);
    }
  }, [selectedScans]);

  const exitCompareMode = useCallback(() => {
    setCompareMode(false);
    setSelectedScans([]);
    setShowComparison(false);
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

  // ── If showing full comparison view ──
  if (showComparison && selectedScans.length === 2) {
    const scanA = scans.find(s => s.id === selectedScans[0]);
    const scanB = scans.find(s => s.id === selectedScans[1]);
    if (scanA && scanB) {
      // Order by date: older first
      const [olderScan, newerScan] = new Date(scanA.created_at) < new Date(scanB.created_at)
        ? [scanA, scanB]
        : [scanB, scanA];
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
          <ComparisonView
            olderScan={olderScan}
            newerScan={newerScan}
            onClose={exitCompareMode}
          />
        </SafeAreaView>
      );
    }
  }

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

    // Broadcast mode detection
    const isBroadcast = item.source_type === 'MOBILE_BROADCAST';
    const durationSecs = item.duration_seconds || 0;

    // Use centralized quality threshold
    const qualityLevel = getQualityLevel(postCount);

    const isSelected = selectedScans.includes(item.id);
    const selectionIndex = selectedScans.indexOf(item.id);

    const handlePress = () => {
      if (compareMode) {
        toggleScanSelection(item.id);
      } else {
        router.push({ pathname: '/(tabs)', params: { scanId: item.id } });
      }
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`${platformName} scan, ${postCount} posts, ${adPercentage}% ads, ${suggestedPct}% suggested${isBroadcast ? ', broadcast' : ''}`}
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.md,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primaryBlue : colors.borderLight,
          ...shadows.card,
          ...(isSelected ? shadows.hero : {}),
        }}
      >
        {/* Top row: platform badge + name + time + selection indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
          {compareMode && (
            <View
              style={{
                width: SPACING['3xl'],
                height: SPACING['3xl'],
                borderRadius: RADIUS.lg,
                backgroundColor: isSelected ? colors.primaryBlue : colors.borderLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: SPACING.md,
              }}
            >
              {isSelected ? (
                <Text style={{ ...TYPOGRAPHY.label, fontWeight: '700', color: colors.white }}>
                  {selectionIndex + 1}
                </Text>
              ) : null}
            </View>
          )}
          <View
            style={{
              width: SPACING['4xl'],
              height: SPACING['4xl'],
              backgroundColor: withAlpha(platformColor, 0.08),
              borderRadius: RADIUS.sm,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: SPACING.md,
            }}
          >
            <Text
              style={{ ...TYPOGRAPHY.label, fontWeight: '700', color: platformColor }}
            >
              {platformLabel}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <Text
                style={{
                  ...TYPOGRAPHY.h3,
                  color: colors.textMain,
                }}
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
                  <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.primaryBlue }}>
                    Broadcast
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ ...TYPOGRAPHY.small, color: colors.textSecondary, marginTop: SPACING.xxs }}>
              {getRelativeTime(item.created_at)} — {postCount} posts
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
              borderRadius: RADIUS.sm,
              gap: SPACING.xs,
            }}
          >
            <Zap size={13} color={colors.primaryBlue} strokeWidth={2} />
            <Text
              style={{
                ...TYPOGRAPHY.labelBold,
                color: colors.blue700,
              }}
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
              borderRadius: RADIUS.sm,
              gap: SPACING.xs,
            }}
          >
            <Users size={13} color={colors.green600} strokeWidth={2} />
            <Text
              style={{
                ...TYPOGRAPHY.labelBold,
                color: colors.green700,
              }}
            >
              {suggestedPct}% suggested
            </Text>
          </View>

          {/* Quality indicator chip — neutral blue styling (non-judgmental, no traffic-light colors) */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.blue50,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.xs,
              borderRadius: RADIUS.sm,
              gap: SPACING.xs,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.labelBold,
                color: colors.primaryBlue,
              }}
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
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryBlue }} />
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>Followed</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentGreen }} />
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>Suggested</Text>
          </View>
          {adPercentage > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.iconAds }} />
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>Ads</Text>
            </View>
          )}
          {/* L-16 FIX: Indicate dashboard is viewable */}
          {!compareMode && (
            <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.primaryBlue, marginLeft: 'auto' }}>
              View Results →
            </Text>
          )}
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
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: SPACING.xl,
        }}
      >
        {/* Hi-2 FIX: Increased icon size for better visibility */}
        <Clock size={32} color={colors.primaryBlue} strokeWidth={1.5} />
      </View>
      <Text
        style={{
          ...TYPOGRAPHY.h2,
          color: colors.textMain,
          marginBottom: SPACING.sm,
        }}
      >
        Your history starts here
      </Text>
      <Text
        style={{
          ...TYPOGRAPHY.body,
          color: colors.textMuted,
          textAlign: 'center',
          marginBottom: SPACING.xl,
        }}
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
        <Text style={{ ...TYPOGRAPHY.h3, color: colors.white }}>
          Start a Scan
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <View style={{ flex: 1 }}>
        {/* Header — H-06 FIX: ensure right-side elements have adequate safe-area padding and don't clip */}
        <View style={{ paddingHorizontal: SPACING.lg, paddingRight: Math.max(SPACING.lg, insets.right + SPACING.sm), paddingVertical: SPACING.xl, overflow: 'visible' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: SPACING.sm }}>
              <Text
                style={{
                  ...TYPOGRAPHY.heroTitle,
                  color: colors.textMain,
                  marginBottom: SPACING.xs,
                }}
              >
                {compareMode ? 'Select Two Scans' : 'Scan History'}
              </Text>
              {/* Hi-3 FIX: Added subtitle to orient users */}
              {!compareMode && scans.length > 0 && (
                <Text style={{ ...TYPOGRAPHY.label, color: colors.textSecondary }}>
                  Review your past feed analyses · {scans.length} scan{scans.length !== 1 ? 's' : ''} total
                </Text>
              )}
              {!compareMode && scans.length === 0 && (
                <Text style={{ ...TYPOGRAPHY.label, color: colors.textSecondary }}>
                  Review your past feed analyses
                </Text>
              )}
              {compareMode && (
                <Text style={{ ...TYPOGRAPHY.label, color: colors.textSecondary }}>
                  {selectedScans.length}/2 selected — tap scans to compare
                </Text>
              )}
            </View>

            {/* Compare / Cancel button */}
            {scans.length >= 2 && (
              <TouchableOpacity
                onPress={() => {
                  if (compareMode) {
                    exitCompareMode();
                  } else {
                    setCompareMode(true);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={compareMode ? 'Cancel comparison' : 'Compare scans'}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.xs,
                  backgroundColor: compareMode ? colors.cancelButtonBg : colors.blue50,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                  minHeight: 44,
                  borderRadius: RADIUS.md,
                }}
              >
                <GitCompareArrows
                  size={16}
                  color={compareMode ? colors.textSecondary : colors.primaryBlue}
                  strokeWidth={2}
                />
                <Text
                  style={{
                    ...TYPOGRAPHY.label,
                    color: compareMode ? colors.textSecondary : colors.primaryBlue,
                  }}
                >
                  {compareMode ? 'Cancel' : 'Compare'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Compare action bar (when 2 scans selected) */}
        {compareMode && selectedScans.length === 2 && (
          <View
            style={{
              marginHorizontal: SPACING.lg,
              marginBottom: SPACING.md,
            }}
          >
            <TouchableOpacity
              onPress={handleComparePress}
              accessibilityRole="button"
              accessibilityLabel="Compare selected scans"
              style={{
                backgroundColor: colors.primaryBlue,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.sm,
                ...shadows.medium,
              }}
            >
              <GitCompareArrows size={18} color={colors.white} strokeWidth={2} />
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.white }}>
                Compare Selected Scans
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Platform filter — H-06 FIX: add right padding to prevent clipping */}
        {!compareMode && availablePlatforms.length > 1 && (
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
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: RADIUS.pill,
                backgroundColor: !filterPlatform ? colors.primaryBlue : colors.bgSecondary,
                minHeight: 44,
                minWidth: 44,
                justifyContent: 'center',
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: !filterPlatform }}
              accessibilityLabel="All platforms"
            >
              <Text style={{ ...TYPOGRAPHY.buttonSm, color: !filterPlatform ? colors.white : colors.textSecondary }}>
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
                    paddingHorizontal: SPACING.md,
                    paddingVertical: SPACING.sm,
                    borderRadius: RADIUS.pill,
                    backgroundColor: isActive ? colors.primaryBlue : colors.bgSecondary,
                    minHeight: 44,
                    minWidth: 44,
                    justifyContent: 'center',
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Filter by ${pName}`}
                >
                  <Text style={{ ...TYPOGRAPHY.buttonSm, color: isActive ? colors.white : colors.textSecondary }}>
                    {pName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Fetch error banner */}
        {fetchError && !loading && (
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
            <Text style={{ ...TYPOGRAPHY.body, color: colors.warning, textAlign: 'center' }}>
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
                <Text style={{ ...TYPOGRAPHY.overline, color: colors.textTertiary }} accessibilityRole="header">
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
            contentContainerStyle={{ paddingVertical: SPACING.xs, flexGrow: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
            }
            ListEmptyComponent={emptyComponent}
            scrollEventThrottle={16}
            extraData={[compareMode, selectedScans, filterPlatform]}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
