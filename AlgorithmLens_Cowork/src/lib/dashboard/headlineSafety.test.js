/**
 * Tests for headlineSafety.js — filtering excluded labels for dashboard headlines
 */
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock scanAggregator before importing headlineSafety
vi.mock('./scanAggregator', () => ({
  UNCLASSIFIED_TOPIC: 'Unclassified',
}));

import { isHeadlineExcludedLabel, pickHeadlineSafeLabels, FALLBACK_MIX_TOPICS_HEADLINE, UNCATEGORIZED_NOTE } from './headlineSafety.js';

// ─── isHeadlineExcludedLabel ──────────────────────────────
describe('isHeadlineExcludedLabel', () => {
  describe('null and undefined', () => {
    test('returns true for null', () => {
      expect(isHeadlineExcludedLabel(null)).toBe(true);
    });

    test('returns true for undefined', () => {
      expect(isHeadlineExcludedLabel(undefined)).toBe(true);
    });
  });

  describe('empty and whitespace strings', () => {
    test('returns true for empty string', () => {
      expect(isHeadlineExcludedLabel('')).toBe(true);
    });

    test('returns true for whitespace-only string', () => {
      expect(isHeadlineExcludedLabel('   ')).toBe(true);
    });

    test('returns true for tab-only string', () => {
      expect(isHeadlineExcludedLabel('\t')).toBe(true);
    });
  });

  describe('unclassified variants', () => {
    test('returns true for unclassified (lowercase)', () => {
      expect(isHeadlineExcludedLabel('unclassified')).toBe(true);
    });

    test('returns true for Unclassified (mixed case)', () => {
      expect(isHeadlineExcludedLabel('Unclassified')).toBe(true);
    });

    test('returns true for UNCLASSIFIED (uppercase)', () => {
      expect(isHeadlineExcludedLabel('UNCLASSIFIED')).toBe(true);
    });

    test('returns true for unclassified with whitespace', () => {
      expect(isHeadlineExcludedLabel('  unclassified  ')).toBe(true);
    });
  });

  describe('other variants', () => {
    test('returns true for other (lowercase)', () => {
      expect(isHeadlineExcludedLabel('other')).toBe(true);
    });

    test('returns true for Other (mixed case)', () => {
      expect(isHeadlineExcludedLabel('Other')).toBe(true);
    });

    test('returns true for OTHER (uppercase)', () => {
      expect(isHeadlineExcludedLabel('OTHER')).toBe(true);
    });

    test('returns true for other / couldn\'t categorize', () => {
      expect(isHeadlineExcludedLabel("other / couldn't categorize")).toBe(true);
    });

    test('returns true for mixed case variant of couldn\'t categorize phrase', () => {
      expect(isHeadlineExcludedLabel("Other / Couldn't Categorize")).toBe(true);
    });
  });

  describe('valid labels', () => {
    test('returns false for Entertainment', () => {
      expect(isHeadlineExcludedLabel('Entertainment')).toBe(false);
    });

    test('returns false for Politics', () => {
      expect(isHeadlineExcludedLabel('Politics')).toBe(false);
    });

    test('returns false for Technology', () => {
      expect(isHeadlineExcludedLabel('Technology')).toBe(false);
    });

    test('returns false for Health', () => {
      expect(isHeadlineExcludedLabel('Health')).toBe(false);
    });

    test('returns false for Sports', () => {
      expect(isHeadlineExcludedLabel('Sports')).toBe(false);
    });

    test('returns false for News', () => {
      expect(isHeadlineExcludedLabel('News')).toBe(false);
    });

    test('returns false for label with whitespace', () => {
      expect(isHeadlineExcludedLabel('  Technology  ')).toBe(false);
    });
  });
});

// ─── pickHeadlineSafeLabels ───────────────────────────────
describe('pickHeadlineSafeLabels', () => {
  describe('empty input', () => {
    test('returns empty labels for empty array', () => {
      const result = pickHeadlineSafeLabels([]);
      expect(result.labels).toEqual([]);
      expect(result.hadExcluded).toBe(false);
    });

    test('returns empty labels when items is null', () => {
      const result = pickHeadlineSafeLabels(null);
      expect(result.labels).toEqual([]);
      expect(result.hadExcluded).toBe(false);
    });

    test('returns empty labels when items is undefined', () => {
      const result = pickHeadlineSafeLabels(undefined);
      expect(result.labels).toEqual([]);
      expect(result.hadExcluded).toBe(false);
    });

    test('returns empty labels when items is not an array', () => {
      const result = pickHeadlineSafeLabels('not an array');
      expect(result.labels).toEqual([]);
      expect(result.hadExcluded).toBe(false);
    });

    test('returns empty labels when items is an object', () => {
      const result = pickHeadlineSafeLabels({ a: 'b' });
      expect(result.labels).toEqual([]);
      expect(result.hadExcluded).toBe(false);
    });
  });

  describe('filtering excluded labels', () => {
    test('filters out unclassified and returns safe labels', () => {
      const items = ['unclassified', 'Politics', 'other', 'Entertainment'];
      const result = pickHeadlineSafeLabels(items);
      expect(result.labels).toEqual(['Politics', 'Entertainment']);
      expect(result.hadExcluded).toBe(true);
    });

    test('returns hadExcluded false when no excluded labels found', () => {
      const items = ['Politics', 'Entertainment', 'Technology'];
      // Default limit is 2, so only first 2 labels returned
      const result = pickHeadlineSafeLabels(items);
      expect(result.labels).toEqual(['Politics', 'Entertainment']);
      expect(result.hadExcluded).toBe(false);
    });

    test('returns hadExcluded true when only excluded labels present', () => {
      const items = ['unclassified', 'other'];
      const result = pickHeadlineSafeLabels(items);
      expect(result.labels).toEqual([]);
      expect(result.hadExcluded).toBe(true);
    });

    test('returns hadExcluded false for empty strings and nulls without content', () => {
      const items = [null, '', '   '];
      const result = pickHeadlineSafeLabels(items);
      expect(result.labels).toEqual([]);
      expect(result.hadExcluded).toBe(false);
    });
  });

  describe('limit parameter', () => {
    test('respects limit of 1', () => {
      const items = ['Politics', 'Entertainment', 'Technology'];
      const result = pickHeadlineSafeLabels(items, { limit: 1 });
      expect(result.labels).toEqual(['Politics']);
    });

    test('respects limit of 2 (default)', () => {
      const items = ['Politics', 'Entertainment', 'Technology', 'Health'];
      const result = pickHeadlineSafeLabels(items, { limit: 2 });
      expect(result.labels).toEqual(['Politics', 'Entertainment']);
    });

    test('respects limit of 5', () => {
      const items = ['Politics', 'Entertainment', 'Technology', 'Health', 'Sports', 'News'];
      const result = pickHeadlineSafeLabels(items, { limit: 5 });
      expect(result.labels).toEqual(['Politics', 'Entertainment', 'Technology', 'Health', 'Sports']);
    });

    test('returns all items if limit exceeds array length', () => {
      const items = ['Politics', 'Entertainment'];
      const result = pickHeadlineSafeLabels(items, { limit: 10 });
      expect(result.labels).toEqual(['Politics', 'Entertainment']);
    });
  });

  describe('getLabel function', () => {
    test('uses getLabel function when provided', () => {
      const items = [
        { name: 'Politics', id: 1 },
        { name: 'unclassified', id: 2 },
        { name: 'Entertainment', id: 3 },
      ];
      const result = pickHeadlineSafeLabels(items, {
        getLabel: (item) => item.name,
        limit: 2,
      });
      expect(result.labels).toEqual(['Politics', 'Entertainment']);
      expect(result.hadExcluded).toBe(true);
    });

    test('works with getLabel and respects limit', () => {
      const items = [
        { category: 'Politics' },
        { category: 'Entertainment' },
        { category: 'Technology' },
      ];
      const result = pickHeadlineSafeLabels(items, {
        getLabel: (item) => item.category,
        limit: 1,
      });
      expect(result.labels).toEqual(['Politics']);
    });

    test('getLabel can return numeric values', () => {
      const items = [1, 2, 3];
      const result = pickHeadlineSafeLabels(items, {
        getLabel: (item) => String(item),
        limit: 3,
      });
      expect(result.labels).toEqual(['1', '2', '3']);
    });
  });

  describe('default behavior', () => {
    test('default limit is 2', () => {
      const items = ['Politics', 'Entertainment', 'Technology', 'Health'];
      const result = pickHeadlineSafeLabels(items);
      expect(result.labels).toEqual(['Politics', 'Entertainment']);
      expect(result.labels.length).toBe(2);
    });

    test('default limit applies with no getLabel', () => {
      const items = ['Politics', 'Entertainment', 'Technology'];
      const result = pickHeadlineSafeLabels(items, {});
      expect(result.labels).toEqual(['Politics', 'Entertainment']);
    });
  });

  describe('complex filtering scenarios', () => {
    test('skips excluded labels and continues until limit reached', () => {
      const items = ['unclassified', 'Politics', 'other', 'Entertainment', 'Technology'];
      const result = pickHeadlineSafeLabels(items, { limit: 2 });
      expect(result.labels).toEqual(['Politics', 'Entertainment']);
      expect(result.hadExcluded).toBe(true);
    });

    test('handles mixed null and excluded labels', () => {
      const items = [null, 'unclassified', 'Politics', 'other', 'Entertainment'];
      const result = pickHeadlineSafeLabels(items, { limit: 2 });
      expect(result.labels).toEqual(['Politics', 'Entertainment']);
      expect(result.hadExcluded).toBe(true);
    });
  });
});

// ─── Constants ─────────────────────────────────────────────
describe('Constants', () => {
  test('FALLBACK_MIX_TOPICS_HEADLINE is a non-empty string', () => {
    expect(typeof FALLBACK_MIX_TOPICS_HEADLINE).toBe('string');
    expect(FALLBACK_MIX_TOPICS_HEADLINE.length).toBeGreaterThan(0);
  });

  test('FALLBACK_MIX_TOPICS_HEADLINE contains expected content', () => {
    expect(FALLBACK_MIX_TOPICS_HEADLINE.toLowerCase()).toContain('mix');
    expect(FALLBACK_MIX_TOPICS_HEADLINE.toLowerCase()).toContain('topic');
  });

  test('UNCATEGORIZED_NOTE is a non-empty string', () => {
    expect(typeof UNCATEGORIZED_NOTE).toBe('string');
    expect(UNCATEGORIZED_NOTE.length).toBeGreaterThan(0);
  });

  test('UNCATEGORIZED_NOTE contains expected content', () => {
    expect(UNCATEGORIZED_NOTE.toLowerCase()).toContain('categor');
  });
});
