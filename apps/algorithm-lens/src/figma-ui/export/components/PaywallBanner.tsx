import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PaywallBannerProps {
  minPlan: 'premium';
  featureName: string;
  benefits: string[];
  price: string;
  onUpgrade: () => void;
  onLearnMore: () => void;
}

export function PaywallBanner({
  minPlan,
  featureName,
  benefits,
  price,
  onUpgrade,
  onLearnMore,
}: PaywallBannerProps) {
  return (
    <motion.div
      className="p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#34D1BF]/10 to-[#8B6EF8]/10 flex items-center justify-center">
          <Sparkles size={24} style={{ color: '#8B6EF8' }} />
        </div>
        <div className="flex-1">
          <h3 
            className="mb-1"
            style={{ 
              fontSize: '20px', 
              fontWeight: 600,
              fontFamily: 'var(--font-headline)',
            }}
          >
            Unlock Deeper Insights
          </h3>
          <p className="text-base" style={{ color: 'var(--foreground-tertiary)' }}>
            {featureName} is available on Premium ({price})
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-8 space-y-3">
        {benefits.map((benefit, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#34D1BF] to-[#8B6EF8] mt-2" />
            <span className="text-base leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
              {benefit}
            </span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onUpgrade}
          className="flex-1 h-12 text-base shadow-lg hover:shadow-xl transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #34D1BF 0%, #8B6EF8 100%)',
            color: 'white',
          }}
        >
          Upgrade to Premium
          <ArrowRight className="ml-2" size={18} />
        </Button>
        <Button
          onClick={onLearnMore}
          variant="outline"
          className="flex-1 h-12 text-base border-2"
        >
          Learn More
        </Button>
      </div>
    </motion.div>
  );
}




