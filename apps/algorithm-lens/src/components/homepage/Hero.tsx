import React, { useState } from 'react';
import { LensCanvas, LensMode } from './LensCanvas';
import { Button } from '../system/Button';

export interface HeroProps {
  onTrySample?: () => void;
  onHowItWorks?: () => void;
}

/**
 * Hero section with interactive LensCanvas
 *
 * Left column:
 * - Eyebrow: "See What Your Feed Reveals"
 * - H1: "Understand Your Algorithm"
 * - Subhead: Clear value prop
 * - CTAs: Try Sample Data + How it works
 * - Trust row: MIT/Harvard · Local-first · Open source
 *
 * Right column:
 * - LensCanvas with mode toggle
 */
export function Hero({ onTrySample, onHowItWorks }: HeroProps) {
  const [lensMode, setLensMode] = useState<LensMode>('bias');

  return (
    <section className="relative min-h-screen flex items-center py-24 px-6 md:px-10">
      <div className="max-w-container mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brandLight border border-brand/20">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-brand"
              >
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8 1V3M8 13V15M15 8H13M3 8H1M12.5 12.5L11 11M5 5L3.5 3.5M12.5 3.5L11 5M5 11L3.5 12.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-sm font-medium text-brand">See What Your Feed Reveals</span>
            </div>

            {/* H1 */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-semibold text-ink tracking-tight"
              style={{ lineHeight: '1.1' }}
            >
              Understand Your Algorithm
            </h1>

            {/* Subhead */}
            <p className="text-lg md:text-xl text-inkMuted leading-relaxed">
              AlgorithmLens shows what your feed says about you—your biases, influence bubble, and
              what you're being sold. Fully local. Nothing stored.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              {onTrySample && (
                <Button variant="primary" size="lg" onClick={onTrySample}>
                  Try Sample Data
                </Button>
              )}
              {onHowItWorks && (
                <Button variant="secondary" size="lg" onClick={onHowItWorks}>
                  How it works →
                </Button>
              )}
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-inkMuted">
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 1L10.5 6L16 6.5L12 10.5L13 16L8 13L3 16L4 10.5L0 6.5L5.5 6L8 1Z"
                    fill="currentColor"
                  />
                </svg>
                Built at MIT/Harvard innovation lab
              </div>
              <span>·</span>
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 1C6 1 4 2 4 4C4 6 6 7 8 7C10 7 12 6 12 4C12 2 10 1 8 1ZM8 7C4 7 1 9 1 11V15H15V11C15 9 12 7 8 7Z"
                    fill="currentColor"
                  />
                </svg>
                Local-first · Open source & privacy-first
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              {(['bias', 'ads', 'tone'] as LensMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLensMode(mode)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    transition-all
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
                    ${lensMode === mode
                      ? 'bg-brand text-white shadow-e1'
                      : 'bg-panel text-inkMuted hover:text-ink border border-line'
                    }
                  `.replace(/\s+/g, ' ').trim()}
                >
                  {mode === 'bias' && 'Bias'}
                  {mode === 'ads' && 'Ads'}
                  {mode === 'tone' && 'Tone'}
                </button>
              ))}
            </div>

            {/* LensCanvas */}
            <LensCanvas mode={lensMode} />
          </div>
        </div>
      </div>
    </section>
  );
}
