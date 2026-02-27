import {
  MIN_POSTS_GOOD,
  MIN_POSTS_OK,
  MIN_POSTS_FOR_ANALYSIS,
  MIN_POSTS_REQUIRED,
  MIN_SCAN_DURATION_SECS,
  MIN_FRAMES_REQUIRED,
  getQualityLevel,
} from '../config/thresholds';

describe('thresholds', () => {
  describe('constants', () => {
    it('MIN_POSTS_GOOD is greater than MIN_POSTS_OK', () => {
      expect(MIN_POSTS_GOOD).toBeGreaterThan(MIN_POSTS_OK);
    });

    it('MIN_POSTS_OK equals MIN_POSTS_FOR_ANALYSIS', () => {
      expect(MIN_POSTS_OK).toBe(MIN_POSTS_FOR_ANALYSIS);
    });

    it('MIN_POSTS_REQUIRED equals MIN_POSTS_GOOD', () => {
      expect(MIN_POSTS_REQUIRED).toBe(20);
    });

    it('MIN_SCAN_DURATION_SECS is 60', () => {
      expect(MIN_SCAN_DURATION_SECS).toBe(60);
    });

    it('MIN_FRAMES_REQUIRED is 20', () => {
      expect(MIN_FRAMES_REQUIRED).toBe(20);
    });
  });

  describe('getQualityLevel — 5-tier system', () => {
    it('returns Excellent for 50+ posts', () => {
      const result = getQualityLevel(50);
      expect(result.label).toBe('Excellent sample');
      expect(result.colorKey).toBe('accentGreen');
    });

    it('returns Excellent for high count', () => {
      expect(getQualityLevel(100).label).toBe('Excellent sample');
    });

    it('returns Good for 30-49 posts', () => {
      const result = getQualityLevel(30);
      expect(result.label).toBe('Good sample');
      expect(result.colorKey).toBe('accentGreen');
    });

    it('returns Good for 49 posts', () => {
      expect(getQualityLevel(49).label).toBe('Good sample');
    });

    it('returns Fair for 20-29 posts (>= MIN_POSTS_GOOD)', () => {
      const result = getQualityLevel(MIN_POSTS_GOOD);
      expect(result.label).toBe('Fair sample');
      expect(result.colorKey).toBe('warning');
    });

    it('returns Fair for 29 posts', () => {
      expect(getQualityLevel(29).label).toBe('Fair sample');
    });

    it('returns Low at MIN_POSTS_OK boundary', () => {
      const result = getQualityLevel(MIN_POSTS_OK);
      expect(result.label).toBe('Low sample');
      expect(result.colorKey).toBe('warning');
    });

    it('returns Low for count between OK and GOOD', () => {
      expect(getQualityLevel(MIN_POSTS_GOOD - 1).label).toBe('Low sample');
    });

    it('returns Very low for count below OK', () => {
      const result = getQualityLevel(MIN_POSTS_OK - 1);
      expect(result.label).toBe('Very low sample');
      expect(result.colorKey).toBe('error');
    });

    it('returns Very low for zero', () => {
      expect(getQualityLevel(0).label).toBe('Very low sample');
    });
  });
});
