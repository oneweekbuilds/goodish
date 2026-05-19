/**
 * SuggestedTab — redesigned "Suggested vs. Followed" tab.
 *
 * Wires the suggested/followed split, creator novelty, by-platform
 * breakdown, commercial comparison, top topics, and content format
 * signals on DashboardData to the design system primitives in
 * `src/design-system/` AND to the 2.x interpretation engine for the
 * headline verdict zone. Mirrors the structure of SourcesTab.tsx,
 * PoliticsTab.tsx, AdsTab.tsx, and ToneTab.tsx as wired in Phases
 * 6.1–6.4.
 *
 * Engine wiring (Phase 6.5.4):
 *   - useMemo chain: activeScan → context → interpretation
 *   - dashboard.suggested surface: 3 templates (followed_creator_absence
 *     at priority 70, suggested_dominance at 50, calm-case at 10 with
 *     4 variants including approximate-follow-detection).
 *   - SupportingCard filters supportingRows to 'fact' variant only;
 *     other variants warn via console.warn (Phase 7+ primitives).
 *   - When activeScan === null (no scan history at all), interpretation
 *     is null and a Tab 6-specific empty-state Card renders at the
 *     verdict-zone slot.
 *
 * What was removed in Phase 6.5.4:
 *   - HeroStatCard block (replaced by VerdictEyebrow + VerdictText +
 *     SublineRow at the verdict zone).
 *   - heroCaution small-sample badge → deferred to future CaveatNote
 *     supporting-row variant (same discipline as Phases 5.1.4 / 6.1.4
 *     / 6.2.4 / 6.3.4 / 6.4.4).
 *
 * The CautionBadge inside "Are these new voices?" Section (3) is
 * UNCHANGED — that badge documents follow-detection limits specific
 * to creatorNovelty's data quality, NOT scan sample size. Different
 * concern; different primitive; preserved.
 *
 * Section order:
 *   1. Hero (HeroStatCard on whichever of suggested/followed dominates,
 *      with insight.meaning as the description)
 *   2. Content origin (ExpandableCard, defaultOpen — StackedBar with
 *      Following / Suggested + CategoryRow rows beneath)
 *   3. Are these new voices? (ExpandableCard with 3 AttributeCard cells;
 *      CautionBadge layered inside when creatorNovelty.approximate)
 *   4. By platform (ExpandableCard with one mini-block per platform —
 *      label + StackedBar + per-row caption. Only renders when
 *      byPlatform has >1 entry, i.e. multi-platform merged scans)
 *   5. Commercial content (ExpandableCard with ComparisonPair — per-side
 *      denominator populated with "Based on N suggested posts" etc.)
 *   6. Top topics (ExpandableCard with two CategoryRow columns side-by-
 *      side: "In suggested" and "In followed". toSentenceCase applied
 *      to each Gemini-derived topic label)
 *   7. Content formats (ExpandableCard with CategoryRow per format.
 *      CONTENT_TYPE_LABELS map applied FIRST to friendly-name the raw
 *      format strings, then toSentenceCase to land in sentence case.
 *      Value packs "sug% / fol% (±delta)" into a single tabular-nums
 *      string)
 *   8. Ideas to explore (ExpandableCard with 3 numbered FeedbackLoopStep
 *      tips — reframed as optional reflections, NOT imperative commands,
 *      preserving the legacy PD-002 epistemic-restraint stance)
 *   9. About this measurement (ExpandableCard, hide-when-absent) —
 *      consumes data.suggestedInsight.howWeMeasure.
 *   10. About this analysis (DisclosureRow chrome closer).
 *
 * Color discipline:
 *   - Bar segments use brand-blue + textTertiary only. Suggested =
 *     brandPrimary (the focal metric — this tab exists to surface how
 *     much of the feed wasn't deliberately chosen). Following =
 *     textTertiary (the supporting baseline).
 *   - Inside the Commercial Content ComparisonPair the dimension is
 *     ads-vs-non-ads (not suggested-vs-followed), so the color logic
 *     swaps semantically: brandPrimary marks the Ads segment (the
 *     focal metric of that comparison) and textTertiary marks Non-ads.
 *     Both sides of the pair render with the same scheme so the visual
 *     comparison is between widths, not hues.
 *   - The legacy #F59E0B is gone.
 *
 * Out of scope:
 *   - extractCreatorNovelty / extractCommercialComparison /
 *     extractTopicsBySourceOrigin / extractContentFormatComparison
 *     beyond consumption
 *   - The legacy "Master numbers line" footer (replaced by the bottom
 *     DisclosureRow which closes the page cleanly)
 *   - No LockedOverlayCard — this tab had no Plus-locked section in
 *     the legacy and the audit confirmed that stays.
 *   - The legacy EvidenceBundleTeaser + FreeAskTeaser components are
 *     dropped consistent with Sources/Politics/Ads decisions.
 */
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import type { DashboardData } from '../../lib/computeDashboardData';
import type { ScanDetail } from '../../hooks/useDashboard';
import {
  AttributeCard,
  Card,
  CategoryRow,
  CautionBadge,
  ComparisonPair,
  DisclosureRow,
  ExpandableCard,
  FactRow,
  FeedbackLoopStep,
  StackedBar,
  SupportingCard,
  VerdictEyebrow,
  VerdictText,
} from '../../design-system';
import { colors, layout, spacing, type as typeTokens } from '../../design-tokens/tokens';
import { toSentenceCase } from '../../lib/string-utils';
import {
  SublineRow,
  sublineGapTop,
} from '../../components/interpretation/SublineRow';
import { interpretScan } from '../../lib/interpretation/interpretationEngine';
import type { InterpretationContext } from '../../lib/interpretation/interpretation-types';

// ────────────────────────────────────────────────────────────
// Content format friendly labels
//
// Duplicated from dashboard.tsx (where the same map is defined for the
// legacy SuggestedContent). Kept in-file rather than imported so this
// screen stays self-contained — if the map ever drifts in dashboard.tsx
// or we add new format keys, this copy is the source of truth for the
// redesigned tab.
// ────────────────────────────────────────────────────────────

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

/** Apply the friendly-label map then sentence-case the result. The map
 *  outputs Title Case, sentence-case normalizes to the brand voice. */
function formatContentType(raw: string): string {
  return toSentenceCase(CONTENT_TYPE_LABELS[raw] ?? raw);
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export interface SuggestedTabProps {
  data: DashboardData;
  /** All prior scans for this user. Used by the interpretation engine
   *  for followed-creator-absence detection and suggested-pct rolling-
   *  average computation. Starts as [] during the useDashboard fetch;
   *  engine handles empty array gracefully (absence and dominance
   *  predicates fall through to calm-case). */
  scans: ScanDetail[];
  /** The scan currently driving `data`. Null only when no scan
   *  history exists at all (first launch); in that case we render
   *  a Tab 6-specific empty state instead of the engine output. */
  activeScan: ScanDetail | null;
  isPlus: boolean;
  onUpgrade: () => void;
}

export function SuggestedTab({ data, scans, activeScan }: SuggestedTabProps) {
  // Note: `isPlus` and `onUpgrade` are accepted on the wrapper for API
  // consistency with the other redesigned tabs but unused here — this
  // tab has no Plus-locked section.

  const insight = data.suggestedInsight;
  const howWeMeasure = insight.howWeMeasure;

  // ── Engine wiring (Phase 6.5.4) ──────────────────────────────
  //
  // The engine runs in the main render path. When activeScan is null
  // (no scan history at all), interpretation is null and a tab-
  // specific empty-state Card renders at the verdict-zone slot.
  // Unlike Tone/Politics tabs, there's no separate !hasFollowedData
  // empty branch — Tab 6 always has both percentages to render, even
  // if the underlying data is sparse. The engine's calm-case variants
  // (approximate-follow-detection / followed-dominant / suggested-
  // leaning / fallback) handle the honest framing across data states.
  const platform = activeScan?.platform ?? 'unknown';

  const context = useMemo<InterpretationContext | null>(() => {
    if (!activeScan) return null;
    return { activeScan, scans, dashboardData: data, platform };
  }, [activeScan, scans, data, platform]);

  const interpretation = useMemo(
    () => (context ? interpretScan(context, 'dashboard.suggested') : null),
    [context],
  );

  // Filter supporting rows to 'fact' variant. Other variants
  // (CreatorRow, TrajectoryRow, BarRow, CaveatNote, MethodologyRow)
  // ship in Phase 7+ — skipped with console.warn for visibility.
  const factRows = useMemo(() => {
    const out: Array<{ label: string; value: string; anchor?: string }> = [];
    if (!interpretation) return out;
    for (const row of interpretation.supportingRows) {
      if (row.variant === 'fact') {
        out.push({ label: row.label, value: row.value, anchor: row.anchor });
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `[2x] supporting row variant not yet implemented on Dashboard Suggested: ${row.variant}`,
        );
      }
    }
    return out;
  }, [interpretation]);

  // 1.1.x HeroStatCard + heroCaution removed in Phase 6.5.4 — the
  // engine's dashboard.suggested surface (followed_creator_absence
  // template + suggested_dominance template + calm-case variants)
  // produces the verdict zone. The CautionBadge inside Section 3
  // ("Are these new voices?") is PRESERVED — that badge documents
  // creator-novelty follow-detection limits, not scan-sample-size
  // caution. Different concern.

  const verdictZone = interpretation ? (
    <View>
      <VerdictEyebrow />
      <View style={{ marginTop: spacing.s4 }}>
        <VerdictText>{interpretation.verdict}</VerdictText>
      </View>
      <View style={{ marginTop: spacing.s6 }}>
        {interpretation.sublines.map((subline, idx) => {
          const prevMode =
            idx > 0 ? interpretation.sublines[idx - 1]?.mode : undefined;
          const marginTop = sublineGapTop(prevMode, subline.mode);
          return (
            <SublineRow
              key={idx}
              subline={subline}
              marginTop={marginTop}
              surface="Dashboard Suggested"
            />
          );
        })}
      </View>
      {factRows.length > 0 ? (
        <View style={{ marginTop: spacing.s6 }}>
          <SupportingCard>
            {factRows.map((row, i) => (
              <FactRow
                key={i}
                label={row.label}
                value={row.value}
                anchor={row.anchor}
              />
            ))}
          </SupportingCard>
        </View>
      ) : null}
    </View>
  ) : (
    <Card>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          fontWeight: typeTokens.body.fontWeight,
          color: colors.textSecondary,
        }}
      >
        Run a scan to see your suggested-versus-followed split.
      </Text>
    </Card>
  );

  return (
    <View
      style={{
        paddingHorizontal: layout.screenPaddingX,
        paddingTop: layout.screenPaddingY,
        paddingBottom: spacing.s7,
      }}
    >
      {/* ── 1. Verdict zone (engine-driven) ─────────────────── */}
      {verdictZone}

      {/* ── 2. Content origin ───────────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <ExpandableCard
          icon="bar-chart-3"
          title="Content origin"
          headline={`${data.followedPct}% / ${data.suggestedPct}%`}
          defaultOpen
        >
          <StackedBar
            segments={[
              { label: 'Following', value: data.followedPct, color: 'textTertiary' },
              { label: 'Suggested', value: data.suggestedPct, color: 'brandPrimary' },
            ]}
            accessibilityLabel={`Content origin: Following ${data.followedPct}%, Suggested ${data.suggestedPct}%`}
          />
          <View style={{ marginTop: spacing.s3 }}>
            <CategoryRow
              label="Following"
              value={`${data.followedPct}% (${data.followedCount})`}
            />
            <CategoryRow
              label="Suggested"
              value={`${data.suggestedPct}% (${data.suggestedCount})`}
              last
            />
          </View>
        </ExpandableCard>
      </View>

      {/* ── 3. Are these new voices? ────────────────────────── */}
      {data.creatorNovelty?.hasData ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Are these new voices?"
            headline={`${data.creatorNovelty.noveltyPercent}% new`}
          >
            {data.creatorNovelty.approximate ? (
              <View style={{ marginBottom: spacing.s4 }}>
                <CautionBadge>
                  Follow detection is limited on some platforms. These numbers are approximate.
                </CautionBadge>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.s2 }}>
              <AttributeCard
                label="Suggested creators"
                value={String(data.creatorNovelty.suggestedCreatorCount)}
              />
              <AttributeCard
                label="Overlap"
                value={String(data.creatorNovelty.overlapCount)}
              />
              <AttributeCard
                label="Followed creators"
                value={String(data.creatorNovelty.followedCreatorCount)}
              />
            </View>

            <Text
              style={{
                fontSize: typeTokens.caption.fontSize,
                lineHeight: typeTokens.caption.lineHeight,
                color: colors.textSecondary,
                marginTop: spacing.s3,
              }}
            >
              {data.creatorNovelty.noveltyPercent >= 60
                ? "Most suggested content appeared to come from creators you don't follow. Lots of new voices in the mix."
                : data.creatorNovelty.noveltyPercent >= 40
                  ? 'A mix of new and familiar creators appeared in suggested content.'
                  : 'Most suggested content appeared to come from creators you already follow.'}
            </Text>
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 4. By platform ──────────────────────────────────── */}
      {/* Only renders for multi-platform scans (data merged across
          platforms). For single-platform scans byPlatform is null
          and the section disappears. */}
      {data.byPlatform && data.byPlatform.length > 1 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="By platform"
            headline={`${data.byPlatform.length} platforms`}
          >
            {data.byPlatform.map((bp, i) => {
              const isLast = i === data.byPlatform!.length - 1;
              return (
                <View
                  key={`${bp.platform}-${i}`}
                  style={{ marginBottom: isLast ? 0 : spacing.s4 }}
                >
                  <Text
                    style={{
                      fontSize: typeTokens.body.fontSize,
                      lineHeight: typeTokens.body.lineHeight,
                      fontWeight: typeTokens.bodyStrong.fontWeight,
                      color: colors.textPrimary,
                      marginBottom: spacing.s2,
                    }}
                  >
                    {toSentenceCase(bp.platform)}
                  </Text>
                  <StackedBar
                    segments={[
                      { label: 'Following', value: bp.followedPct, color: 'textTertiary' },
                      { label: 'Suggested', value: bp.suggestedPct, color: 'brandPrimary' },
                    ]}
                    accessibilityLabel={`${bp.platform}: Following ${bp.followedPct}%, Suggested ${bp.suggestedPct}%`}
                  />
                  <Text
                    style={{
                      fontSize: typeTokens.caption.fontSize,
                      lineHeight: typeTokens.caption.lineHeight,
                      color: colors.textSecondary,
                      marginTop: spacing.s2,
                    }}
                  >
                    Following: {bp.followedCount} ({bp.followedPct}%) · Suggested: {bp.suggestedCount} ({bp.suggestedPct}%)
                  </Text>
                </View>
              );
            })}
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 5. Commercial content ───────────────────────────── */}
      {data.commercialComparison ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Commercial content"
            headline={`${data.commercialComparison.suggested.adPct}% vs ${data.commercialComparison.followed.adPct}%`}
          >
            <ComparisonPair
              left={{
                label: 'Suggested posts',
                denominator: `Based on ${data.commercialComparison.suggested.total} suggested ${data.commercialComparison.suggested.total === 1 ? 'post' : 'posts'}`,
                segments: [
                  { label: 'Ads', value: data.commercialComparison.suggested.adPct, color: 'brandPrimary' },
                  { label: 'Non-ads', value: Math.max(0, 100 - data.commercialComparison.suggested.adPct), color: 'textTertiary' },
                ],
                accessibilityLabel: `Suggested posts: ${data.commercialComparison.suggested.adPct}% ads, ${Math.max(0, 100 - data.commercialComparison.suggested.adPct)}% non-ads`,
              }}
              right={{
                label: 'Followed posts',
                denominator: `Based on ${data.commercialComparison.followed.total} followed ${data.commercialComparison.followed.total === 1 ? 'post' : 'posts'}`,
                segments: [
                  { label: 'Ads', value: data.commercialComparison.followed.adPct, color: 'brandPrimary' },
                  { label: 'Non-ads', value: Math.max(0, 100 - data.commercialComparison.followed.adPct), color: 'textTertiary' },
                ],
                accessibilityLabel: `Followed posts: ${data.commercialComparison.followed.adPct}% ads, ${Math.max(0, 100 - data.commercialComparison.followed.adPct)}% non-ads`,
              }}
              deltaInsight={
                data.commercialComparison.biggestDifference
                  ? `Based on observable data: ${data.commercialComparison.biggestDifference}`
                  : null
              }
            />
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 6. Top topics (2-column CategoryRow) ────────────── */}
      {data.topTopicsBySuggested.length > 0 || data.topTopicsByFollowed.length > 0 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard icon="bar-chart-3" title="Top topics">
            <View style={{ flexDirection: 'row', gap: spacing.s4 }}>
              {/* Left column — "In suggested" */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: typeTokens.body.fontSize,
                    lineHeight: typeTokens.body.lineHeight,
                    fontWeight: typeTokens.bodyStrong.fontWeight,
                    color: colors.textPrimary,
                    marginBottom: spacing.s2,
                  }}
                >
                  In suggested
                </Text>
                {data.topTopicsBySuggested.length > 0 ? (
                  data.topTopicsBySuggested.map((t, i) => (
                    <CategoryRow
                      key={`s-${t.topic}-${i}`}
                      label={toSentenceCase(t.topic)}
                      value={`${t.percentage}%`}
                      last={i === data.topTopicsBySuggested.length - 1}
                    />
                  ))
                ) : (
                  <Text
                    style={{
                      fontSize: typeTokens.caption.fontSize,
                      lineHeight: typeTokens.caption.lineHeight,
                      color: colors.textTertiary,
                    }}
                  >
                    No topic data
                  </Text>
                )}
              </View>

              {/* Right column — "In followed" */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: typeTokens.body.fontSize,
                    lineHeight: typeTokens.body.lineHeight,
                    fontWeight: typeTokens.bodyStrong.fontWeight,
                    color: colors.textPrimary,
                    marginBottom: spacing.s2,
                  }}
                >
                  In followed
                </Text>
                {data.topTopicsByFollowed.length > 0 ? (
                  data.topTopicsByFollowed.map((t, i) => (
                    <CategoryRow
                      key={`f-${t.topic}-${i}`}
                      label={toSentenceCase(t.topic)}
                      value={`${t.percentage}%`}
                      last={i === data.topTopicsByFollowed.length - 1}
                    />
                  ))
                ) : (
                  <Text
                    style={{
                      fontSize: typeTokens.caption.fontSize,
                      lineHeight: typeTokens.caption.lineHeight,
                      color: colors.textTertiary,
                    }}
                  >
                    No topic data
                  </Text>
                )}
              </View>
            </View>
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 7. Content formats ──────────────────────────────── */}
      {/* Sample-size caveat renders at the top of the body when either
          side has < 10 posts — the per-format percentages are unstable
          on small samples and the user should weigh them accordingly.
          (Build #52 verification flagged this; surfaced now in build #53.) */}
      {data.contentFormatComparison.length > 0 ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard
            icon="bar-chart-3"
            title="Content formats"
            headline={`${data.contentFormatComparison.length} ${data.contentFormatComparison.length === 1 ? 'format' : 'formats'}`}
          >
            {data.suggestedCount < 10 || data.followedCount < 10 ? (
              <Text
                style={{
                  fontSize: typeTokens.caption.fontSize,
                  lineHeight: typeTokens.caption.lineHeight,
                  color: colors.textTertiary,
                  marginBottom: spacing.s3,
                }}
              >
                Based on {data.suggestedCount} suggested and {data.followedCount} followed posts. Patterns from small samples may not generalize.
              </Text>
            ) : null}
            {data.contentFormatComparison.map((cf, i) => {
              const deltaSign = cf.delta > 0 ? '+' : '';
              // Pack three numbers into one tabular-nums value string so the
              // CategoryRow primitive renders without modification.
              const value = `${cf.suggestedPct}% / ${cf.followedPct}% (${deltaSign}${cf.delta})`;
              return (
                <CategoryRow
                  key={`${cf.format}-${i}`}
                  label={formatContentType(cf.format)}
                  value={value}
                  last={i === data.contentFormatComparison.length - 1}
                />
              );
            })}
            <Text
              style={{
                fontSize: typeTokens.caption.fontSize,
                lineHeight: typeTokens.caption.lineHeight,
                color: colors.textSecondary,
                marginTop: spacing.s3,
              }}
            >
              Value shows: suggested% / followed% (difference). Positive difference means the format was more common in suggested content.
            </Text>
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 8. Ideas to explore ─────────────────────────────── */}
      {/* Reframed as optional reflections per the legacy PD-002 fix —
          NOT imperative commands. "Some people find that..." not "Do
          this". The brand voice is reflective, not prescriptive. */}
      <View style={{ marginTop: spacing.s7 }}>
        <ExpandableCard icon="lightbulb" title="Ideas to explore">
          <FeedbackLoopStep
            n={1}
            title="Diversify your follows"
            body="Some people find that following a wider range of accounts changes what their feed recommends over time."
          />
          <FeedbackLoopStep
            n={2}
            title="Try chronological mode"
            body='Some platforms offer a "Following" or "Latest" feed mode that shows only posts from accounts you follow, in chronological order.'
          />
          <FeedbackLoopStep
            n={3}
            title="Engage intentionally"
            body="Platforms often describe engagement (likes, shares, comments) as a factor in feed ranking, though the exact effect is not publicly documented."
            last
          />
        </ExpandableCard>
      </View>

      {/* ── 9. About this measurement ───────────────────────── */}
      {howWeMeasure ? (
        <View style={{ marginTop: spacing.s7 }}>
          <ExpandableCard icon="info" title="About this measurement">
            <MethodologySections howWeMeasure={howWeMeasure} />
          </ExpandableCard>
        </View>
      ) : null}

      {/* ── 10. About this analysis ─────────────────────────── */}
      <View style={{ marginTop: spacing.s7 }}>
        <DisclosureRow label="About this analysis" />
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Local: methodology sub-sections renderer
//
// Same shape as PoliticsTab/AdsTab's MethodologySections. Duplicated
// rather than shared so each redesigned tab stays self-contained; the
// design system can promote this to a shared primitive once all five
// tabs land and we're sure the contract is stable.
// ────────────────────────────────────────────────────────────

interface MethodologySectionsProps {
  howWeMeasure: NonNullable<DashboardData['suggestedInsight']['howWeMeasure']>;
}

function MethodologySections({ howWeMeasure }: MethodologySectionsProps) {
  return (
    <>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          fontWeight: typeTokens.bodyStrong.fontWeight,
          color: colors.textPrimary,
          marginBottom: spacing.s2,
        }}
      >
        What we measure
      </Text>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          color: colors.textSecondary,
          marginBottom: spacing.s4,
        }}
      >
        {howWeMeasure.what}
      </Text>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          fontWeight: typeTokens.bodyStrong.fontWeight,
          color: colors.textPrimary,
          marginBottom: spacing.s2,
        }}
      >
        How we measure it
      </Text>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          color: colors.textSecondary,
          marginBottom: spacing.s4,
        }}
      >
        {howWeMeasure.how}
      </Text>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          fontWeight: typeTokens.bodyStrong.fontWeight,
          color: colors.textPrimary,
          marginBottom: spacing.s2,
        }}
      >
        Limitations
      </Text>
      <Text
        style={{
          fontSize: typeTokens.body.fontSize,
          lineHeight: typeTokens.body.lineHeight,
          color: colors.textSecondary,
        }}
      >
        {howWeMeasure.limitations}
      </Text>
    </>
  );
}
