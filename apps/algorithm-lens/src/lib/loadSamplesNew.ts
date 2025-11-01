import { z } from 'zod';
import { useDataStore, Platform, NormalizedItem } from './db';

// Zod schema for validation - compatible with both old SampleItem and new NormalizedItem
const ItemSchema = z.object({
  id: z.string(),
  platform: z.enum(['x', 'instagram', 'tiktok', 'youtube', 'facebook', 'reddit']),
  timestamp: z.number().int(),
  contentId: z.string().optional(),
  url: z.string().optional(),
  text: z.string().optional(),
  topics: z.array(z.string()).optional(),
  creatorId: z.string().optional(),
  sentiment: z.enum(['pos', 'neg', 'neu']).optional(),
  isAd: z.boolean().optional(),
  // Legacy fields for compatibility
  type: z.enum(['post', 'ad']).optional(),
  author: z.string().optional(),
  topicTags: z.array(z.string()).optional(),
  productTags: z.array(z.string()).optional(),
  political: z.enum(['left', 'right', 'neutral']).nullable().optional(),
  tone: z.enum(['analytical', 'empathetic', 'outrage', 'calm', 'emotional']).nullable().optional()
});

export interface LoadProgress {
  loaded: number;
  total: number;
  phase: 'parsing' | 'validating' | 'storing';
}

export interface LoadResult {
  success: number;
  errors: string[];
  warnings: string[];
}

export async function loadSampleBlob(
  data: unknown,
  onProgress?: (progress: LoadProgress) => void
): Promise<LoadResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let successCount = 0;

  try {
    onProgress?.({ loaded: 0, total: 0, phase: 'parsing' });

    // Validate data is an array
    if (!Array.isArray(data)) {
      errors.push(`Expected array, got ${typeof data}`);
      return { success: 0, errors, warnings };
    }

    onProgress?.({ loaded: 0, total: data.length, phase: 'validating' });

    const validItems: NormalizedItem[] = [];

    // Validate each item
    for (let i = 0; i < data.length; i++) {
      try {
        const parsed = ItemSchema.parse(data[i]);
        // Convert to NormalizedItem format
        const normalized: NormalizedItem = {
          id: parsed.id,
          platform: parsed.platform,
          timestamp: parsed.timestamp,
          contentId: parsed.contentId || parsed.id,
          url: parsed.url,
          text: parsed.text || '',
          topics: parsed.topics || parsed.topicTags || [],
          creatorId: parsed.creatorId || parsed.author,
          sentiment: parsed.sentiment,
          isAd: parsed.isAd !== undefined ? parsed.isAd : parsed.type === 'ad',
        };
        validItems.push(normalized);

        if ((i + 1) % 50 === 0) {
          onProgress?.({ loaded: i + 1, total: data.length, phase: 'validating' });
        }
      } catch (e) {
        if (e instanceof z.ZodError) {
          const issues = e.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`).join(', ');
          warnings.push(`Item ${i}: ${issues}`);
        } else {
          warnings.push(`Item ${i}: Unknown validation error`);
        }
      }
    }

    if (validItems.length === 0) {
      errors.push('No valid items found after validation');
      return { success: 0, errors, warnings };
    }

    onProgress?.({ loaded: 0, total: validItems.length, phase: 'storing' });

    // Store in Zustand store in batches
    const BATCH_SIZE = 100;
    const store = useDataStore.getState();
    for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
      const batch = validItems.slice(i, i + BATCH_SIZE);
      store.addItems(batch);
      successCount += batch.length;

      onProgress?.({
        loaded: Math.min(i + BATCH_SIZE, validItems.length),
        total: validItems.length,
        phase: 'storing'
      });
    }

    return { success: successCount, errors, warnings };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error during load';
    errors.push(errorMsg);
    return { success: successCount, errors, warnings };
  }
}

// For loading built-in sample files
export async function loadBuiltInSample(
  filename: string,
  onProgress?: (progress: LoadProgress) => void
): Promise<LoadResult> {
  try {
    // Determine platform from filename
    const platformMap: Record<string, Platform> = {
      'x_tweets_sample.js': 'x',
      'instagram_sample.json': 'instagram',
      'tiktok_sample.json': 'tiktok',
      'youtube_watch_history_sample.json': 'youtube',
      'facebook_posts_sample.json': 'facebook',
      'reddit_sample.json': 'reddit'
    };

    const platform = platformMap[filename];
    if (!platform) {
      return {
        success: 0,
        errors: [`Unknown sample file: ${filename}`],
        warnings: []
      };
    }

    // Dynamically import the sample file
    const samplePath = `/samples/${filename}`;
    const response = await fetch(samplePath);

    if (!response.ok) {
      return {
        success: 0,
        errors: [`Failed to load ${filename}: ${response.statusText}`],
        warnings: []
      };
    }

    let data: unknown;

    if (filename.endsWith('.js')) {
      // For JS files, evaluate the code
      const code = await response.text();
      // Extract array from variable assignment
      const match = code.match(/=\s*(\[[\s\S]*\]);?/);
      if (match) {
        data = JSON.parse(match[1]);
      } else {
        throw new Error('Could not parse JS sample file');
      }
    } else {
      // For JSON files
      data = await response.json();
    }

    return loadSampleBlob(data, onProgress);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error loading sample';
    return {
      success: 0,
      errors: [errorMsg],
      warnings: []
    };
  }
}
