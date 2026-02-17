import React, { useState } from 'react';
import {
  MasterNumbersLine,
  DenominatorLine,
  CompositionBar100WithCounts,
} from '../../../components/dashboard/primitives';
import InsightHero from '../../../components/dashboard/InsightHero';
import SectionHeader from '../../../components/dashboard/SectionHeader';
import TrendsCTA from '../../../components/dashboard/TrendsCTA';
import TrendsPanel from '../../../components/dashboard/TrendsPanel';
import { buildToneHero } from '../../../lib/dashboard/insightBuilders';
import { aggregateEmotions, aggregateAds } from '../../../lib/dashboard/scanAggregator';
import { getFeedItems } from '../../../lib/dashboard/dataHelpers';
import EvidenceBundleTeaser from '../../../components/plan/EvidenceBundleTeaser';
import FreeAskTeaser from '../../../components/dashboard/FreeAskTeaser';

/**
 * ToneDiffInsight - Shows the key difference between two tone groups
 * as a single insight sentence + simple diverging bar, instead of
 * dual side-by-side composition bars.
 */
const ToneDiffInsight = ({ groupALabel, groupBLabel, groupA, groupB }) => {
  if (!groupA || !groupB) return null;

  const aNeg = groupA.segments.find(s => s.label === 'Negative')?.percentage || 0;
  const bNeg = groupB.segments.find(s => s.label === 'Negative')?.percentage || 0;
  const aPos = groupA.segments.find(s => s.label === 'Positive')?.percentage || 0;
  const bPos = groupB.segments.find(s => s.label === 'Positive')?.percentage || 0;

  const negDiff = aNeg - bNeg;
  const posDiff = aPos - bPos;

  // Pick the largest absolute difference
  const useDiff = Math.abs(negDiff) >= Math.abs(posDiff) ? 'negative' : 'positive';
  const diff = useDiff === 'negative' ? negDiff : posDiff;
  const absDiff = Math.abs(diff);

  if (absDiff < 3) {
    return (
      <div
      className="rounded-xl p-5 sm:p-6"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFE 100%)',
        border: '1px solid rgba(37, 99, 235, 0.08)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
        <p className="text-sm text-slate-600">
          {groupALabel} and {groupBLabel.toLowerCase()} have similar emotional tone. No meaningful difference detected.
        </p>
      </div>
    );
  }

  const higherGroup = diff > 0 ? groupALabel : groupBLabel;
  const toneType = useDiff === 'negative' ? 'negative' : 'positive';
  const toneColor = useDiff === 'negative' ? '#A3B1C6' : '#93C5B8';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">
          {higherGroup} are {absDiff} points more {toneType}
        </p>
        <p className="text-sm text-slate-600">
          {groupALabel}: {useDiff === 'negative' ? aNeg : aPos}% {toneType} · {groupBLabel}: {useDiff === 'negative' ? bNeg : bPos}% {toneType}
        </p>
      </div>

      {/* Simple diverging bar */}
      <div
        className="flex items-center gap-3"
        role="img"
        aria-label={`${higherGroup} are ${absDiff} points more ${toneType}. ${groupALabel}: ${useDiff === 'negative' ? aNeg : aPos}% ${toneType}. ${groupBLabel}: ${useDiff === 'negative' ? bNeg : bPos}% ${toneType}.`}
      >
        <span className="text-xs text-slate-500 w-24 text-right truncate">{groupALabel}</span>
        <div className="flex-1 flex items-center gap-1">
          <div className="flex-1 h-6 bg-slate-100 rounded-l-full overflow-hidden flex justify-end">
            <div
              className="h-full rounded-l-full"
              style={{
                width: `${useDiff === 'negative' ? aNeg : aPos}%`,
                backgroundColor: toneColor,
                opacity: 0.7,
              }}
            />
          </div>
          <div className="w-px h-8 bg-slate-300" />
          <div className="flex-1 h-6 bg-slate-100 rounded-r-full overflow-hidden">
            <div
              className="h-full rounded-r-full"
              style={{
                width: `${useDiff === 'negative' ? bNeg : bPos}%`,
                backgroundColor: toneColor,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
        <span className="text-xs text-slate-500 w-24 truncate">{groupBLabel}</span>
      </div>

      <p className="text-xs text-text-muted">
        Based on {groupA.total || groupA.totalKnownValence || 0} {groupALabel.toLowerCase()} and {groupB.total || groupB.totalKnownValence || 0} {groupBLabel.toLowerCase()} posts
      </p>
    </div>
  );
};

/**
 * ToneTab - Tab 5 of locked spec
 *
 * Provides emotional tone analysis with:
 * - Section 5.1: Tone distribution (100% split) with top 5 handles by positive/negative volume
 * - Section 5.2: Tone split: political vs non-political
 * - Section 5.3: Tone split: selling vs not selling
 * - Section 5.4: Master numbers line
 */
const ToneTab = ({
  scans,
  scanDetails,
  onOpenTrends,
  isPlusUser,
  showTrendsPanel,
  onCloseTrendsPanel,
}) => {

  // Aggregate data from all filtered scans
  const emotionsData = aggregateEmotions(scans, scanDetails);
  const adsData = aggregateAds(scans, scanDetails);

  const totalPosts = adsData.totalPosts || 0;
  const scanCount = scans.length;
  const platformCount = Object.keys(adsData.byPlatform || {}).length || 1;

  // ===========================================
  // SECTION 5.1 - Tone Distribution
  // ===========================================

  const computeToneDistribution = () => {
    // Only use known valence: POSITIVE, NEUTRAL, NEGATIVE
    const posCount = emotionsData.valenceDistribution.POSITIVE || 0;
    const neutCount = emotionsData.valenceDistribution.NEUTRAL || 0;
    const negCount = emotionsData.valenceDistribution.NEGATIVE || 0;

    const knownValenceTotal = posCount + neutCount + negCount;

    if (totalPosts === 0 || knownValenceTotal < 10) {
      return { hasData: false };
    }

    // Calculate percentages with rounding
    let posPercent = Math.round((posCount / knownValenceTotal) * 100);
    let neutPercent = Math.round((neutCount / knownValenceTotal) * 100);
    let negPercent = Math.round((negCount / knownValenceTotal) * 100);

    // Ensure percentages sum to exactly 100
    const sum = posPercent + neutPercent + negPercent;
    if (sum !== 100) {
      const diff = 100 - sum;
      if (posCount >= neutCount && posCount >= negCount) {
        posPercent += diff;
      } else if (neutCount >= negCount) {
        neutPercent += diff;
      } else {
        negPercent += diff;
      }
    }

    // Find top 5 handles by positive post volume
    const creatorPositiveCounts = {};
    const creatorNegativeCounts = {};

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const creator = item.creator_username || item.author_handle;
        if (!creator) continue;

        const normalizedCreator = creator.toLowerCase().replace(/^@/, '');
        const valence = item.emotions?.valence;

        if (valence === 'POSITIVE') {
          creatorPositiveCounts[normalizedCreator] = (creatorPositiveCounts[normalizedCreator] || 0) + 1;
        } else if (valence === 'NEGATIVE') {
          creatorNegativeCounts[normalizedCreator] = (creatorNegativeCounts[normalizedCreator] || 0) + 1;
        }
      }
    }

    // Sort and get top 5 positive
    const topPositive = Object.entries(creatorPositiveCounts)
      .map(([handle, count]) => ({ handle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sort and get top 5 negative
    const topNegative = Object.entries(creatorNegativeCounts)
      .map(([handle, count]) => ({ handle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      hasData: true,
      segments: [
        { label: 'Positive', percentage: posPercent, count: posCount, color: '#93C5B8' },
        { label: 'Neutral', percentage: neutPercent, count: neutCount, color: '#CBD5E1' },
        { label: 'Negative', percentage: negPercent, count: negCount, color: '#A3B1C6' },
      ],
      knownValenceTotal,
      topPositive,
      topNegative,
    };
  };

  const toneDistribution = computeToneDistribution();

  // ===========================================
  // SECTION 5.2 - Political vs Non-Political Tone
  // ===========================================

  const computePoliticalVsNonPoliticalTone = () => {
    // Count tone for political vs non-political posts
    let politicalPos = 0;
    let politicalNeut = 0;
    let politicalNeg = 0;

    let nonPoliticalPos = 0;
    let nonPoliticalNeut = 0;
    let nonPoliticalNeg = 0;

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const valence = item.emotions?.valence;
        const isPolitical = item.political?.is_political;

        if (valence === 'POSITIVE' || valence === 'NEUTRAL' || valence === 'NEGATIVE') {
          if (isPolitical) {
            if (valence === 'POSITIVE') politicalPos++;
            else if (valence === 'NEUTRAL') politicalNeut++;
            else if (valence === 'NEGATIVE') politicalNeg++;
          } else {
            if (valence === 'POSITIVE') nonPoliticalPos++;
            else if (valence === 'NEUTRAL') nonPoliticalNeut++;
            else if (valence === 'NEGATIVE') nonPoliticalNeg++;
          }
        }
      }
    }

    const politicalTotal = politicalPos + politicalNeut + politicalNeg;
    const nonPoliticalTotal = nonPoliticalPos + nonPoliticalNeut + nonPoliticalNeg;

    // Must have at least 10 posts in BOTH groups
    if (politicalTotal < 10 || nonPoliticalTotal < 10) {
      return { hasData: false };
    }

    // Calculate percentages for political posts
    let polPosPercent = Math.round((politicalPos / politicalTotal) * 100);
    let polNeutPercent = Math.round((politicalNeut / politicalTotal) * 100);
    let polNegPercent = Math.round((politicalNeg / politicalTotal) * 100);

    const polSum = polPosPercent + polNeutPercent + polNegPercent;
    if (polSum !== 100) {
      const diff = 100 - polSum;
      if (politicalPos >= politicalNeut && politicalPos >= politicalNeg) {
        polPosPercent += diff;
      } else if (politicalNeut >= politicalNeg) {
        polNeutPercent += diff;
      } else {
        polNegPercent += diff;
      }
    }

    // Calculate percentages for non-political posts
    let nonPolPosPercent = Math.round((nonPoliticalPos / nonPoliticalTotal) * 100);
    let nonPolNeutPercent = Math.round((nonPoliticalNeut / nonPoliticalTotal) * 100);
    let nonPolNegPercent = Math.round((nonPoliticalNeg / nonPoliticalTotal) * 100);

    const nonPolSum = nonPolPosPercent + nonPolNeutPercent + nonPolNegPercent;
    if (nonPolSum !== 100) {
      const diff = 100 - nonPolSum;
      if (nonPoliticalPos >= nonPoliticalNeut && nonPoliticalPos >= nonPoliticalNeg) {
        nonPolPosPercent += diff;
      } else if (nonPoliticalNeut >= nonPoliticalNeg) {
        nonPolNeutPercent += diff;
      } else {
        nonPolNegPercent += diff;
      }
    }

    return {
      hasData: true,
      political: {
        segments: [
          { label: 'Positive', percentage: polPosPercent, count: politicalPos, color: '#93C5B8' },
          { label: 'Neutral', percentage: polNeutPercent, count: politicalNeut, color: '#CBD5E1' },
          { label: 'Negative', percentage: polNegPercent, count: politicalNeg, color: '#A3B1C6' },
        ],
        total: politicalTotal,
      },
      nonPolitical: {
        segments: [
          { label: 'Positive', percentage: nonPolPosPercent, count: nonPoliticalPos, color: '#93C5B8' },
          { label: 'Neutral', percentage: nonPolNeutPercent, count: nonPoliticalNeut, color: '#CBD5E1' },
          { label: 'Negative', percentage: nonPolNegPercent, count: nonPoliticalNeg, color: '#A3B1C6' },
        ],
        total: nonPoliticalTotal,
      },
    };
  };

  const politicalVsNonPoliticalTone = computePoliticalVsNonPoliticalTone();

  // ===========================================
  // SECTION 5.3 - Selling vs Not Selling Tone
  // ===========================================

  const computeSellingVsNotSellingTone = () => {
    // Count tone for selling vs not selling posts
    let sellingPos = 0;
    let sellingNeut = 0;
    let sellingNeg = 0;

    let notSellingPos = 0;
    let notSellingNeut = 0;
    let notSellingNeg = 0;

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const valence = item.emotions?.valence;
        const isSelling = item.influence?.is_ad || item.influence?.likely_influence;

        if (valence === 'POSITIVE' || valence === 'NEUTRAL' || valence === 'NEGATIVE') {
          if (isSelling) {
            if (valence === 'POSITIVE') sellingPos++;
            else if (valence === 'NEUTRAL') sellingNeut++;
            else if (valence === 'NEGATIVE') sellingNeg++;
          } else {
            if (valence === 'POSITIVE') notSellingPos++;
            else if (valence === 'NEUTRAL') notSellingNeut++;
            else if (valence === 'NEGATIVE') notSellingNeg++;
          }
        }
      }
    }

    const sellingTotal = sellingPos + sellingNeut + sellingNeg;
    const notSellingTotal = notSellingPos + notSellingNeut + notSellingNeg;

    // Must have at least 10 posts in BOTH groups
    if (sellingTotal < 10 || notSellingTotal < 10) {
      return { hasData: false };
    }

    // Calculate percentages for selling posts
    let sellPosPercent = Math.round((sellingPos / sellingTotal) * 100);
    let sellNeutPercent = Math.round((sellingNeut / sellingTotal) * 100);
    let sellNegPercent = Math.round((sellingNeg / sellingTotal) * 100);

    const sellSum = sellPosPercent + sellNeutPercent + sellNegPercent;
    if (sellSum !== 100) {
      const diff = 100 - sellSum;
      if (sellingPos >= sellingNeut && sellingPos >= sellingNeg) {
        sellPosPercent += diff;
      } else if (sellingNeut >= sellingNeg) {
        sellNeutPercent += diff;
      } else {
        sellNegPercent += diff;
      }
    }

    // Calculate percentages for not selling posts
    let notSellPosPercent = Math.round((notSellingPos / notSellingTotal) * 100);
    let notSellNeutPercent = Math.round((notSellingNeut / notSellingTotal) * 100);
    let notSellNegPercent = Math.round((notSellingNeg / notSellingTotal) * 100);

    const notSellSum = notSellPosPercent + notSellNeutPercent + notSellNegPercent;
    if (notSellSum !== 100) {
      const diff = 100 - notSellSum;
      if (notSellingPos >= notSellingNeut && notSellingPos >= notSellingNeg) {
        notSellPosPercent += diff;
      } else if (notSellingNeut >= notSellingNeg) {
        notSellNeutPercent += diff;
      } else {
        notSellNegPercent += diff;
      }
    }

    return {
      hasData: true,
      selling: {
        segments: [
          { label: 'Positive', percentage: sellPosPercent, count: sellingPos, color: '#93C5B8' },
          { label: 'Neutral', percentage: sellNeutPercent, count: sellingNeut, color: '#CBD5E1' },
          { label: 'Negative', percentage: sellNegPercent, count: sellingNeg, color: '#A3B1C6' },
        ],
        total: sellingTotal,
      },
      notSelling: {
        segments: [
          { label: 'Positive', percentage: notSellPosPercent, count: notSellingPos, color: '#93C5B8' },
          { label: 'Neutral', percentage: notSellNeutPercent, count: notSellingNeut, color: '#CBD5E1' },
          { label: 'Negative', percentage: notSellNegPercent, count: notSellingNeg, color: '#A3B1C6' },
        ],
        total: notSellingTotal,
      },
    };
  };

  const sellingVsNotSellingTone = computeSellingVsNotSellingTone();
  const [showToneSplits, setShowToneSplits] = useState(false);

  // ===========================================
  // BUILD INSIGHT HERO
  // ===========================================

  const hero = buildToneHero({
    toneDistribution,
    totalPosts,
    platformCount,
  });

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="space-y-10">
      {/* Insight Hero */}
      <InsightHero {...hero} />

      {/* Trends CTA */}
      <TrendsCTA
        onClick={() => onOpenTrends({ tab: 'tone', placement: 'hero_trends' })}
        isPlusUser={isPlusUser}
      />

      {/* Trends Panel (Plus users only) */}
      {showTrendsPanel && (
        <TrendsPanel
          scans={scans}
          scanDetails={scanDetails}
          onClose={onCloseTrendsPanel}
        />
      )}

      {/* Section 5.1 - Tone Distribution */}
      <section>
        <SectionHeader>Tone distribution</SectionHeader>

        {toneDistribution.hasData ? (
          <div className="space-y-4">
            <CompositionBar100WithCounts segments={toneDistribution.segments} />
            <p className="text-xs text-slate-500 italic">Each segment shows what percentage of posts fall into that emotional category.</p>
            <DenominatorLine text={`Percent of posts in the selected date range (${toneDistribution.knownValenceTotal} posts)`} />

            {/* Top 5 Positive Sources */}
            {toneDistribution.topPositive.length > 0 && (
              <div
      className="rounded-xl p-5 sm:p-6"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFE 100%)',
        border: '1px solid rgba(37, 99, 235, 0.08)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Top 5 sources by positive post volume</h3>
                <div className="space-y-2">
                  {toneDistribution.topPositive.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-800">@{item.handle}</span>
                      <span className="text-slate-600">{item.count} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 5 Negative Sources */}
            {toneDistribution.topNegative.length > 0 && (
              <div
      className="rounded-xl p-5 sm:p-6"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFE 100%)',
        border: '1px solid rgba(37, 99, 235, 0.08)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Top 5 sources by negative post volume</h3>
                <div className="space-y-2">
                  {toneDistribution.topNegative.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-800">@{item.handle}</span>
                      <span className="text-slate-600">{item.count} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-6 text-center" style={{ background: '#FAFBFE', border: '1px solid rgba(37, 99, 235, 0.06)' }}>
            <p className="text-sm text-slate-400 italic">
              Not enough posts with known tone in this window.
            </p>
          </div>
        )}
      </section>

      {/* Sections 5.2-5.3: Collapsible tone comparisons */}
      <section>
        <button
          onClick={() => setShowToneSplits(!showToneSplits)}
          className="w-full flex items-center justify-between py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded"
          aria-expanded={showToneSplits}
        >
          <span>Tone comparisons</span>
          <span className="text-xs text-slate-400">{showToneSplits ? 'Show less' : 'Show more'}</span>
        </button>

        {showToneSplits && (
          <div className="space-y-8 mt-4">
            {/* Section 5.2 - Tone: Political vs Non-Political */}
            <div>
              <SectionHeader>Tone: political vs non-political</SectionHeader>

              {politicalVsNonPoliticalTone.hasData ? (
                <ToneDiffInsight
                  groupALabel="Political posts"
                  groupBLabel="Non-political posts"
                  groupA={politicalVsNonPoliticalTone.political}
                  groupB={politicalVsNonPoliticalTone.nonPolitical}
                />
              ) : (
                <div className="rounded-xl p-6 text-center" style={{ background: '#FAFBFE', border: '1px solid rgba(37, 99, 235, 0.06)' }}>
                  <p className="text-sm text-slate-400 italic">
                    Not enough posts in both political and non-political groups to compare tone.
                  </p>
                </div>
              )}
            </div>

            {/* Section 5.3 - Tone: Selling vs Not Selling */}
            <div>
              <SectionHeader>Tone: selling vs not selling</SectionHeader>

              {sellingVsNotSellingTone.hasData ? (
                <ToneDiffInsight
                  groupALabel="Selling posts"
                  groupBLabel="Non-selling posts"
                  groupA={sellingVsNotSellingTone.selling}
                  groupB={sellingVsNotSellingTone.notSelling}
                />
              ) : (
                <div className="rounded-xl p-6 text-center" style={{ background: '#FAFBFE', border: '1px solid rgba(37, 99, 235, 0.06)' }}>
                  <p className="text-sm text-slate-400 italic">
                    Not enough posts in both selling and not selling groups to compare tone.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Evidence Bundle + Ask Your Feed Teasers (free users only) */}
      {!isPlusUser && (
        <>
          <EvidenceBundleTeaser
            tabName="tone"
            teaserText="Plus explains the emotional patterns in your feed content and what compositional shifts look like across scans."
          />
          <FreeAskTeaser
            tabName="tone"
            exampleQuestion="What is the overall emotional tone of my feed and how does it break down?"
          />
        </>
      )}

      {/* Section 5.4 - Master Numbers Line */}
      <section className="pt-4 border-t border-slate-200">
        <MasterNumbersLine
          scanCount={scanCount}
          platformCount={platformCount}
          postCount={totalPosts}
        />
      </section>
    </div>
  );
};

export default ToneTab;
