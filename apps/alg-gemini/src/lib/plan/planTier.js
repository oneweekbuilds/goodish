/**
 * Plan Tier State System
 *
 * Single source of truth for plan tier state in the frontend.
 * Supports: anonymous visitors, free users, and Plus users.
 *
 * This is foundational state only. Will be wired to real auth/subscription
 * in later prompts.
 */

// Plan tier constants
export const PLAN_TIERS = {
  ANON: 'anon',
  FREE: 'free',
  PLUS: 'plus',
};

// LocalStorage key for persisting plan tier
const STORAGE_KEY = 'alg_plan_tier';

/**
 * Get stored plan tier from localStorage.
 * Safe for SSR and privacy mode (returns null if unavailable).
 *
 * @returns {string | null} - "anon" | "free" | "plus" | null
 */
export function getStoredPlanTier() {
  if (typeof window === 'undefined') return null; // SSR guard
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Validate stored value
    if (stored && Object.values(PLAN_TIERS).includes(stored)) {
      return stored;
    }
    return null;
  } catch (err) {
    // localStorage unavailable (privacy mode, etc.)
    return null;
  }
}

/**
 * Set plan tier in localStorage.
 * Safe for SSR and privacy mode (fails silently).
 *
 * @param {string} tier - "anon" | "free" | "plus"
 */
export function setStoredPlanTier(tier) {
  if (typeof window === 'undefined') return; // SSR guard
  if (!Object.values(PLAN_TIERS).includes(tier)) {
    console.warn(`[planTier] Invalid tier: ${tier}`);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, tier);
  } catch (err) {
    // localStorage unavailable - fail silently
  }
}

/**
 * Clear plan tier from localStorage.
 * Safe for SSR and privacy mode (fails silently).
 */
export function clearStoredPlanTier() {
  if (typeof window === 'undefined') return; // SSR guard
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    // localStorage unavailable - fail silently
  }
}

/**
 * Check if tier is anonymous.
 * @param {string} tier
 * @returns {boolean}
 */
export function isAnon(tier) {
  return tier === PLAN_TIERS.ANON;
}

/**
 * Check if tier is free.
 * @param {string} tier
 * @returns {boolean}
 */
export function isFree(tier) {
  return tier === PLAN_TIERS.FREE;
}

/**
 * Check if tier is Plus.
 * @param {string} tier
 * @returns {boolean}
 */
export function isPlus(tier) {
  return tier === PLAN_TIERS.PLUS;
}

/**
 * Check if tier can view scan results.
 * Anonymous users cannot view results.
 * Free and Plus users can view results.
 *
 * @param {string} tier
 * @returns {boolean}
 */
export function canViewResults(tier) {
  return isFree(tier) || isPlus(tier);
}

/**
 * Check if tier can view trend charts (time-series views).
 * Only Plus users can view trends.
 *
 * @param {string} tier
 * @returns {boolean}
 */
export function canViewTrends(tier) {
  return isPlus(tier);
}

/**
 * Get current plan tier with demo override support.
 *
 * Resolution order:
 * 1. If demo mode (?demo=1), check for ?demoPlan=plus|free|anon override
 * 2. If demo mode but no demoPlan, default to "free"
 * 3. If not demo mode, use stored plan tier
 * 4. Default to "anon" if nothing is set
 *
 * @param {boolean} isDemoMode - Whether demo mode is active
 * @param {URLSearchParams} searchParams - URL search params (for demo overrides)
 * @returns {string} - "anon" | "free" | "plus"
 */
export function getCurrentPlanTier(isDemoMode = false, searchParams = null) {
  // Demo mode overrides
  if (isDemoMode && searchParams) {
    const demoPlan = searchParams.get('demoPlan');
    if (demoPlan && Object.values(PLAN_TIERS).includes(demoPlan)) {
      return demoPlan;
    }
    // Demo mode defaults to "free" (not plus)
    return PLAN_TIERS.FREE;
  }

  // Non-demo mode: use stored tier or default to anon
  const stored = getStoredPlanTier();
  return stored || PLAN_TIERS.ANON;
}
