/**
 * Plan Tier State System - Type declarations
 */

export const PLAN_TIERS: {
  readonly ANON: 'anon';
  readonly FREE: 'free';
  readonly PLUS: 'plus';
};

export type PlanTierValue = 'anon' | 'free' | 'plus';

export function getStoredPlanTier(): PlanTierValue | null;
export function setStoredPlanTier(tier: PlanTierValue): void;
export function clearStoredPlanTier(): void;
export function isAnon(tier: string): boolean;
export function isFree(tier: string): boolean;
export function isPlus(tier: string): boolean;
export function canViewResults(tier: string): boolean;
export function canViewTrends(tier: string): boolean;
export function getStoredSubscriptionStatus(): string | null;
export function setStoredSubscriptionStatus(status: string | null): void;
export function getCurrentPlanTier(isDemoMode?: boolean, searchParams?: URLSearchParams | null): PlanTierValue;
