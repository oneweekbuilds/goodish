import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Button } from './ui/button';

interface PlanCardProps {
  name: string;
  tagline?: string;
  price: { monthly: string; annual: string };
  description: string;
  features: string[];
  cta: string;
  isMostPopular?: boolean;
  isCurrent?: boolean;
  billingPeriod: 'monthly' | 'annual';
  accentColor?: string;
  onSelect: () => void;
}

export function PlanCard({
  name,
  tagline,
  price,
  description,
  features,
  cta,
  isMostPopular = false,
  isCurrent = false,
  billingPeriod,
  accentColor = '#34D1BF',
  onSelect,
}: PlanCardProps) {
  const displayPrice = billingPeriod === 'monthly' ? price.monthly : price.annual;
  const isPro = name === 'Pro';

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
          <div className="px-4 py-1 rounded-full bg-gradient-to-r from-[#34D1BF] to-[#8B6EF8] text-white text-sm font-semibold shadow-lg">
            Most Popular
          </div>
        </div>
      )}

      <div
        className={`h-full p-8 rounded-3xl bg-white transition-all duration-300 ${
          isPro 
            ? 'border-2 border-foreground shadow-xl' 
            : 'border border-gray-200 shadow-md'
        }`}
        style={{
          boxShadow: isPro 
            ? '0 8px 24px rgba(0, 0, 0, 0.12)' 
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Plan Name */}
        <div className="mb-6">
          {tagline && (
            <div 
              className="inline-block px-3 py-1 rounded-full mb-3 text-sm"
              style={{ 
                backgroundColor: `${accentColor}20`,
                color: accentColor,
                fontWeight: 600,
              }}
            >
              {tagline}
            </div>
          )}
          <h3 
            className="mb-2"
            style={{ 
              fontSize: '28px', 
              fontWeight: 700,
              fontFamily: 'var(--font-headline)',
            }}
          >
            {name}
          </h3>
          <p className="text-base" style={{ color: 'var(--foreground-tertiary)' }}>
            {description}
          </p>
        </div>

        {/* Price */}
        <div className="mb-8">
          {billingPeriod === 'annual' && name !== 'Free' ? (
            <>
              <div className="flex items-baseline gap-2">
                <span 
                  style={{ 
                    fontSize: '48px', 
                    fontWeight: 700,
                    fontFamily: 'var(--font-headline)',
                  }}
                >
                  {name === 'Pro' ? '$4.08' : '$7.42'}
                </span>
                <span className="text-xl" style={{ color: 'var(--foreground-muted)' }}>
                  /mo
                </span>
              </div>
              <p className="text-sm mt-1" style={{ fontSize: '14px', lineHeight: '22px', color: 'var(--foreground-tertiary)' }}>
                Billed annually — {name === 'Pro' ? '$49' : '$89'} due today
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

        {/* CTA */}
        <Button
          onClick={onSelect}
          disabled={isCurrent}
          className={`w-full h-12 text-base mb-8 transition-all duration-300 ${
            isCurrent ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          variant={isPro ? 'default' : 'outline'}
          style={
            isPro && !isCurrent
              ? {
                  background: 'linear-gradient(135deg, #34D1BF 0%, #8B6EF8 100%)',
                }
              : undefined
          }
        >
          {isCurrent ? 'Current Plan' : cta}
        </Button>

        {/* Features */}
        <div className="space-y-3">
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
      </div>
    </motion.div>
  );
}
