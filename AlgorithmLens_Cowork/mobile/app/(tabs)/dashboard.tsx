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
const OverviewContent = memo(({ data, isPlus, onUpgrade }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  return <OverviewTab data={data} isPlus={isPlus} onUpgrade={onUpgrade} />;
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
                    {formatHandle(source.handle)}
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
                    {formatHandle(source.handle)}
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
