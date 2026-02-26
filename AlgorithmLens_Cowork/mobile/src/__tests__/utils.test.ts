import { generateUUID, safeJsonParse, withAlpha } from '../lib/utils';

describe('utils', () => {
  describe('generateUUID', () => {
    it('returns a string in UUID v4 format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it('generates unique values', () => {
      const a = generateUUID();
      const b = generateUUID();
      expect(a).not.toBe(b);
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid JSON', () => {
      const result = safeJsonParse<{ a: number }>('{"a":1}');
      expect(result).toEqual({ a: 1 });
    });

    it('throws on invalid JSON', () => {
      expect(() => safeJsonParse('not json')).toThrow();
    });

    it('throws when input exceeds max size', () => {
      const huge = 'x'.repeat(100);
      expect(() => safeJsonParse(huge, 50)).toThrow(/too large/);
    });

    it('accepts input within max size', () => {
      const result = safeJsonParse<number[]>('[1,2,3]', 100);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('withAlpha', () => {
    it('converts 6-char hex to rgba', () => {
      expect(withAlpha('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('converts 3-char hex to rgba', () => {
      expect(withAlpha('#F00', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('handles hex without hash', () => {
      expect(withAlpha('00FF00', 1)).toBe('rgba(0, 255, 0, 1)');
    });

    it('handles black', () => {
      expect(withAlpha('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
    });

    it('handles white', () => {
      expect(withAlpha('#FFFFFF', 1)).toBe('rgba(255, 255, 255, 1)');
    });
  });
});
