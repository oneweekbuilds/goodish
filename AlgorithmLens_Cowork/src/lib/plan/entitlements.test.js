/**
 * Tests for entitlements.js — subscription sync logic.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies before importing
vi.mock('../api/authenticatedFetch', () => ({
  authenticatedFetch: vi.fn(),
  isUnauthorized: vi.fn((r) => r?.status === 401),
}));
vi.mock('../apiConfig', () => ({
  getApiBaseUrl: vi.fn(() => 'https://api.test'),
}));
vi.mock('./planTier', () => ({
  PLAN_TIERS: { ANON: 'anon', FREE: 'free', PLUS: 'plus' },
  setStoredPlanTier: vi.fn(),
  setStoredSubscriptionStatus: vi.fn(),
}));
vi.mock('../errorLogger.js', () => ({
  logError: vi.fn(),
}));
vi.mock('../sentry.js', () => ({
  setSentryUser: vi.fn(),
}));

import { syncPlanTierFromEntitlements, fetchEntitlements } from './entitlements.js';
import { authenticatedFetch } from '../api/authenticatedFetch';
import { setStoredPlanTier, setStoredSubscriptionStatus } from './planTier';
import { setSentryUser } from '../sentry.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('syncPlanTierFromEntitlements', () => {
  test('skips sync in demo mode', async () => {
    const result = await syncPlanTierFromEntitlements({ isDemoMode: true, authReady: true, hasSession: true });
    expect(result).toEqual({ synced: false, reason: 'demo' });
    expect(setStoredPlanTier).not.toHaveBeenCalled();
  });

  test('skips sync when auth is not ready', async () => {
    const result = await syncPlanTierFromEntitlements({ isDemoMode: false, authReady: false, hasSession: false });
    expect(result).toEqual({ synced: false, reason: 'auth_not_ready' });
  });

  test('sets anon when no session', async () => {
    const result = await syncPlanTierFromEntitlements({ isDemoMode: false, authReady: true, hasSession: false });
    expect(result).toEqual({ synced: true, tier: 'anon' });
    expect(setStoredPlanTier).toHaveBeenCalledWith('anon');
  });

  test('sets plus when entitlements.is_plus is true', async () => {
    authenticatedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ is_plus: true, subscription: { status: 'active' } }),
    });
    const result = await syncPlanTierFromEntitlements({ isDemoMode: false, authReady: true, hasSession: true });
    expect(result.synced).toBe(true);
    expect(result.tier).toBe('plus');
    expect(result.subscriptionStatus).toBe('active');
    expect(setStoredPlanTier).toHaveBeenCalledWith('plus');
    expect(setStoredSubscriptionStatus).toHaveBeenCalledWith('active');
    expect(setSentryUser).toHaveBeenCalledWith(undefined, 'plus');
  });

  test('sets free when entitlements.is_plus is false', async () => {
    authenticatedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ is_plus: false, subscription: { status: 'trialing' } }),
    });
    const result = await syncPlanTierFromEntitlements({ isDemoMode: false, authReady: true, hasSession: true });
    expect(result.synced).toBe(true);
    expect(result.tier).toBe('free');
    expect(setSentryUser).toHaveBeenCalledWith(undefined, 'free');
  });

  test('sets anon on 401 unauthorized response', async () => {
    authenticatedFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });
    const result = await syncPlanTierFromEntitlements({ isDemoMode: false, authReady: true, hasSession: true });
    expect(result.synced).toBe(true);
    expect(result.tier).toBe('anon');
  });

  test('fails closed to free on entitlements error', async () => {
    authenticatedFetch.mockRejectedValue(new Error('Network error'));
    const result = await syncPlanTierFromEntitlements({ isDemoMode: false, authReady: true, hasSession: true });
    expect(result.synced).toBe(false);
    expect(result.reason).toBe('entitlements_error');
    expect(result.error).toContain('Unable to check subscription');
    expect(setStoredPlanTier).toHaveBeenCalledWith('free');
  });

  test('handles subscription without status field', async () => {
    authenticatedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ is_plus: true }),
    });
    const result = await syncPlanTierFromEntitlements({ isDemoMode: false, authReady: true, hasSession: true });
    expect(result.synced).toBe(true);
    expect(setStoredSubscriptionStatus).toHaveBeenCalledWith(null);
  });
});

describe('fetchEntitlements', () => {
  test('returns entitlements data on success', async () => {
    const mockData = { is_plus: true, subscription: { status: 'active' } };
    authenticatedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    });
    const result = await fetchEntitlements();
    expect(result).toEqual(mockData);
  });

  test('returns null on 401', async () => {
    authenticatedFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });
    const result = await fetchEntitlements();
    expect(result).toBeNull();
  });

  test('throws on non-401 error response', async () => {
    authenticatedFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'Server error' }),
    });
    await expect(fetchEntitlements()).rejects.toThrow('Server error');
  });

  test('throws user-friendly message on network error', async () => {
    authenticatedFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(fetchEntitlements()).rejects.toThrow('Unable to check subscription');
  });
});
