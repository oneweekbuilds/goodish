import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboard, ScanDetail } from '../../src/hooks/useDashboard';
import { router } from 'expo-router';
import { Zap, Users, Clock, ScanSearch } from 'lucide-react-native';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, PLATFORMS } from '../../src/lib/theme';

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'IG',
  twitter: 'X',
  youtube: 'YT',
  tiktok: 'TT',
  facebook: 'FB',
  reddit: 'R',
};

export default function HistoryScreen() {
  const { scans, loading, refresh } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

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

  const renderScanItem = ({ item }: { item: ScanDetail }) => {
    const platformKey = (item.platform || '').toLowerCase();
    const platformInfo = PLATFORMS[platformKey as keyof typeof PLATFORMS];
    const platformColor = platformInfo?.color || '#9CA3AF';
    const platformName = platformInfo?.name || item.platform;
    const platformLabel = PLATFORM_LABELS[platformKey] || '?';
    const postCount = item.post_count || 0;
    const adPercentage = Math.round(item.ad_percentage || 0);

    // Calculate suggested % from raw_data if available
    const rawPosts = (item as any).raw_data?.posts || [];
    const suggestedCount = rawPosts.filter((p: any) => p.is_suggested).length;
    const suggestedPct = postCount > 0 ? Math.round((suggestedCount / postCount) * 100) : 0;

    // M15: Get quality indicator based on post count
    const getQualityChip = (count: number) => {
      if (count >= 20) {
        return { label: 'Good sample', color: COLORS.accentGreen };
      } else if (count >= 10) {
        return { label: 'Fair sample', color: COLORS.warning };
      } else {
        return { label: 'Low sample', color: COLORS.error };
      }
    };
    const quality = getQualityChip(postCount);

    return (
      <TouchableOpacity
        onPress={() => {
          // L4: Navigate to dashboard with specific scan selected
          router.push({ pathname: '/(tabs)', params: { scanId: item.id } });
        }}
        activeOpacity={0.7}
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.md,
          borderWidth: 1,
          borderColor: COLORS.borderLight,
          ...SHADOWS.card,
        }}
      >
        {/* Top row: platform badge + name + time */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
          <View
            style={{
              width: 40,
              height: 40,
              backgroundColor: `${platformColor}14`,
              borderRadius: RADIUS.sm,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: SPACING.md,
            }}
          >
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: platformColor }}
            >
              {platformLabel}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                ...TYPOGRAPHY.h3,
                color: COLORS.textMain,
                marginBottom: 2,
              }}
            >
              {platformName}
            </Text>
            <Text style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary }}>
              {getRelativeTime(item.created_at)} — {postCount} posts
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
              backgroundColor: COLORS.blue50,
              paddingHorizontal: SPACING.md,
              paddingVertical: 6,
              borderRadius: RADIUS.sm,
              gap: 4,
            }}
          >
            <Zap size={13} color={COLORS.primaryBlue} strokeWidth={2} />
            <Text
              style={{
                ...TYPOGRAPHY.labelBold,
                color: COLORS.blue700,
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
              backgroundColor: COLORS.green50,
              paddingHorizontal: SPACING.md,
              paddingVertical: 6,
              borderRadius: RADIUS.sm,
              gap: 4,
            }}
          >
            <Users size={13} color={COLORS.green600} strokeWidth={2} />
            <Text
              style={{
                ...TYPOGRAPHY.labelBold,
                color: COLORS.green700,
              }}
            >
              {suggestedPct}% suggested
            </Text>
          </View>

          {/* M15: Quality indicator chip */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: `${quality.color}20`,
              paddingHorizontal: SPACING.md,
              paddingVertical: 6,
              borderRadius: RADIUS.sm,
              gap: 4,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.labelBold,
                color: quality.color,
              }}
            >
              {quality.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const SkeletonCard = () => (
    <View
      style={{
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
        <Skeleton width={40} height={40} borderRadius={RADIUS.sm} style={{ marginRight: SPACING.md }} />
        <View style={{ flex: 1 }}>
          <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width={180} height={12} borderRadius={4} />
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
        paddingVertical: 60,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          backgroundColor: COLORS.blue50,
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: SPACING.xl,
        }}
      >
        <Clock size={28} color={COLORS.primaryBlue} strokeWidth={1.5} />
      </View>
      <Text
        style={{
          ...TYPOGRAPHY.h2,
          color: COLORS.textMain,
          marginBottom: SPACING.sm,
        }}
      >
        No scans yet
      </Text>
      <Text
        style={{
          ...TYPOGRAPHY.body,
          color: COLORS.textMuted,
          textAlign: 'center',
          marginBottom: SPACING.xl,
        }}
      >
        Your scan history will appear here after you complete your first scan.
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/scan')}
        style={{
          backgroundColor: COLORS.primaryBlue,
          borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.xl,
          paddingVertical: SPACING.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          ...SHADOWS.medium,
        }}
      >
        <ScanSearch size={18} color={COLORS.white} strokeWidth={2} />
        <Text style={{ ...TYPOGRAPHY.h3, color: COLORS.white }}>
          Start a Scan
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgPage }}>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl }}>
          <Text
            style={{
              ...TYPOGRAPHY.heroTitle,
              color: COLORS.textMain,
              fontSize: 24,
              marginBottom: 4,
            }}
          >
            Scan History
          </Text>
          {scans.length > 0 && (
            <Text style={{ ...TYPOGRAPHY.label, color: COLORS.textSecondary }}>
              {scans.length} scan{scans.length !== 1 ? 's' : ''} total
            </Text>
          )}
        </View>
        {loading && scans.length === 0 ? (
          <View style={{ paddingTop: SPACING.sm }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <FlatList
            data={scans || []}
            renderItem={renderScanItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 4, flexGrow: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryBlue} />
            }
            ListEmptyComponent={emptyComponent}
            scrollEventThrottle={16}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
