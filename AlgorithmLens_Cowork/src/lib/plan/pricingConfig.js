/**
 * Pricing Configuration — Single Source of Truth
 *
 * B3 fix: All price values live here. Every component that displays
 * pricing should import from this file instead of hardcoding values.
 *
 * If prices change in Stripe, update ONLY this file to keep
 * the frontend consistent.
 */

export const PRICING = {
  monthly: {
    price: 10,
    display: '$10',
    interval: 'month',
    label: '$10/month',
  },
  annual: {
    price: 96,
    display: '$96',
    interval: 'year',
    label: '$96/year',
    monthlyEquivalent: '$8/month',
  },
  trial: {
    days: 14,
    label: '14-day free trial',
  },
};
