import { useState } from 'react';
import { MetricPreviewCard } from '../../components/MetricPreviewCard';
import { Modal } from '../../components/system/Modal';

export function PreviewGrid() {
  const [selectedPreview, setSelectedPreview] = useState<number | null>(null);
  const previews = [
    {
      title: 'Echo Chamber',
      pill: '71%',
      subtitle: 'Viewpoint diversity',
      description: '71% of your content reinforces existing views. Consider following different perspectives.',
      pillColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
      scale: 'Scale: 0–40 diverse · 41–70 mixed · 71–100 narrow',
      calculation: 'We analyze the political leanings and source diversity of your recommended content to measure how much your feed reinforces existing viewpoints.',
      meaning: 'A high echo chamber score means your feed primarily shows content that aligns with your existing beliefs, potentially limiting exposure to diverse perspectives.'
    },
    {
      title: 'Top Products',
      pill: 'Tech',
      subtitle: 'Commercial influence',
      description: 'Most ads focus on technology and wellness products, suggesting algorithmic calibration.',
      pillColor: 'bg-gradient-to-br from-green-500 to-green-600',
      calculation: 'We categorize and analyze the commercial content in your feed to identify which product categories and brands are most frequently advertised to you.',
      meaning: 'This shows what advertisers think you\'re most likely to buy, revealing how algorithms have profiled your commercial interests and spending potential.'
    },
    {
      title: 'Emotional Tone',
      pill: '🧠',
      subtitle: 'Content characteristics',
      description: 'Your feed tends toward analytical rather than emotional content, indicating information density preference.',
      pillColor: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      calculation: 'We analyze the emotional characteristics of your content using sentiment analysis to understand what tone dominates your algorithmic environment.',
      meaning: 'This reveals whether your feed tends toward analytical, empathetic, or outrage-driven content, showing how algorithms shape your emotional engagement.'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-bg">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-ink mb-4 tracking-tight">
            What You'll See
          </h2>
          <p className="text-lg text-ink-2 max-w-2xl mx-auto">
            Preview of what you'll discover about your feed's patterns and influences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {previews.map((preview, index) => (
            <button
              key={index}
              onClick={() => setSelectedPreview(index)}
              className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary rounded-lg"
            >
              <MetricPreviewCard {...preview} />
            </button>
          ))}
        </div>

        {/* Preview Detail Modal */}
        <Modal
          isOpen={selectedPreview !== null}
          onClose={() => setSelectedPreview(null)}
          title={selectedPreview !== null ? previews[selectedPreview].title : ''}
        >
          {selectedPreview !== null && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary mb-2">How we calculate</h4>
                <p className="text-secondary leading-relaxed">
                  {previews[selectedPreview].calculation}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">What this means</h4>
                <p className="text-secondary leading-relaxed">
                  {previews[selectedPreview].meaning}
                </p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </section>
  );
}
