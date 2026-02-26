import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, BarChart3, Globe, Megaphone, Scale, MessageSquare, Compass } from 'lucide-react';

/**
 * DashboardTour - Interactive spotlight tour of the 6 dashboard tabs
 *
 * Highlights each tab with a dimmed overlay + spotlight cutout + tooltip.
 * Triggers on first dashboard visit after account creation.
 * Uses localStorage to track completion. Can be re-triggered via props.
 *
 * Storage key: alg_dashboard_tour_completed
 */

const TOUR_STORAGE_KEY = 'alg_dashboard_tour_completed';

const TOUR_STEPS = [
  {
    tabId: 'overview',
    icon: BarChart3,
    title: 'Overview',
    description: 'Your feed at a glance — see what types of content appeared and in what proportions.',
    accent: '#2563EB',
  },
  {
    tabId: 'sources',
    icon: Globe,
    title: 'Sources',
    description: "Who's creating the content you see? Discover how diverse or concentrated your sources are.",
    accent: '#6366F1',
  },
  {
    tabId: 'ads',
    icon: Megaphone,
    title: 'Ads & Promotions',
    description: 'How much of your feed is promotional? See advertising patterns and sponsored content.',
    accent: '#D97706',
  },
  {
    tabId: 'politics',
    icon: Scale,
    title: 'Political Exposure',
    description: 'Observe the political composition of content in your feed — described, never judged.',
    accent: '#7C3AED',
  },
  {
    tabId: 'tone',
    icon: MessageSquare,
    title: 'Emotional Tone',
    description: 'What emotional tones characterize your feed? See the distribution of sentiment.',
    accent: '#0D9488',
  },
  {
    tabId: 'suggested_vs_followed',
    icon: Compass,
    title: 'Suggested vs. Followed',
    description: 'How much of your feed comes from accounts you chose vs. algorithmic suggestions?',
    accent: '#E11D48',
  },
];

const DashboardTour = ({ forceTour = false, onComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, placement: 'bottom' });
  const rafRef = useRef(null);

  // Check if tour should show
  useEffect(() => {
    if (forceTour) {
      setIsActive(true);
      return;
    }
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => setIsActive(true), 600);
      return () => clearTimeout(timer);
    }
  }, [forceTour]);

  // Find and measure the target tab element
  const measureTarget = useCallback(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    const el = document.getElementById(`tab-${step.tabId}`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const padding = 6;
    const paddedRect = {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      bottom: rect.bottom + padding,
      right: rect.right + padding,
    };
    setTargetRect(paddedRect);

    // Calculate tooltip position
    const tooltipWidth = 360;
    const tooltipHeight = 220;
    const gap = 16;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top, left, placement;

    // Prefer below the tab
    if (paddedRect.bottom + gap + tooltipHeight < viewportH) {
      placement = 'bottom';
      top = paddedRect.bottom + gap;
      left = paddedRect.left + paddedRect.width / 2 - tooltipWidth / 2;
    } else {
      // Above
      placement = 'top';
      top = paddedRect.top - gap - tooltipHeight;
      left = paddedRect.left + paddedRect.width / 2 - tooltipWidth / 2;
    }

    // Clamp horizontally
    left = Math.max(16, Math.min(left, viewportW - tooltipWidth - 16));

    setTooltipPosition({ top, left, placement });
  }, [isActive, currentStep]);

  // Measure on step change + resize
  useEffect(() => {
    if (!isActive) return;
    measureTarget();

    const handleResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measureTarget);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, currentStep, measureTarget]);

  // Scroll the target tab into view
  useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    const el = document.getElementById(`tab-${step.tabId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      // Re-measure after scroll settles
      const timer = setTimeout(measureTarget, 350);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep, measureTarget]);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsActive(false);
    onComplete?.();
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  // Handle keyboard
  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handleBack();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  if (!isActive || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const overlay = (
    <div className="fixed inset-0 z-[9998]" aria-hidden="true">
      {/* SVG overlay with cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left}
              y={targetRect.top}
              width={targetRect.width}
              height={targetRect.height}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.55)"
          mask="url(#tour-spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={handleSkip}
        />
      </svg>

      {/* Spotlight ring highlight */}
      <div
        className="absolute rounded-xl pointer-events-none"
        style={{
          top: targetRect.top - 2,
          left: targetRect.left - 2,
          width: targetRect.width + 4,
          height: targetRect.height + 4,
          boxShadow: `0 0 0 3px ${step.accent}, 0 0 20px ${step.accent}40`,
          transition: 'all 0.3s ease-out',
        }}
      />
    </div>
  );

  const tooltip = (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: tooltipPosition.placement === 'bottom' ? -10 : 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed z-[9999]"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: 360,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Dashboard tour: ${step.title}`}
      >
        {/* Arrow */}
        <div
          className="absolute w-3 h-3 rotate-45"
          style={{
            backgroundColor: 'white',
            [tooltipPosition.placement === 'bottom' ? 'top' : 'bottom']: -6,
            left: Math.min(
              Math.max(targetRect.left + targetRect.width / 2 - tooltipPosition.left - 6, 20),
              330
            ),
            boxShadow: tooltipPosition.placement === 'bottom'
              ? '-1px -1px 2px rgba(0,0,0,0.05)'
              : '1px 1px 2px rgba(0,0,0,0.05)',
          }}
        />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 w-full" style={{ backgroundColor: step.accent }} />

          <div className="p-5">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${step.accent}15` }}
                >
                  <Icon size={16} style={{ color: step.accent }} />
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: step.accent }}
                >
                  {currentStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                aria-label="Skip tour"
              >
                <X size={16} />
              </button>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              {step.description}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-4">
              {TOUR_STEPS.map((_, index) => (
                <div
                  key={index}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: index === currentStep ? '20px' : '6px',
                    backgroundColor: index <= currentStep ? step.accent : '#E2E8F0',
                  }}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
              >
                Skip tour
              </button>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft size={14} />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                  style={{ backgroundColor: step.accent }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(0.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'none';
                  }}
                >
                  {isLastStep ? 'Get Started' : 'Next'}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(
    <>
      {overlay}
      {tooltip}
    </>,
    document.body
  );
};

export { TOUR_STORAGE_KEY };
export default DashboardTour;
