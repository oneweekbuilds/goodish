// Ad Intent Metric - detects commercial intent in non-promoted content
// Identifies subtle advertising, affiliate links, and sponsored-like content

import type { NormalizedItem, ItemFeatures } from '../../types/content';
import type { MetricBase } from '../../types/metrics';
import { detectBrands } from '../rules/brands.dictionary';

export interface AdIntentMetric extends MetricBase {
  metric: 'ad_intent';
  value: {
    explicitAdRatio: number; // % flagged as ads
    implicitAdRatio: number; // % with commercial signals but not flagged
    totalCommercialRatio: number; // explicit + implicit
    affiliateLinkRatio: number; // % with affiliate/tracking links
    undisclosedSponsorshipScore: number; // 0-100, likelihood of hidden sponsorship
  };
}

export function calculateAdIntent(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): AdIntentMetric {
  if (items.length === 0) {
    return createEmptyMetric();
  }

  const explicitAds = items.filter(i => i.item.isPromoted);
  const explicitAdRatio = explicitAds.length / items.length;

  // Detect implicit ads: not flagged as promoted but has commercial signals
  const commercialPatterns = [
    /affiliate/i,
    /sponsored/i,
    /ad[:\s]/i,
    /\bpr\b/i, // PR/public relations
    /discount code/i,
    /promo code/i,
    /link in bio/i,
    /swipe up/i,
    /shop now/i,
    /buy now/i,
    /limited time/i,
    /use code/i,
    /#ad\b/,
    /#sponsored\b/,
    /#partner\b/
  ];

  const trackingDomains = ['amzn.to', 'bit.ly', 'geni.us', 'go.skimresources.com', 'shareasale.com', 'avantlink.com'];

  let implicitAdCount = 0;
  let affiliateLinkCount = 0;

  for (const { item, features } of items) {
    if (item.isPromoted) continue; // Skip explicit ads

    let hasCommercialSignals = false;

    // Check for commercial language
    for (const pattern of commercialPatterns) {
      if (pattern.test(item.text)) {
        hasCommercialSignals = true;
        break;
      }
    }

    // Check for brand mentions + CTA
    if (features.brands.length > 0 && /check out|try|recommend|love/i.test(item.text)) {
      hasCommercialSignals = true;
    }

    // Check for affiliate links
    const hasAffiliateLink = item.urls.some(url =>
      trackingDomains.some(domain => url.includes(domain))
    );

    if (hasAffiliateLink) {
      affiliateLinkCount++;
      hasCommercialSignals = true;
    }

    if (hasCommercialSignals) {
      implicitAdCount++;
    }
  }

  const implicitAdRatio = implicitAdCount / items.length;
  const affiliateLinkRatio = affiliateLinkCount / items.length;
  const totalCommercialRatio = explicitAdRatio + implicitAdRatio;

  // Undisclosed sponsorship score
  let undisclosedScore = 0;
  if (implicitAdRatio > 0.2) undisclosedScore += 40;
  else if (implicitAdRatio > 0.1) undisclosedScore += 20;

  if (affiliateLinkRatio > 0.15) undisclosedScore += 35;
  else if (affiliateLinkRatio > 0.05) undisclosedScore += 15;

  if (implicitAdRatio > explicitAdRatio && implicitAdRatio > 0.1) {
    undisclosedScore += 25; // More implicit than explicit = suspicious
  }

  undisclosedScore = Math.min(100, undisclosedScore);

  const explanation = `${Math.round(explicitAdRatio * 100)}% explicit ads, ${Math.round(implicitAdRatio * 100)}% implicit commercial content (total: ${Math.round(totalCommercialRatio * 100)}%). ${Math.round(affiliateLinkRatio * 100)}% contain affiliate links. ${undisclosedScore > 60 ? 'High likelihood of undisclosed sponsorships.' : undisclosedScore > 30 ? 'Some undisclosed commercial content detected.' : 'Most commercial content appears properly disclosed.'}`;

  const { status, issues } = undisclosedScore > 70 ?
    { status: 'warning' as const, issues: ['High undisclosed sponsorship risk detected'] } :
    { status: 'ok' as const, issues: [] };

  return {
    metric: 'ad_intent',
    key: 'ad_intent',
    value: {
      explicitAdRatio: Math.round(explicitAdRatio * 100) / 100,
      implicitAdRatio: Math.round(implicitAdRatio * 100) / 100,
      totalCommercialRatio: Math.round(totalCommercialRatio * 100) / 100,
      affiliateLinkRatio: Math.round(affiliateLinkRatio * 100) / 100,
      undisclosedSponsorshipScore: Math.round(undisclosedScore)
    },
    unit: '%',
    confidence: Math.min(items.length / 50, 1.0),
    explanation,
    topSignals: [
      `${Math.round(explicitAdRatio * 100)}% explicit, ${Math.round(implicitAdRatio * 100)}% implicit ads`,
      `${Math.round(affiliateLinkRatio * 100)}% affiliate links`,
      `Undisclosed risk: ${Math.round(undisclosedScore)}/100`
    ],
    examples: [],
    status,
    issues
  };
}

function createEmptyMetric(): AdIntentMetric {
  return {
    metric: 'ad_intent',
    key: 'ad_intent',
    value: {
      explicitAdRatio: 0,
      implicitAdRatio: 0,
      totalCommercialRatio: 0,
      affiliateLinkRatio: 0,
      undisclosedSponsorshipScore: 0
    },
    unit: '%',
    confidence: 0,
    explanation: 'No data available.',
    topSignals: [],
    examples: [],
    status: 'error',
    issues: ['No items provided']
  };
}
