import React from 'react';
import { Fingerprint, MessageCircle, Tag } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ScaleBadge } from '../../components/ui/ScaleBadge';

export function ThreeInsights() {
  const insights = [
    {
      icon: Fingerprint,
      title: 'Echo Chamber Score',
      subtitle: 'Viewpoint diversity vs. reinforcement',
      description: 'Measures how much your feed reinforces similar viewpoints vs. showing diverse perspectives.',
      scales: [
        { label: 'Diverse', range: '0–40' },
        { label: 'Mixed', range: '41–70' },
        { label: 'Narrow', range: '71–100' }
      ]
    },
    {
      icon: Tag,
      title: 'Product Categories',
      subtitle: 'What your ads/products push most',
      description: 'Shows which commercial categories dominate your ad exposure and product mentions.',
      scales: [
        { label: 'Balanced', range: '<30%' },
        { label: 'Focused', range: '30–50%' },
        { label: 'Dominant', range: '>50%' }
      ]
    },
    {
      icon: MessageCircle,
      title: 'Emotional Tone',
      subtitle: 'Analytical, empathetic, calm, emotional, outrage',
      description: 'Analyzes whether content is analytical, empathetic, calm, emotional, or outrage-driven.',
      scales: [
        { label: 'Analytical', emoji: '🧠' },
        { label: 'Empathetic', emoji: '💚' },
        { label: 'Calm', emoji: '😌' },
        { label: 'Emotional', emoji: '😢' },
        { label: 'Outrage', emoji: '😡' }
      ]
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-bg">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-ink mb-4 tracking-tight">
            Three Key Insights
          </h2>
          <p className="text-lg text-ink-2 max-w-2xl mx-auto">
            AlgorithmLens reveals the hidden patterns in your digital diet,
            helping you understand and rebalance your algorithmic environment.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div
                key={index}
                className="bg-surface-1 border border-stroke rounded-xl shadow-card p-6 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-ink-2" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-ink mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-ink-3">
                      {insight.subtitle}
                    </p>
                  </div>
                </div>

                {/* Scale chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {insight.scales.map((scale: any, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-accent-soft rounded-full px-2.5 py-0.5 text-xs text-ink-2"
                    >
                      {scale.emoji && <span>{scale.emoji}</span>}
                      <span className="font-medium">{scale.label}</span>
                      {scale.range && <span className="text-ink-3">{scale.range}</span>}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
