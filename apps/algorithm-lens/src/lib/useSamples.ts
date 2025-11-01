import { useMemo } from 'react';
import { useDataStore, Platform } from './db';

export interface SampleCounts {
  x: number;
  instagram: number;
  tiktok: number;
  youtube: number;
  facebook: number;
  reddit: number;
  total: number;
}

export function useSamples() {
  const items = useDataStore((state) => state.items);

  const counts = useMemo<SampleCounts>(() => {
    const newCounts: SampleCounts = {
      x: 0,
      instagram: 0,
      tiktok: 0,
      youtube: 0,
      facebook: 0,
      reddit: 0,
      total: items.length
    };

    items.forEach((item) => {
      if (item.platform in newCounts) {
        newCounts[item.platform as Platform]++;
      }
    });

    return newCounts;
  }, [items]);

  const refresh = () => {
    // No-op since Zustand store is reactive
    // The counts will update automatically when items change
  };

  return { counts, loading: false, refresh };
}

export async function clearAllSamplesFromDB() {
  useDataStore.getState().clearAll();
}
