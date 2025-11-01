import { getAllSamples, getSamplesByPlatform, Platform, SampleItem } from '../db';

export interface PoliticalSplit {
  left: number;
  neutral: number;
  right: number;
  total: number;
  leftPercent: number;
  neutralPercent: number;
  rightPercent: number;
}

export interface PoliticalDistribution {
  left: number;
  neutral: number;
  right: number;
  totalPolitical: number;
}

export async function getPoliticalSplit(overall = true): Promise<Record<string, PoliticalSplit>> {
  const platforms: Platform[] = ['x', 'instagram', 'tiktok', 'youtube', 'facebook', 'reddit'];
  const result: Record<string, PoliticalSplit> = {};

  if (overall) {
    const allItems = await getAllSamples();
    result['overall'] = calculatePoliticalSplit(allItems);
  } else {
    for (const platform of platforms) {
      const items = await getSamplesByPlatform(platform);
      result[platform] = calculatePoliticalSplit(items);
    }
  }

  return result;
}

export async function calculatePoliticalDistribution(platform?: Platform): Promise<PoliticalDistribution> {
  const items = platform ? await getSamplesByPlatform(platform) : await getAllSamples();

  let left = 0;
  let neutral = 0;
  let right = 0;
  let totalPolitical = 0;

  for (const item of items) {
    if (!item.political) continue;
    totalPolitical++;
    if (item.political === 'left') left++;
    else if (item.political === 'right') right++;
    else if (item.political === 'neutral') neutral++;
  }

  const leftPercent = totalPolitical > 0 ? Math.round((left / totalPolitical) * 100) : 0;
  const neutralPercent = totalPolitical > 0 ? Math.round((neutral / totalPolitical) * 100) : 0;
  const rightPercent = totalPolitical > 0 ? Math.round((right / totalPolitical) * 100) : 0;

  return {
    left: leftPercent,
    neutral: neutralPercent,
    right: rightPercent,
    totalPolitical
  };
}

function calculatePoliticalSplit(items: SampleItem[]): PoliticalSplit {
  let left = 0;
  let neutral = 0;
  let right = 0;
  let total = 0;

  for (const item of items) {
    if (!item.political) continue;
    total++;
    if (item.political === 'left') left++;
    else if (item.political === 'right') right++;
    else if (item.political === 'neutral') neutral++;
  }

  const leftPercent = total > 0 ? Math.round((left / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;
  const rightPercent = total > 0 ? Math.round((right / total) * 100) : 0;

  return {
    left,
    neutral,
    right,
    total,
    leftPercent,
    neutralPercent,
    rightPercent
  };
}
