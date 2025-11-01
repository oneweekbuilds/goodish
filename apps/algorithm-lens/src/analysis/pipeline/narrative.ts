// Narrative Generator - creates human-readable explanations of algorithmic patterns
// Tells the story of what algorithms think about the user

import type { MetricBundle } from '../../types/metrics';
import type { AggregatedMetrics } from './aggregation';

export interface Narrative {
  headline: string;
  summary: string;
  sections: NarrativeSection[];
  conclusion: string;
}

export interface NarrativeSection {
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * Generate narrative explanation of analysis
 * @param metrics - Calculated metrics
 * @param aggregated - Aggregated summary
 * @returns Human-readable narrative
 */
export function generateNarrative(
  metrics: MetricBundle,
  aggregated: AggregatedMetrics
): Narrative {
  const sections: NarrativeSection[] = [];

  // Generate headline based on overall health
  const headline = generateHeadline(aggregated.overallHealth, aggregated.criticalIssues);

  // Generate summary
  const summary = generateSummary(metrics, aggregated);

  // Generate sections for each metric domain
  if (metrics.echoChamber || metrics.topicDiversity) {
    sections.push(generateInformationDietSection(metrics));
  }

  if (metrics.politicalLean) {
    sections.push(generatePoliticalSection(metrics.politicalLean));
  }

  if (metrics.emotionTone || metrics.sentimentBalance) {
    sections.push(generateEmotionalSection(metrics));
  }

  if (metrics.productAffinity || metrics.adIntent) {
    sections.push(generateCommercialSection(metrics));
  }

  if (metrics.influenceBias) {
    sections.push(generateInfluenceSection(metrics.influenceBias));
  }

  if (metrics.misinfoRisk) {
    sections.push(generateCredibilitySection(metrics.misinfoRisk));
  }

  if (metrics.platformContrast) {
    sections.push(generatePlatformSection(metrics.platformContrast));
  }

  // Generate conclusion
  const conclusion = generateConclusion(aggregated);

  return {
    headline,
    summary,
    sections,
    conclusion
  };
}

function generateHeadline(healthScore: number, criticalIssues: string[]): string {
  if (criticalIssues.length > 0) {
    return `⚠️ Your Feed Has ${criticalIssues.length} Critical Issue${criticalIssues.length > 1 ? 's' : ''}`;
  }

  if (healthScore >= 85) {
    return '✅ Your Feed Shows Excellent Health & Diversity';
  } else if (healthScore >= 70) {
    return '👍 Your Feed Is Generally Healthy';
  } else if (healthScore >= 55) {
    return '⚡ Your Feed Needs Some Attention';
  } else if (healthScore >= 40) {
    return '⚠️ Your Feed Shows Concerning Patterns';
  } else {
    return '🚨 Your Feed Has Serious Issues';
  }
}

function generateSummary(metrics: MetricBundle, aggregated: AggregatedMetrics): string {
  let summary = `Analysis complete. Overall health score: ${aggregated.overallHealth}/100. `;

  const categories = aggregated.categories;
  if (categories) {
    const scores = [
      `Information Diet: ${categories.informationDiet.label}`,
      `Emotional Wellbeing: ${categories.emotionalWellbeing.label}`,
      `Commercial Exposure: ${categories.commercialExposure.label}`,
      `Source Credibility: ${categories.sourceCredibility.label}`
    ];
    summary += scores.join(', ') + '. ';
  }

  if (aggregated.criticalIssues.length > 0) {
    summary += `Critical concerns detected: ${aggregated.criticalIssues[0]}`;
  }

  return summary;
}

function generateInformationDietSection(metrics: MetricBundle): NarrativeSection {
  const echoScore = metrics.echoChamber?.value.score || 0;
  const topicScore = metrics.topicDiversity?.value.diversityScore || 0;

  let content = '';
  let severity: 'info' | 'warning' | 'critical' = 'info';

  if (echoScore > 70 || topicScore < 30) {
    severity = 'critical';
    content = `**Echo Chamber Detected**: You're in a filter bubble with limited information diversity. `;
    content += `Echo score: ${echoScore}/100, Topic diversity: ${topicScore}/100. `;
    content += `\n\nAlgorithms are showing you similar content from similar sources repeatedly. This limits exposure to new ideas and perspectives. `;
    content += `Consider following accounts outside your usual interests and from different viewpoints.`;
  } else if (echoScore > 50 || topicScore < 50) {
    severity = 'warning';
    content = `**Moderate Echo Effect**: Your feed has some repetition and concentration. `;
    content += `Echo score: ${echoScore}/100, Topic diversity: ${topicScore}/100. `;
    content += `\n\nWhile not severe, there's room to expand your information sources. Try adding 5-10 accounts in new topic areas.`;
  } else {
    content = `**Healthy Diversity**: Your feed shows good variety in sources and topics. `;
    content += `Echo score: ${echoScore}/100, Topic diversity: ${topicScore}/100. `;
    content += `\n\nYou're being exposed to a broad range of content, which helps maintain a balanced perspective.`;
  }

  return {
    title: 'Information Diet',
    content,
    severity
  };
}

function generatePoliticalSection(metric: any): NarrativeSection {
  const leanScore = metric.value.leanScore;
  const label = metric.value.label;
  const partisanship = metric.value.partisanshipIndex;

  let content = `**Political Profile**: ${label} `;
  content += `(score: ${leanScore}, partisanship: ${partisanship}/100)\n\n`;

  let severity: 'info' | 'warning' | 'critical' = 'info';

  if (Math.abs(leanScore) > 70 || partisanship > 75) {
    severity = 'warning';
    content += `Algorithms have classified you as strongly ${leanScore < 0 ? 'left' : 'right'}-leaning. `;
    content += `High partisanship (${partisanship}/100) suggests exposure to opinion-driven content rather than balanced news. `;
    content += `\n\n**Recommendation**: Add centrist news sources and fact-checking organizations to your follows.`;
  } else if (partisanship > 50) {
    severity = 'info';
    content += `Moderate political content with some partisan sources. Consider balancing with neutral journalism.`;
  } else {
    content += `Relatively balanced political exposure. Good mix of perspectives across the spectrum.`;
  }

  return {
    title: 'Political Landscape',
    content,
    severity
  };
}

function generateEmotionalSection(metrics: MetricBundle): NarrativeSection {
  const emotionMetric = metrics.emotionTone;
  const sentimentMetric = metrics.sentimentBalance;

  let content = '';
  let severity: 'info' | 'warning' | 'critical' = 'info';

  const manipulationScore = emotionMetric?.value.manipulationScore || 0;
  const negativityBias = sentimentMetric?.value.negativityBias || 0;

  if (manipulationScore > 70 || negativityBias > 70) {
    severity = 'critical';
    content = `**⚠️ Emotional Manipulation Detected**: Your feed contains content designed to trigger strong emotional responses.\n\n`;

    if (emotionMetric) {
      content += `Emotional manipulation score: ${manipulationScore}/100. `;
      content += `Dominant emotion: ${emotionMetric.value.dominantEmotion}. `;
      content += `Tone: ${emotionMetric.value.toneLabel}.\n\n`;
    }

    if (negativityBias > 70) {
      content += `High negativity bias (${negativityBias}/100) - your feed skews heavily negative, which may harm mental wellbeing.\n\n`;
    }

    content += `**This is concerning**: Platforms optimize for engagement, which often means showing outrage-inducing content. `;
    content += `Consider unfollowing accounts that consistently use fear, anger, or outrage tactics.`;

  } else if (manipulationScore > 40 || negativityBias > 40) {
    severity = 'warning';
    content = `**Mixed Emotional Content**: Some emotionally charged content present.\n\n`;
    content += `Manipulation score: ${manipulationScore}/100, Negativity bias: ${negativityBias}/100.\n\n`;
    content += `Monitor your emotional response to your feed. If you feel drained or anxious, consider a digital detox.`;

  } else {
    content = `**Balanced Emotional Tone**: Content is relatively neutral and authentic.\n\n`;
    if (emotionMetric) {
      content += `Low manipulation risk (${manipulationScore}/100). Emotional content appears genuine rather than engineered for virality.`;
    }
  }

  return {
    title: 'Emotional Landscape',
    content,
    severity
  };
}

function generateCommercialSection(metrics: MetricBundle): NarrativeSection {
  const productMetric = metrics.productAffinity;
  const adMetric = metrics.adIntent;

  let content = '';
  let severity: 'info' | 'warning' | 'critical' = 'info';

  const adRatio = productMetric?.value.adRatio || 0;
  const targeting = productMetric?.value.targetingIntensity || 0;
  const undisclosed = adMetric?.value.undisclosedSponsorshipScore || 0;

  if (adRatio > 0.4 || targeting > 70 || undisclosed > 70) {
    severity = 'critical';
    content = `**⚠️ Heavy Commercialization**: Your feed is highly monetized.\n\n`;
    content += `Commercial content: ${Math.round(adRatio * 100)}%, Targeting intensity: ${targeting}/100, Undisclosed sponsorships: ${undisclosed}/100.\n\n`;

    if (productMetric) {
      content += `**Your Consumer Profile**: ${productMetric.value.consumerProfile}\n\n`;
    }

    content += `Platforms have built a detailed commercial profile of you. Your attention is being sold to advertisers. `;
    content += `Consider using ad blockers and being skeptical of product recommendations from influencers.`;

  } else if (adRatio > 0.2 || targeting > 40) {
    severity = 'warning';
    content = `**Moderate Commercial Presence**: ${Math.round(adRatio * 100)}% of your feed is commercial.\n\n`;
    if (productMetric) {
      content += `Algorithms classify you as: ${productMetric.value.consumerProfile}. `;
    }
    content += `Be aware that many posts are designed to sell products, even without #ad disclosure.`;

  } else {
    content = `**Low Commercial Impact**: Relatively few ads (${Math.round(adRatio * 100)}%).\n\n`;
    content += `Your feed isn't heavily commercialized. Most content appears organic.`;
  }

  return {
    title: 'Commercial Influence',
    content,
    severity
  };
}

function generateInfluenceSection(metric: any): NarrativeSection {
  const amplification = metric.value.amplificationScore;
  const topAccountRatio = metric.value.topAccountRatio;

  let content = '';
  let severity: 'info' | 'warning' | 'critical' = 'info';

  if (amplification > 70) {
    severity = 'warning';
    content = `**Elite Voices Dominate**: Algorithms heavily favor high-follower accounts.\n\n`;
    content += `${Math.round(topAccountRatio * 100)}% of your feed comes from accounts with >100k followers. `;
    content += `Amplification score: ${amplification}/100.\n\n`;
    content += `You're seeing mostly celebrity/influencer content while grassroots voices are buried. `;
    content += `Consider following smaller accounts (under 10k followers) to hear diverse perspectives.`;
  } else if (amplification > 40) {
    severity = 'info';
    content = `**Moderate Influence Bias**: Mix of large and small accounts (amplification: ${amplification}/100).\n\n`;
    content += `You see content from both popular and smaller creators, which is healthy.`;
  } else {
    content = `**Balanced Voice Distribution**: Good mix of account sizes (amplification: ${amplification}/100).\n\n`;
    content += `You're hearing from a democratic range of voices, not just the loudest.`;
  }

  return {
    title: 'Voice Amplification',
    content,
    severity
  };
}

function generateCredibilitySection(metric: any): NarrativeSection {
  const riskScore = metric.value.avgRiskScore;
  const riskLevel = metric.value.overallRiskLevel;
  const flaggedSources = metric.value.flaggedSourcesCount;

  let content = '';
  let severity: 'info' | 'warning' | 'critical' = 'info';

  if (riskScore > 70) {
    severity = 'critical';
    content = `**🚨 High Misinformation Risk**: Your feed contains questionable sources.\n\n`;
    content += `Risk level: ${riskLevel} (${riskScore}/100). ${flaggedSources} known problematic sources detected.\n\n`;
    content += `**Action Required**: `;
    content += `Cross-reference claims with fact-checking sites (Snopes, FactCheck.org, PolitiFact). `;
    content += `Be extremely skeptical of sensational headlines. Verify before sharing.`;

  } else if (riskScore > 40) {
    severity = 'warning';
    content = `**Moderate Misinformation Risk**: Some questionable sources present.\n\n`;
    content += `Risk level: ${riskLevel} (${riskScore}/100). `;
    content += `${flaggedSources > 0 ? `${flaggedSources} flagged sources. ` : ''}`;
    content += `Verify important claims independently.`;

  } else {
    content = `**Low Misinformation Risk**: Sources appear mostly credible.\n\n`;
    content += `Risk level: ${riskLevel} (${riskScore}/100). `;
    content += `Your feed includes relatively trustworthy sources, but always verify important claims.`;
  }

  return {
    title: 'Source Credibility',
    content,
    severity
  };
}

function generatePlatformSection(metric: any): NarrativeSection {
  const platforms = metric.value.platforms;
  const topicDivergence = metric.value.topicDivergence;
  const sentimentDivergence = metric.value.sentimentDivergence;

  let content = `**Multi-Platform Analysis**: Content compared across ${platforms.length} platforms: ${platforms.join(', ')}.\n\n`;

  if (topicDivergence > 60 || sentimentDivergence > 60) {
    content += `**Significant Divergence Detected**: `;
    content += `Topics differ by ${topicDivergence}/100, sentiment by ${sentimentDivergence}/100.\n\n`;
    content += `Different platforms are showing you very different sides of the world. `;
    content += `This reveals how algorithms create personalized realities based on platform-specific engagement patterns.`;

    if (metric.value.mostDivergentPair) {
      content += `\n\nMost different: ${metric.value.mostDivergentPair.platform1} vs ${metric.value.mostDivergentPair.platform2}.`;
    }
  } else {
    content += `Platforms show relatively consistent content (divergence: ${topicDivergence}/100). `;
    content += `Your interests translate similarly across platforms.`;
  }

  return {
    title: 'Platform Comparison',
    content,
    severity: 'info'
  };
}

function generateConclusion(aggregated: AggregatedMetrics): string {
  const health = aggregated.overallHealth;

  let conclusion = `\n\n**Overall Assessment**: `;

  if (health >= 85) {
    conclusion += `Your algorithmic exposure is very healthy (${health}/100). `;
    conclusion += `You're seeing diverse, credible content without excessive manipulation or commercialization. `;
    conclusion += `Keep maintaining this balanced information diet.`;
  } else if (health >= 70) {
    conclusion += `Your feed is generally healthy (${health}/100) with room for improvement. `;
    conclusion += `Address the warnings above to optimize your information environment.`;
  } else if (health >= 55) {
    conclusion += `Your feed needs attention (${health}/100). `;
    conclusion += `Several concerning patterns detected. Follow the recommendations above to improve your digital wellbeing.`;
  } else if (health >= 40) {
    conclusion += `Your feed shows serious issues (${health}/100). `;
    conclusion += `Algorithms are creating an unhealthy information environment. `;
    conclusion += `Strong action recommended: diversify sources, use fact-checkers, consider platform alternatives.`;
  } else {
    conclusion += `⚠️ **Critical**: Your feed has severe problems (${health}/100). `;
    conclusion += `You're in a filter bubble with high manipulation, commercialization, or misinformation. `;
    conclusion += `Immediate action needed to restore a healthy information diet.`;
  }

  conclusion += `\n\n*Remember: Algorithms optimize for engagement, not truth or wellbeing. Take control of what you consume.*`;

  return conclusion;
}
