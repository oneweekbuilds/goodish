import { motion } from 'motion/react';

interface BillingToggleProps {
  value: 'monthly' | 'annual';
  onChange: (value: 'monthly' | 'annual') => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center gap-3 p-1 rounded-full bg-gray-100 border border-gray-200">
      <button
        onClick={() => onChange('monthly')}
        className={`relative px-6 py-2 rounded-full text-base font-medium transition-all duration-300 ${
          value === 'monthly' ? 'text-white' : 'text-foreground-secondary'
        }`}
      >
        {value === 'monthly' && (
          <motion.div
            layoutId="billingToggle"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#34D1BF] to-[#8B6EF8]"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <span className="relative z-10">Monthly</span>
      </button>

      <button
        onClick={() => onChange('annual')}
        className={`relative px-6 py-2 rounded-full text-base font-medium transition-all duration-300 ${
          value === 'annual' ? 'text-white' : 'text-foreground-secondary'
        }`}
      >
        {value === 'annual' && (
          <motion.div
            layoutId="billingToggle"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#34D1BF] to-[#8B6EF8]"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <span className="relative z-10">Annual</span>
      </button>
    </div>
  );
}
