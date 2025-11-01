export interface Suggestion {
  id: string;
  title: string;
  why: string;
  cta: string;
  action: 'opposingViews' | 'adPreferences' | 'outrageReduction' | 'tracking';
}

export interface MetricsInput {
  echo: number;
  topAds: { category: string; share: number }[];
  tone: Record<string, number>;
}

export function buildSuggestions(metrics: MetricsInput): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Echo chamber suggestion
  if (metrics.echo >= 71) {
    suggestions.push({
      id: 'opposing-views',
      title: 'Follow opposite-view creators',
      why: `Your echo score is ${metrics.echo} (narrow). Adding 5 diverse sources can reduce it within a week.`,
      cta: 'See recommended sources',
      action: 'opposingViews'
    });
  }

  // Ad targeting suggestion
  const topCategory = metrics.topAds[0];
  if (topCategory && topCategory.share >= 40) {
    suggestions.push({
      id: 'ad-preferences',
      title: 'Adjust ad preferences',
      why: `${topCategory.share}% of ads target ${topCategory.category} themes.`,
      cta: 'Open step-by-step guide',
      action: 'adPreferences'
    });
  }

  // Outrage content suggestion
  const outragePercent = metrics.tone['outrage'] || metrics.tone['Outrage'] || 0;
  if (outragePercent >= 30) {
    suggestions.push({
      id: 'outrage-reduction',
      title: 'Reduce outrage content',
      why: `Outrage tone detected at ${outragePercent}%.`,
      cta: 'Get practical tips',
      action: 'outrageReduction'
    });
  }

  // Always offer tracking
  suggestions.push({
    id: 'tracking',
    title: 'Track changes over time',
    why: 'Monitor how your algorithmic environment evolves.',
    cta: 'Set up tracking',
    action: 'tracking'
  });

  return suggestions;
}
