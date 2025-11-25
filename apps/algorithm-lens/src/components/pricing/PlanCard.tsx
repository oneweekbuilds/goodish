import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tag } from '../ui/Tag';
import { cn } from '../../lib/utils';

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
    accentColor = '#4AB8B0',
    planType,
    onSelect,
}: PlanCardProps) {
    const displayPrice = billingPeriod === 'monthly' ? price.monthly : price.annual;
    const isPro = planType === 'premium';
    const isFree = planType === 'free';
    const tierId = `tier-${name.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <motion.div
            className="relative h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -8 }}
        >
            {isMostPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Tag variant="secondary" className="shadow-lg border border-primary-indigo/20">
                        Most Popular
                    </Tag>
                </div>
            )}

            <Card
                className={cn(
                    "h-full p-8 flex flex-col transition-all duration-300",
                    isPro
                        ? "bg-white border-primary-teal/20 shadow-post hover:shadow-insight"
                        : "bg-neutral-50/50 border-neutral-150 hover:bg-white"
                )}
                aria-labelledby={tierId}
            >
                {/* Plan Name */}
                <div className="mb-6 flex-shrink-0">
                    {tagline && (
                        <Tag variant="primary" className="mb-3">
                            {tagline}
                        </Tag>
                    )}
                    <h3
                        id={tierId}
                        className="font-heading text-3xl font-bold text-neutral-graphite mb-2"
                    >
                        {name}
                    </h3>
                    {description && (
                        <p className="text-neutral-graphite/60">
                            {description}
                        </p>
                    )}
                </div>

                {/* Price */}
                <div className="mb-8 flex-shrink-0">
                    {billingPeriod === 'annual' && isPro ? (
                        <>
                            <div className="flex items-baseline gap-1">
                                <span className="font-heading text-5xl font-bold text-neutral-graphite">
                                    $7.99
                                </span>
                                <span className="text-xl text-neutral-graphite/60">
                                    / mo
                                </span>
                            </div>
                            <p className="text-sm text-neutral-graphite/60 mt-1">
                                Billed annually - $95.88 today
                            </p>
                        </>
                    ) : (
                        <div className="flex items-baseline gap-1">
                            <span className="font-heading text-5xl font-bold text-neutral-graphite">
                                {displayPrice.split('/')[0]}
                            </span>
                            <span className="text-xl text-neutral-graphite/60">
                                /{displayPrice.split('/')[1]}
                            </span>
                        </div>
                    )}
                </div>

                {/* Lead Sentence */}
                {leadSentence && (
                    <p className="text-base mb-6 leading-relaxed text-neutral-graphite/80">
                        {leadSentence}
                    </p>
                )}

                {/* Features */}
                <div className="space-y-4 flex-grow mb-8">
                    {features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: `${accentColor}20` }}
                                >
                                    <Check size={12} style={{ color: accentColor }} strokeWidth={3} />
                                </div>
                            </div>
                            <span className="text-sm text-neutral-graphite/80 leading-relaxed">
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <Button
                    onClick={onSelect}
                    disabled={isCurrent}
                    className="w-full"
                    variant={isPro ? 'primary' : 'outline'}
                    aria-label={isCurrent ? (isFree ? 'Starter plan current status' : 'Pro Insights plan current status') : (isPro ? 'Upgrade to Pro Insights' : cta)}
                >
                    {isCurrent ? 'Current Plan' : cta}
                </Button>
            </Card>
        </motion.div>
    );
}
