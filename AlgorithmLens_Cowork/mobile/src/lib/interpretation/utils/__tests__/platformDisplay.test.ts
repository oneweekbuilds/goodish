/**
 * Unit tests for capitalizePlatform.
 */

import { capitalizePlatform } from '../platformDisplay';

describe('capitalizePlatform', () => {
  test('youtube becomes YouTube', () => {
    expect(capitalizePlatform('youtube')).toBe('YouTube');
  });

  test('instagram becomes Instagram', () => {
    expect(capitalizePlatform('instagram')).toBe('Instagram');
  });

  test('tiktok becomes TikTok (camelCase brand convention)', () => {
    expect(capitalizePlatform('tiktok')).toBe('TikTok');
  });

  test('twitter becomes X (current brand)', () => {
    expect(capitalizePlatform('twitter')).toBe('X');
  });

  test('facebook becomes Facebook', () => {
    expect(capitalizePlatform('facebook')).toBe('Facebook');
  });

  test('reddit becomes Reddit', () => {
    expect(capitalizePlatform('reddit')).toBe('Reddit');
  });

  test('match is case-insensitive (uppercase input)', () => {
    expect(capitalizePlatform('YOUTUBE')).toBe('YouTube');
  });

  test('match is case-insensitive (mixed input)', () => {
    expect(capitalizePlatform('YouTube')).toBe('YouTube');
  });

  test('unknown platform falls back to title-case', () => {
    expect(capitalizePlatform('mastodon')).toBe('Mastodon');
  });

  test('unknown platform uppercase input is title-cased', () => {
    expect(capitalizePlatform('MASTODON')).toBe('Mastodon');
  });

  test('empty input returns Unknown sentinel', () => {
    expect(capitalizePlatform('')).toBe('Unknown');
  });
});
