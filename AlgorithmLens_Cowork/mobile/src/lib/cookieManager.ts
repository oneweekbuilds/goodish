/**
 * Cookie persistence manager for WebView sessions.
 * Saves and restores cookies using AsyncStorage so users don't
 * need to re-login to social media platforms after app restarts.
 *
 * On iOS: CookieManager from @react-native-cookies/cookies
 * On Android: Uses WebView's built-in cookie persistence
 *
 * Fallback: AsyncStorage-based cookie cache for platforms
 * that don't persist cookies natively.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { addBreadcrumb } from './sentry';

const COOKIE_STORAGE_KEY = '@alg_webview_cookies';
const LOGIN_STATE_KEY = '@alg_platform_login_state';

interface PlatformLoginState {
  platform: string;
  loggedIn: boolean;
  lastVerified: number;
}

/**
 * Record that the user has logged into a platform within the WebView.
 * Called after detecting successful login (e.g., URL changes from login to feed).
 */
export async function markPlatformLoggedIn(platform: string): Promise<void> {
  try {
    const existing = await getLoginStates();
    existing[platform] = {
      platform,
      loggedIn: true,
      lastVerified: Date.now(),
    };
    await AsyncStorage.setItem(LOGIN_STATE_KEY, JSON.stringify(existing));
    addBreadcrumb('cookies', `Marked ${platform} as logged in`);
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to save login state:', error);
    }
  }
}

/**
 * Check if the user has previously logged into a platform.
 * Login states expire after 30 days.
 */
export async function isPlatformLoggedIn(platform: string): Promise<boolean> {
  try {
    const states = await getLoginStates();
    const state = states[platform];
    if (!state?.loggedIn) return false;
    // Expire after 30 days
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - state.lastVerified > thirtyDays) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all platform login states.
 */
async function getLoginStates(): Promise<Record<string, PlatformLoginState>> {
  try {
    const data = await AsyncStorage.getItem(LOGIN_STATE_KEY);
    if (!data) return {};
    // Guard against corrupted or excessively large stored data
    if (data.length > 100_000) {
      if (__DEV__) {
        console.warn('[cookieManager] Login state data too large, resetting');
      }
      await AsyncStorage.removeItem(LOGIN_STATE_KEY);
      return {};
    }
    const parsed = JSON.parse(data);
    // Validate it's a plain object
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, PlatformLoginState>;
  } catch {
    return {};
  }
}

/**
 * Clear login state for a platform (e.g., on explicit logout).
 */
export async function clearPlatformLogin(platform: string): Promise<void> {
  try {
    const existing = await getLoginStates();
    delete existing[platform];
    await AsyncStorage.setItem(LOGIN_STATE_KEY, JSON.stringify(existing));
  } catch {
    // Silently fail
  }
}

/**
 * Clear all cached login states.
 */
export async function clearAllLoginStates(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOGIN_STATE_KEY);
    await AsyncStorage.removeItem(COOKIE_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Detect if a URL indicates the user is logged in for a given platform.
 * Used by WebViewScanner to auto-detect successful login.
 */
export function isLoggedInUrl(platform: string, url: string): boolean {
  const lowerUrl = url.toLowerCase();
  switch (platform) {
    case 'instagram':
      // If we're on the main feed (not login/challenge pages), user is logged in
      return (
        lowerUrl.includes('instagram.com') &&
        !lowerUrl.includes('/accounts/login') &&
        !lowerUrl.includes('/challenge') &&
        !lowerUrl.includes('/consent') &&
        (lowerUrl === 'https://www.instagram.com/' || lowerUrl.includes('instagram.com/?'))
      );
    case 'twitter':
      return (
        (lowerUrl.includes('x.com/home') || lowerUrl.includes('twitter.com/home')) &&
        !lowerUrl.includes('/login') &&
        !lowerUrl.includes('/i/flow')
      );
    case 'youtube':
      return (
        lowerUrl.includes('youtube.com') &&
        !lowerUrl.includes('/signin') &&
        !lowerUrl.includes('accounts.google.com')
      );
    case 'tiktok':
      return (
        lowerUrl.includes('tiktok.com') &&
        !lowerUrl.includes('/login') &&
        (lowerUrl.includes('/foryou') || lowerUrl.includes('/following'))
      );
    case 'facebook':
      return (
        lowerUrl.includes('facebook.com') &&
        !lowerUrl.includes('/login') &&
        !lowerUrl.includes('/checkpoint') &&
        !lowerUrl.includes('/recover')
      );
    case 'reddit':
      return (
        lowerUrl.includes('reddit.com') &&
        !lowerUrl.includes('/login') &&
        !lowerUrl.includes('/register') &&
        !lowerUrl.includes('/account/login')
      );
    default:
      return false;
  }
}
