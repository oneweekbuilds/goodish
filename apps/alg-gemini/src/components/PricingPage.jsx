import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Layers, Clock, BarChart3, RefreshCw } from 'lucide-react';

const PricingPage = () => {
    const [isAnnual, setIsAnnual] = useState(true);

    return (
        <div className="bg-bg-page min-h-screen font-sans selection:bg-primary-blue/20 overflow-x-hidden pt-20 md:pt-24 pb-20">
            {/* Background Grid - Fading out */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary-blue/5 to-transparent opacity-40" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4">

                {/* 1. HERO AREA */}
                <section className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight text-text-main mb-4">
                        Choose the plan that works for you.
                    </h1>
                    <p className="text-base md:text-lg text-text-muted max-w-2xl mx-auto">
                        AlgorithmLens helps you see how algorithms shape your digital life.
                        Start free, or unlock deeper insights with Premium.
                    </p>
                </section>

                {/* 2. PRICING TOGGLE */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-full p-1 border border-border-light shadow-sm flex items-center relative">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative z-10 ${!isAnnual ? 'text-white' : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative z-10 ${isAnnual ? 'text-white' : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            Annual
                        </button>
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary-blue rounded-full transition-all duration-300 ease-in-out ${isAnnual ? 'left-[calc(50%+2px)]' : 'left-1'
                                }`}
                        />
                    </div>
                </div>

                {/* 3. PRICING CARDS */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-16">

                    {/* Starter Card */}
                    <div className="bg-white rounded-[16px] border border-primary-blue/15 shadow-sm hover:shadow-md transition-all duration-200 p-6 md:p-8 flex flex-col h-full">
                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-text-main">Starter</h3>
                            <p className="text-sm text-text-muted mt-2 leading-relaxed min-h-[3rem]">
                                A clear snapshot of how one platform shapes your feed.
                            </p>
                        </div>

                        <div className="flex flex-col mb-6 min-h-[4.5rem]">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-text-main">$0</span>
                                <span className="text-base text-text-muted">/ month</span>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            <PlanFeature text="Analyze 1 platform" />
                            <PlanFeature text="Visualize topic mix & content tone" />
                            <PlanFeature text="See top 5 topics and creators" />
                            <PlanFeature text="Access a 7-day snapshot of your feed" />
                            <PlanFeature text="Basic dashboard views only" />
                            <PlanFeature text="Limited refresh frequency" />
                        </ul>

                        <button className="w-full py-3 rounded-full border border-primary-blue text-primary-blue font-semibold text-sm md:text-base hover:bg-primary-blue/5 transition-all duration-200 mt-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2">
                            Get Started Free
                        </button>
                    </div>

                    {/* Premium Card */}
                    <div className="bg-accent-green/5 rounded-[16px] border-2 border-accent-green shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.005] transition-all duration-300 p-6 md:p-8 flex flex-col h-full relative">
                        {/* Badge */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-[#f0fdf4] text-accent-green text-xs font-bold tracking-wide shadow-sm whitespace-nowrap z-20 border border-accent-green/20">
                            Most Popular
                        </div>

                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-text-main">Premium</h3>
                            <p className="text-sm text-text-muted mt-2 leading-relaxed min-h-[3rem]">
                                Go beyond the surface. Understand how your digital world really works.
                            </p>
                        </div>

                        <div className="flex flex-col mb-6 min-h-[4.5rem]">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-text-main">
                                    ${isAnnual ? '7.99' : '9.99'}
                                </span>
                                <span className="text-base text-text-muted">/ month</span>
                            </div>
                            {isAnnual && (
                                <span className="text-xs text-text-muted mt-1 font-medium">
                                    $95.88 billed today
                                </span>
                            )}
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            <PlanFeature text="Analyze all major platforms (5+)" accent="green" />
                            <PlanFeature text="See 7-day, 30-day, and custom ranges" accent="green" />
                            <PlanFeature text="Compare bias, tone & sentiment" accent="green" />
                            <PlanFeature text="Reveal brand & influencer influence" accent="green" />
                            <PlanFeature text="Advanced dashboard views" accent="green" />
                            <PlanFeature text="Unlimited profile refreshes" accent="green" />
                            <PlanFeature text="Priority platform-level insights" accent="green" />
                        </ul>

                        <button className="w-full py-3 rounded-full bg-accent-green text-white font-semibold text-sm md:text-base hover:bg-accent-green/90 transition-all duration-200 mt-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/60 focus-visible:ring-offset-2 shadow-sm">
                            Upgrade to Premium
                        </button>
                    </div>
                </section>

                {/* 4. COMPARE PLANS SUMMARY */}
                <section className="mb-16">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-text-main mb-2">Compare Plans</h2>
                        <p className="text-sm text-text-muted">See what you unlock when you upgrade from Starter to Premium.</p>
                    </div>

                    <div className="bg-white rounded-[16px] shadow-soft border border-border-light overflow-hidden">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 p-4 px-6 bg-bg-page/50 border-b border-border-light text-xs font-semibold uppercase tracking-wider text-text-muted">
                            <div className="col-span-4">Feature</div>
                            <div className="col-span-4 text-center">Starter</div>
                            <div className="col-span-4 text-center text-accent-green">Premium</div>
                        </div>

                        <div className="divide-y divide-border-light/50">
                            <ComparisonRow
                                icon={Layers}
                                label="Platforms"
                                starter="1 platform"
                                premium="5+ platforms"
                                isPremiumBetter
                            />
                            <ComparisonRow
                                icon={Clock}
                                label="Time Range"
                                starter="7-day snapshot"
                                premium="7, 30, and custom ranges"
                                isPremiumBetter
                            />
                            <ComparisonRow
                                icon={BarChart3}
                                label="Insights"
                                starter="Basic dashboard views"
                                premium="Advanced dashboards + cross-platform insights"
                                isPremiumBetter
                            />
                            <ComparisonRow
                                icon={RefreshCw}
                                label="Refreshes"
                                starter="Limited refreshes"
                                premium="Unlimited refreshes"
                                isPremiumBetter
                            />
                        </div>
                    </div>
                </section>

                {/* 5. FAQ SECTION */}
                <section className="max-w-3xl mx-auto mb-16">
                    <div className="bg-white rounded-[16px] border border-border-light shadow-sm px-6 py-6">
                        <h2 className="text-2xl font-bold text-text-main text-center mb-6">
                            Frequently Asked Questions
                        </h2>

                        <div className="divide-y divide-border-light/50">
                            <FaqItem
                                question="How does AlgorithmLens read my data?"
                                answer="We analyze engagement patterns and metadata from your connected accounts to estimate what the algorithms may be inferring. We do not post on your behalf."
                            />
                            <FaqItem
                                question="Is Premium required to use the tool?"
                                answer="No. The Starter plan gives you a basic snapshot. Premium simply unlocks richer, more detailed analysis and comparisons."
                            />
                            <FaqItem
                                question="Do you store my information?"
                                answer="We prioritize privacy and use read-only access. Data handling is minimized and governed by our privacy policy."
                            />
                            <FaqItem
                                question="Can I cancel anytime?"
                                answer="Yes. You can downgrade or cancel Premium at any time from your account settings. If you cancel, you'll retain access until the end of your billing period."
                            />
                        </div>
                    </div>
                </section>

                {/* 6. FINAL CTA STRIP */}
                <section className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-text-main mb-2">
                        Ready to get started?
                    </h2>
                    <p className="text-sm text-text-muted mb-6">
                        You can always start on Free and upgrade anytime.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="w-full sm:w-auto px-8 py-3 rounded-full border border-primary-blue text-primary-blue font-semibold hover:bg-primary-blue/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2">
                            Get Started Free
                        </button>
                        <button className="w-full sm:w-auto px-8 py-3 rounded-full bg-accent-green text-white font-semibold hover:bg-accent-green/90 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/60 focus-visible:ring-offset-2">
                            Upgrade to Premium
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
};

// --- Helper Components ---

const PlanFeature = ({ text, accent = 'blue' }) => (
    <li className="flex items-start gap-3">
        <div
            className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${accent === 'green'
                    ? 'border-accent-green text-accent-green'
                    : 'border-primary-blue text-primary-blue'
                }`}
        >
            <Check size={10} strokeWidth={3} />
        </div>
        <span className="text-sm text-text-main leading-tight">{text}</span>
    </li>
);

const ComparisonRow = ({ icon: Icon, label, starter, premium, isPremiumBetter }) => (
    <div className="grid grid-cols-1 md:grid-cols-12 p-4 md:px-6 items-center gap-2 md:gap-4 hover:bg-bg-page/30 transition-colors">
        <div className="col-span-1 md:col-span-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-blue/5 flex items-center justify-center text-primary-blue flex-shrink-0">
                <Icon size={16} />
            </div>
            <span className="font-semibold text-text-main text-sm">{label}</span>
        </div>

        <div className="col-span-1 md:col-span-4 flex md:justify-center items-center text-sm text-text-muted pl-11 md:pl-0">
            <span className="md:hidden text-xs font-semibold uppercase mr-2 w-16 flex-shrink-0">Starter:</span>
            {starter}
        </div>

        <div className={`col-span-1 md:col-span-4 flex md:justify-center items-center text-sm pl-11 md:pl-0 ${isPremiumBetter ? 'font-semibold text-text-main' : 'text-text-main'} text-center`}>
            <span className="md:hidden text-xs font-semibold uppercase text-accent-green mr-2 w-16 flex-shrink-0 text-left">Premium:</span>
            <div className="relative w-full md:w-auto flex justify-start md:justify-center">
                {isPremiumBetter && <div className="absolute -inset-x-2 -inset-y-1 bg-accent-green/10 rounded -z-10 hidden md:block" />}
                {premium}
            </div>
        </div>
    </div>
);

const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="py-4 first:pt-0 last:pb-0">
            <button
                className="w-full flex items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded-lg transition-colors group"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span className="text-sm md:text-base font-semibold text-text-main group-hover:text-primary-blue transition-colors">
                    {question}
                </span>
                <span className={`transition-transform duration-200 text-text-muted ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                    <ChevronDown size={18} />
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <p className="text-sm text-text-muted leading-relaxed pt-3">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PricingPage;
