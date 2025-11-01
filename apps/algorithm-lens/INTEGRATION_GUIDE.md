# Quick Integration Guide

## 🚀 5-Minute Setup

This guide shows you how to integrate the new hardened features into your existing AlgorithmLens app.

---

## Step 1: Initialize Database on App Start

**File:** `src/main.tsx`

```typescript
import { getDB } from './lib/db';

// Initialize database
getDB().catch(console.error);
```

---

## Step 2: Update Samples Page

**File:** `src/routes/Samples.tsx`

Replace the current loading logic with the new validated loader:

```diff
+ import { loadBuiltInSample, LoadProgress, LoadResult } from '../lib/loadSamplesNew';
+ import { useSamples } from '../lib/useSamples';
+ import { DismissibleAlert } from '../components/ui/Alert';

export function Samples({ onComplete }: { onComplete: () => void }) {
+  const { counts, refresh } = useSamples();
+  const [progress, setProgress] = useState<Record<string, number>>({});
+  const [results, setResults] = useState<Record<string, LoadResult>>({});
+  const [errors, setErrors] = useState<string[]>([]);

  async function handleLoadOne(sample: Sample) {
+    const result = await loadBuiltInSample(sample.filename, (prog) => {
+      setProgress(prev => ({
+        ...prev,
+        [sample.filename]: (prog.loaded / prog.total) * 100
+      }));
+    });
+
+    setResults(prev => ({ ...prev, [sample.filename]: result }));
+
+    if (result.errors.length > 0) {
+      setErrors(result.errors);
+    }
+
+    await refresh();
  }

  return (
    <div>
+      <DismissibleAlert title="Loading errors" items={errors} variant="error" />
+
+      {/* Show counts */}
+      <div className="text-center mb-6">
+        <div className="text-4xl font-bold text-brand-primary">{counts.total}</div>
+        <div className="text-sm text-secondary">items loaded</div>
+      </div>

      {/* Sample cards with progress */}
      {SAMPLES.map(sample => (
        <SampleCard
          key={sample.filename}
          {...sample}
+          progress={progress[sample.filename]}
+          result={results[sample.filename]}
          onClick={() => handleLoadOne(sample)}
        />
      ))}
    </div>
  );
}
```

---

## Step 3: Update Dashboard to Use Real Metrics

**File:** `src/routes/DashboardNew.tsx`

Replace mock data with real computed metrics:

```diff
+ import { useEffect, useState } from 'react';
+ import { calculateEchoScore } from '../lib/metrics/echo';
+ import { getPoliticalSplit } from '../lib/metrics/politics';
+ import { getTopProductCategories } from '../lib/metrics/products';
+ import { getToneDistribution } from '../lib/metrics/tone';
+ import { getDiversityByPlatform } from '../lib/metrics/diversity';
+ import { buildSuggestions } from '../lib/suggestions';
+ import { RingGauge } from '../components/charts/RingGauge';
+ import { TriSegmentBar } from '../components/charts/TriSegmentBar';
+ import { HorizontalBars } from '../components/charts/HorizontalBars';
+ import { DismissibleAlert } from '../components/ui/Alert';
+ import { ScaleBadge } from '../components/ui/ScaleBadge';
+ import { ErrorBoundary } from '../components/ErrorBoundary';

export function DashboardNew() {
-  const mockData = { ... };
+  const [metrics, setMetrics] = useState<any>(null);
+  const [loading, setLoading] = useState(true);
+  const [errors, setErrors] = useState<string[]>([]);

+  useEffect(() => {
+    async function loadMetrics() {
+      try {
+        const [echo, politics, products, tone, diversity] = await Promise.all([
+          calculateEchoScore(),
+          getPoliticalSplit(true),
+          getTopProductCategories(5),
+          getToneDistribution(),
+          getDiversityByPlatform()
+        ]);
+
+        setMetrics({ echo, politics: politics.overall, products, tone, diversity });
+      } catch (e: any) {
+        setErrors([`Failed to compute metrics: ${e.message}`]);
+      } finally {
+        setLoading(false);
+      }
+    }
+    loadMetrics();
+  }, []);
+
+  if (loading) return <div>Computing metrics...</div>;
+  if (!metrics) return <div>No data available</div>;
+
+  const suggestions = buildSuggestions({
+    echo: metrics.echo.score,
+    topAds: metrics.products.map(p => ({ category: p.category, share: p.percentage })),
+    tone: Object.fromEntries(metrics.tone.map(t => [t.tone, t.percentage]))
+  });

  return (
+    <ErrorBoundary>
      <div>
+        <DismissibleAlert title="Computation errors" items={errors} variant="error" />

        {/* Echo Chamber Score */}
        <div>
-          <BadgeNumber value={`${mockData.echoChamberScore}%`} />
+          <RingGauge value={metrics.echo.score} label="Echo score" />
+          <ScaleBadge label="Scale" range="0–40 diverse · 41–70 mixed · 71–100 narrow" />
        </div>

        {/* Influence Spectrum */}
        <div>
-          <Pill>Left {mockData.influenceSpectrum.left}%</Pill>
+          <TriSegmentBar
+            left={metrics.politics.leftPercent}
+            neutral={metrics.politics.neutralPercent}
+            right={metrics.politics.rightPercent}
+          />
        </div>

        {/* Tone Chart */}
        <div>
-          <SimpleBar data={mockData.toneData} />
+          <HorizontalBars
+            data={metrics.tone.map(t => ({
+              label: t.tone,
+              value: t.percentage,
+              color: t.color,
+              emoji: t.emoji
+            }))}
+          />
        </div>

        {/* Suggested Actions */}
+        {suggestions.map(s => (
+          <ActionCard key={s.id} title={s.title} description={s.why} cta={s.cta} />
+        ))}
      </div>
+    </ErrorBoundary>
  );
}
```

---

## Step 4: Add Modals to Dashboard

```diff
+ import { OpposingViewsModal } from '../components/modals/OpposingViewsModal';
+ import { AdPreferencesModal } from '../components/modals/AdPreferencesModal';
+ import { OutrageTipsModal } from '../components/modals/OutrageTipsModal';

export function DashboardNew() {
+  const [showOpposingViews, setShowOpposingViews] = useState(false);
+  const [showAdPrefs, setShowAdPrefs] = useState(false);
+  const [showOutrageTips, setShowOutrageTips] = useState(false);

  // ... (in suggested actions section)
  <ActionCard
    onClick={() => {
+      if (suggestion.action === 'opposingViews') setShowOpposingViews(true);
+      else if (suggestion.action === 'adPreferences') setShowAdPrefs(true);
+      else if (suggestion.action === 'outrageReduction') setShowOutrageTips(true);
    }}
  />

  return (
    <>
      {/* ... dashboard content ... */}
+      <OpposingViewsModal open={showOpposingViews} onClose={() => setShowOpposingViews(false)} />
+      <AdPreferencesModal open={showAdPrefs} onClose={() => setShowAdPrefs(false)} />
+      <OutrageTipsModal open={showOutrageTips} onClose={() => setShowOutrageTips(false)} />
    </>
  );
}
```

---

## Step 5: Add "Clear All" Button to Samples Page

```tsx
import { clearAllSamples } from '../lib/db';

<Button
  variant="secondary"
  onClick={async () => {
    if (confirm('Clear all sample data?')) {
      await clearAllSamples();
      await refresh();
    }
  }}
>
  Clear All Samples
</Button>
```

---

## Step 6: Update Home Page with Scale Badges

**File:** `src/routes/HomepageNew.tsx` or relevant sections

Add scale badges to "What You'll See" preview cards:

```tsx
import { ScaleBadge } from '../components/ui/ScaleBadge';

<MetricPreviewCard title="Echo Chamber" value="71%">
  <ScaleBadge label="Scale" range="0–40 diverse · 41–70 mixed · 71–100 narrow" />
  <p className="text-sm text-secondary mt-2">
    71% of content reinforces existing views—higher concentration than most users.
  </p>
</MetricPreviewCard>
```

---

## Step 7: Add Export Functionality

Create `src/lib/export.ts`:

```typescript
export function exportMetricsToCSV(metrics: any) {
  const rows = [
    ['Metric', 'Value'],
    ['Echo Chamber Score', metrics.echo.score],
    ['Political Left %', metrics.politics.leftPercent],
    ['Political Neutral %', metrics.politics.neutralPercent],
    ['Political Right %', metrics.politics.rightPercent],
    ...metrics.tone.map(t => [`Tone: ${t.tone}`, t.percentage])
  ];

  const csv = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'algorithm-lens-metrics.csv';
  a.click();
  URL.revokeObjectURL(url);
}
```

Add button to Dashboard:

```tsx
import { exportMetricsToCSV } from '../lib/export';

<Button onClick={() => exportMetricsToCSV(metrics)}>
  Export CSV
</Button>
```

---

## Step 8: Wrap App in ErrorBoundary

**File:** `src/main.tsx`

```diff
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
+    <ErrorBoundary>
      <App />
+    </ErrorBoundary>
  </React.StrictMode>
);
```

---

## ✅ Verification Checklist

After integration, verify:

- [ ] Database initializes on app load (check DevTools → Application → IndexedDB)
- [ ] Sample data loads without errors
- [ ] Counts display correctly on Samples page
- [ ] Dashboard shows real computed metrics (not mock data)
- [ ] Charts render with correct data
- [ ] Suggested Actions appear based on actual metrics
- [ ] Modals open when clicking action CTAs
- [ ] Export CSV downloads correctly
- [ ] Error alerts appear when issues occur
- [ ] No TypeScript errors in console

---

## 🐛 Common Issues

**Problem:** Database not persisting between reloads
- **Solution:** Check browser settings allow IndexedDB. Try incognito mode.

**Problem:** Metrics show 0
- **Solution:** Ensure sample data is loaded. Check `useSamples()` returns non-zero counts.

**Problem:** Charts not rendering
- **Solution:** Parent container must have explicit width. Add `width="100%"` to chart components.

**Problem:** TypeScript errors on existing code
- **Solution:** Add `// @ts-ignore` above problematic lines or cast types as needed for legacy compatibility.

---

## 📊 Testing

Run the app:
```bash
npm run dev
```

Load samples, navigate to Dashboard, verify all metrics display correctly.

---

**Quick Start:** Follow Steps 1-4 for minimum viable integration. Steps 5-8 are enhancements.
