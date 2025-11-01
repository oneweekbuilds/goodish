import React from 'react';
import { MetricCard } from '../system/MetricCard';
import { Donut } from '../charts/Donut';
import { DataBar, DataBarSegment } from '../charts/DataBar';

export interface KeyInsightsProps {
  onLearnMore?: () => void;
}

/**
 * KeyInsights section - Three immediately readable metric cards
 *
 * 1. Echo Chamber — 71% (Donut chart)
 * 2. Influence Spectrum — segmented bar (Left/Neutral/Right)
 * 3. Top Product Categories — list with percentages
 */
export function KeyInsights({ onLearnMore }: KeyInsightsProps) {
  // Demo data
  const echoChamberScore = 71;

  const influenceSegments: DataBarSegment[] = [
    { label: 'Left', value: 45, color: '#4A90E2', percentage: 45 },
    { label: 'Neutral', value: 30, color: '#9CA3AF', percentage: 30 },
    { label: 'Right', value: 25, color: '#E74C3C', percentage: 25 },
  ];

  const topProducts = [
    { category: 'Technology', percentage: 35 },
    { category: 'Wellness', percentage: 27 },
    { category: 'Finance', percentage: 18 },
    { category: 'Fashion', percentage: 12 },
    { category: 'Food', percentage: 8 },
  ];

  return (
    <section className="py-24 px-6 md:px-10 bg-bg">
      <div className="max-w-container mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-ink mb-4">
            Three Key Insights
          </h2>
          <p className="text-lg text-inkMuted max-w-2xl mx-auto">
            At a glance, see what your algorithm thinks about you
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Echo Chamber */}
          <MetricCard
            title="Echo Chamber"
            value={`${echoChamberScore}%`}
            subtitle={`${echoChamberScore}% of your feed reinforces existing views.`}
            helpText="Higher percentage means more repetition of similar viewpoints. Aim for ≤40%."
            infoContent={
              <>
                <p className="mb-2">
                  The Echo Chamber score measures how often your feed repeats similar viewpoints.
                </p>
                <p>
                  A lower score indicates diverse perspectives. A higher score suggests algorithmic
                  filtering that reinforces your existing beliefs.
                </p>
              </>
            }
          >
            <div className="flex justify-center mt-4">
              <Donut value={echoChamberScore} size={120} />
            </div>
          </MetricCard>

          {/* Influence Spectrum */}
          <MetricCard
            title="Influence Spectrum"
            value="" // No single value, chart is the value
            subtitle="Distribution of political lean in recommended content."
            helpText="Shows the balance of left, neutral, and right-leaning content in your feed."
            infoContent={
              <>
                <p className="mb-2">
                  We analyze account sources and content to determine political lean.
                </p>
                <p>
                  A balanced feed shows roughly equal distribution. Skewed distribution suggests
                  algorithmic bias toward one perspective.
                </p>
              </>
            }
          >
            <DataBar segments={influenceSegments} showLabels={true} />
          </MetricCard>

          {/* Top Product Categories */}
          <MetricCard
            title="Top Product Categories"
            value="" // No single value
            subtitle="Ad topics inferred from your feed."
            helpText="Categories of products and services you're being marketed."
            infoContent={
              <>
                <p className="mb-2">
                  We detect product mentions and ad content to identify commercial influence.
                </p>
                <p>
                  This shows what advertisers think you're interested in, based on your feed
                  activity.
                </p>
              </>
            }
          >
            <ul className="space-y-2 mt-4">
              {topProducts.map((product, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span className="text-sm text-ink">{product.category}</span>
                  <span className="text-sm font-medium text-inkMuted tabular-nums">
                    {product.percentage}%
                  </span>
                </li>
              ))}
            </ul>
          </MetricCard>
        </div>

        {/* CTA */}
        {onLearnMore && (
          <div className="text-center mt-12">
            <button
              onClick={onLearnMore}
              className="text-brand hover:text-brandDark font-medium underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              See full dashboard →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
