import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface BillingToggleProps {
    value: 'monthly' | 'annual';
    onChange: (value: 'monthly' | 'annual') => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
    return (
        <div className="inline-flex items-center gap-1 p-1 bg-neutral-150 rounded-lg border border-neutral-200">
            <button
                onClick={() => onChange('monthly')}
                className={cn(
                    "relative px-6 py-2 text-sm font-medium transition-all duration-300 rounded-md",
                    value === 'monthly' ? "text-white" : "text-neutral-graphite hover:text-primary-indigo"
                )}
            >
                {value === 'monthly' && (
                    <motion.div
                        layoutId="billingToggle"
                        className="absolute inset-0 bg-primary-teal rounded-md shadow-sm"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                )}
                <span className="relative z-10">Monthly</span>
            </button>

            <button
                onClick={() => onChange('annual')}
                className={cn(
                    "relative px-6 py-2 text-sm font-medium transition-all duration-300 rounded-md",
                    value === 'annual' ? "text-white" : "text-neutral-graphite hover:text-primary-indigo"
                )}
            >
                {value === 'annual' && (
                    <motion.div
                        layoutId="billingToggle"
                        className="absolute inset-0 bg-primary-teal rounded-md shadow-sm"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                )}
                <span className="relative z-10">Annual</span>
            </button>
        </div>
    );
}
