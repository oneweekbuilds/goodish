import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ScanWalkthrough - Post-first-scan onboarding tooltip
 *
 * Appears as a floating tooltip card after a user completes their first scan.
 * Guides users through key dashboard features with a 4-step walkthrough.
 *
 * Features:
 * - Self-contained show/hide logic based on localStorage
 * - Smooth framer-motion animations
 * - Step progress indicator with dots
 * - Navigation buttons (Next, Back, Skip)
 * - Blue accent styling consistent with design system
 *
 * Props:
 * - showWalkthrough: boolean (optional) - Force show the walkthrough (for testing)
 */
const ScanWalkthrough = ({ showWalkthrough = false }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const wasCompleted = localStorage.getItem('alg_walkthrough_completed');
    const shouldShow = showWalkthrough || (!wasCompleted && localStorage.getItem('alg_first_scan_completed'));
    setIsVisible(shouldShow);
  }, [showWalkthrough]);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to your dashboard',
      description: 'This is your overview — a snapshot of the patterns and labels that appeared in this scan.',
      target: 'hero-section', // CSS class or ID to point to
    },
    {
      id: 'explore-tabs',
      title: 'Explore your tabs',
      description: 'Each tab breaks down a different dimension: what sources appear, ads in your feed, political content patterns, tone, and more.',
      target: 'tab-navigation',
    },
    {
      id: 'track-changes',
      title: 'Track changes over time',
      description: 'Run more scans to see how your algorithmic profile shifts over time. Plus members get full trend analysis.',
      target: 'trends-area',
    },
    {
      id: 'upgrade',
      title: 'Upgrade for deeper insights',
      description: 'AlgorithmLens Plus unlocks longitudinal trends, cross-platform comparisons, and priority support.',
      target: 'cta-area',
      cta: true,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeWalkthrough();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeWalkthrough = () => {
    localStorage.setItem('alg_walkthrough_completed', 'true');
    setIsVisible(false);
  };

  const handleSkip = () => {
    completeWalkthrough();
  };

  const handleViewPlus = () => {
    completeWalkthrough();
    navigate('/plus');
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-8 right-8 z-50 max-w-sm"
      >
        {/* Main tooltip card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header with accent bar */}
          <div
            className="h-1 w-full"
            style={{ backgroundColor: '#2563EB' }}
          />

          {/* Content */}
          <div className="p-6">
            {/* Step counter */}
            <div className="flex items-center justify-between mb-4">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: '#2563EB' }}
              >
                {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Skip tour"
                title="Skip tour"
              >
                <X size={18} />
              </button>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-text-main mb-3">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-text-muted leading-relaxed mb-6">
              {step.description}
            </p>

            {/* CTA Button for last step */}
            {step.cta && (
              <button
                onClick={handleViewPlus}
                className="w-full mb-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
              >
                View Plus
              </button>
            )}

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="h-2 rounded-full transition-all duration-200"
                  style={{
                    width: index === currentStep ? '20px' : '8px',
                    backgroundColor: index <= currentStep ? '#2563EB' : '#E2E8F0',
                  }}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2 justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                Skip tour
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                  style={{
                    backgroundColor: '#2563EB',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1D4ED8';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2563EB';
                  }}
                >
                  {isLastStep ? 'Finish' : 'Next'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Optional: Subtle info text below card */}
        <p
          className="text-xs text-slate-400 text-center mt-3 px-4"
          style={{ color: 'rgba(148, 163, 184, 0.6)' }}
        >
          You can close this anytime
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScanWalkthrough;
