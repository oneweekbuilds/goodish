import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { PlanCard } from './PlanCard';
import { BillingToggle } from './BillingToggle';
import { toast } from 'sonner';

interface PricingPageProps {
  currentPlan: 'free' | 'premium';
  onPlanChange: (plan: 'free' | 'premium') => void;
}

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="border-b"
      style={{ borderColor: '#EAEAEA' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left transition-all"
        style={{
          fontSize: '24px',
          lineHeight: '34px',
          fontWeight: 600,
          fontFamily: 'var(--font-headline)',
          color: 'var(--foreground)',
        }}
      >
        <span>{question}</span>
        <ChevronDown 
          size={24}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: '180ms ease-out',
            color: 'var(--brand-purple)',
          }}
        />
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.18 }}
        style={{ overflow: 'hidden' }}
      >
        <p 
          className="pb-6"
          style={{
            fontSize: '16px',
            lineHeight: '26px',
            color: 'var(--foreground-secondary)',
            maxWidth: '720px',
          }}
        >
          {answer}
        </p>
      </motion.div>
    </div>
  );
}

export function PricingPage({ currentPlan, onPlanChange }: PricingPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      name: 'Free',
      tagline: 'See your algorithm',
      description: 'See what your feed really shows you — instantly',
      price: { monthly: '$0/mo', annual: '$0/yr' },
      features: [
        'One platform snapshot',
        'Topic mix visualization',
        'Content tone overview',
        'Top 5 topics & creators',
        'Feed fingerprint chart',
        'Local-only processing',
        '7-day static history',
      ],
      cta: 'Start Free',
      plan: 'free' as const,
      accentColor: '#8BBF9F',
    },
    {
      name: 'Premium',
      tagline: 'Understand & Control',
      description: 'Full algorithmic transparency across all platforms',
      price: { monthly: '$9.99/mo', annual: '$89/yr' },
      features: [
        'All platforms (5+ supported)',
        '7-day & 30-day trend analysis',
        'Per-platform insights & comparison',
        'Sentiment & bias tracking',
        'Brand & product exposure',
        'Influencer network analysis',
        'Custom date ranges & filters',
        'Weekly email digests',
        'Cloud sync & CSV export',
        'AI "Blind Spot" reports',
        'Priority support',
      ],
      cta: 'Upgrade to Premium',
      plan: 'premium' as const,
      isMostPopular: true,
      accentColor: '#7D66E6',
    },
  ];

  const handlePlanSelect = (plan: 'free' | 'premium') => {
    if (plan === currentPlan) return;
    
    onPlanChange(plan);
    toast.success(`Upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)}! 🎉`);
  };

  return (
    <div className="min-h-screen px-6 md:px-8 bg-background" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 
            className="mb-4 tracking-tight" 
            style={{ 
              fontSize: 'clamp(40px, 6vw, 56px)', 
              fontWeight: 800,
              lineHeight: '1.1',
              fontFamily: 'var(--font-headline)',
            }}
          >
            See. Understand. Control.
          </h1>
          <p className="text-xl leading-relaxed mb-8" style={{ color: 'var(--foreground-secondary)' }}>
            Choose the level of insight that's right for you. Upgrade or downgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center" style={{ marginBottom: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
          </div>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)', marginBottom: 'var(--spacing-md)' }}>
            Save up to 17% with annual billing
          </p>
        </motion.div>

        {/* Benefits Text */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ marginTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}
        >
          <ul className="flex flex-wrap items-center justify-center gap-6" style={{ fontSize: '18px', lineHeight: '28px', color: 'var(--foreground-secondary)' }}>
            <li className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="#3ED6B2" opacity="0.1" />
                <path d="M6 10 L9 13 L14 7" stroke="#3ED6B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Privacy-first
            </li>
            <li className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="#3ED6B2" opacity="0.1" />
                <path d="M6 10 L9 13 L14 7" stroke="#3ED6B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Local processing
            </li>
            <li className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="#3ED6B2" opacity="0.1" />
                <path d="M6 10 L9 13 L14 7" stroke="#3ED6B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Delete data anytime
            </li>
            <li className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="#3ED6B2" opacity="0.1" />
                <path d="M6 10 L9 13 L14 7" stroke="#3ED6B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              No ads. Your data, your control.
            </li>
          </ul>
        </motion.div>

        {/* Plan Cards - now 2 columns */}
        <div className="grid md:grid-cols-2 gap-8 mb-16" style={{ maxWidth: '900px', margin: '0 auto' }}>
          {plans.map((plan, i) => (
            <PlanCard
              key={i}
              name={plan.name}
              tagline={plan.tagline}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              cta={plan.cta}
              isMostPopular={plan.isMostPopular}
              isCurrent={currentPlan === plan.plan}
              billingPeriod={billingPeriod}
              accentColor={plan.accentColor}
              onSelect={() => handlePlanSelect(plan.plan)}
            />
          ))}
        </div>

        {/* FAQ as Accordion */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 
            className="mb-8 text-center"
            style={{ 
              fontSize: '36px',
              lineHeight: '46px',
              fontWeight: 700,
              fontFamily: 'var(--font-headline)',
              color: 'var(--foreground)',
            }}
          >
            Frequently Asked Questions
          </h2>
          <div className="space-y-0">
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes! Upgrade or downgrade whenever you want. Changes take effect immediately.',
              },
              {
                q: 'Is my data safe?',
                a: 'Absolutely. We process everything locally on your device. You can delete all your data anytime from your account settings.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards and PayPal. All transactions are secure and encrypted.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee. If you are not satisfied, contact us for a full refund.',
              },
            ].map((faq, i) => (
              <AccordionItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
