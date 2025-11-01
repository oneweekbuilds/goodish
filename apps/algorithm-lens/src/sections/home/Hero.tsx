import React from 'react';
import { Shield, Eye, Brain } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface HeroProps {
  onTrySample: () => void;
  onConnectAccounts: () => void;
}

export function Hero({ onTrySample, onConnectAccounts }: HeroProps) {
  return (
    <section className="relative min-h-[80vh] bg-bg overflow-hidden flex items-center">
      {/* Subtle Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-end pr-[10%] opacity-[0.03] pointer-events-none">
        <img
          src="/logo.png"
          alt=""
          className="w-[600px] h-auto"
          aria-hidden="true"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-8 py-20 w-full">
        <div className="max-w-4xl">
          {/* Hero Title */}
          <h1
            className="font-bold text-ink tracking-tight leading-tight mb-6"
            style={{ fontSize: 'clamp(28px, 6vw, 44px)' }}
          >
            See what your feed says about you
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-ink-2 leading-relaxed max-w-[720px] mb-8">
            AlgorithmLens reveals what your feed says about you — your biases,
            your influence bubble, and what you're being sold.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button onClick={onTrySample} size="lg" variant="primary">
              Try Sample Data
            </Button>
            <Button onClick={onConnectAccounts} size="lg" variant="outline">
              Connect Accounts
            </Button>
          </div>

          {/* Trust Markers */}
          <div className="flex flex-wrap items-start gap-6 text-xs">
            <div className="inline-flex items-center gap-2 bg-surface-2 rounded-full px-2.5 py-1 text-ink-3">
              <Shield className="w-3 h-3 flex-shrink-0" />
              <span>Research-backed methodology</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-surface-2 rounded-full px-2.5 py-1 text-ink-3">
              <Eye className="w-3 h-3 flex-shrink-0" />
              <span>Your data stays local</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-surface-2 rounded-full px-2.5 py-1 text-ink-3">
              <Brain className="w-3 h-3 flex-shrink-0" />
              <span>Open source & privacy-first</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
