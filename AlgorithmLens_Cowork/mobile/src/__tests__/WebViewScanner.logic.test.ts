/**
 * Unit tests for the pure-logic helpers in WebViewScanner.tsx
 * (V2 spec Phase 1.h — test logic functions, not React rendering).
 */

import { buildDedupKey, getErrorMessage } from '../components/scanner/scannerHelpers';

describe('WebViewScanner pure logic', () => {
  describe('buildDedupKey', () => {
    test('combines creator handle and first 80 chars of post text', () => {
      expect(buildDedupKey('alice', 'hello world')).toBe('alice::hello world');
    });

    test('truncates post_text to 80 characters', () => {
      const long = 'x'.repeat(200);
      const key = buildDedupKey('alice', long);
      expect(key).toBe('alice::' + 'x'.repeat(80));
    });

    test('null creator handle becomes empty string', () => {
      expect(buildDedupKey(null, 'hello')).toBe('::hello');
    });

    test('null post text becomes empty string', () => {
      expect(buildDedupKey('alice', null)).toBe('alice::');
    });

    test('undefined inputs become empty strings', () => {
      expect(buildDedupKey(undefined, undefined)).toBe('::');
    });

    test('two identical posts produce identical keys (Set will dedup)', () => {
      const k1 = buildDedupKey('alice', 'caption');
      const k2 = buildDedupKey('alice', 'caption');
      expect(k1).toBe(k2);
      const set = new Set<string>();
      set.add(k1);
      expect(set.has(k2)).toBe(true);
      expect(set.size).toBe(1);
    });

    test('different creators with same caption produce different keys', () => {
      expect(buildDedupKey('alice', 'caption')).not.toBe(buildDedupKey('bob', 'caption'));
    });

    test('different captions from same creator produce different keys', () => {
      expect(buildDedupKey('alice', 'first')).not.toBe(buildDedupKey('alice', 'second'));
    });

    test('captions that differ only past char 80 collide (intentional fuzzy match)', () => {
      const a = 'a'.repeat(80) + 'X';
      const b = 'a'.repeat(80) + 'Y';
      // Both truncate to 80 'a's, so they collide
      expect(buildDedupKey('alice', a)).toBe(buildDedupKey('alice', b));
    });
  });

  describe('getErrorMessage', () => {
    const everyReason = [
      'PAGE_NOT_LOADED',
      'BOT_DETECTION',
      'DOM_STRUCTURE_CHANGED',
      'CAPTURE_FAILED',
      'BLOCKED_BY_PLATFORM',
      'INJECTION_ERROR',
      'TIMEOUT_NO_POSTS',
    ] as const;

    test('every known reason has a non-empty message', () => {
      everyReason.forEach((reason) => {
        const msg = getErrorMessage({ reason, detail: '' }, false);
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
        expect(msg).not.toBe('undefined');
      });
    });

    test('isMaxRetries=true overrides every reason with the cap message', () => {
      everyReason.forEach((reason) => {
        const msg = getErrorMessage({ reason, detail: '' }, true);
        expect(msg).toMatch(/multiple attempts|after multiple/i);
      });
    });

    test('unknown reason falls through to the default timeout message', () => {
      const msg = getErrorMessage({ reason: 'COMPLETELY_NEW_REASON', detail: '' }, false);
      // Default branch shares wording with TIMEOUT_NO_POSTS
      expect(msg).toMatch(/couldn't capture/i);
    });

    test('PAGE_NOT_LOADED message references connectivity', () => {
      const msg = getErrorMessage({ reason: 'PAGE_NOT_LOADED', detail: '' }, false);
      expect(msg).toMatch(/loaded|connection/i);
    });

    test('BOT_DETECTION message instructs the user to scroll manually', () => {
      const msg = getErrorMessage({ reason: 'BOT_DETECTION', detail: '' }, false);
      expect(msg).toMatch(/scroll/i);
    });

    test('DOM_STRUCTURE_CHANGED message mentions layout/design change', () => {
      const msg = getErrorMessage({ reason: 'DOM_STRUCTURE_CHANGED', detail: '' }, false);
      expect(msg).toMatch(/layout|design/i);
    });

    test('CAPTURE_FAILED suggests scrolling the feed first', () => {
      const msg = getErrorMessage({ reason: 'CAPTURE_FAILED', detail: '' }, false);
      expect(msg).toMatch(/scroll/i);
    });

    test('messages are user-facing — no jargon, no codes, no error.reason leakage', () => {
      everyReason.forEach((reason) => {
        const msg = getErrorMessage({ reason, detail: 'tech detail' }, false);
        expect(msg).not.toContain('TIMEOUT_NO_POSTS');
        expect(msg).not.toContain('DOM_STRUCTURE_CHANGED');
        expect(msg).not.toContain('null');
        expect(msg).not.toContain('undefined');
      });
    });

    test('messages do not anthropomorphize the algorithm (epistemic restraint)', () => {
      everyReason.forEach((reason) => {
        const msg = getErrorMessage({ reason, detail: '' }, false).toLowerCase();
        expect(msg).not.toMatch(/algorithm wants|algorithm decides|algorithm chose/);
      });
    });
  });
});
