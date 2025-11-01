import React, { useState } from 'react';
import { Modal } from '../system/Modal';

export interface HowItWorksProps {}

/**
 * HowItWorks section - 3 steps with icons
 *
 * Steps:
 * 1. Connect Accounts → We Analyze → Get Insights
 *
 * Each step has 1-sentence explanation + "View privacy" modal
 */
export function HowItWorks({}: HowItWorksProps) {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const steps = [
    {
      number: 1,
      title: 'Connect Accounts',
      description: 'Upload your data exports from Instagram, TikTok, YouTube, X, Facebook, or Reddit.',
      icon: (
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-brand"
        >
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
          <path
            d="M24 16V32M16 24H32"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'We Analyze',
      description: 'Our algorithms run locally in your browser—no data leaves your device.',
      icon: (
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-brand"
        >
          <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M16 24L22 30L32 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Get Insights',
      description: 'View your bias profile, echo chamber score, ad influence, and more.',
      icon: (
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-brand"
        >
          <rect x="8" y="12" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="2" />
          <path
            d="M16 20L20 28L24 22L28 30L32 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      <section className="py-24 px-6 md:px-10 bg-panel">
        <div className="max-w-container mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-ink mb-4">
              How It Works
            </h2>
            <p className="text-lg text-inkMuted max-w-2xl mx-auto">
              Three simple steps to understand your algorithm
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="mb-4">{step.icon}</div>

                {/* Number badge */}
                <div className="mb-3 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-semibold">
                  {step.number}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-ink mb-2">{step.title}</h3>

                {/* Description */}
                <p className="text-sm text-inkMuted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Privacy CTA */}
          <div className="text-center mt-12">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="inline-flex items-center gap-2 text-brand hover:text-brandDark font-medium underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 1L2 4V7C2 11 5 14 8 15C11 14 14 11 14 7V4L8 1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              View privacy details
            </button>
          </div>
        </div>
      </section>

      {/* Privacy Modal */}
      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Local-first, by design"
        size="md"
      >
        <div className="space-y-4 text-sm text-inkMuted leading-relaxed">
          <p>
            <strong className="text-ink">Your analysis runs on your device.</strong> We do not
            store or sell your data. Everything happens in your browser—no cloud processing, no
            external servers.
          </p>

          <p>
            When you upload your data exports, they never leave your computer. Our algorithms
            analyze them locally and generate insights that exist only in your session.
          </p>

          <p>
            <strong className="text-ink">You control what you export.</strong> If you choose to
            export your insights as a CSV, that file is generated locally on your machine. We never
            see it.
          </p>

          <p>
            <strong className="text-ink">No telemetry or analytics.</strong> We don't track you.
            We don't collect metrics. We don't use cookies for anything other than saving your
            preferences.
          </p>

          <p className="pt-2 border-t border-line text-xs">
            AlgorithmLens is open source. You can review the code, run it yourself, or contribute
            improvements.
          </p>
        </div>
      </Modal>
    </>
  );
}
