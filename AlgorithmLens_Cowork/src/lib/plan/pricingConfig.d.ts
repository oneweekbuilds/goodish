/**
 * Pricing Configuration - Type declarations
 */

export interface PricingTier {
  price: number;
  display: string;
  interval: string;
  label: string;
  monthlyEquivalent?: string;
}

export interface TrialConfig {
  days: number;
  label: string;
}

export const PRICING: {
  monthly: PricingTier;
  annual: PricingTier;
  trial: TrialConfig;
};
