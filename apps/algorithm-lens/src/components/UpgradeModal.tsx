import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { BillingToggle } from './BillingToggle';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  benefits: string[];
  targetPlan: 'pro' | 'plus';
  onUpgrade: (plan: 'pro' | 'plus', billing: 'monthly' | 'annual') => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  featureName,
  benefits,
  targetPlan,
  onUpgrade,
}: UpgradeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const pricing = {
    pro: { monthly: '$4.99/mo', annual: '$49/yr' },
    plus: { monthly: '$9.99/mo', annual: '$89/yr' },
  };

  const displayPrice = billingPeriod === 'monthly' 
    ? pricing[targetPlan].monthly 
    : pricing[targetPlan].annual;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            style={{ backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              className="bg-white rounded-3xl p-10 max-w-lg w-full relative"
              style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)' }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200"
              >
                <X size={20} style={{ color: 'var(--foreground-secondary)' }} />
              </button>

              {/* Content */}
              <div className="mb-8">
                <h2 
                  className="mb-3"
                  style={{ 
                    fontSize: '32px', 
                    fontWeight: 700,
                    fontFamily: 'var(--font-headline)',
                    lineHeight: '1.2',
                  }}
                >
                  Unlock {featureName}
                </h2>
                <p className="text-lg" style={{ color: 'var(--foreground-secondary)' }}>
                  Available on {targetPlan === 'pro' ? 'Pro' : 'Plus'}
                </p>
              </div>

              {/* Benefits */}
              <div className="mb-8 space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#34D1BF]/20 to-[#8B6EF8]/20 flex items-center justify-center mt-0.5">
                      <Check size={16} style={{ color: '#34D1BF' }} strokeWidth={3} />
                    </div>
                    <span className="text-base leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-medium">Billing</span>
                  <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span 
                    style={{ 
                      fontSize: '40px', 
                      fontWeight: 700,
                      fontFamily: 'var(--font-headline)',
                    }}
                  >
                    {displayPrice.split('/')[0]}
                  </span>
                  <span className="text-lg" style={{ color: 'var(--foreground-muted)' }}>
                    /{displayPrice.split('/')[1]}
                  </span>
                </div>
                {billingPeriod === 'annual' && (
                  <p className="text-sm mt-2" style={{ color: 'var(--foreground-tertiary)' }}>
                    {targetPlan === 'pro' ? 'Save $10/year' : 'Save $31/year'}
                  </p>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => onUpgrade(targetPlan, billingPeriod)}
                  className="w-full h-12 text-base shadow-xl hover:shadow-2xl transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #34D1BF 0%, #8B6EF8 100%)',
                  }}
                >
                  Upgrade to {targetPlan === 'pro' ? 'Pro' : 'Plus'}
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="w-full h-12 text-base"
                >
                  Keep Free
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
