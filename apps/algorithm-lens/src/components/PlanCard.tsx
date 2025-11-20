import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Button } from './ui/Button';

interface PlanCardProps {
  name: string;
  tagline?: string;
  price: { monthly: string; annual: string };
  description?: string;
  leadSentence?: string;
  features: string[];
  cta: string;
  isMostPopular?: boolean;
  isCurrent?: boolean;
  billingPeriod: 'monthly' | 'annual';
  accentColor?: string;
  planType: 'free' | 'premium';
  onSelect: () => void;
}

export function PlanCard({
  name,
  tagline,
  price,
  description,
  leadSentence,
  features,
  cta,
  isMostPopular = false,
  isCurrent = false,
  billingPeriod,
  accentColor = '#34D1BF',
  planType,
  onSelect,
}: PlanCardProps) {
  const displayPrice = billingPeriod === 'monthly' ? price.monthly : price.annual;
  const isPro = planType === 'premium';
  const isFree = planType === 'free';
  const tierId = `tier-${name.toLowerCase().replace(/\s+/g, '-').replace(/—/g, '-').replace(/[^\w-]/g, '')}`;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -8 }}
    >
      {isMostPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="px-4 py-1 bg-gradient-to-r from-[#34D1BF] to-[#8B6EF8] text-white text-sm font-semibold shadow-lg" style={{ borderRadius: '8px' }}>
            Most Popular
          </div>
        </div>
      )}

      <div
        className={`h-full p-10 transition-all duration-300 flex flex-col ${
          isPro
            ? 'ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-neutral-900 shadow-md hover:shadow-lg transition-shadow'
            : 'ring-1 ring-black/5 dark:ring-white/5 bg-white/70 dark:bg-neutral-900/60'
        }`}
        style={{
          borderRadius: '8px',
        }}
        aria-labelledby={tierId}
      >
        {/* Plan Name */}
        <div className="mb-6 flex-shrink-0">
          {tagline && (
            <div
              className="inline-block px-3 py-1 mb-3 text-sm"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              {tagline}
            </div>
          )}
          <h3 
            id={tierId}
            className="mb-2"
            style={{ 
              fontSize: '28px', 
              fontWeight: 700,
              fontFamily: 'var(--font-headline)',
            }}
          >
            {name}
          </h3>
          {description && (
            <p className="text-base" style={{ color: 'var(--foreground-tertiary)' }}>
              {description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="mb-8 flex-shrink-0">
          {billingPeriod === 'annual' && isPro ? (
            <>
              <div className="flex items-baseline gap-2">
                <span
                  style={{
                    fontSize: '48px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-headline)',
                  }}
                >
                  $7.99
                </span>
                <span className="text-xl" style={{ color: 'var(--foreground-muted)' }}>
                  / mo
                </span>
              </div>
              <p className="text-sm mt-1" style={{ fontSize: '14px', lineHeight: '22px', color: 'var(--foreground-tertiary)' }}>
                Billed annually - $95.88 today
              </p>
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <span
                style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-headline)',
                }}
              >
                {displayPrice.split('/')[0]}
              </span>
              <span className="text-xl" style={{ color: 'var(--foreground-muted)' }}>
                /{displayPrice.split('/')[1]}
              </span>
            </div>
          )}
        </div>

        {/* Lead Sentence */}
        {leadSentence && (
          <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
            {leadSentence}
          </p>
        )}

        {/* Features */}
        <div className="space-y-3 flex-grow mb-8">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Check size={14} style={{ color: accentColor }} strokeWidth={3} />
                </div>
              </div>
              <span className="text-base leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={onSelect}
          disabled={isCurrent}
          className={`w-full h-12 text-base transition-all duration-300 flex-shrink-0 ${
            isCurrent ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          variant={isPro ? 'default' : 'outline'}
          style={
            isPro && !isCurrent
              ? {
                  background: 'linear-gradient(135deg, #34D1BF 0%, #8B6EF8 100%)',
                  borderRadius: '8px',
                  color: 'white',
                }
              : {
                  borderRadius: '8px',
                }
          }
          aria-label={isCurrent ? (isFree ? 'Starter plan current status' : 'Pro Insights plan current status') : (isPro ? 'Upgrade to Pro Insights' : cta)}
        >
          {isCurrent ? 'Current Plan' : cta}
        </Button>
      </div>
    </motion.div>
  );
}
