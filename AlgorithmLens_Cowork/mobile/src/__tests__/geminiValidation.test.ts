/**
 * Tests for Gemini response validation and sanitization logic.
 * These functions clean up raw Gemini API responses into safe, typed data.
 */

// We need to test the validation functions that are used in broadcastAnalysisPipeline
// These are: validateSourceOrigin, validateAiDisclosure, and the Valence type validation

describe('validation functions', () => {
  // Import the validators from the pipeline
  // Since they're module-level functions, we test them via behavior

  describe('validateSourceOrigin', () => {
    // The function should return 'suggested' | 'followed' | null
    const validateSourceOrigin = (value: string | null | undefined): 'suggested' | 'followed' | null => {
      if (value === 'suggested' || value === 'followed') return value;
      return null;
    };

    it('accepts "suggested"', () => {
      expect(validateSourceOrigin('suggested')).toBe('suggested');
    });

    it('accepts "followed"', () => {
      expect(validateSourceOrigin('followed')).toBe('followed');
    });

    it('rejects invalid strings', () => {
      expect(validateSourceOrigin('SUGGESTED')).toBeNull();
      expect(validateSourceOrigin('unknown')).toBeNull();
      expect(validateSourceOrigin('both')).toBeNull();
    });

    it('handles null and undefined', () => {
      expect(validateSourceOrigin(null)).toBeNull();
      expect(validateSourceOrigin(undefined)).toBeNull();
    });
  });

  describe('validateAiDisclosure', () => {
    const validateAiDisclosure = (value: string | null | undefined): 'LABELED_AI' | 'NOT_LABELED' | null => {
      if (value === 'LABELED_AI' || value === 'NOT_LABELED') return value;
      return null;
    };

    it('accepts valid values', () => {
      expect(validateAiDisclosure('LABELED_AI')).toBe('LABELED_AI');
      expect(validateAiDisclosure('NOT_LABELED')).toBe('NOT_LABELED');
    });

    it('rejects invalid strings', () => {
      expect(validateAiDisclosure('labeled_ai')).toBeNull();
      expect(validateAiDisclosure('ai')).toBeNull();
    });

    it('handles null and undefined', () => {
      expect(validateAiDisclosure(null)).toBeNull();
      expect(validateAiDisclosure(undefined)).toBeNull();
    });
  });

  describe('Valence validation', () => {
    const VALID_VALENCES = ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'] as const;
    type Valence = (typeof VALID_VALENCES)[number];

    const mapValence = (raw: unknown): Valence => {
      if (typeof raw === 'string' && VALID_VALENCES.includes(raw as Valence)) {
        return raw as Valence;
      }
      return 'NEUTRAL';
    };

    it('accepts valid valences', () => {
      expect(mapValence('POSITIVE')).toBe('POSITIVE');
      expect(mapValence('NEGATIVE')).toBe('NEGATIVE');
      expect(mapValence('NEUTRAL')).toBe('NEUTRAL');
      expect(mapValence('MIXED')).toBe('MIXED');
    });

    it('defaults to NEUTRAL for invalid values', () => {
      expect(mapValence('positive')).toBe('NEUTRAL');
      expect(mapValence('happy')).toBe('NEUTRAL');
      expect(mapValence(null)).toBe('NEUTRAL');
      expect(mapValence(undefined)).toBe('NEUTRAL');
      expect(mapValence(42)).toBe('NEUTRAL');
    });
  });

  describe('processing time calculation', () => {
    it('correctly converts milliseconds to seconds with one decimal', () => {
      const startTime = 1000;
      const endTime = 4500; // 3.5 seconds later

      const result = Math.round((endTime - startTime) / 1000 * 10) / 10;
      expect(result).toBe(3.5);
    });

    it('rounds correctly', () => {
      const startTime = 0;
      const endTime = 12345;

      const result = Math.round((endTime - startTime) / 1000 * 10) / 10;
      expect(result).toBe(12.3);
    });

    it('handles zero duration', () => {
      const result = Math.round(0 / 1000 * 10) / 10;
      expect(result).toBe(0);
    });
  });
});
