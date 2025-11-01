import { getAllSamples, getSamplesByPlatform, Platform, SampleItem } from '../db';

export interface DiversityStat {
  uniqueSources: number;
  total: number;
  topSourceShare: number;
  topSource: string;
  diversityPercent: number;
}

export interface DiversityMetrics {
  uniqueSourceRatio: number;
  topSourceConcentration: number;
  topSource: string;
  uniqueSources: number;
  totalItems: number;
}

export async function getDiversityByPlatform(): Promise<Record<Platform, DiversityStat>> {
  const platforms: Platform[] = ['x', 'instagram', 'tiktok', 'youtube', 'facebook', 'reddit'];
  const result: Record<string, DiversityStat> = {} as Record<Platform, DiversityStat>;

  for (const platform of platforms) {
    const items = await getSamplesByPlatform(platform);
    result[platform] = calculateDiversity(items);
  }

  return result as Record<Platform, DiversityStat>;
}

export async function calculateDiversityMetrics(platform?: Platform): Promise<DiversityMetrics> {
  const items = platform ? await getSamplesByPlatform(platform) : await getAllSamples();

  const sourceCounts: Record<string, number> = {};
  for (const item of items) {
    const source = item.author || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  }

  const uniqueSources = Object.keys(sourceCounts).length;
  const totalItems = items.length;
  const uniqueSourceRatio = totalItems > 0 ? uniqueSources / totalItems : 0;

  const counts = Object.values(sourceCounts);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;
  const topSource = Object.entries(sourceCounts).find(([_, count]) => count === maxCount)?.[0] || 'unknown';
  const topSourceConcentration = totalItems > 0 ? maxCount / totalItems : 0;

  return {
    uniqueSourceRatio,
    topSourceConcentration,
    topSource,
    uniqueSources,
    totalItems
  };
}

function calculateDiversity(items: SampleItem[]): DiversityStat {
  const sourceCounts: Record<string, number> = {};
  let total = 0;

  for (const item of items) {
    total++;
    const source = item.author || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  }

  const uniqueSources = Object.keys(sourceCounts).length;
  const counts = Object.values(sourceCounts);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;
  const topSource = Object.entries(sourceCounts).find(([_, count]) => count === maxCount)?.[0] || 'unknown';
  const topSourceShare = total > 0 ? Math.round((maxCount / total) * 100) : 0;
  const diversityPercent = total > 0 ? Math.round((uniqueSources / total) * 100) : 0;

  return {
    uniqueSources,
    total,
    topSourceShare,
    topSource,
    diversityPercent: Math.min(100, diversityPercent * 2) // Scale up for visibility
  };
}
