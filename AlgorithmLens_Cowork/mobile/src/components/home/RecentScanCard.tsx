/**
 * RecentScanCard — Small card showing the user's most recent scan result.
 *
 * Provides a quick glance at what they did last:
 * "Instagram · 2 hours ago · 23 posts · 12% ads"
 *
 * Design: Compact, informational. Uses the Card primitive with
 * muted typography. Tappable to navigate to the full result.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../lib/theme';

interface RecentScanData {
  platform: string;
  created_at: string;
  post_count: number;
  ad_percentage: number;
}

interface RecentScanCardProps {
  scan: RecentScanData | null;
  onPress?: () => void;
}

/**
 * Formats a timestamp as a relative time string.
 */
function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const weeks = Math.floor(diffDays / 7);
  return weeks > 0 ? `${weeks}w ago` : `${diffDays}d ago`;
}

/**
 * Capitalizes the first letter of a platform name.
 */
function formatPlatformName(platform: string): string {
  const names: Record<string, string> = {
    instagram: 'Instagram',
    twitter: 'Twitter / X',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    reddit: 'Reddit',
  };
  return names[platform] || platform;
}

function RecentScanCardComponent({ scan, onPress }: RecentScanCardProps) {
  const { colors, shadows } = useTheme();

  if (!scan) return null;

  const timeAgo = formatTimeAgo(scan.created_at);
  const platformName = formatPlatformName(scan.platform);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`Last scan: ${platformName}, ${timeAgo}, ${scan.post_count} posts, ${Math.round(scan.ad_percentage)}% ads`}
      accessibilityHint={onPress ? 'Opens dashboard with full scan results' : undefined}
      hitSlop={onPress ? { top: 8, bottom: 8, left: 8, right: 8 } : undefined}
    >
      <View
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          flexDirection: 'row',
          alignItems: 'center',
          ...shadows.soft,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.bgSecondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
          }}
        >
          <Clock size={14} color={colors.textTertiary} strokeWidth={2} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...TYPOGRAPHY.caption,
              color: colors.textTertiary,
              marginBottom: SPACING.xxs,
            }}
          >
            Last scan
          </Text>
          <Text
            style={{
              ...TYPOGRAPHY.bodySmall,
              color: colors.textMain,
            }}
            numberOfLines={1}
          >
            {platformName} · {timeAgo} · {scan.post_count} posts · {Math.round(scan.ad_percentage)}% ads
          </Text>
        </View>

        {onPress && (
          <ChevronRight
            size={16}
            color={colors.textTertiary}
            strokeWidth={2}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export const RecentScanCard = React.memo(RecentScanCardComponent);
