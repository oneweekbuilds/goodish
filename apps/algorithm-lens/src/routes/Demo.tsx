import { useState, useEffect } from 'react';
import { RingGauge } from '../components/charts/RingGauge';
import { TriSegmentBar } from '../components/charts/TriSegmentBar';
import { HorizontalBars } from '../components/charts/HorizontalBars';
import { BubbleChart, BubbleData } from '../components/charts/BubbleChart';
import { DismissibleAlert } from '../components/ui/Alert';
import { ScaleBadge } from '../components/ui/ScaleBadge';
import { Button } from '../components/ui/Button';
import { OpposingViewsModal } from '../components/modals/OpposingViewsModal';
import { AdPreferencesModal } from '../components/modals/AdPreferencesModal';
import { OutrageTipsModal } from '../components/modals/OutrageTipsModal';
import { useSamples } from '../lib/useSamples';
import { loadBuiltInSample } from '../lib/loadSamplesNew';
import { calculateEchoScore } from '../lib/metrics/echo';
import { getPoliticalSplit } from '../lib/metrics/politics';
import { getTopProductCategories } from '../lib/metrics/products';
import { getToneDistribution } from '../lib/metrics/tone';
import { buildSuggestions } from '../lib/suggestions';

export function Demo() {
  const { counts, refresh } = useSamples();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const [showOpposingViews, setShowOpposingViews] = useState(false);
  const [showAdPrefs, setShowAdPrefs] = useState(false);
  const [showOutrageTips, setShowOutrageTips] = useState(false);

  const mockBubbleData: BubbleData[] = [
    { category: 'Technology', x: 5, y: 35, size: 10, color: '#3B82F6', brands: ['Apple', 'Google'] },
    { category: 'Wellness', x: 3, y: 27, size: 8, color: '#10B981', brands: ['Peloton', 'Calm'] },
    { category: 'Finance', x: 4, y: 18, size: 6, color: '#F59E0B', brands: ['Robinhood', 'Chase'] },
    { category: 'Fashion', x: 2, y: 12, size: 5, color: '#EF4444', brands: ['Nike', 'Zara'] },
    { category: 'Food', x: 1, y: 8, size: 3, color: '#8B5CF6', brands: ['HelloFresh'] }
  ];

  async function loadSampleData() {
    setLoading(true);
    try {
      const result = await loadBuiltInSample('x_tweets_sample.js');
      if (result.errors.length > 0) {
        setErrors(result.errors);
      }
      await refresh();
      await computeMetrics();
    } catch (e: any) {
      setErrors([e.message]);
    } finally {
      setLoading(false);
    }
  }

  async function computeMetrics() {
    try {
      const [echo, politics, products, tone] = await Promise.all([
        calculateEchoScore(),
        getPoliticalSplit(true),
        getTopProductCategories(5),
        getToneDistribution()
      ]);

      setMetrics({ echo, politics: politics.overall, products, tone });
    } catch (e: any) {
      setErrors([`Failed to compute metrics: ${e.message}`]);
    }
  }

  useEffect(() => {
    if (counts.total > 0 && !metrics) {
      computeMetrics();
    }
  }, [counts.total]);

  const suggestions = metrics ? buildSuggestions({
    echo: metrics.echo.score,
    topAds: metrics.products.map((p: any) => ({ category: p.category, share: p.percentage })),
    tone: Object.fromEntries(metrics.tone.map((t: any) => [t.tone, t.percentage]))
  }) : [];

  return (
    <div className="min-h-screen bg-neutral-50 pt-16">

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">
              🎨 New Features Demo
            </h1>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              This page showcases all the new production-ready components and features.
            </p>
          </div>

          {/* Errors */}
          <DismissibleAlert title="Errors" items={errors} variant="error" />

          {/* Data Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Local Database Status</h3>
                <p className="text-sm text-secondary">
                  Items loaded: <span className="font-bold text-brand-primary">{counts.total}</span>
                </p>
                {counts.total > 0 && (
                  <p className="text-xs text-tertiary mt-1">
                    X: {counts.x} • Instagram: {counts.instagram} • TikTok: {counts.tiktok}
                  </p>
                )}
              </div>
              <Button onClick={loadSampleData} loading={loading} disabled={loading}>
                {counts.total === 0 ? 'Load Sample Data' : 'Reload Data'}
              </Button>
            </div>
          </div>

          {/* Charts Showcase */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">📊 Chart Components</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Ring Gauge */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Ring Gauge</h3>
                <div className="flex justify-center mb-4">
                  <RingGauge value={metrics?.echo.score || 71} label="Echo score" />
                </div>
                <ScaleBadge label="Scale" range="0–40 diverse · 41–70 mixed · 71–100 narrow" />
                <p className="text-sm text-secondary mt-3">
                  Shows circular progress with color-coded bands based on value ranges.
                </p>
              </div>

              {/* Tri-Segment Bar */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Tri-Segment Bar</h3>
                <TriSegmentBar
                  left={metrics?.politics.leftPercent || 45}
                  neutral={metrics?.politics.neutralPercent || 30}
                  right={metrics?.politics.rightPercent || 25}
                />
                <p className="text-sm text-secondary mt-4">
                  Displays three-way distribution with color-coded segments and legend.
                </p>
              </div>

              {/* Horizontal Bars */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Horizontal Bars</h3>
                <HorizontalBars
                  data={metrics?.tone.map((t: any) => ({
                    label: t.tone,
                    value: t.percentage,
                    color: t.color,
                    emoji: t.emoji
                  })) || [
                    { label: 'Analytical', value: 45, color: '#3B82F6', emoji: '🧠' },
                    { label: 'Empathetic', value: 31, color: '#10B981', emoji: '💚' },
                    { label: 'Calm', value: 15, color: '#8B5CF6', emoji: '😌' },
                    { label: 'Outrage', value: 9, color: '#EF4444', emoji: '😡' }
                  ]}
                />
                <p className="text-sm text-secondary mt-4">
                  Shows percentage-based bars with emojis and smooth animations.
                </p>
              </div>

              {/* Bubble Chart */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Bubble Chart</h3>
                <BubbleChart data={mockBubbleData} width={450} height={280} />
                <p className="text-sm text-secondary mt-4">
                  Interactive scatter plot with filtering, tooltips, and labeled axes.
                </p>
              </div>
            </div>
          </div>

          {/* UI Components */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">🎨 UI Components</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Alerts</h3>
                <DismissibleAlert
                  title="Warning Example"
                  items={['This is a warning message', 'It can have multiple items']}
                  variant="warning"
                />
                <div className="mt-4">
                  <DismissibleAlert
                    title="Info Example"
                    items={['This is an info message']}
                    variant="info"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Scale Badges</h3>
                <div className="space-y-3">
                  <ScaleBadge label="Echo" range="0–40 diverse · 41–70 mixed · 71–100 narrow" />
                  <ScaleBadge label="Quality" range="0–50 low · 51–80 medium · 81–100 high" />
                  <p className="text-sm text-secondary mt-3">
                    Shows metric ranges with labels for easy interpretation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modals Showcase */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">💬 Action Modals</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="font-semibold mb-3">Opposing Views</h3>
                <p className="text-sm text-secondary mb-4">
                  Curated account recommendations to diversify your feed.
                </p>
                <Button onClick={() => setShowOpposingViews(true)} variant="secondary" size="md">
                  Open Modal
                </Button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="font-semibold mb-3">Ad Preferences</h3>
                <p className="text-sm text-secondary mb-4">
                  Step-by-step guide to adjust ad settings per platform.
                </p>
                <Button onClick={() => setShowAdPrefs(true)} variant="secondary" size="md">
                  Open Modal
                </Button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="font-semibold mb-3">Outrage Tips</h3>
                <p className="text-sm text-secondary mb-4">
                  Practical tips to reduce inflammatory content exposure.
                </p>
                <Button onClick={() => setShowOutrageTips(true)} variant="secondary" size="md">
                  Open Modal
                </Button>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-6">💡 Dynamic Suggestions</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {suggestions.map((s: any) => (
                  <div key={s.id} className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                    <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                    <p className="text-sm text-secondary mb-4">{s.why}</p>
                    <button className="text-brand-primary font-medium hover:underline">
                      {s.cta} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentation Links */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-semibold mb-4">📚 Documentation</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">For Developers:</h3>
                <ul className="space-y-2 text-sm">
                  <li>• <code className="bg-white px-2 py-1 rounded">IMPLEMENTATION_SUMMARY.md</code> - What was built</li>
                  <li>• <code className="bg-white px-2 py-1 rounded">HARDENING_IMPLEMENTATION.md</code> - Technical details</li>
                  <li>• <code className="bg-white px-2 py-1 rounded">INTEGRATION_GUIDE.md</code> - Code examples</li>
                  <li>• <code className="bg-white px-2 py-1 rounded">NEXT_STEPS.md</code> - Integration checklist</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Key Features:</h3>
                <ul className="space-y-2 text-sm">
                  <li>✅ IndexedDB local persistence</li>
                  <li>✅ Zod runtime validation</li>
                  <li>✅ 5 production metrics</li>
                  <li>✅ 4 chart components</li>
                  <li>✅ Dynamic suggestions</li>
                  <li>✅ Full TypeScript coverage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <OpposingViewsModal open={showOpposingViews} onClose={() => setShowOpposingViews(false)} />
      <AdPreferencesModal open={showAdPrefs} onClose={() => setShowAdPrefs(false)} />
      <OutrageTipsModal open={showOutrageTips} onClose={() => setShowOutrageTips(false)} />
    </div>
  );
}
