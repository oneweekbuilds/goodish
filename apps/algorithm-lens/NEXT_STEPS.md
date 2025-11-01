# Next Steps - Integration Checklist

This document provides a step-by-step checklist for integrating all the new production-ready features into your AlgorithmLens application.

---

## ✅ Phase 1: Foundation (30 minutes)

### 1.1 Verify Dependencies Installed
```bash
cd apps/algorithm-lens
npm list idb zod clsx html2canvas vitest @playwright/test
```
✅ Should show all 6 packages installed

### 1.2 Initialize Database on App Start
**File:** `src/main.tsx`

Add at top of file:
```typescript
import { getDB } from './lib/db';

// Initialize IndexedDB
getDB().catch(console.error);
```

### 1.3 Test Database Works
Open browser DevTools → Application → IndexedDB → Check `algorithm-lens` database exists

---

## ✅ Phase 2: Samples Page (1 hour)

### 2.1 Update Samples Page to Use New Loader
**File:** `src/routes/Samples.tsx`

Replace imports:
```typescript
import { loadBuiltInSample, LoadProgress, LoadResult } from '../lib/loadSamplesNew';
import { useSamples } from '../lib/useSamples';
import { DismissibleAlert } from '../components/ui/Alert';
```

Add state:
```typescript
const { counts, refresh } = useSamples();
const [progress, setProgress] = useState<Record<string, LoadProgress>>({});
const [results, setResults] = useState<Record<string, LoadResult>>({});
const [errors, setErrors] = useState<string[]>([]);
```

Update handleLoadOne function:
```typescript
async function handleLoadOne(sample: Sample) {
  const result = await loadBuiltInSample(sample.filename, (prog) => {
    setProgress(prev => ({ ...prev, [sample.filename]: prog }));
  });

  setResults(prev => ({ ...prev, [sample.filename]: result }));
  if (result.errors.length > 0) setErrors(result.errors);
  await refresh();
}
```

Add UI for errors:
```tsx
<DismissibleAlert title="Loading errors" items={errors} variant="error" />
```

Add total count display:
```tsx
<div className="text-center mb-6">
  <div className="text-4xl font-bold text-brand-primary">{counts.total}</div>
  <div className="text-sm text-secondary">items in local database</div>
</div>
```

### 2.2 Add "Clear All" Button
```tsx
import { clearAllSamples } from '../lib/db';

<Button
  variant="secondary"
  onClick={async () => {
    if (confirm('Clear all sample data from local database?')) {
      await clearAllSamples();
      await refresh();
    }
  }}
>
  Clear All Samples
</Button>
```

### 2.3 Test
1. Load X sample → should see progress bar → count updates
2. Check DevTools IndexedDB → should see items
3. Reload page → count should persist
4. Click "Clear All" → count should reset to 0

---

## ✅ Phase 3: Dashboard Metrics (2 hours)

### 3.1 Import Metrics and Charts
**File:** `src/routes/DashboardNew.tsx`

Add imports:
```typescript
import { useEffect, useState } from 'react';
import { calculateEchoScore } from '../lib/metrics/echo';
import { getPoliticalSplit } from '../lib/metrics/politics';
import { getTopProductCategories } from '../lib/metrics/products';
import { getToneDistribution } from '../lib/metrics/tone';
import { getDiversityByPlatform } from '../lib/metrics/diversity';
import { buildSuggestions } from '../lib/suggestions';
import { RingGauge } from '../components/charts/RingGauge';
import { TriSegmentBar } from '../components/charts/TriSegmentBar';
import { HorizontalBars } from '../components/charts/HorizontalBars';
import { BubbleChart } from '../components/charts/BubbleChart';
import { DismissibleAlert } from '../components/ui/Alert';
import { ScaleBadge } from '../components/ui/ScaleBadge';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OpposingViewsModal } from '../components/modals/OpposingViewsModal';
import { AdPreferencesModal } from '../components/modals/AdPreferencesModal';
import { OutrageTipsModal } from '../components/modals/OutrageTipsModal';
```

### 3.2 Add State for Metrics
```typescript
const [metrics, setMetrics] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [errors, setErrors] = useState<string[]>([]);
const [showOpposingViews, setShowOpposingViews] = useState(false);
const [showAdPrefs, setShowAdPrefs] = useState(false);
const [showOutrageTips, setShowOutrageTips] = useState(false);
```

### 3.3 Load Metrics on Mount
```typescript
useEffect(() => {
  async function loadMetrics() {
    try {
      const [echo, politics, products, tone, diversity] = await Promise.all([
        calculateEchoScore(),
        getPoliticalSplit(true),
        getTopProductCategories(5),
        getToneDistribution(),
        getDiversityByPlatform()
      ]);

      setMetrics({ echo, politics: politics.overall, products, tone, diversity });
    } catch (e: any) {
      setErrors([`Failed to compute metrics: ${e.message}`]);
    } finally {
      setLoading(false);
    }
  }
  loadMetrics();
}, []);

if (loading) return <div className="p-8 text-center">Computing metrics...</div>;
if (!metrics) return <div className="p-8 text-center">No data. Load samples first.</div>;
```

### 3.4 Replace Echo Chamber Card
**Old:**
```tsx
<BadgeNumber value={`${mockData.echoChamberScore}%`} />
```

**New:**
```tsx
<div className="flex justify-center mb-4">
  <RingGauge value={metrics.echo.score} label="Echo score" />
</div>
<p className="text-sm text-secondary mb-2">
  {metrics.echo.score}% means {metrics.echo.score}% of your feed reinforces existing views.
</p>
<ScaleBadge label="Scale" range="0–40 diverse · 41–70 mixed · 71–100 narrow" />
```

### 3.5 Replace Influence Spectrum Card
**Old:**
```tsx
<Pill variant="info">Left {mockData.influenceSpectrum.left}%</Pill>
```

**New:**
```tsx
<TriSegmentBar
  left={metrics.politics.leftPercent}
  neutral={metrics.politics.neutralPercent}
  right={metrics.politics.rightPercent}
/>
<p className="text-xs text-tertiary mt-4">
  Distribution of political lens in your recommended content.
</p>
```

### 3.6 Replace Tone Chart
**Old:**
```tsx
<SimpleBar data={mockData.toneData} />
```

**New:**
```tsx
<HorizontalBars
  data={metrics.tone.map(t => ({
    label: t.tone,
    value: t.percentage,
    color: t.color,
    emoji: t.emoji
  }))}
/>
<p className="text-xs text-tertiary mt-4">
  % of content by dominant tone. Higher = more frequent in your feed.
</p>
```

### 3.7 Replace Suggested Actions
**Old:**
```tsx
<ActionCard title="Follow opposite-view creators" onClick={...} />
```

**New:**
```typescript
const suggestions = buildSuggestions({
  echo: metrics.echo.score,
  topAds: metrics.products.map(p => ({ category: p.category, share: p.percentage })),
  tone: Object.fromEntries(metrics.tone.map(t => [t.tone, t.percentage]))
});
```

```tsx
{suggestions.map(s => (
  <ActionCard
    key={s.id}
    title={s.title}
    description={s.why}
    onClick={() => {
      if (s.action === 'opposingViews') setShowOpposingViews(true);
      else if (s.action === 'adPreferences') setShowAdPrefs(true);
      else if (s.action === 'outrageReduction') setShowOutrageTips(true);
    }}
  />
))}
```

### 3.8 Add Modals at Bottom
```tsx
<OpposingViewsModal open={showOpposingViews} onClose={() => setShowOpposingViews(false)} />
<AdPreferencesModal open={showAdPrefs} onClose={() => setShowAdPrefs(false)} />
<OutrageTipsModal open={showOutrageTips} onClose={() => setShowOutrageTips(false)} />
```

### 3.9 Wrap Return in ErrorBoundary
```tsx
return (
  <ErrorBoundary>
    <div className="min-h-screen bg-neutral-50">
      {/* ... existing content */}
    </div>
  </ErrorBoundary>
);
```

### 3.10 Test
1. Load samples on Samples page
2. Navigate to Dashboard
3. Should see RingGauge with echo score
4. Should see TriSegmentBar with political split
5. Should see HorizontalBars with tone distribution
6. Click suggested action → modal opens
7. Check console → no errors

---

## ✅ Phase 4: Home Page Polish (30 minutes)

### 4.1 Add Scale Badges to Preview Cards
**File:** `src/routes/HomepageNew.tsx` or `src/sections/home/PreviewGrid.tsx`

Import:
```typescript
import { ScaleBadge } from '../components/ui/ScaleBadge';
```

Add to Echo Chamber preview:
```tsx
<MetricPreviewCard title="Echo Chamber" value="71%">
  <ScaleBadge label="Scale" range="0–40 diverse · 41–70 mixed · 71–100 narrow" />
  <p className="text-sm text-secondary mt-2">
    71% of content reinforces existing views—higher concentration than average.
  </p>
</MetricPreviewCard>
```

---

## ✅ Phase 5: Testing (1 hour)

### 5.1 Manual Testing
- [ ] Load all 6 platforms on Samples page
- [ ] Verify counts persist after reload
- [ ] Navigate to Dashboard
- [ ] Verify all metrics display correctly
- [ ] Click all suggested action cards
- [ ] Verify modals open and close
- [ ] Test "Clear All" button
- [ ] Check DevTools Console for errors
- [ ] Check DevTools → Application → IndexedDB for data

### 5.2 Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge

### 5.3 TypeScript Check
```bash
npm run build
```
Should complete with no errors.

---

## ✅ Phase 6: Optional Enhancements

### 6.1 Export Functionality
Create `src/lib/export.ts`:
```typescript
export function exportMetricsToCSV(metrics: any) {
  const rows = [
    ['Metric', 'Value'],
    ['Echo Chamber Score', metrics.echo.score],
    ['Political Left %', metrics.politics.leftPercent],
    ['Political Neutral %', metrics.politics.neutralPercent],
    ['Political Right %', metrics.politics.rightPercent],
    ...metrics.tone.map((t: any) => [`Tone: ${t.tone}`, t.percentage])
  ];

  const csv = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `algorithm-lens-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

Add button to Dashboard:
```tsx
<Button onClick={() => exportMetricsToCSV(metrics)}>
  Export Metrics CSV
</Button>
```

### 6.2 Chart Export
Add to each chart card:
```tsx
<button
  onClick={() => {
    // Use html2canvas to capture chart
    const element = document.getElementById('chart-id');
    // ... implementation
  }}
  className="text-sm text-brand-primary hover:underline"
>
  Download PNG
</button>
```

---

## ✅ Phase 7: Documentation

### 7.1 Update README
Add to `README.md`:
```markdown
## Features

- ✅ **Local-first**: All data stored in IndexedDB (no network calls)
- ✅ **Validated**: Zod schema validation for data integrity
- ✅ **Real-time metrics**: Echo score, political distribution, tone analysis
- ✅ **Interactive charts**: Ring gauges, segment bars, bubble charts
- ✅ **Actionable insights**: Dynamic suggestions with step-by-step modals

## Usage

1. Load sample data from the "Try Sample Data" page
2. View metrics on the Dashboard
3. Click suggested actions for detailed guidance
4. Export metrics as CSV for further analysis
```

---

## 🎯 Success Criteria

After completing all phases, you should have:
- [x] IndexedDB storing sample data locally
- [x] Samples page with progress bars and counts
- [x] Dashboard showing real computed metrics (not mocks)
- [x] All charts rendering with real data
- [x] Suggested actions generated dynamically
- [x] Modals opening when clicking actions
- [x] Zero TypeScript errors
- [x] Data persisting across reloads
- [x] Cross-browser compatibility

---

## 📚 Reference Documents

1. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What was built
2. **[HARDENING_IMPLEMENTATION.md](./HARDENING_IMPLEMENTATION.md)** - Full technical details
3. **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Quick code examples
4. **NEXT_STEPS.md** (this file) - Step-by-step checklist

---

## 🐛 Troubleshooting

**Problem:** "getDB is not a function"
- **Fix:** Run `npm install` to ensure `idb` is installed

**Problem:** Metrics show 0 or undefined
- **Fix:** Load sample data first on Samples page

**Problem:** TypeScript errors on existing code
- **Fix:** The new code doesn't break existing functionality. You can integrate gradually by:
  1. Keep existing Dashboard working
  2. Create a "DashboardV2" route with new features
  3. A/B test both versions
  4. Migrate when ready

**Problem:** Charts not rendering
- **Fix:** Ensure parent container has width. Add `className="w-full"` to chart wrappers.

**Problem:** Data not persisting
- **Fix:** Check browser allows IndexedDB. Try incognito mode. Check for HTTPS (or localhost).

---

**Estimated Total Time:** 5-6 hours for full integration
**Priority:** Phase 1-3 (core functionality) → Phase 4-5 (polish) → Phase 6-7 (optional)

---

Good luck! 🚀
