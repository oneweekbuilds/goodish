import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Circle, TrendingUp, Sparkles, ChevronDown, ArrowRight, Shield, Zap, Eye, MessageCircleQuestion, FileSearch, Clock, Users, AlertTriangle } from 'lucide-react';
import { usePaywall } from '../../lib/plan/PaywallProvider';
import { track } from '../../lib/analytics/analyticsClient';
import { EVENTS } from '../../lib/analytics/events';
import { getCurrentPlanTier, PLAN_TIERS } from '../../lib/plan/planTier';
import { PRICING } from '../../lib/plan/pricingConfig';
import { getApiBaseUrl } from '../../lib/apiConfig';
import { authenticatedFetch } from '../../lib/api/authenticatedFetch';
import SEO from '../../components/SEO';

/**
 * PlusPage - Dedicated /plus conversion page
 *
 * Conversion-optimized page explaining Plus features with pricing cards.
 * Opens PaywallModal when user clicks CTA.
 *
 * Analytics:
 * - upgrade_cta_clicked: When user clicks primary CTA
 * - paywall_viewed: When PaywallModal opens (tracked by PaywallProvider)
 *
 * Demo mode isolation:
 * - No analytics events fire when ?demo=1 is present
 */
const PlusPage = () => {
  const navigate = useNavigate();
  const { openPaywall, openBillingPortal, isPortalLoading, portalError } = usePaywall();

  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';

  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const planTier = useMemo(
    () => getCurrentPlanTier(isDemoMode, searchParams),
    [isDemoMode, searchParams]
  );

  const [billingCycle, setBillingCycle] = useState('annual');

  const [checkoutCanceled, setCheckoutCanceled] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('checkout') === 'canceled';
  });

  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // H3 fix: Fetch subscription data to show cancellation status
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  useEffect(() => {
    if (!isDemoMode && planTier === PLAN_TIERS.PLUS) {
      setLoadingSubscription(true);
      const fetchSubscription = async () => {
        try {
          const apiBase = getApiBaseUrl();
          const response = await authenticatedFetch(`${apiBase}/api/user/entitlements`);
          if (response.ok) {
            const data = await response.json();
            setSubscriptionData(data.subscription);
          }
        } catch (err) {
          // Fail silently — don't break the page
        } finally {
          setLoadingSubscription(false);
        }
      };
      fetchSubscription();
    }
  }, [isDemoMode, planTier]);

  useEffect(() => {
    if (checkoutCanceled) {
      const params = new URLSearchParams(window.location.search);
      params.delete('checkout');
      const newSearch = params.toString();
      navigate({ search: newSearch ? `?${newSearch}` : '' }, { replace: true });
    }
  }, [checkoutCanceled, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleStartTrial = () => {
    if (!isDemoMode) {
      track(EVENTS.UPGRADE_CTA_CLICKED, {
        tab: 'plus_page',
        placement: 'primary_cta',
        planTier,
        isDemo: false,
      });
    }
    openPaywall('plus_page_primary');
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleFaqKeyDown = (index, e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFaq(index);
    }
  };

  const faqItems = [
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes. Cancel anytime during your trial or subscription. No questions asked, no hidden fees.',
    },
    {
      question: 'How do you use my data?',
      answer: 'We only use your data to provide your analysis. Your scans are private by default. We do not sell or share your data with third parties.',
    },
    {
      question: 'Do you explain why my feed changed?',
      answer: 'We describe what appeared in your feed and what changed between scans. We provide possible factors that could influence feed composition, but we do not speculate about platform intent or make causal claims. Platform algorithms are opaque.',
    },
    {
      question: 'What are evidence bundles?',
      answer: 'Evidence bundles are detailed, AI-generated analyses that appear on each dashboard tab. They break down your scan data — showing which advertisers appeared, what content patterns emerged, how your sources compare, and more. Every claim is grounded in your actual scan data.',
    },
    {
      question: 'What can I ask with "Ask your feed"?',
      answer: 'You can ask natural-language questions about your feed composition — for example, "Why am I seeing so many fitness ads?" or "How concentrated are my sources?" The AI answers using your actual scan data, not general knowledge.',
    },
    {
      question: 'Why do multiple scans matter?',
      answer: 'A single scan shows your feed at one moment in time. Multiple scans let you track how your feed evolves, spot patterns, and understand what changed. Plus gives you the tools to compare scans and see trends.',
    },
    {
      question: 'Do you support the extension and uploads?',
      answer: 'Use AlgorithmLens with the Chrome extension, or upload scans from your desktop. Both free and Plus users have access to all scan methods.',
    },
    {
      question: 'What happens after my trial ends?',
      answer: `After ${PRICING.trial.days} days, your subscription begins. You can cancel before the trial ends to avoid any charges. Your scans and data remain accessible whether you subscribe or not.`,
    },
  ];

  // Animation variants — hero uses "animate" (fires immediately) for visibility;
  // deeper sections use whileInView for scroll-triggered entrance.
  const fadeUpImmediate = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const staggerImmediate = (delay) => ({
    ...fadeUpImmediate,
    transition: { duration: 0.5, delay },
  });

  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
  };

  const stagger = (delay) => ({
    ...fadeUp,
    transition: { duration: 0.5, delay },
  });

  return (
    <>
      <SEO title="Plus" description="Your scan shows the surface. Plus shows the story — evidence-based analysis, AI-powered Q&A, and trend tracking with AlgorithmLens Plus." path="/plus" />
      <div className="min-h-[100dvh] bg-bg-page">

        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden pt-16 sm:pt-24 pb-12 sm:pb-20">
          {/* Subtle gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-green-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <motion.div {...staggerImmediate(0)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200/60 rounded-full mb-8">
              <Sparkles size={16} className="text-primary-blue" />
              <span className="text-sm font-semibold text-primary-blue">AlgorithmLens Plus</span>
            </motion.div>

            <motion.h1
              {...staggerImmediate(0.1)}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-main mb-6 leading-tight tracking-tight"
            >
              Your scan shows the surface.
              <br />
              <span className="bg-gradient-to-r from-primary-blue to-accent-green bg-clip-text text-transparent">
                Plus shows the story.
              </span>
            </motion.h1>

            <motion.p
              {...staggerImmediate(0.2)}
              className="text-lg sm:text-xl text-text-muted mb-4 max-w-2xl mx-auto leading-relaxed"
            >
              Evidence-based analysis on every tab, AI-powered Q&A about your feed, and trend tracking across scans.
            </motion.p>

            <motion.div {...staggerImmediate(0.3)} className="flex flex-col items-center mt-10">
              <button
                onClick={handleStartTrial}
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-blue to-blue-600 text-white rounded-full font-bold text-lg hover:shadow-xl hover:shadow-primary-blue/20 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5"
              >
                Start your {PRICING.trial.label}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="mt-3 text-sm text-text-muted flex items-center gap-1.5">
                <Clock size={14} className="text-primary-blue" />
                No credit card charged for {PRICING.trial.days} days
              </p>
            </motion.div>

            {/* Social proof row */}
            <motion.div {...staggerImmediate(0.4)} className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200/60 rounded-full text-sm font-semibold text-text-main">
                <Shield size={14} className="text-primary-blue flex-shrink-0" />
                Built at MIT
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-text-muted">
                <Users size={14} className="text-primary-blue flex-shrink-0" />
                Join early adopters taking control of their feeds
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-text-muted">
                <Eye size={14} className="text-primary-blue flex-shrink-0" />
                No data sold — ever
              </span>
            </motion.div>
          </div>
        </section>

        {/* ── Manage Subscription (existing Plus users) ── */}
        {planTier === PLAN_TIERS.PLUS && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200/60 rounded-2xl p-8 text-center">
              {/* H3 fix: Show cancellation notice if user scheduled cancellation */}
              {subscriptionData?.cancel_at_period_end && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 max-w-md mx-auto flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-amber-800">
                      Your subscription is scheduled to cancel
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {subscriptionData.period_days_remaining !== null
                        ? `Access remains for ${subscriptionData.period_days_remaining} more days.`
                        : 'Access will end at the end of your current billing period.'}
                    </p>
                  </div>
                </div>
              )}
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={18} className="text-accent-green" />
                </div>
                <span className="text-lg font-semibold text-text-main">You're on Plus</span>
              </div>
              <p className="text-text-muted mb-6 max-w-md mx-auto">
                Manage your billing, update your payment method, or cancel anytime.
              </p>
              {portalError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 max-w-md mx-auto">
                  <p className="text-sm text-red-700">{portalError}</p>
                </div>
              )}
              <button
                onClick={openBillingPortal}
                disabled={isPortalLoading}
                className="px-8 py-3 bg-primary-blue text-white rounded-full font-semibold text-base hover:bg-blue-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPortalLoading ? 'Loading...' : 'Manage subscription'}
              </button>
            </div>
          </section>
        )}

        {/* ── Why Trends Matter ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <motion.div {...fadeUp} className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-main mb-4">
              What Plus shows you
            </h2>
            <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto">
              Your free scan shows the headlines. Plus reveals the full picture — detailed analysis, AI conversations, and trend tracking.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div {...stagger(0.1)} className="bg-white rounded-2xl p-7 border border-blue-100/60 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <FileSearch size={24} className="text-primary-blue" />
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">Evidence-based analysis</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                See detailed breakdowns on every tab — which advertisers appeared, what patterns emerged, and how your feed composition compares.
              </p>
            </motion.div>

            <motion.div {...stagger(0.2)} className="bg-white rounded-2xl p-7 border border-green-100/60 hover:shadow-lg hover:shadow-green-50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <MessageCircleQuestion size={24} className="text-accent-green" />
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">Ask your feed</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Get AI-powered answers grounded in your actual scan data. Ask why your feed looks the way it does and get responses backed by evidence.
              </p>
            </motion.div>

            <motion.div {...stagger(0.3)} className="bg-white rounded-2xl p-7 border border-blue-100/60 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-green-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp size={24} className="text-primary-blue" />
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">Track changes over time</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Compare scans side by side. See what shifted in your feed over weeks and months — ads, sources, topics, and tone.
              </p>
            </motion.div>
          </div>

          {/* Example insight stat cards — simplified for at-a-glance understanding */}
          <div className="mt-14 space-y-6 max-w-4xl mx-auto">
            <motion.p {...stagger(0.35)} className="text-center text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
              Example insights from Plus
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Stat 1: Ad content doubled */}
              <motion.div
                {...stagger(0.4)}
                className="bg-white rounded-2xl border border-blue-100/60 p-6 text-center hover:shadow-lg hover:shadow-blue-50 transition-all duration-300"
              >
                <span className="text-xs font-medium text-white bg-gradient-to-r from-primary-blue to-blue-600 px-3 py-1 rounded-full">Plus insight</span>
                <div className="mt-5 mb-3 flex items-center justify-center gap-3">
                  <span className="text-4xl sm:text-5xl font-bold text-text-muted/40">18%</span>
                  <ArrowRight size={24} className="text-primary-blue" />
                  <span className="text-4xl sm:text-5xl font-bold text-primary-blue">38%</span>
                </div>
                <p className="text-sm font-bold text-text-main mb-1">Ad content doubled in 8 weeks</p>
                <p className="text-xs text-text-muted leading-relaxed">Without tracking over time, this gradual shift would be invisible.</p>
              </motion.div>

              {/* Stat 2: Political content spike */}
              <motion.div
                {...stagger(0.5)}
                className="bg-white rounded-2xl border border-green-100/60 p-6 text-center hover:shadow-lg hover:shadow-green-50 transition-all duration-300"
              >
                <span className="text-xs font-medium text-white bg-gradient-to-r from-accent-green to-green-600 px-3 py-1 rounded-full">Plus insight</span>
                <div className="mt-5 mb-3 flex items-center justify-center gap-3">
                  <span className="text-4xl sm:text-5xl font-bold text-text-muted/40">8%</span>
                  <ArrowRight size={24} className="text-accent-green" />
                  <span className="text-4xl sm:text-5xl font-bold text-accent-green">25%</span>
                </div>
                <p className="text-sm font-bold text-text-main mb-1">Political content tripled after a news event</p>
                <p className="text-xs text-text-muted leading-relaxed">Two weeks later, still elevated at 15%. A single scan misses this entirely.</p>
              </motion.div>

              {/* Stat 3: Source diversity dropped */}
              <motion.div
                {...stagger(0.6)}
                className="bg-white rounded-2xl border border-blue-100/60 p-6 text-center hover:shadow-lg hover:shadow-blue-50 transition-all duration-300"
              >
                <span className="text-xs font-medium text-white bg-gradient-to-r from-primary-blue to-blue-600 px-3 py-1 rounded-full">Plus insight</span>
                <div className="mt-5 mb-3 flex items-center justify-center gap-3">
                  <span className="text-4xl sm:text-5xl font-bold text-text-muted/40">24</span>
                  <ArrowRight size={24} className="text-primary-blue" />
                  <span className="text-4xl sm:text-5xl font-bold text-primary-blue">9</span>
                </div>
                <p className="text-sm font-bold text-text-main mb-1">Unique sources dropped 62% in 3 weeks</p>
                <p className="text-xs text-text-muted leading-relaxed">Your feed narrowed — fewer accounts and publishers showing up.</p>
              </motion.div>
            </div>

            <motion.p {...stagger(0.65)} className="text-center text-xs text-text-muted mt-2">
              Simplified examples — your actual Plus dashboard shows full trend charts and detailed breakdowns.
            </motion.p>
          </div>
        </section>

        {/* ── Free vs Plus Comparison ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <motion.div {...fadeUpImmediate} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-main mb-4">
              Free vs. Plus
            </h2>
            <p className="text-base text-text-muted">
              Free gives you the snapshot. Plus adds the context that makes it meaningful.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Free tier */}
            <motion.div {...staggerImmediate(0.1)} className="bg-white border-2 border-border-light rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Circle size={22} className="text-text-muted" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-main">Free</h3>
                  <p className="text-sm text-text-muted">Always free</p>
                </div>
              </div>
              <p className="text-base text-text-muted mb-6 leading-relaxed">
                See what your feed looks like right now.
              </p>
              <ul className="space-y-4">
                {[
                  { text: 'Unlimited scans', included: true },
                  { text: 'Full six-tab dashboard', included: true },
                  { text: 'Ad and source breakdown', included: true },
                  { text: 'Political content detection', included: true },
                  { text: 'Tone composition', included: true },
                  { text: 'All platforms supported', included: true },
                  { text: 'Evidence-based analysis', included: false },
                  { text: '"Ask your feed" AI Q&A', included: false },
                  { text: 'Trend tracking over time', included: false },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.included ? 'bg-blue-50' : 'bg-blue-50/50'}`}>
                      {item.included ? (
                        <Check size={13} className="text-text-muted" />
                      ) : (
                        <span className="text-text-muted/50 text-xs">—</span>
                      )}
                    </div>
                    <span className={`text-sm ${item.included ? 'text-text-muted' : 'text-text-muted/50 line-through'}`}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Plus tier */}
            <motion.div {...staggerImmediate(0.2)} className="relative bg-gradient-to-br from-blue-50/80 via-white to-green-50/80 border-2 border-primary-blue/30 rounded-2xl p-8 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300">
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-primary-blue to-accent-green rounded-full text-xs font-bold text-white uppercase tracking-wide">
                  <Sparkles size={12} />
                  Most popular
                </span>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  <TrendingUp size={22} className="text-primary-blue" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-main">Plus</h3>
                  <p className="text-sm text-primary-blue font-medium">Starting at {PRICING.annual.monthlyEquivalent}</p>
                </div>
              </div>
              <p className="text-base text-text-main mb-6 leading-relaxed font-medium">
                Understand what shaped your feed — with evidence, AI, and trends.
              </p>
              <ul className="space-y-4">
                {[
                  'Everything in Free',
                  'Evidence-based analysis on every tab',
                  'AI-powered "Ask your feed" Q&A',
                  'Compare scans side by side',
                  'Track trends over time',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={13} className="text-primary-blue" />
                    </div>
                    <span className="text-sm text-text-main font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5 border-t border-blue-100/60">
                <button
                  onClick={handleStartTrial}
                  className="w-full py-3 px-6 bg-gradient-to-r from-primary-blue to-blue-600 text-white rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-primary-blue/20 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Start {PRICING.trial.label}
                  <ArrowRight size={16} />
                </button>
                <p className="text-center text-xs text-text-muted mt-2">Cancel anytime during your trial</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Pricing Cards ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <motion.div {...fadeUp}>
            <div className="bg-white border border-border-light/80 rounded-3xl p-8 sm:p-12 shadow-sm">
              <h2 className="text-3xl sm:text-4xl font-bold text-text-main text-center mb-3">
                Choose your plan
              </h2>
              <p className="text-base text-text-muted text-center mb-10 max-w-lg mx-auto">
                Both plans include a {PRICING.trial.label}. Cancel anytime.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto mb-10">
                {/* Monthly */}
                <div
                  className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 ${
                    billingCycle === 'monthly'
                      ? 'border-primary-blue bg-gradient-to-br from-blue-50/60 to-white ring-1 ring-primary-blue/20 shadow-md shadow-blue-50'
                      : 'border-border-light hover:border-border-light hover:shadow-sm'
                  }`}
                  role="radio"
                  aria-checked={billingCycle === 'monthly'}
                  tabIndex={0}
                  onClick={() => setBillingCycle('monthly')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBillingCycle('monthly'); } }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${billingCycle === 'monthly' ? 'border-primary-blue' : 'border-border-light'}`}>
                      {billingCycle === 'monthly' && <div className="w-2.5 h-2.5 rounded-full bg-primary-blue" />}
                    </div>
                    <span className="text-sm font-semibold text-text-main">Monthly</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-4xl font-bold text-text-main">{PRICING.monthly.display}</span>
                    <span className="text-lg text-text-muted">/{PRICING.monthly.interval}</span>
                  </div>
                  <p className="text-sm text-text-muted">{PRICING.trial.label} included</p>
                </div>

                {/* Annual */}
                <div
                  className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 ${
                    billingCycle === 'annual'
                      ? 'border-accent-green bg-gradient-to-br from-green-50/60 to-white ring-1 ring-accent-green/20 shadow-md shadow-green-50'
                      : 'border-border-light hover:border-border-light hover:shadow-sm'
                  }`}
                  role="radio"
                  aria-checked={billingCycle === 'annual'}
                  tabIndex={0}
                  onClick={() => setBillingCycle('annual')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBillingCycle('annual'); } }}
                >
                  <div className="absolute -top-3 right-5">
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-accent-green to-green-600 rounded-full text-xs font-bold text-white shadow-sm">
                      Save 20%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${billingCycle === 'annual' ? 'border-accent-green' : 'border-border-light'}`}>
                      {billingCycle === 'annual' && <div className="w-2.5 h-2.5 rounded-full bg-accent-green" />}
                    </div>
                    <span className="text-sm font-semibold text-text-main">Annual</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-4xl font-bold text-text-main">{PRICING.annual.display}</span>
                    <span className="text-lg text-text-muted">/{PRICING.annual.interval}</span>
                  </div>
                  <p className="text-sm text-accent-green font-medium mb-2">That's just {PRICING.annual.monthlyEquivalent}</p>
                  <p className="text-sm text-text-muted">{PRICING.trial.label} included</p>
                </div>
              </div>

              {/* Checkout canceled message */}
              {checkoutCanceled && (
                <div className="mb-6 bg-blue-50/50 border border-border-light rounded-xl p-4 flex items-start gap-3 max-w-3xl mx-auto">
                  <div className="flex-1">
                    <p className="text-sm text-text-muted">
                      Checkout canceled. You can try again anytime — no pressure.
                    </p>
                  </div>
                  <button
                    onClick={() => setCheckoutCanceled(false)}
                    className="text-text-muted hover:text-text-main transition-colors p-1"
                    aria-label="Dismiss"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* CTA */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleStartTrial}
                  className="group w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-primary-blue to-blue-600 text-white rounded-full font-bold text-lg hover:shadow-xl hover:shadow-primary-blue/20 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5"
                >
                  Start {PRICING.trial.label} — {billingCycle === 'annual' ? PRICING.annual.label : PRICING.monthly.label}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-5 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5"><Shield size={14} className="text-accent-green" /> Cancel anytime</span>
                  <span className="flex items-center gap-1.5"><Zap size={14} className="text-primary-blue" /> Instant access</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Trust row ── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <motion.div {...fadeUp} className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {[
              { label: 'Privacy-first', icon: Shield, color: 'blue' },
              { label: 'No data sold', icon: Eye, color: 'green' },
              { label: 'Cancel anytime', icon: Zap, color: 'blue' },
            ].map((badge, i) => (
              <div
                key={i}
                className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-all duration-300 hover:shadow-sm ${
                  badge.color === 'blue'
                    ? 'bg-gradient-to-r from-blue-50 to-white border-blue-200/60 hover:border-blue-300'
                    : 'bg-gradient-to-r from-green-50 to-white border-green-200/60 hover:border-green-200'
                }`}
              >
                <badge.icon size={16} className={badge.color === 'blue' ? 'text-primary-blue' : 'text-accent-green'} />
                <span className="text-sm font-medium text-text-main">{badge.label}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── FAQ Section ── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-main text-center mb-10">
              Questions? We've got answers.
            </h2>

            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 ${
                    openFaqIndex === index
                      ? 'border-primary-blue/30 shadow-md shadow-blue-50'
                      : 'border-border-light hover:border-border-light'
                  }`}
                >
                  <button
                    id={`faq-button-${index}`}
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-blue-50/50/50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/50 focus-visible:ring-offset-0"
                    aria-expanded={openFaqIndex === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3 className="text-base sm:text-lg font-semibold text-text-main pr-4">
                      {item.question}
                    </h3>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      openFaqIndex === index ? 'bg-primary-blue/10 rotate-180' : 'bg-blue-50'
                    }`}>
                      <ChevronDown
                        size={18}
                        className={`transition-colors duration-300 ${openFaqIndex === index ? 'text-primary-blue' : 'text-text-muted'}`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  <div
                    id={`faq-answer-${index}`}
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: openFaqIndex === index ? '500px' : '0px',
                      opacity: openFaqIndex === index ? 1 : 0,
                    }}
                    role="region"
                    aria-labelledby={`faq-button-${index}`}
                    hidden={openFaqIndex !== index}
                  >
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 text-sm text-text-muted leading-relaxed border-t border-border-light">
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
          <motion.div
            {...fadeUp}
            className="bg-gradient-to-b from-blue-50 via-white to-green-50/30 border border-blue-200/60 rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
          >
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-main mb-4">
                Your feed changes every day. Are you keeping up?
              </h2>
              <p className="text-base text-text-muted mb-3 max-w-lg mx-auto">
                A single scan shows a moment. Plus shows the story — how your feed shifts over time, and what's driving those changes.
              </p>
              <p className="text-sm text-text-muted/70 mb-8 max-w-md mx-auto">
                Try it free for {PRICING.trial.days} days. Cancel anytime. Your data stays yours.
              </p>
              <button
                onClick={handleStartTrial}
                className="group px-10 py-4 bg-gradient-to-r from-primary-blue to-blue-600 text-white rounded-full font-bold text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center gap-2.5"
              >
                Start your {PRICING.trial.label}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex justify-center gap-6 mt-5 text-xs text-text-muted">
                <span className="flex items-center gap-1.5"><Shield size={12} className="text-accent-green" /> No credit card for {PRICING.trial.days} days</span>
                <span className="flex items-center gap-1.5"><Zap size={12} className="text-primary-blue" /> Instant access</span>
              </div>
            </div>
          </motion.div>
        </section>

      </div>
    </>
  );
};

export default PlusPage;
