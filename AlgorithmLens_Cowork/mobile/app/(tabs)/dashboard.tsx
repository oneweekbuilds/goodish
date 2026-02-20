import React, { useState, useMemo, useRef, useCallback } from 'react';
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
import { useTheme } from '../../src/context/ThemeContext';
import { computeDashboardData, DashboardData, PoliticalAnalysis, ToneAnalysis } from '../../src/lib/computeDashboardData';
import { InsightHero } from '../../src/components/dashboard/InsightHero';
import { BarChart } from '../../src/components/dashboard/BarChart';
import { StackedBar100 } from '../../src/components/dashboard/StackedBar100';
import { BigNumber } from '../../src/components/dashboard/BigNumber';
import { MetricCard } from '../../src/components/dashboard/MetricCard';
import { SectionHeader } from '../../src/components/dashboard/SectionHeader';
import { LockedOverlayCard } from '../../src/components/plan/LockedOverlayCard';
import { DashboardTour } from '../../src/components/dashboard/DashboardTour';
import { SPACING, RADIUS } from '../../src/lib/theme';
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
  { id: 'suggested_vs_followed', label: 'Suggested', needsAi: false },
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

const OverviewContent = ({ data, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => (
  <View style={{ gap: 8 }}>
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
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
        }}>
          <StackedBar100
            segments={data.contentTypes.map((ct, i) => ({
              label: CONTENT_TYPE_LABELS[ct.label] || ct.label,
              percentage: ct.percentage,
              count: ct.count,
              color: colors.chartPalette[i % colors.chartPalette.length],
            }))}
          />
        </View>
      </>
    )}

    {/* Premium: Trend Analysis — locked for free users */}
    <LockedOverlayCard
      locked={!isPlus}
      title="Trend analysis"
      body="See how your feed composition changes over time. Track ad percentages, source concentration, and content themes across scans."
      onUpgrade={onUpgrade}
    >
      <View style={{ gap: 8 }}>
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
  </View>
);

const SourcesContent = ({ data, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => (
  <View style={{ gap: 8 }}>
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
          items={data.topCreators.slice(0, 8).map((creator, i) => ({
            label: `@${creator.name}`,
            value: creator.count,
            percentage: creator.percentage,
            color: i === 0 ? '#1E40AF' : i < 3 ? colors.primaryBlue : colors.blue200,
          }))}
        />
      </View>
    ) : (
      <EmptySection message="No creator data available for this scan." colors={colors} />
    )}

    {data.topCreators.length >= 5 && (
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
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
            Typical range: 40–60%
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
      <View style={{ gap: 8 }}>
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

const AdsContent = ({ data, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  const organicCount = data.totalPosts - data.adCount;
  const organicPct = 100 - data.adPct;

  return (
    <View style={{ gap: 8 }}>
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

      {data.adCount === 0 ? (
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
        }}>
          <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: 'center' }}>
            No content labeled as sponsored was detected in this scan. Some ads may not carry visible labels.
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

      {/* Premium: Ad trend over time — locked for free users */}
      <LockedOverlayCard
        locked={!isPlus}
        title="Ad trends over time"
        body="Track how advertising in your feed changes across scans. See if ad percentages are rising, falling, or steady."
        onUpgrade={onUpgrade}
      >
        <View style={{ gap: 8 }}>
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
};

const SuggestedContent = ({ data, colors, shadows }: { data: DashboardData; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => (
  <View style={{ gap: 8 }}>
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
      <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 19 }}>
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

// Politics tab — renders political analysis from Gemini AI classification.
// Shows political share, top political source, ideological distribution,
// and methodology disclaimer matching the main site's PoliticsTab.
const PoliticsContent = ({ data, aiConsent, onGoToSettings, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; aiConsent: boolean; onGoToSettings: () => void; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  const [showIdeology, setShowIdeology] = useState(false);
  const analysis = data.politicalAnalysis;

  return (
    <View style={{ gap: 8 }}>
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

      {/* Gate 1: No AI consent */}
      {!aiConsent ? (
        <AiConsentCard
          title="Enable AI Insights"
          description="Turn on AI analysis in Settings to see how much political content appears in your feed."
          buttonLabel="Go to Settings"
          onPress={onGoToSettings}
          colors={colors}
          shadows={shadows}
        />
      ) : !data.hasPoliticsData ? (
        /* Gate 2: AI consent given but no political data yet */
        <View style={{ gap: 8 }}>
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
            alignItems: 'center',
            gap: 10,
          }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: colors.blue50, justifyContent: 'center', alignItems: 'center',
            }}>
              <Info size={20} color={colors.primaryBlue} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textMain, textAlign: 'center' }}>
              No political content detected
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 }}>
              No posts in this scan contained political keywords or themes. This could mean political content was light in this session, or the scan needs more posts for analysis.
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
              Try scanning a longer session for a fuller picture.
            </Text>
          </View>
          <PoliticsMethodologyDisclaimer colors={colors} />
        </View>
      ) : (
        /* Gate 3: Has political data — render full analysis */
        <View style={{ gap: 8 }}>
          {/* Low sample indicator */}
          {analysis?.lowSample && (
            <View style={{
              backgroundColor: '#FFFBEB',
              borderRadius: RADIUS.md,
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.md,
              borderWidth: 1,
              borderColor: 'rgba(180, 134, 11, 0.15)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
              <Info size={14} color={colors.warning} strokeWidth={2} />
              <Text style={{ fontSize: 12, color: colors.warning, flex: 1, lineHeight: 17 }}>
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
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
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
              }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textMain }}>
                  @{analysis.topPoliticalSource.handle}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 19 }}>
                  Appeared in {analysis.topPoliticalSource.pctOfPolitical}% of political posts ({analysis.topPoliticalSource.count} posts)
                </Text>
              </View>
            </>
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
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textMuted }}>
              Show ideological breakdown
            </Text>
            <ChevronDown
              size={16}
              color={colors.textSecondary}
              strokeWidth={2}
              style={{ transform: [{ rotate: showIdeology ? '180deg' : '0deg' }] }}
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
                  gap: 8,
                }}>
                  <StackedBar100
                    segments={[
                      { label: 'Left', percentage: analysis.ideology.left, count: analysis.ideology.leftCount, color: '#7C9CBF' },
                      { label: 'Center', percentage: analysis.ideology.center, count: analysis.ideology.centerCount, color: '#94A3B8' },
                      { label: 'Right', percentage: analysis.ideology.right, count: analysis.ideology.rightCount, color: '#B8A394' },
                    ]}
                  />
                  <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16, fontStyle: 'italic' }}>
                    Each segment shows what share of political posts showed keywords associated with that direction. This is approximate and may not capture nuance.
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
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
                  <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, fontStyle: 'italic' }}>
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
            <View style={{ gap: 8 }}>
              <SectionHeader title="Changes Over Time" subtitle="Political exposure trend" />
              <View style={{
                backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
                borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card, minHeight: 120,
              }}>
                <MetricCard headline="Political trend" value="—" microLine="Across recent scans" hasData={false} />
              </View>
            </View>
          </LockedOverlayCard>

          {/* Methodology disclaimer */}
          <PoliticsMethodologyDisclaimer colors={colors} />
        </View>
      )}
    </View>
  );
};

// Methodology disclaimer matching the main site's epistemic restraint pattern
const PoliticsMethodologyDisclaimer = ({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) => (
  <View style={{
    backgroundColor: colors.bgCardGradientEnd,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  }}>
    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 4 }}>
      How we measure
    </Text>
    <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
      Political classification uses Google's Gemini AI to identify posts containing political keywords and themes. Ideological alignment (left/center/right) is approximate, based on stance keywords found in post text. This analysis describes what appeared in your feed — it does not infer your personal views or the platform's intent.
    </Text>
  </View>
);

// Tone tab — renders emotional tone analysis from Gemini AI classification.
// Shows tone composition bar, methodology disclaimer, and quality gating.
// Matches the main site's ToneTab pattern with epistemic restraint.
const ToneContent = ({ data, aiConsent, onGoToSettings, isPlus, onUpgrade, colors, shadows }: { data: DashboardData; aiConsent: boolean; onGoToSettings: () => void; isPlus: boolean; onUpgrade: () => void; colors: ReturnType<typeof useTheme>['colors']; shadows: ReturnType<typeof useTheme>['shadows'] }) => {
  const analysis = data.toneAnalysis;

  // Tone colors matching the main site's palette
  const TONE_COLORS = {
    positive: '#93C5B8',  // Soft green
    neutral: '#CBD5E1',   // Slate
    negative: '#A3B1C6',  // Blue-tinted grey
  };

  return (
    <View style={{ gap: 8 }}>
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

      {/* Gate 1: No AI consent */}
      {!aiConsent ? (
        <AiConsentCard
          title="Enable AI Insights"
          description="Turn on AI analysis in Settings to unlock emotional tone classification for your feed content."
          buttonLabel="Go to Settings"
          onPress={onGoToSettings}
          colors={colors}
          shadows={shadows}
        />
      ) : !data.hasToneData ? (
        /* Gate 2: AI consent given but no tone data yet */
        <View style={{ gap: 8 }}>
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            ...shadows.card,
            alignItems: 'center',
            gap: 10,
          }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: colors.blue50, justifyContent: 'center', alignItems: 'center',
            }}>
              <Info size={20} color={colors.primaryBlue} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textMain, textAlign: 'center' }}>
              No emotional tone data detected
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 }}>
              No posts in this scan contained identifiable emotional tone. This could mean tone classification was not available for this session, or the scan needs more posts for analysis.
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
              Try scanning a longer session for a fuller picture.
            </Text>
          </View>
          <ToneMethodologyDisclaimer colors={colors} />
        </View>
      ) : (
        /* Gate 3: Has tone data — render full analysis */
        <View style={{ gap: 8 }}>
          {/* Low sample indicator */}
          {analysis?.lowSample && (
            <View style={{
              backgroundColor: '#FFFBEB',
              borderRadius: RADIUS.md,
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.md,
              borderWidth: 1,
              borderColor: 'rgba(180, 134, 11, 0.15)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
              <Info size={14} color={colors.warning} strokeWidth={2} />
              <Text style={{ fontSize: 12, color: colors.warning, flex: 1, lineHeight: 17 }}>
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
            <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16, fontStyle: 'italic', marginTop: 4 }}>
              Each segment shows what share of posts fell into that emotional category.
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
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
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 19 }}>
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

          {/* Premium: Rare content detection — locked for free users */}
          <LockedOverlayCard
            locked={!isPlus}
            title="Rare content detection"
            body="See which topics rarely appear in your feed and discover underrepresented content themes across your scans."
            onUpgrade={onUpgrade}
          >
            <View style={{ gap: 8 }}>
              <SectionHeader title="Underrepresented Topics" subtitle="What rarely shows up" />
              <View style={{
                backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
                borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card, minHeight: 120,
              }}>
                <MetricCard headline="Rare topics" value="—" microLine="Topics that rarely appear" hasData={false} />
              </View>
            </View>
          </LockedOverlayCard>

          {/* Methodology disclaimer */}
          <ToneMethodologyDisclaimer colors={colors} />
        </View>
      )}
    </View>
  );
};

// Methodology disclaimer matching the main site's epistemic restraint pattern
const ToneMethodologyDisclaimer = ({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) => (
  <View style={{
    backgroundColor: colors.bgCardGradientEnd,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  }}>
    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 4 }}>
      How we measure
    </Text>
    <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
      Emotional tone classification uses Google's Gemini AI to categorize posts as positive, neutral, or negative based on language patterns. Sentiment analysis is approximate — tone is subjective, and short posts may be misclassified. This analysis describes what appeared in your feed — it does not infer your emotional state or the platform's intent.
    </Text>
  </View>
);

// ─── Shared Sub-Components ───────────────────────────────

const EmptySection = ({ message, colors }: { message: string; colors: ReturnType<typeof useTheme>['colors'] }) => (
  <View style={{
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
  }}>
    <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 }}>
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
    gap: 10,
  }}>
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.blue50, justifyContent: 'center', alignItems: 'center',
    }}>
      <Sparkles size={20} color={colors.primaryBlue} strokeWidth={1.5} />
    </View>
    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textMain, textAlign: 'center' }}>
      {title}
    </Text>
    <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 }}>
      {description}
    </Text>
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.primaryBlue, borderRadius: RADIUS.md,
        paddingHorizontal: 14, paddingVertical: 9,
        flexDirection: 'row', alignItems: 'center', gap: 5,
      }}
    >
      <Settings size={13} color={colors.white} strokeWidth={2} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>{buttonLabel}</Text>
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
    gap: 10,
  }}>
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.blue50, justifyContent: 'center', alignItems: 'center',
    }}>
      <Info size={20} color={colors.primaryBlue} strokeWidth={1.5} />
    </View>
    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textMain, textAlign: 'center' }}>
      {title}
    </Text>
    <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 }}>
      {message}
    </Text>
    {subtitle && (
      <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
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
      style={{
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        backgroundColor: colors.blue800,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <TrendingUp size={16} color={colors.white} strokeWidth={2} />
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF', flex: 1 }}>
        Unlock trend analysis with Plus
      </Text>
      <View style={{
        backgroundColor: colors.accentGreen, borderRadius: RADIUS.sm,
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
  const { userProfile, isPlus } = useAuth();
  const { colors, shadows } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  const handleUpgrade = () => router.push('/(tabs)/settings');

  const renderTabContent = () => {
    if (!dashboardData) return null;
    switch (activeTab) {
      case 'overview': return <OverviewContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />;
      case 'sources': return <SourcesContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />;
      case 'ads': return <AdsContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />;
      case 'politics': return <PoliticsContent data={dashboardData} aiConsent={aiConsent} onGoToSettings={goToSettings} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />;
      case 'tone': return <ToneContent data={dashboardData} aiConsent={aiConsent} onGoToSettings={goToSettings} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />;
      case 'suggested_vs_followed': return <SuggestedContent data={dashboardData} colors={colors} shadows={shadows} />;
      default: return <OverviewContent data={dashboardData} isPlus={isPlus} onUpgrade={handleUpgrade} colors={colors} shadows={shadows} />;
    }
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
          paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: 6,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textMain, marginBottom: 2 }}>
              Your Dashboard
            </Text>
            {activeScan ? (
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {new Date(activeScan.created_at).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}{' — '}
                {activeScan.platform.charAt(0).toUpperCase() + activeScan.platform.slice(1)}{' '}
                ({activeScan.post_count} posts)
              </Text>
            ) : (
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {loading ? 'Loading...' : 'No scans yet'}
              </Text>
            )}
          </View>
          {hasData && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/scan')}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.accentGreen, borderRadius: RADIUS.md,
                paddingHorizontal: 14, paddingVertical: 8,
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}
            >
              <ScanSearch size={14} color={colors.white} strokeWidth={2} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Scan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading */}
        {loading && !refreshing && scans.length === 0 && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12 }}>
              Loading your scans...
            </Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && !hasData && (
          <View style={{ paddingHorizontal: 24, paddingVertical: 60, alignItems: 'center' }}>
            <View style={{
              width: 56, height: 56, backgroundColor: colors.blue50, borderRadius: 28,
              justifyContent: 'center', alignItems: 'center', marginBottom: 16,
            }}>
              <Search size={24} color={colors.primaryBlue} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textMain, marginBottom: 6 }}>
              No scans yet
            </Text>
            <Text style={{
              fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: 20,
            }}>
              Scan a social media feed to see what appears — ads, suggested content, top sources, and more.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/scan')}
              style={{
                backgroundColor: colors.accentGreen, borderRadius: RADIUS.md,
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
            <PlusTierBanner isPlus={isPlus} colors={colors} />

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
                          paddingVertical: 12,
                          minHeight: 44,
                          borderRadius: RADIUS.md,
                          backgroundColor: isActive ? colors.primaryBlue : colors.bgCard,
                          borderWidth: isActive ? 0 : 1,
                          borderColor: colors.borderSlate200,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: tab.needsAi ? 4 : 0,
                          ...(isActive ? shadows.soft : {}),
                        }}
                      >
                        {tab.needsAi && !isActive && (
                          <Sparkles size={11} color={colors.textSecondary} strokeWidth={2} />
                        )}
                        {tab.needsAi && isActive && (
                          <Sparkles size={11} color={colors.white} strokeWidth={2} />
                        )}
                        <Text style={{
                          fontSize: 13, fontWeight: '600',
                          color: isActive ? colors.white : colors.textMuted,
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
