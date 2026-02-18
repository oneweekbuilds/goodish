import React from 'react';
import { PRICING } from '../../lib/plan/pricingConfig';

/**
 * UpgradeCTA - Consistent upgrade button across the app
 *
 * Props:
 * - onClick: callback function
 * - variant: "primary" (default) or "secondary"
 * - label: button text (default uses PRICING.trial.days from pricingConfig)
 *
 * M2 fix: Default label now references PRICING config instead of hardcoded "14 days".
 */
const UpgradeCTA = ({
  onClick,
  variant = 'primary',
  label = `Try free for ${PRICING.trial.days} days`,
}) => {
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-primary-blue to-blue-600 text-white hover:shadow-lg hover:shadow-primary-blue/20 hover:-translate-y-0.5 border-transparent',
    secondary:
      'bg-white text-primary-blue border-primary-blue hover:bg-primary-blue/5',
  };

  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-full font-semibold text-sm md:text-base border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 ${variantClasses[variant]}`}
    >
      {label}
    </button>
  );
};

export default UpgradeCTA;
