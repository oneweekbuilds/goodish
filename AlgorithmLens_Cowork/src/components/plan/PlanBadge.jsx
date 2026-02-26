import React from 'react';
import { PLAN_TIERS } from '../../lib/plan';

/**
 * PlanBadge - Display tier badge for Free/Plus users
 *
 * Props:
 * - tier: "anon" | "free" | "plus"
 * - size: "sm" (default)
 *
 * Renders nothing for anonymous users.
 */
const PlanBadge = ({ tier, size = 'sm' }) => {
  // Don't show badge for anonymous users
  if (tier === PLAN_TIERS.ANON) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
  };

  const tierConfig = {
    [PLAN_TIERS.FREE]: {
      label: 'Free',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-700',
      borderColor: 'border-slate-300',
    },
    [PLAN_TIERS.PLUS]: {
      label: 'Plus',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-300',
    },
  };

  const config = tierConfig[tier] || tierConfig[PLAN_TIERS.FREE];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
};

export default PlanBadge;
