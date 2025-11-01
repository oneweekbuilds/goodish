import { useState } from 'react';
import { Modal } from '../../components/system/Modal';

export function HowItWorks() {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const steps = [
    {
      number: 1,
      title: 'Connect Accounts',
      description: 'Securely connect your social media accounts or try with sample data to get started immediately',
      details: 'We support data exports from major platforms including TikTok, Instagram, X (Twitter), YouTube, Facebook, and Reddit. Your data stays completely local on your device.'
    },
    {
      number: 2,
      title: 'We Analyze',
      description: 'Our lens scans your feed for bias patterns, commercial influence, and echo chambers',
      details: 'Our privacy-first analysis examines your content for political bias, emotional tone, commercial targeting, and echo chamber effects using transparent, open-source algorithms.'
    },
    {
      number: 3,
      title: 'Get Insights',
      description: 'Receive clear, actionable insights about your algorithmic environment',
      details: 'Get personalized recommendations to diversify your feed, understand your commercial profile, and make more informed choices about your digital consumption.'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-surface-2">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-ink mb-4 tracking-tight">
            How It Works
          </h2>
          <p className="text-lg text-ink-2 max-w-2xl mx-auto">
            Three simple steps to understand your algorithmic environment
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="flex flex-col items-center text-center"
              >
                {/* Step Number */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">
                    {step.number}
                  </div>
                </div>

                {/* Step Content */}
                <h3 className="text-xl font-semibold text-ink mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-ink-2 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Detail Modal */}
        <Modal
          isOpen={selectedStep !== null}
          onClose={() => setSelectedStep(null)}
          title={selectedStep ? steps[selectedStep - 1].title : ''}
        >
          {selectedStep && (
            <div className="space-y-4">
              <p className="text-secondary leading-relaxed">
                {steps[selectedStep - 1].details}
              </p>
            </div>
          )}
        </Modal>
      </div>
    </section>
  );
}
