/**
 * Comprehensive tests for planTier.js — plan tier state and entitlement predicates.
 *
 * Tests cover:
 * - PLAN_TIERS constants
 * - Tier predicate functions (isAnon, isFree, isPlus)
 * - Entitlement checks (canViewResults, canViewTrends)
 * - localStorage operations with mocking
 * - getCurrentPlanTier with demo and non-demo modes
 * - Subscription status management
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PLAN_TIERS,
  isAnon,
  isFree,
  isPlus,
  canViewResults,
  canViewTrends,
  getCurrentPlanTier,
  getStoredPlanTier,
  setStoredPlanTier,
  clearStoredPlanTier,
  getStoredSubscriptionStatus,
  setStoredSubscriptionStatus,
} from './planTier.js';

// Mock errorLogger
vi.mock('../errorLogger.js', () => ({
  logWarning: vi.fn(),
}));

// Setup localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
// planTier.js guards on `typeof window !== 'undefined'` — define window for node env
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}

// ─── PLAN_TIERS Constants ─────────────────────────────────
describe('PLAN_TIERS constants', () => {
  test('PLAN_TIERS.ANON equals "anon"', () => {
    expect(PLAN_TIERS.ANON).toBe('anon');
  });

  test('PLAN_TIERS.FREE equals "free"', () => {
    expect(PLAN_TIERS.FREE).toBe('free');
  });

  test('PLAN_TIERS.PLUS equals "plus"', () => {
    expect(PLAN_TIERS.PLUS).toBe('plus');
  });

  test('PLAN_TIERS has exactly 3 properties', () => {
    expect(Object.keys(PLAN_TIERS).length).toBe(3);
  });

  test('all constants are lowercase strings', () => {
    Object.values(PLAN_TIERS).forEach((tier) => {
      expect(typeof tier).toBe('string');
      expect(tier).toBe(tier.toLowerCase());
    });
  });
});

// ─── Tier Predicate Functions ─────────────────────────────
describe('isAnon', () => {
  test('returns true for PLAN_TIERS.ANON', () => {
    expect(isAnon(PLAN_TIERS.ANON)).toBe(true);
  });

  test('returns true for "anon" string', () => {
    expect(isAnon('anon')).toBe(true);
  });

  test('returns false for PLAN_TIERS.FREE', () => {
    expect(isAnon(PLAN_TIERS.FREE)).toBe(false);
  });

  test('returns false for PLAN_TIERS.PLUS', () => {
    expect(isAnon(PLAN_TIERS.PLUS)).toBe(false);
  });

  test('returns false for "free"', () => {
    expect(isAnon('free')).toBe(false);
  });

  test('returns false for "plus"', () => {
    expect(isAnon('plus')).toBe(false);
  });

  test('returns false for invalid tier', () => {
    expect(isAnon('invalid')).toBe(false);
  });

  test('returns false for null', () => {
    expect(isAnon(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isAnon(undefined)).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isAnon('')).toBe(false);
  });
});

describe('isFree', () => {
  test('returns true for PLAN_TIERS.FREE', () => {
    expect(isFree(PLAN_TIERS.FREE)).toBe(true);
  });

  test('returns true for "free" string', () => {
    expect(isFree('free')).toBe(true);
  });

  test('returns false for PLAN_TIERS.ANON', () => {
    expect(isFree(PLAN_TIERS.ANON)).toBe(false);
  });

  test('returns false for PLAN_TIERS.PLUS', () => {
    expect(isFree(PLAN_TIERS.PLUS)).toBe(false);
  });

  test('returns false for "anon"', () => {
    expect(isFree('anon')).toBe(false);
  });

  test('returns false for "plus"', () => {
    expect(isFree('plus')).toBe(false);
  });

  test('returns false for invalid tier', () => {
    expect(isFree('invalid')).toBe(false);
  });

  test('returns false for null', () => {
    expect(isFree(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isFree(undefined)).toBe(false);
  });
});

describe('isPlus', () => {
  test('returns true for PLAN_TIERS.PLUS', () => {
    expect(isPlus(PLAN_TIERS.PLUS)).toBe(true);
  });

  test('returns true for "plus" string', () => {
    expect(isPlus('plus')).toBe(true);
  });

  test('returns false for PLAN_TIERS.ANON', () => {
    expect(isPlus(PLAN_TIERS.ANON)).toBe(false);
  });

  test('returns false for PLAN_TIERS.FREE', () => {
    expect(isPlus(PLAN_TIERS.FREE)).toBe(false);
  });

  test('returns false for "anon"', () => {
    expect(isPlus('anon')).toBe(false);
  });

  test('returns false for "free"', () => {
    expect(isPlus('free')).toBe(false);
  });

  test('returns false for invalid tier', () => {
    expect(isPlus('invalid')).toBe(false);
  });

  test('returns false for null', () => {
    expect(isPlus(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isPlus(undefined)).toBe(false);
  });
});

// ─── Entitlement Checks ────────────────────────────────────
describe('canViewResults', () => {
  test('returns true for PLAN_TIERS.FREE', () => {
    expect(canViewResults(PLAN_TIERS.FREE)).toBe(true);
  });

  test('returns true for "free"', () => {
    expect(canViewResults('free')).toBe(true);
  });

  test('returns true for PLAN_TIERS.PLUS', () => {
    expect(canViewResults(PLAN_TIERS.PLUS)).toBe(true);
  });

  test('returns true for "plus"', () => {
    expect(canViewResults('plus')).toBe(true);
  });

  test('returns false for PLAN_TIERS.ANON', () => {
    expect(canViewResults(PLAN_TIERS.ANON)).toBe(false);
  });

  test('returns false for "anon"', () => {
    expect(canViewResults('anon')).toBe(false);
  });

  test('returns false for invalid tier', () => {
    expect(canViewResults('invalid')).toBe(false);
  });

  test('returns false for null', () => {
    expect(canViewResults(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(canViewResults(undefined)).toBe(false);
  });
});

describe('canViewTrends', () => {
  test('returns true for PLAN_TIERS.PLUS', () => {
    expect(canViewTrends(PLAN_TIERS.PLUS)).toBe(true);
  });

  test('returns true for "plus"', () => {
    expect(canViewTrends('plus')).toBe(true);
  });

  test('returns false for PLAN_TIERS.FREE', () => {
    expect(canViewTrends(PLAN_TIERS.FREE)).toBe(false);
  });

  test('returns false for "free"', () => {
    expect(canViewTrends('free')).toBe(false);
  });

  test('returns false for PLAN_TIERS.ANON', () => {
    expect(canViewTrends(PLAN_TIERS.ANON)).toBe(false);
  });

  test('returns false for "anon"', () => {
    expect(canViewTrends('anon')).toBe(false);
  });

  test('returns false for invalid tier', () => {
    expect(canViewTrends('invalid')).toBe(false);
  });

  test('returns false for null', () => {
    expect(canViewTrends(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(canViewTrends(undefined)).toBe(false);
  });
});

// ─── localStorage Operations ──────────────────────────────
describe('getStoredPlanTier and setStoredPlanTier', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  test('getStoredPlanTier returns null when nothing is stored', () => {
    localStorageMock.getItem.mockReturnValueOnce(null);
    expect(getStoredPlanTier()).toBeNull();
  });

  test('setStoredPlanTier stores valid tier "free"', () => {
    setStoredPlanTier('free');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('alg_plan_tier', 'free');
  });

  test('setStoredPlanTier stores valid tier "plus"', () => {
    setStoredPlanTier('plus');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('alg_plan_tier', 'plus');
  });

  test('setStoredPlanTier stores valid tier "anon"', () => {
    setStoredPlanTier('anon');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('alg_plan_tier', 'anon');
  });

  test('setStoredPlanTier does not store invalid tier', () => {
    setStoredPlanTier('invalid');
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  test('setStoredPlanTier does not store null', () => {
    setStoredPlanTier(null);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  test('getStoredPlanTier returns stored tier when valid', () => {
    localStorageMock.getItem.mockReturnValueOnce('free');
    expect(getStoredPlanTier()).toBe('free');
  });

  test('getStoredPlanTier returns null for invalid stored value', () => {
    localStorageMock.getItem.mockReturnValueOnce('garbage');
    expect(getStoredPlanTier()).toBeNull();
  });

  test('getStoredPlanTier returns null for empty string', () => {
    localStorageMock.getItem.mockReturnValueOnce('');
    expect(getStoredPlanTier()).toBeNull();
  });
});

describe('clearStoredPlanTier', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  test('clearStoredPlanTier removes the stored key', () => {
    clearStoredPlanTier();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('alg_plan_tier');
  });

  test('clearStoredPlanTier works when called multiple times', () => {
    clearStoredPlanTier();
    clearStoredPlanTier();
    expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2);
  });
});

// ─── Subscription Status ───────────────────────────────────
describe('getStoredSubscriptionStatus and setStoredSubscriptionStatus', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  test('setStoredSubscriptionStatus stores "active"', () => {
    setStoredSubscriptionStatus('active');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('alg_subscription_status', 'active');
  });

  test('setStoredSubscriptionStatus stores "trialing"', () => {
    setStoredSubscriptionStatus('trialing');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('alg_subscription_status', 'trialing');
  });

  test('setStoredSubscriptionStatus stores "past_due"', () => {
    setStoredSubscriptionStatus('past_due');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('alg_subscription_status', 'past_due');
  });

  test('setStoredSubscriptionStatus removes when null', () => {
    setStoredSubscriptionStatus(null);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('alg_subscription_status');
  });

  test('getStoredSubscriptionStatus returns stored value', () => {
    localStorageMock.getItem.mockReturnValueOnce('past_due');
    expect(getStoredSubscriptionStatus()).toBe('past_due');
  });

  test('getStoredSubscriptionStatus returns null when empty', () => {
    localStorageMock.getItem.mockReturnValueOnce(null);
    expect(getStoredSubscriptionStatus()).toBeNull();
  });
});

// ─── getCurrentPlanTier ────────────────────────────────────
describe('getCurrentPlanTier', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('non-demo mode (isDemoMode=false)', () => {
    test('returns stored tier when available', () => {
      localStorageMock.getItem.mockReturnValueOnce('plus');
      expect(getCurrentPlanTier(false, null)).toBe('plus');
    });

    test('returns stored "free" tier', () => {
      localStorageMock.getItem.mockReturnValueOnce('free');
      expect(getCurrentPlanTier(false, null)).toBe('free');
    });

    test('returns stored "anon" tier', () => {
      localStorageMock.getItem.mockReturnValueOnce('anon');
      expect(getCurrentPlanTier(false, null)).toBe('anon');
    });

    test('returns "anon" when nothing stored', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      expect(getCurrentPlanTier(false, null)).toBe('anon');
    });

    test('returns "anon" when invalid tier stored', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid');
      expect(getCurrentPlanTier(false, null)).toBe('anon');
    });

    test('ignores demoPlan param in searchParams', () => {
      localStorageMock.getItem.mockReturnValueOnce('free');
      const params = new URLSearchParams('demoPlan=plus');
      expect(getCurrentPlanTier(false, params)).toBe('free');
    });

    test('ignores searchParams even if null', () => {
      localStorageMock.getItem.mockReturnValueOnce('plus');
      expect(getCurrentPlanTier(false)).toBe('plus');
    });
  });

  describe('demo mode (isDemoMode=true)', () => {
    test('demo mode without demoPlan defaults to "free"', () => {
      const params = new URLSearchParams();
      expect(getCurrentPlanTier(true, params)).toBe('free');
    });

    test('demo mode with demoPlan=plus returns "plus"', () => {
      const params = new URLSearchParams('demoPlan=plus');
      expect(getCurrentPlanTier(true, params)).toBe('plus');
    });

    test('demo mode with demoPlan=free returns "free"', () => {
      const params = new URLSearchParams('demoPlan=free');
      expect(getCurrentPlanTier(true, params)).toBe('free');
    });

    test('demo mode with demoPlan=anon returns "anon"', () => {
      const params = new URLSearchParams('demoPlan=anon');
      expect(getCurrentPlanTier(true, params)).toBe('anon');
    });

    test('demo mode with invalid demoPlan defaults to "free"', () => {
      const params = new URLSearchParams('demoPlan=invalid');
      expect(getCurrentPlanTier(true, params)).toBe('free');
    });

    test('demo mode with null searchParams falls through to stored/anon', () => {
      // When searchParams is null, `isDemoMode && searchParams` is falsy,
      // so the code falls through to the non-demo path (stored tier or 'anon')
      localStorageMock.getItem.mockReturnValueOnce(null);
      expect(getCurrentPlanTier(true, null)).toBe('anon');
    });

    test('demo mode with undefined searchParams falls through to stored/anon', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      expect(getCurrentPlanTier(true)).toBe('anon');
    });

    test('demo mode ignores stored tier', () => {
      // Note: don't use mockReturnValueOnce here because the demo path
      // never calls getItem — an unconsumed mock leaks to the next test.
      // Instead, put the value in the actual store.
      localStorageMock.setItem('alg_plan_tier', 'plus');
      const params = new URLSearchParams();
      expect(getCurrentPlanTier(true, params)).toBe('free');
    });
  });

  describe('default parameters', () => {
    test('isDemoMode defaults to false, returns stored or anon', () => {
      // Ensure store is empty so getStoredPlanTier returns null → 'anon'
      localStorageMock.clear();
      localStorageMock.getItem.mockReturnValueOnce(null);
      const result = getCurrentPlanTier();
      expect(result).toBe('anon');
    });

    test('searchParams defaults to null', () => {
      localStorageMock.clear();
      localStorageMock.getItem.mockReturnValueOnce(null);
      expect(getCurrentPlanTier(false)).toBe('anon');
    });
  });

  describe('edge cases', () => {
    test('demo mode true with empty searchParams uses defaults', () => {
      const params = new URLSearchParams();
      expect(getCurrentPlanTier(true, params)).toBe('free');
    });

    test('non-demo mode with searchParams containing demoPlan still uses stored', () => {
      localStorageMock.getItem.mockReturnValueOnce('anon');
      const params = new URLSearchParams('demoPlan=plus');
      expect(getCurrentPlanTier(false, params)).toBe('anon');
    });

    test('demo mode with searchParams and multiple params', () => {
      const params = new URLSearchParams('demoPlan=plus&other=value&more=data');
      expect(getCurrentPlanTier(true, params)).toBe('plus');
    });
  });
});
