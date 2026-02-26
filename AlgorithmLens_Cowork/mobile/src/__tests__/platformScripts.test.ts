import { getPlatformUrl, getPlatformScript } from '../lib/platformScripts';
import { INSTAGRAM_SCRIPT } from '../lib/platformScripts/instagram';
import { TWITTER_SCRIPT } from '../lib/platformScripts/twitter';
import { YOUTUBE_SCRIPT } from '../lib/platformScripts/youtube';
import { TIKTOK_SCRIPT } from '../lib/platformScripts/tiktok';
import { FACEBOOK_SCRIPT } from '../lib/platformScripts/facebook';
import { REDDIT_SCRIPT } from '../lib/platformScripts/reddit';

const PLATFORMS = ['instagram', 'twitter', 'youtube', 'tiktok', 'facebook', 'reddit'] as const;

const RAW_SCRIPTS: Record<string, string> = {
  instagram: INSTAGRAM_SCRIPT,
  twitter: TWITTER_SCRIPT,
  youtube: YOUTUBE_SCRIPT,
  tiktok: TIKTOK_SCRIPT,
  facebook: FACEBOOK_SCRIPT,
  reddit: REDDIT_SCRIPT,
};

describe('platformScripts', () => {
  describe('getPlatformUrl', () => {
    it.each(PLATFORMS)('%s returns a valid https URL', (platform) => {
      const url = getPlatformUrl(platform);
      expect(url).toMatch(/^https:\/\//);
    });

    it('returns fallback for unknown platform', () => {
      const url = getPlatformUrl('snapchat');
      expect(url).toMatch(/^https:\/\//);
    });

    it('is case-insensitive', () => {
      expect(getPlatformUrl('Instagram')).toBe(getPlatformUrl('instagram'));
    });
  });

  describe('getPlatformScript', () => {
    it.each(PLATFORMS)('%s returns a non-empty string', (platform) => {
      const script = getPlatformScript(platform);
      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(100);
    });

    it('returns generic script for unknown platform', () => {
      const script = getPlatformScript('snapchat');
      expect(script.length).toBeGreaterThan(100);
    });
  });

  describe('raw script safety patterns', () => {
    it.each(PLATFORMS)('%s sends SCANNER_READY message', (platform) => {
      expect(RAW_SCRIPTS[platform]).toContain('SCANNER_READY');
    });

    it.each(PLATFORMS)('%s sends FEED_ITEM messages', (platform) => {
      expect(RAW_SCRIPTS[platform]).toContain('FEED_ITEM');
    });

    it.each(PLATFORMS)('%s uses dedup Set', (platform) => {
      expect(RAW_SCRIPTS[platform]).toContain('new Set()');
    });

    it.each(PLATFORMS)('%s uses IntersectionObserver', (platform) => {
      expect(RAW_SCRIPTS[platform]).toContain('IntersectionObserver');
    });

    it.each(PLATFORMS)('%s uses MutationObserver', (platform) => {
      expect(RAW_SCRIPTS[platform]).toContain('MutationObserver');
    });

    it.each(PLATFORMS)('%s uses strict mode', (platform) => {
      expect(RAW_SCRIPTS[platform]).toContain("'use strict'");
    });

    it.each(PLATFORMS)('%s has scroll-based fallback', (platform) => {
      expect(RAW_SCRIPTS[platform]).toContain('setInterval');
    });

    it.each(PLATFORMS)('%s suppresses banners', (platform) => {
      expect(RAW_SCRIPTS[platform]).toContain('suppressBanners');
    });

    it.each(PLATFORMS)('%s has null guards on textContent', (platform) => {
      // All scripts should use (el.textContent || '') pattern
      expect(RAW_SCRIPTS[platform]).toContain(".textContent || ''");
    });

    it.each(PLATFORMS)('%s truncates post text to prevent memory issues', (platform) => {
      expect(RAW_SCRIPTS[platform]).toContain('substring(0,');
    });
  });

  describe('error handling wrapper', () => {
    it.each(PLATFORMS)('%s wrapped script has timeout detection', (platform) => {
      const wrapped = getPlatformScript(platform);
      expect(wrapped).toContain('SCAN_ERROR');
      expect(wrapped).toContain('TIMEOUT_NO_POSTS');
    });

    it.each(PLATFORMS)('%s wrapped script has DOM change detection', (platform) => {
      const wrapped = getPlatformScript(platform);
      expect(wrapped).toContain('DOM_STRUCTURE_CHANGED');
    });

    it.each(PLATFORMS)('%s wrapped script has bot detection', (platform) => {
      const wrapped = getPlatformScript(platform);
      expect(wrapped).toContain('BOT_DETECTION');
    });

    it.each(PLATFORMS)('%s wrapped script has try-catch', (platform) => {
      const wrapped = getPlatformScript(platform);
      expect(wrapped).toContain('try {');
      expect(wrapped).toContain('catch');
    });
  });
});
