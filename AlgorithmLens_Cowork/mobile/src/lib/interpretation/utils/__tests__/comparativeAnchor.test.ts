/**
 * Unit tests for getComparativeAnchor.
 */

import { getComparativeAnchor } from '../comparativeAnchor';

describe('getComparativeAnchor', () => {
  describe('null and edge inputs', () => {
    test('returns null when rolling average is null', () => {
      expect(getComparativeAnchor(15, null)).toBeNull();
    });

    test('returns null when rolling average is zero (no meaningful ratio)', () => {
      expect(getComparativeAnchor(15, 0)).toBeNull();
    });

    test('returns null when current value is NaN', () => {
      expect(getComparativeAnchor(Number.NaN, 10)).toBeNull();
    });

    test('returns null when rolling average is Infinity', () => {
      expect(getComparativeAnchor(15, Number.POSITIVE_INFINITY)).toBeNull();
    });
  });

  describe('bucket: lower than typical', () => {
    test('ratio 0 returns lower (current is zero)', () => {
      expect(getComparativeAnchor(0, 10)).toBe('lower than typical');
    });

    test('ratio just under 0.7 returns lower', () => {
      // 6.99 / 10 = 0.699 < 0.7
      expect(getComparativeAnchor(6.99, 10)).toBe('lower than typical');
    });

    test('ratio at 0.5 returns lower', () => {
      expect(getComparativeAnchor(5, 10)).toBe('lower than typical');
    });
  });

  describe('bucket: typical', () => {
    test('ratio exactly at lower boundary (0.7) returns typical', () => {
      expect(getComparativeAnchor(7, 10)).toBe('typical');
    });

    test('ratio at 1.0 returns typical', () => {
      expect(getComparativeAnchor(10, 10)).toBe('typical');
    });

    test('ratio at 1.3 (upper boundary) returns typical', () => {
      expect(getComparativeAnchor(13, 10)).toBe('typical');
    });
  });

  describe('bucket: higher than typical', () => {
    test('ratio just above 1.3 returns higher', () => {
      // 13.01 / 10 = 1.301 > 1.3
      expect(getComparativeAnchor(13.01, 10)).toBe('higher than typical');
    });

    test('ratio at 1.7 returns higher', () => {
      expect(getComparativeAnchor(17, 10)).toBe('higher than typical');
    });

    test('ratio at exactly 2.0 returns higher (upper boundary inclusive)', () => {
      expect(getComparativeAnchor(20, 10)).toBe('higher than typical');
    });
  });

  describe('bucket: much higher (multiplier text)', () => {
    test('ratio just above 2.0 returns multiplier text', () => {
      // 22 / 10 = 2.2
      expect(getComparativeAnchor(22, 10)).toBe('2.2× your typical');
    });

    test('ratio at 2.5 returns 2.5x your typical', () => {
      expect(getComparativeAnchor(25, 10)).toBe('2.5× your typical');
    });

    test('multiplier rounds to 1 decimal place', () => {
      // 20.55 / 10 = 2.055 -> 2.1
      expect(getComparativeAnchor(20.55, 10)).toBe('2.1× your typical');
    });

    test('large multiplier formats correctly', () => {
      expect(getComparativeAnchor(150, 10)).toBe('15× your typical');
    });
  });

  describe('custom labels', () => {
    test('honors custom lowerLabel', () => {
      expect(
        getComparativeAnchor(5, 10, { lowerLabel: 'unusually low' }),
      ).toBe('unusually low');
    });

    test('honors custom typicalLabel', () => {
      expect(
        getComparativeAnchor(10, 10, { typicalLabel: 'in line with usual' }),
      ).toBe('in line with usual');
    });

    test('honors custom higherLabel', () => {
      expect(
        getComparativeAnchor(15, 10, { higherLabel: 'unusually high' }),
      ).toBe('unusually high');
    });

    test('much-higher multiplier text is not affected by custom labels', () => {
      expect(
        getComparativeAnchor(25, 10, {
          lowerLabel: 'L',
          typicalLabel: 'T',
          higherLabel: 'H',
        }),
      ).toBe('2.5× your typical');
    });
  });
});
