/**
 * Plan Tier Module
 * Single source of truth for plan tier state in the frontend.
 */

export {
  PLAN_TIERS,
  getStoredPlanTier,
  setStoredPlanTier,
  clearStoredPlanTier,
  isAnon,
  isFree,
  isPlus,
  canViewResults,
  canViewTrends,
  getCurrentPlanTier,
} from './planTier';
