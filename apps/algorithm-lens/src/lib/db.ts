import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Platform = 'x' | 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'reddit';

export interface NormalizedItem {
  id: string;
  platform: Platform;
  timestamp: number;
  contentId: string;
  url?: string;
  text: string;
  topics: string[];
  creatorId?: string;
  sentiment?: 'pos' | 'neg' | 'neu';
  isAd?: boolean;
}

export interface ImportLog {
  id: string;
  platform: Platform | 'unknown';
  addedAt: number;
  label: string;
  itemsAdded: number;
  itemsSkipped: number;
  ms: number;
}

interface DataStore {
  items: NormalizedItem[];
  imports: ImportLog[];
  isPremium: boolean; // Dev-only flag for testing Premium features
  addItems: (items: NormalizedItem[]) => void;
  addImport: (log: Omit<ImportLog, 'id'>) => void;
  setPremium: (value: boolean) => void;
  clearAll: () => void;
}

// Zustand store with localStorage persistence
export const useDataStore = create<DataStore>()(
  persist(
    (set) => ({
      items: [],
      imports: [],
      isPremium: false,
      addItems: (newItems) =>
        set((state) => {
          // Deduplicate by id
          const existingIds = new Set(state.items.map((i) => i.id));
          const fresh = newItems.filter((i) => !existingIds.has(i.id));
          return {
            items: [...state.items, ...fresh],
          };
        }),
      addImport: (log) =>
        set((state) => ({
          imports: [
            {
              ...log,
              id: `import_${log.addedAt}_${Date.now()}`,
            },
            ...state.imports,
          ].slice(0, 100), // Keep last 100 imports
        })),
      setPremium: (value) => set({ isPremium: value }),
      clearAll: () => set({ items: [], imports: [] }),
    }),
    {
      name: 'algorithmlens:data:v1',
    }
  )
);

// Helper functions for accessing data
export async function getAllSamples(): Promise<NormalizedItem[]> {
  return useDataStore.getState().items;
}

export async function getSamplesByPlatform(platform: Platform): Promise<NormalizedItem[]> {
  return useDataStore.getState().items.filter((item) => item.platform === platform);
}

// Legacy Dexie-compatible API for backward compatibility
// This allows existing code to work while we migrate to Zustand
export const db = {
  items: {
    where: (field: string) => ({
      above: (value: number) => ({
        toArray: async () => {
          const items = useDataStore.getState().items;
          return items.filter((item: any) => (item[field] as number) > value);
        },
      }),
      anyOf: (ids: string[]) => ({
        primaryKeys: async () => {
          const items = useDataStore.getState().items;
          return items.filter((item) => ids.includes(item.id)).map((item) => item.id);
        },
      }),
    }),
    bulkPut: async (items: NormalizedItem[]) => {
      useDataStore.getState().addItems(items);
    },
    count: () => useDataStore.getState().items.length,
    toArray: async () => useDataStore.getState().items,
  },
  imports: {
    orderBy: (field: string) => ({
      reverse: () => ({
        limit: (n: number) => ({
          toArray: async () => {
            const imports = useDataStore.getState().imports;
            return imports.slice(0, n);
          },
        }),
      }),
    }),
    add: async (log: Omit<ImportLog, 'id'>) => {
      useDataStore.getState().addImport(log);
    },
  },
};
