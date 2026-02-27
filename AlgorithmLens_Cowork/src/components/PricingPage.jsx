import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, FileSearch, MessageCircleQuestion, TrendingUp } from 'lucide-react';
import { PRICING } from '../lib/plan/pricingConfig';

const PricingPage = () => {
    const [isAnnual, setIsAnnual] = useState(true);

    return (
        <div className="bg-bg-page min-h-[100dvh] font-sans selection:bg-primary-blue/20 overflow-x-hidden pt-20 md:pt-24 pb-20">
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
                        AlgorithmLens helps you see what's in your social media feed.
                        Start free, or unlock deeper analysis with Plus.
                    </p>
                    <p className="text-sm text-text-muted mt-4">
                        Built at MIT. Designed for transparency.
                    </p>
                </section>

                {/* 2. PRICING TOGGLE */}
                <div className="flex justify-center mb-8">
                    <div
                        className="bg-white rounded-full p-1 border border-border-light shadow-sm flex items-center relative"
                        role="radiogroup"
                        aria-label="Billing cycle"
                    >
                        <button
                            onClick={() => setIsAnnual(false)}
                            role="radio"
                            aria-checked={!isAnnual}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative z-10 ${!isAnnual ? 'text-white' : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            role="radio"
                            aria-checked={isAnnual}
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

                    {/* Free Card */}
                    <div className="bg-white rounded-[16px] border border-primary-blue/15 shadow-sm hover:shadow-md transition-all duration-200 p-6 md:p-8 flex flex-col h-full">
                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-text-main">Free</h3>
                            <p className="text-sm text-text-muted mt-2 leading-relaxed min-h-[3rem]">
                                See what your feed looks like right now — a complete snapshot with every scan.
                            </p>
                        </div>

                        <div className="flex flex-col mb-6 min-h-[4.5rem]">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-text-main">$0</span>
                                <span className="text-base text-text-muted">/ forever</span>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            <PlanFeature text="Unlimited scans" />
                            <PlanFeature text="Full six-tab dashboard" />
                            <PlanFeature text="All platforms supported" />
                            <PlanFeature text="Ad and source breakdown" />
                            <PlanFeature text="Political content detection" />
                            <PlanFeature text="Tone composition" />
                        </ul>

                        <Link
                            to="/start"
                            className="w-full py-3 rounded-full border border-primary-blue text-primary-blue font-semibold text-sm md:text-base hover:bg-primary-blue/5 transition-all duration-200 mt-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 block text-center"
                        >
                            Get Started Free
                        </Link>
                    </div>

                    {/* Plus Card */}
                    <div className="bg-accent-green/5 rounded-[16px] border-2 border-accent-green shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.005] transition-all duration-300 p-6 md:p-8 flex flex-col h-full relative">
                        {/* Badge */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-[#f0fdf4] text-accent-green text-xs font-bold tracking-wide shadow-sm whitespace-nowrap z-20 border border-accent-green/20">
                            Most Popular
                        </div>

                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-text-main">Plus</h3>
                            <p className="text-sm text-text-muted mt-2 leading-relaxed min-h-[3rem]">
                                Understand what shaped your feed — with evidence, AI conversations, and trend tracking.
                            </p>
                        </div>

                        <div className="flex flex-col mb-6 min-h-[4.5rem]">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-text-main">
                                    {isAnnual ? PRICING.annual.monthlyEquivalent.replace('/month', '') : PRICING.monthly.display}
                                </span>
                                <span className="text-base text-text-muted">/ month</span>
                            </div>
                            {isAnnual && (
                                <span className="text-xs text-text-muted mt-1 font-medium">
                                    {PRICING.annual.display} billed annually · Save 20%
                                </span>
                            )}
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            <PlanFeature text="Everything in Free" accent="green" />
                            <PlanFeature text="Evidence-based analysis on every tab" accent="green" />
                            <PlanFeature text='AI-powered "Ask your feed" Q&A' accent="green" />
                            <PlanFeature text="Track trends across scans" accent="green" />
                            <PlanFeature text="Compare scans side by side" accent="green" />
                            <PlanFeature text={PRICING.trial.label} accent="green" />
                        </ul>

                        <Link
                            to="/plus"
                            className="w-full py-3 rounded-full bg-accent-green text-white font-semibold text-sm md:text-base hover:bg-accent-green/90 transition-all duration-200 mt-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/60 focus-visible:ring-offset-2 shadow-sm block text-center"
                        >
                            Try Plus Free for {PRICING.trial.days} Days
                        </Link>
                    </div>
                </section>

                {/* 4. WHAT MAKES PLUS DIFFERENT */}
                <section className="mb-16">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-text-main mb-2">What makes Plus different</h2>
                        <p className="text-sm text-text-muted">The free scan shows the headlines. Plus reveals the full picture.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white rounded-xl border border-border-light p-6 text-center">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-4">
                                <FileSearch size={20} className="text-primary-blue" />
                            </div>
                            <h3 className="text-sm font-bold text-text-main mb-2">Evidence-based analysis</h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Detailed breakdowns on every dashboard tab, grounded in your actual scan data.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-border-light p-6 text-center">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                                <MessageCircleQuestion size={20} className="text-emerald-600" />
                            </div>
                            <h3 className="text-sm font-bold text-text-main mb-2">Ask your feed</h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                                AI-powered Q&A that answers questions using your scan data, not general knowledge.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-border-light p-6 text-center">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-4">
                                <TrendingUp size={20} className="text-primary-blue" />
                            </div>
                            <h3 className="text-sm font-bold text-text-main mb-2">Track changes over time</h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Compare scans side by side and see how your feed evolves over weeks and months.
                            </p>
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
                                question="What do I get for free?"
                                answer="Unlimited scans, the full six-tab dashboard, all platforms, ad and source breakdowns, political content detection, and tone composition. The free tier gives you a complete snapshot of your feed every time you scan."
                            />
                            <FaqItem
                                question="What does Plus add?"
                                answer="Plus adds evidence-based analysis on every dashboard tab, AI-powered Q&A about your feed, and trend tracking across scans. It's designed for people who want to understand what shaped their feed, not just see the surface numbers."
                            />
                            <FaqItem
                                question="Do you store my information?"
                                answer="We prioritize privacy and use read-only access. Data handling is minimized and governed by our privacy policy."
                            />
                            <FaqItem
                                question="Can I cancel anytime?"
                                answer="Yes. You can cancel Plus at any time from your account settings. If you cancel, you'll retain access until the end of your billing period. Your scans and data remain accessible whether you subscribe or not."
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
                        Start free with unlimited scans. Upgrade to Plus anytime.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/start"
                            className="w-full sm:w-auto px-8 py-3 rounded-full border border-primary-blue text-primary-blue font-semibold hover:bg-primary-blue/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 text-center"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/plus"
                            className="w-full sm:w-auto px-8 py-3 rounded-full bg-accent-green text-white font-semibold hover:bg-accent-green/90 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/60 focus-visible:ring-offset-2 text-center"
                        >
                            Try Plus Free for {PRICING.trial.days} Days
                        </Link>
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
