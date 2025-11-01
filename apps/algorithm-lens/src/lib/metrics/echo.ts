import { getAllSamples, getSamplesByPlatform, Platform } from '../db';

export interface EchoScore {
  score: number;
  sourceConcentration: number;
  topicDiversity: number;
  band: 'diverse' | 'mixed' | 'narrow';
}

export async function calculateEchoScore(platform?: Platform): Promise<EchoScore> {
  const items = platform ? await getSamplesByPlatform(platform) : await getAllSamples();

  // Calculate source concentration
  const sourceCounts: Record<string, number> = {};
  for (const item of items) {
    const source = item.author || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  }

  const maxSourceCount = Math.max(0, ...Object.values(sourceCounts));
  const sourceConcentration = items.length > 0 ? maxSourceCount / items.length : 0;

  // Calculate topic diversity
  const allTopics = items.flatMap(item => item.topicTags || []);
  const uniqueTopics = new Set(allTopics).size;
  const topicDiversity = allTopics.length > 0 ? uniqueTopics / allTopics.length : 0;

  // Compute final score
  // Higher source concentration and lower topic diversity = higher echo score
  const rawScore = 0.6 * sourceConcentration + 0.4 * (1 - topicDiversity);
  const score = Math.round(rawScore * 100);

  // Determine band
  let band: 'diverse' | 'mixed' | 'narrow';
  if (score <= 40) band = 'diverse';
  else if (score <= 70) band = 'mixed';
  else band = 'narrow';

  return {
    score,
    sourceConcentration: Math.round(sourceConcentration * 100),
    topicDiversity: Math.round(topicDiversity * 100),
    band
  };
}

export async function calculateEchoScoreByPlatform(): Promise<Record<Platform, EchoScore>> {
  const platforms: Platform[] = ['x', 'instagram', 'tiktok', 'youtube', 'facebook', 'reddit'];
  const result: Record<string, EchoScore> = {};

  for (const platform of platforms) {
    result[platform] = await calculateEchoScore(platform);
  }

  return result as Record<Platform, EchoScore>;
}
