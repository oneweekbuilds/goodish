import { isLoggedInUrl } from '../lib/cookieManager';

describe('cookieManager', () => {
  describe('isLoggedInUrl', () => {
    // Instagram
    it('detects Instagram main feed as logged in', () => {
      expect(isLoggedInUrl('instagram', 'https://www.instagram.com/')).toBe(true);
    });

    it('detects Instagram feed with query as logged in', () => {
      expect(isLoggedInUrl('instagram', 'https://www.instagram.com/?hl=en')).toBe(true);
    });

    it('rejects Instagram login page', () => {
      expect(isLoggedInUrl('instagram', 'https://www.instagram.com/accounts/login/')).toBe(false);
    });

    it('rejects Instagram challenge page', () => {
      expect(isLoggedInUrl('instagram', 'https://www.instagram.com/challenge/')).toBe(false);
    });

    it('rejects Instagram consent page', () => {
      expect(isLoggedInUrl('instagram', 'https://www.instagram.com/consent/')).toBe(false);
    });

    // Twitter / X
    it('detects X.com/home as logged in', () => {
      expect(isLoggedInUrl('twitter', 'https://x.com/home')).toBe(true);
    });

    it('detects Twitter.com/home as logged in', () => {
      expect(isLoggedInUrl('twitter', 'https://twitter.com/home')).toBe(true);
    });

    it('rejects Twitter login page', () => {
      expect(isLoggedInUrl('twitter', 'https://x.com/i/flow/login')).toBe(false);
    });

    // YouTube
    it('detects YouTube as logged in', () => {
      expect(isLoggedInUrl('youtube', 'https://m.youtube.com/')).toBe(true);
    });

    it('rejects Google accounts sign-in', () => {
      expect(isLoggedInUrl('youtube', 'https://accounts.google.com/signin')).toBe(false);
    });

    // TikTok
    it('detects TikTok For You page as logged in', () => {
      expect(isLoggedInUrl('tiktok', 'https://www.tiktok.com/foryou')).toBe(true);
    });

    it('detects TikTok Following page as logged in', () => {
      expect(isLoggedInUrl('tiktok', 'https://www.tiktok.com/following')).toBe(true);
    });

    it('rejects TikTok login page', () => {
      expect(isLoggedInUrl('tiktok', 'https://www.tiktok.com/login')).toBe(false);
    });

    // Facebook
    it('detects Facebook feed as logged in', () => {
      expect(isLoggedInUrl('facebook', 'https://www.facebook.com/')).toBe(true);
    });

    it('rejects Facebook login page', () => {
      expect(isLoggedInUrl('facebook', 'https://www.facebook.com/login')).toBe(false);
    });

    it('rejects Facebook checkpoint', () => {
      expect(isLoggedInUrl('facebook', 'https://www.facebook.com/checkpoint/')).toBe(false);
    });

    // Reddit
    it('detects Reddit feed as logged in', () => {
      expect(isLoggedInUrl('reddit', 'https://www.reddit.com/')).toBe(true);
    });

    it('rejects Reddit login page', () => {
      expect(isLoggedInUrl('reddit', 'https://www.reddit.com/login')).toBe(false);
    });

    it('rejects Reddit register page', () => {
      expect(isLoggedInUrl('reddit', 'https://www.reddit.com/register')).toBe(false);
    });

    // Unknown platform
    it('returns false for unknown platform', () => {
      expect(isLoggedInUrl('snapchat', 'https://www.snapchat.com/')).toBe(false);
    });

    // Case insensitivity
    it('handles uppercase URLs', () => {
      expect(isLoggedInUrl('instagram', 'HTTPS://WWW.INSTAGRAM.COM/')).toBe(true);
    });
  });
});
