import React from 'react';
import {
  MasterNumbersLine,
  DenominatorLine,
  CompositionBar100WithCounts,
} from '../../../components/dashboard/primitives';
import InsightHero from '../../../components/dashboard/InsightHero';
import SectionHeader from '../../../components/dashboard/SectionHeader';
import TrendsCTA from '../../../components/dashboard/TrendsCTA';
import TrendsStubPanel from '../../../components/dashboard/TrendsStubPanel';
import { buildAdsHero } from '../../../lib/dashboard/insightBuilders';
import { aggregateAds, summarizeInfluence } from '../../../lib/dashboard/scanAggregator';

/**
 * Helper to extract feed items from scan detail
 */
const getFeedItems = (scanDetail) => {
  if (!scanDetail) return [];
  const data = scanDetail.result || scanDetail.scan || scanDetail;
  return data?.feed_items || [];
};

/**
 * AdsTab - Tab 3 of locked spec
 *
 * Provides commercial content analysis with:
 * - Section 3.1: Commercial composition (100% split)
 * - Section 3.2: Top advertised companies
 * - Section 3.3: Top advertised product types
 * - Section 3.4: Unlabeled promotional content (rule-based engine)
 * - Section 3.5: Tone split: selling vs not selling (conditional)
 * - Section 3.6: Master numbers line
 */
const AdsTab = ({
  scans,
  scanDetails,
  onOpenTrends,
  isPlusUser,
  showTrendsPanel,
  onCloseTrendsPanel,
}) => {

  // Aggregate data from all filtered scans
  const adsData = aggregateAds(scans, scanDetails);
  const influenceData = summarizeInfluence(scans, scanDetails);

  const totalPosts = adsData.totalPosts || 0;
  const scanCount = scans.length;
  const platformCount = Object.keys(adsData.byPlatform || {}).length || 1;

  // ===========================================
  // SECTION 3.1 - Commercial Composition
  // ===========================================

  const computeCommercialComposition = () => {
    if (totalPosts < 10) {
      return { hasData: false };
    }

    const labeledAds = influenceData.labeledAds || 0;
    const likelySellingUnlabeled = influenceData.possibleInfluence || 0;
    const notAds = totalPosts - labeledAds - likelySellingUnlabeled;

    // Ensure no negative values
    const notAdsCount = Math.max(0, notAds);
    const labeledAdsCount = Math.max(0, labeledAds);
    const likelySellingCount = Math.max(0, likelySellingUnlabeled);

    const total = notAdsCount + labeledAdsCount + likelySellingCount;
    if (total === 0) {
      return { hasData: false };
    }

    // Calculate percentages with rounding
    let notAdsPercent = Math.round((notAdsCount / total) * 100);
    let labeledAdsPercent = Math.round((labeledAdsCount / total) * 100);
    let likelySellingPercent = Math.round((likelySellingCount / total) * 100);

    // Ensure percentages sum to exactly 100 by adjusting largest segment
    const sum = notAdsPercent + labeledAdsPercent + likelySellingPercent;
    if (sum !== 100) {
      const diff = 100 - sum;
      if (notAdsCount >= labeledAdsCount && notAdsCount >= likelySellingCount) {
        notAdsPercent += diff;
      } else if (labeledAdsCount >= likelySellingCount) {
        labeledAdsPercent += diff;
      } else {
        likelySellingPercent += diff;
      }
    }

    return {
      hasData: true,
      segments: [
        { label: 'Not ads', percentage: notAdsPercent, count: notAdsCount, color: '#94A3B8' },
        { label: 'Ads clearly labeled as ads', percentage: labeledAdsPercent, count: labeledAdsCount, color: '#2563EB' },
        { label: 'Likely selling, not labeled as an ad', percentage: likelySellingPercent, count: likelySellingCount, color: '#F59E0B' },
      ],
    };
  };

  const commercialComposition = computeCommercialComposition();

  // ===========================================
  // SECTION 3.2 - Top Advertised Companies
  // ===========================================

  const computeTopAdvertisers = () => {
    const labeledAdsCount = influenceData.labeledAds || 0;

    if (labeledAdsCount === 0) {
      return { hasData: false, labeledAdsCount: 0 };
    }

    // Collect advertisers from all scans
    const advertiserCounts = {};

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        if (item.is_ad) {
          const advertiserName = item.ad_metadata?.advertiser_name || 'Unknown advertiser';
          advertiserCounts[advertiserName] = (advertiserCounts[advertiserName] || 0) + 1;
        }
      }
    }

    // Sort by count and take top 3-5
    const sortedAdvertisers = Object.entries(advertiserCounts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / labeledAdsCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      hasData: sortedAdvertisers.length > 0,
      advertisers: sortedAdvertisers,
      labeledAdsCount,
    };
  };

  const topAdvertisers = computeTopAdvertisers();

  // ===========================================
  // SECTION 3.3 - Top Advertised Product Types
  // ===========================================

  const computeTopProductTypes = () => {
    const labeledAdsCount = influenceData.labeledAds || 0;

    if (labeledAdsCount === 0) {
      return { hasData: false, labeledAdsCount: 0 };
    }

    // Collect product/theme information from labeled ads
    const themeCounts = {};
    const themeAdvertisers = {}; // Track advertisers per theme for examples

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        if (item.is_ad) {
          // Try to get theme/category from topics or ad_metadata
          const theme = item.topics?.primary_category ||
                       item.ad_metadata?.product_or_service ||
                       null;

          if (theme && theme.toLowerCase() !== 'unknown' && theme.toLowerCase() !== 'other') {
            themeCounts[theme] = (themeCounts[theme] || 0) + 1;

            // Track advertiser for examples
            const advertiser = item.ad_metadata?.advertiser_name;
            if (advertiser && advertiser !== 'Unknown advertiser') {
              if (!themeAdvertisers[theme]) {
                themeAdvertisers[theme] = new Set();
              }
              themeAdvertisers[theme].add(advertiser);
            }
          }
        }
      }
    }

    // Check if we have enough themes to display
    if (Object.keys(themeCounts).length === 0) {
      return { hasData: false, labeledAdsCount };
    }

    // Sort by count and take top 3-5
    const sortedThemes = Object.entries(themeCounts)
      .map(([theme, count]) => ({
        theme,
        count,
        percent: Math.round((count / labeledAdsCount) * 100),
        examples: themeAdvertisers[theme] ? Array.from(themeAdvertisers[theme]).slice(0, 2) : [],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      hasData: sortedThemes.length > 0,
      themes: sortedThemes,
      labeledAdsCount,
    };
  };

  const topProductTypes = computeTopProductTypes();

  // ===========================================
  // SECTION 3.4 - Unlabeled Promotional Content
  // ===========================================

  const computeUnlabeledPromo = () => {
    const unlabeledPromoCount = influenceData.possibleInfluence || 0;

    if (unlabeledPromoCount === 0) {
      return { hasData: false };
    }

    const promoPercent = Math.round((unlabeledPromoCount / totalPosts) * 100);

    // Get trigger breakdown from influence data
    const triggers = [];
    if (influenceData.topSignals && Array.isArray(influenceData.topSignals)) {
      for (const signal of influenceData.topSignals.slice(0, 5)) {
        triggers.push({
          name: signal.signal || 'Unknown trigger',
          count: signal.count || 0,
        });
      }
    }

    // Get example handles from flagged items
    const exampleHandles = [];
    if (influenceData.examples && Array.isArray(influenceData.examples)) {
      for (const example of influenceData.examples.slice(0, 5)) {
        const handle = example.creator?.handle || example.account?.username || example.creator?.name;
        if (handle) {
          exampleHandles.push(`@${handle.toLowerCase()}`);
        }
      }
    }

    return {
      hasData: true,
      promoPercent,
      unlabeledPromoCount,
      triggers,
      exampleHandles,
    };
  };

  const unlabeledPromo = computeUnlabeledPromo();

  // ===========================================
  // SECTION 3.5 - Tone Split: Selling vs Not Selling
  // ===========================================

  const computeToneSplit = () => {
    const labeledAds = influenceData.labeledAds || 0;
    const unlabeledPromo = influenceData.possibleInfluence || 0;
    const sellingCount = labeledAds + unlabeledPromo;
    const notSellingCount = totalPosts - sellingCount;

    // Collect tone data for each group
    const sellingTones = { positive: 0, neutral: 0, negative: 0 };
    const notSellingTones = { positive: 0, neutral: 0, negative: 0 };

    // Track which posts are selling
    const sellingPostKeys = new Set();

    // First pass: identify selling posts
    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const postKey = `${scan.id}-${item.position_in_feed}`;

        // Check if this is a selling post (labeled ad or has influence signals)
        const isSelling = item.is_ad || (item.influenceSignals && item.influenceSignals.length > 0);

        if (isSelling) {
          sellingPostKeys.add(postKey);
        }
      }
    }

    // Second pass: aggregate tones
    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const postKey = `${scan.id}-${item.position_in_feed}`;
        const valence = item.wellbeing?.valence;

        // Only count known valences (positive, neutral, negative)
        if (valence === 'positive' || valence === 'POSITIVE') {
          if (sellingPostKeys.has(postKey)) {
            sellingTones.positive++;
          } else {
            notSellingTones.positive++;
          }
        } else if (valence === 'neutral' || valence === 'NEUTRAL') {
          if (sellingPostKeys.has(postKey)) {
            sellingTones.neutral++;
          } else {
            notSellingTones.neutral++;
          }
        } else if (valence === 'negative' || valence === 'NEGATIVE') {
          if (sellingPostKeys.has(postKey)) {
            sellingTones.negative++;
          } else {
            notSellingTones.negative++;
          }
        }
      }
    }

    const sellingKnownValenceTotal = sellingTones.positive + sellingTones.neutral + sellingTones.negative;
    const notSellingKnownValenceTotal = notSellingTones.positive + notSellingTones.neutral + notSellingTones.negative;

    // Conservative threshold: both groups must have at least 10 posts with known valence
    if (sellingKnownValenceTotal < 10 || notSellingKnownValenceTotal < 10) {
      return { hasData: false };
    }

    // Calculate percentages for selling group
    let sellingPosPercent = Math.round((sellingTones.positive / sellingKnownValenceTotal) * 100);
    let sellingNeutPercent = Math.round((sellingTones.neutral / sellingKnownValenceTotal) * 100);
    let sellingNegPercent = Math.round((sellingTones.negative / sellingKnownValenceTotal) * 100);

    // Ensure selling percentages sum to 100
    let sellingSum = sellingPosPercent + sellingNeutPercent + sellingNegPercent;
    if (sellingSum !== 100) {
      const diff = 100 - sellingSum;
      if (sellingTones.positive >= sellingTones.neutral && sellingTones.positive >= sellingTones.negative) {
        sellingPosPercent += diff;
      } else if (sellingTones.neutral >= sellingTones.negative) {
        sellingNeutPercent += diff;
      } else {
        sellingNegPercent += diff;
      }
    }

    // Calculate percentages for not selling group
    let notSellingPosPercent = Math.round((notSellingTones.positive / notSellingKnownValenceTotal) * 100);
    let notSellingNeutPercent = Math.round((notSellingTones.neutral / notSellingKnownValenceTotal) * 100);
    let notSellingNegPercent = Math.round((notSellingTones.negative / notSellingKnownValenceTotal) * 100);

    // Ensure not selling percentages sum to 100
    let notSellingSum = notSellingPosPercent + notSellingNeutPercent + notSellingNegPercent;
    if (notSellingSum !== 100) {
      const diff = 100 - notSellingSum;
      if (notSellingTones.positive >= notSellingTones.neutral && notSellingTones.positive >= notSellingTones.negative) {
        notSellingPosPercent += diff;
      } else if (notSellingTones.neutral >= notSellingTones.negative) {
        notSellingNeutPercent += diff;
      } else {
        notSellingNegPercent += diff;
      }
    }

    return {
      hasData: true,
      selling: {
        segments: [
          { label: 'Positive or happy tone', percentage: sellingPosPercent, count: sellingTones.positive, color: '#86EFAC' },
          { label: 'Neutral or balanced tone', percentage: sellingNeutPercent, count: sellingTones.neutral, color: '#CBD5E1' },
          { label: 'Negative or outrage tone', percentage: sellingNegPercent, count: sellingTones.negative, color: '#FCA5A5' },
        ],
        totalKnownValence: sellingKnownValenceTotal,
      },
      notSelling: {
        segments: [
          { label: 'Positive or happy tone', percentage: notSellingPosPercent, count: notSellingTones.positive, color: '#86EFAC' },
          { label: 'Neutral or balanced tone', percentage: notSellingNeutPercent, count: notSellingTones.neutral, color: '#CBD5E1' },
          { label: 'Negative or outrage tone', percentage: notSellingNegPercent, count: notSellingTones.negative, color: '#FCA5A5' },
        ],
        totalKnownValence: notSellingKnownValenceTotal,
      },
    };
  };

  const toneSplit = computeToneSplit();

  // ===========================================
  // BUILD INSIGHT HERO
  // ===========================================

  const hero = buildAdsHero({
    commercialComposition,
    totalPosts,
    platformCount,
  });

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="space-y-8">
      {/* Insight Hero */}
      <InsightHero {...hero} />

      {/* Trends CTA */}
      <TrendsCTA
        onClick={() => onOpenTrends({ tab: 'ads', placement: 'hero_trends' })}
        isPlusUser={isPlusUser}
      />

      {/* Trends Panel (Plus users only) */}
      {showTrendsPanel && (
        <TrendsStubPanel
          scanCount={scans.length}
          onClose={onCloseTrendsPanel}
        />
      )}

      {/* Section 3.1 - Commercial Composition */}
      <section>
        <SectionHeader>Commercial composition</SectionHeader>

        {commercialComposition.hasData ? (
          <>
            <CompositionBar100WithCounts segments={commercialComposition.segments} />
            <p className="text-xs text-slate-500 italic mt-2">Each segment shows what percentage of posts fall into that category.</p>
            <div className="mt-3">
              <DenominatorLine text={`Percent of posts in the selected date range (${totalPosts} posts)`} />
            </div>
          </>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              Not enough posts in this window.
            </p>
          </div>
        )}
      </section>

      {/* Section 3.2 - Top Advertised Companies */}
      <section>
        <SectionHeader>Top advertised companies</SectionHeader>

        {topAdvertisers.hasData ? (
          <>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Advertiser</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">% of labeled ads</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topAdvertisers.advertisers.map((advertiser, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-3 text-sm text-slate-800">{advertiser.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-right">{advertiser.percent}%</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-right">{advertiser.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <DenominatorLine text={`Percent of labeled ads (${topAdvertisers.labeledAdsCount} ads)`} />
            </div>
          </>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              No labeled ads were detected in this window.
            </p>
          </div>
        )}
      </section>

      {/* Section 3.3 - Top Advertised Product Types */}
      <section>
        <SectionHeader>Top advertised product types</SectionHeader>

        {topProductTypes.hasData ? (
          <>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Theme</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">% of labeled ads</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Examples</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductTypes.themes.map((theme, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-3 text-sm text-slate-800">{theme.theme}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-right">{theme.percent}%</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {theme.examples.length > 0 ? theme.examples.join(', ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <DenominatorLine text={`Percent of labeled ads (${topProductTypes.labeledAdsCount} ads)`} />
            </div>
          </>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              Ads in this window did not repeat strongly enough to form clear themes.
            </p>
          </div>
        )}
      </section>

      {/* Section 3.4 - Unlabeled Promotional Content */}
      <section>
        <SectionHeader>Unlabeled promotional content</SectionHeader>

        {unlabeledPromo.hasData ? (
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div>
              <div className="text-3xl font-bold text-slate-900">{unlabeledPromo.promoPercent}%</div>
              <div className="text-sm text-slate-600 mt-1">
                {unlabeledPromo.unlabeledPromoCount} posts flagged (unlabeled only)
              </div>
            </div>

            {unlabeledPromo.triggers.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-600 mb-2">Top triggers:</div>
                <div className="space-y-1">
                  {unlabeledPromo.triggers.map((trigger, idx) => (
                    <div key={idx} className="text-sm text-slate-700">
                      {trigger.name} ({trigger.count})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unlabeledPromo.exampleHandles.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-600 mb-2">Example accounts:</div>
                <div className="text-sm text-slate-700">
                  {unlabeledPromo.exampleHandles.join(', ')}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              No unlabeled promotional posts were detected in the selected date range.
            </p>
          </div>
        )}
      </section>

      {/* Section 3.5 - Tone Split: Selling vs Not Selling */}
      {toneSplit.hasData && (
        <section>
          <SectionHeader>Tone split: selling vs not selling</SectionHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Selling posts */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-medium text-slate-700">Selling posts</h3>
                <CompositionBar100WithCounts segments={toneSplit.selling.segments} />
                <DenominatorLine text={`Percent of posts in this group (${toneSplit.selling.totalKnownValence} selling)`} />
              </div>

              {/* Not selling posts */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-medium text-slate-700">Not selling posts</h3>
                <CompositionBar100WithCounts segments={toneSplit.notSelling.segments} />
                <DenominatorLine text={`Percent of posts in this group (${toneSplit.notSelling.totalKnownValence} not selling)`} />
              </div>
            </div>
            <p className="text-xs text-slate-500 italic">Compares emotional tone between commercial and non-commercial content in your feed.</p>
          </div>
        </section>
      )}

      {/* Section 3.6 - Master Numbers Line */}
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

export default AdsTab;
