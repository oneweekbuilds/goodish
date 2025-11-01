import { getAllSamples } from '../db';

export interface ToneStat {
  tone: string;
  count: number;
  percentage: number;
  color: string;
  emoji: string;
}

export interface ToneBreakdown {
  analytical: number;
  empathetic: number;
  calm: number;
  emotional: number;
  outrage: number;
  totalTagged: number;
}

export async function getToneDistribution(): Promise<ToneStat[]> {
  const items = await getAllSamples();

  const toneCounts: Record<string, number> = {
    analytical: 0,
    empathetic: 0,
    calm: 0,
    emotional: 0,
    outrage: 0
  };

  let total = 0;

  for (const item of items) {
    if (!item.tone) continue;
    total++;
    toneCounts[item.tone]++;
  }

  const toneMap: Record<string, { color: string; emoji: string; order: number }> = {
    analytical: { color: '#3B82F6', emoji: '🧠', order: 1 },
    empathetic: { color: '#10B981', emoji: '💚', order: 2 },
    calm: { color: '#8B5CF6', emoji: '😌', order: 3 },
    emotional: { color: '#F59E0B', emoji: '😢', order: 4 },
    outrage: { color: '#EF4444', emoji: '😡', order: 5 }
  };

  const result = Object.entries(toneCounts)
    .map(([tone, count]) => ({
      tone: tone.charAt(0).toUpperCase() + tone.slice(1),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: toneMap[tone]?.color || '#6B7280',
      emoji: toneMap[tone]?.emoji || '📊',
      order: toneMap[tone]?.order || 99
    }))
    .sort((a, b) => a.order - b.order);

  return result;
}

export async function calculateToneBreakdown(): Promise<ToneBreakdown> {
  const items = await getAllSamples();

  const toneCounts: Record<string, number> = {
    analytical: 0,
    empathetic: 0,
    calm: 0,
    emotional: 0,
    outrage: 0
  };

  let totalTagged = 0;

  for (const item of items) {
    if (!item.tone) continue;
    totalTagged++;
    toneCounts[item.tone]++;
  }

  return {
    analytical: totalTagged > 0 ? Math.round((toneCounts.analytical / totalTagged) * 100) : 0,
    empathetic: totalTagged > 0 ? Math.round((toneCounts.empathetic / totalTagged) * 100) : 0,
    calm: totalTagged > 0 ? Math.round((toneCounts.calm / totalTagged) * 100) : 0,
    emotional: totalTagged > 0 ? Math.round((toneCounts.emotional / totalTagged) * 100) : 0,
    outrage: totalTagged > 0 ? Math.round((toneCounts.outrage / totalTagged) * 100) : 0,
    totalTagged
  };
}
