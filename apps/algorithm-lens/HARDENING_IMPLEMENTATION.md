# AlgorithmLens Hardening & Clarity Improvements

## 🎯 Implementation Summary

This document outlines the comprehensive improvements made to enhance functionality, dashboard clarity, and production readiness for the AlgorithmLens application.

---

## ✅ Completed Infrastructure

### 1. Dependencies Installed
```bash
npm install idb zod clsx html2canvas vitest @playwright/test
```

**Purpose:**
- `idb`: IndexedDB wrapper for local data persistence
- `zod`: Runtime schema validation
- `clsx`: Utility for conditional classNames
- `html2canvas`: Export/snapshot functionality
- `vitest`: Unit testing framework
- `@playwright/test`: E2E testing

---

### 2. Shared UI Components

#### **Created:**

**`src/components/ui/Alert.tsx`** - DismissibleAlert component
- Variants: warning, error, info
- Dismissible with close button
- Icon support
- Accessible with proper ARIA labels

**`src/components/ui/ScaleBadge.tsx`** - Scale indicator badges
- Shows metric ranges (e.g., "0–40 diverse · 41–70 mixed · 71–100 narrow")
- Used across KPI cards for clarity

**`src/components/ErrorBoundary.tsx`** - React Error Boundary
- Catches rendering errors
- Shows user-friendly fallback UI
- Logs errors to console for debugging
- Optional custom fallback component

---

### 3. Local Database Layer (IndexedDB)

#### **Created:**

**`src/lib/db.ts`** - Core database operations
```typescript
export interface SampleItem {
  id: string;
  platform: 'x' | 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'reddit';
  type: 'post' | 'ad';
  timestamp: number;
  author?: string;
  text?: string;
  topicTags?: string[];
  productTags?: string[];
  political?: 'left' | 'right' | 'neutral' | null;
  tone?: 'analytical' | 'empathetic' | 'outrage' | 'calm' | 'emotional' | null;
}
```

**Functions:**
- `getDB()` - Get/create database instance
- `getAllSamples()` - Retrieve all items
- `getSamplesByPlatform()` - Filter by platform
- `getSampleCount()` - Get total count
- `addSample()` - Add single item
- `addSamplesBatch()` - Bulk insert
- `clearAllSamples()` - Clear database

**`src/lib/useSamples.ts`** - React hook for sample counts
```typescript
export function useSamples() {
  const { counts, loading, refresh } = useSamples();
  // counts: { x: 0, instagram: 0, ..., total: 0 }
}
```

---

### 4. Robust Data Loading with Validation

**`src/lib/loadSamplesNew.ts`** - Zod-validated loader

**Features:**
- Schema validation with Zod
- Progress callbacks (parsing → validating → storing)
- Error and warning collection
- Batch processing (100 items/batch)
- Support for both JSON and JS sample files

**Functions:**
```typescript
loadSampleBlob(platform, data, onProgress?) → LoadResult
loadBuiltInSample(filename, onProgress?) → LoadResult
```

**LoadResult:**
```typescript
{
  success: number;      // Items loaded successfully
  errors: string[];     // Critical errors
  warnings: string[];   // Validation warnings
}
```

---

### 5. Metrics Utilities

All metrics compute from IndexedDB, ensuring consistency.

#### **`src/lib/metrics/echo.ts`** - Echo Chamber Score

**Formula:**
```
score = round(100 * (0.6 * sourceConcentration + 0.4 * (1 - topicDiversity)))
```

**Bands:**
- 0–40: Diverse
- 41–70: Mixed
- 71–100: Narrow

**Returns:**
```typescript
{
  score: number;
  sourceConcentration: number;
  topicDiversity: number;
  band: 'diverse' | 'mixed' | 'narrow';
}
```

#### **`src/lib/metrics/politics.ts`** - Political Distribution

Computes left/neutral/right percentages from `political` field.

**Returns per platform or overall:**
```typescript
{
  left: number;
  neutral: number;
  right: number;
  total: number;
  leftPercent: number;
  neutralPercent: number;
  rightPercent: number;
}
```

#### **`src/lib/metrics/diversity.ts`** - Source Diversity

**Returns per platform:**
```typescript
{
  uniqueSources: number;
  total: number;
  topSourceShare: number;
  topSource: string;
  diversityPercent: number;
}
```

#### **`src/lib/metrics/products.ts`** - Top Product Categories

Maps `productTags` to categories (Technology, Wellness, Finance, Fashion, Food).

**Returns:**
```typescript
{
  category: string;
  count: number;
  percentage: number;
  color: string;
}[]
```

#### **`src/lib/metrics/tone.ts`** - Tone Distribution

Aggregates `tone` field across all items.

**Returns:**
```typescript
{
  tone: string;
  count: number;
  percentage: number;
  color: string;
  emoji: string;
}[]
```

---

### 6. Chart Components

All charts are self-contained, accessible, and responsive.

#### **`src/components/charts/RingGauge.tsx`**
- Circular progress gauge
- Color-coded by bands (green/yellow/red)
- Animated fill
- Center label with percentage

**Usage:**
```tsx
<RingGauge value={71} label="Echo score" size={120} />
```

#### **`src/components/charts/TriSegmentBar.tsx`**
- Horizontal bar split into three segments (left/neutral/right)
- Color-coded: blue (left), gray (neutral), red (right)
- Percentage labels
- Legend below

**Usage:**
```tsx
<TriSegmentBar left={45} neutral={30} right={25} showLabels />
```

#### **`src/components/charts/BubbleChart.tsx`**
- Scatter plot with bubbles
- Interactive legend (click to filter)
- Hover tooltips
- Labeled axes

**Usage:**
```tsx
<BubbleChart data={[
  { category: 'Tech', x: 5, y: 35, size: 10, color: '#3B82F6', brands: ['Apple'] }
]} />
```

#### **`src/components/charts/HorizontalBars.tsx`**
- Horizontal bar chart
- Percentage labels at end of bars
- Emoji support
- Smooth animations

**Usage:**
```tsx
<HorizontalBars data={[
  { label: 'Analytical', value: 45, color: '#3B82F6', emoji: '🧠' }
]} />
```

---

### 7. Dynamic Suggested Actions

**`src/lib/suggestions.ts`** - Logic for generating suggestions

**Rules:**
- Echo ≥ 71 → "Follow opposite-view creators"
- Top ad category ≥ 40% → "Adjust ad preferences"
- Outrage tone ≥ 30% → "Reduce outrage content"
- Always: "Track changes over time"

**Returns:**
```typescript
{
  id: string;
  title: string;
  why: string;
  cta: string;
  action: 'opposingViews' | 'adPreferences' | 'outrageReduction' | 'tracking';
}[]
```

#### **Modal Components:**

**`src/components/modals/OpposingViewsModal.tsx`**
- Curated list of credible accounts per platform
- External links
- Actionable tips

**`src/components/modals/AdPreferencesModal.tsx`**
- Step-by-step instructions per platform
- Checkmark list
- Timeline note

**`src/components/modals/OutrageTipsModal.tsx`**
- 5 practical tips
- Research-backed note

---

## 📋 Integration Guide for Developers

### Step 1: Update Dashboard Page

**File:** `src/routes/DashboardNew.tsx`

Replace mock data with real metric calls:

```typescript
import { useEffect, useState } from 'react';
import { calculateEchoScore } from '../lib/metrics/echo';
import { getPoliticalSplit } from '../lib/metrics/politics';
import { getTopProductCategories } from '../lib/metrics/products';
import { getToneDistribution } from '../lib/metrics/tone';
import { getDiversityByPlatform } from '../lib/metrics/diversity';
import { buildSuggestions } from '../lib/suggestions';
import { DismissibleAlert } from '../components/ui/Alert';
import { RingGauge } from '../components/charts/RingGauge';
import { TriSegmentBar } from '../components/charts/TriSegmentBar';
import { BubbleChart } from '../components/charts/BubbleChart';
import { HorizontalBars } from '../components/charts/HorizontalBars';
import { OpposingViewsModal } from '../components/modals/OpposingViewsModal';
import { AdPreferencesModal } from '../components/modals/AdPreferencesModal';
import { OutrageTipsModal } from '../components/modals/OutrageTipsModal';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function DashboardNew() {
  const [echo, setEcho] = useState<any>(null);
  const [politics, setPolitics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [tone, setTone] = useState<any[]>([]);
  const [diversity, setDiversity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const [showOpposingViewsModal, setShowOpposingViewsModal] = useState(false);
  const [showAdPrefsModal, setShowAdPrefsModal] = useState(false);
  const [showOutrageTipsModal, setShowOutrageTipsModal] = useState(false);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [echoData, politicsData, productsData, toneData, diversityData] = await Promise.all([
          calculateEchoScore(),
          getPoliticalSplit(true),
          getTopProductCategories(5),
          getToneDistribution(),
          getDiversityByPlatform()
        ]);

        setEcho(echoData);
        setPolitics(politicsData.overall);
        setProducts(productsData);
        setTone(toneData);
        setDiversity(diversityData);
      } catch (e: any) {
        setErrors([`Failed to load metrics: ${e.message}`]);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  if (loading) return <div>Loading metrics...</div>;

  const suggestions = buildSuggestions({
    echo: echo.score,
    topAds: products.map(p => ({ category: p.category, share: p.percentage })),
    tone: Object.fromEntries(tone.map(t => [t.tone, t.percentage]))
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-50">
        <Navigation currentRoute="dashboard" />

        <main className="py-8">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            {/* Errors Alert */}
            <DismissibleAlert title="Issues detected" items={errors} variant="error" />

            {/* KPI Trio */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Echo Chamber Score */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Echo Chamber Score</h3>
                <div className="flex justify-center mb-3">
                  <RingGauge value={echo.score} />
                </div>
                <p className="text-sm text-secondary mb-2">
                  {echo.score}% means {echo.score}% of your feed reinforces existing views.
                </p>
                <ScaleBadge label="Scale" range="0–40 diverse · 41–70 mixed · 71–100 narrow" />
              </div>

              {/* Influence Spectrum */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Influence Spectrum</h3>
                <TriSegmentBar
                  left={politics.leftPercent}
                  neutral={politics.neutralPercent}
                  right={politics.rightPercent}
                />
                <p className="text-xs text-tertiary mt-4">
                  Distribution of political lens in your recommended content.
                </p>
              </div>

              {/* Top Product Categories */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Top Product Categories</h3>
                <div className="space-y-2">
                  {products.map((p, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-sm">{p.category}</span>
                      </div>
                      <span className="text-sm font-semibold">{p.percentage}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-tertiary mt-4">
                  Share of ad impressions by category (last 30 days).
                </p>
              </div>
            </div>

            {/* Detailed Insights */}
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Tone of Content */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Tone of Content</h3>
                <HorizontalBars
                  data={tone.map(t => ({
                    label: t.tone,
                    value: t.percentage,
                    color: t.color,
                    emoji: t.emoji
                  }))}
                />
                <p className="text-xs text-tertiary mt-4">
                  % of content by dominant tone. Higher = more frequent in your feed.
                </p>
              </div>

              {/* Platform Comparison */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Platform Comparison</h3>
                <div className="space-y-4">
                  {Object.entries(diversity).map(([platform, stat]: [string, any]) => (
                    <div key={platform}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium capitalize">{platform}</span>
                        <span className="text-sm text-secondary">
                          {stat.uniqueSources} sources · Top: {stat.topSourceShare}%
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-yellow-500"
                          style={{ width: `${stat.diversityPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-tertiary mt-4">
                  Diversity = variety of sources; Concentration = top source share.
                </p>
              </div>
            </div>

            {/* Suggested Actions */}
            <div>
              <h3 className="text-2xl font-semibold mb-6">Suggested Actions</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
                  >
                    <h4 className="font-semibold text-lg mb-2">{suggestion.title}</h4>
                    <p className="text-sm text-secondary mb-4">{suggestion.why}</p>
                    <button
                      onClick={() => {
                        if (suggestion.action === 'opposingViews') setShowOpposingViewsModal(true);
                        else if (suggestion.action === 'adPreferences') setShowAdPrefsModal(true);
                        else if (suggestion.action === 'outrageReduction') setShowOutrageTipsModal(true);
                      }}
                      className="text-brand-primary font-medium hover:underline"
                    >
                      {suggestion.cta} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Modals */}
        <OpposingViewsModal open={showOpposingViewsModal} onClose={() => setShowOpposingViewsModal(false)} />
        <AdPreferencesModal open={showAdPrefsModal} onClose={() => setShowAdPrefsModal(false)} />
        <OutrageTipsModal open={showOutrageTipsModal} onClose={() => setShowOutrageTipsModal(false)} />
      </div>
    </ErrorBoundary>
  );
}
```

---

### Step 2: Update Samples Page

**File:** `src/routes/Samples.tsx`

Integrate `loadBuiltInSample` with progress tracking:

```typescript
import { loadBuiltInSample, LoadProgress } from '../lib/loadSamplesNew';
import { useSamples } from '../lib/useSamples';

export function Samples({ onComplete }: { onComplete: () => void }) {
  const { counts, refresh } = useSamples();
  const [progress, setProgress] = useState<Record<string, LoadProgress>>({});
  const [results, setResults] = useState<Record<string, LoadResult>>({});

  async function handleLoadOne(sample: Sample) {
    setProgress(prev => ({ ...prev, [sample.filename]: { loaded: 0, total: 0, phase: 'parsing' } }));

    const result = await loadBuiltInSample(sample.filename, (prog) => {
      setProgress(prev => ({ ...prev, [sample.filename]: prog }));
    });

    setResults(prev => ({ ...prev, [sample.filename]: result }));
    await refresh();
  }

  // ... render with progress bars
}
```

---

### Step 3: Add Export Functionality

Create `src/lib/export.ts`:

```typescript
import html2canvas from 'html2canvas';

export async function exportToCSV(data: any[], filename: string) {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function captureChart(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}
```

---

### Step 4: Add Tests

**Unit Test Example** (`src/lib/metrics/echo.test.ts`):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { calculateEchoScore } from './echo';
import { clearAllSamples, addSamplesBatch } from '../db';

describe('calculateEchoScore', () => {
  beforeEach(async () => {
    await clearAllSamples();
  });

  it('returns 0 for empty database', async () => {
    const result = await calculateEchoScore();
    expect(result.score).toBe(0);
    expect(result.band).toBe('diverse');
  });

  it('calculates score for concentrated sources', async () => {
    await addSamplesBatch([
      { id: '1', platform: 'x', type: 'post', timestamp: Date.now(), author: 'user1', topicTags: ['tech'] },
      { id: '2', platform: 'x', type: 'post', timestamp: Date.now(), author: 'user1', topicTags: ['tech'] },
      { id: '3', platform: 'x', type: 'post', timestamp: Date.now(), author: 'user2', topicTags: ['sports'] }
    ]);

    const result = await calculateEchoScore();
    expect(result.score).toBeGreaterThan(40);
  });
});
```

**E2E Test Example** (`tests/e2e/dashboard.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test('loads sample data and displays dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Go to samples page
  await page.click('text=Try Sample Data');

  // Load X sample
  await page.click('text=Load Sample', { force: true });
  await page.waitForSelector('text=Loaded', { timeout: 10000 });

  // Go to dashboard
  await page.click('text=Dashboard');

  // Check KPIs exist
  await expect(page.locator('text=Echo Chamber Score')).toBeVisible();
  await expect(page.locator('text=Influence Spectrum')).toBeVisible();
  await expect(page.locator('text=Top Product Categories')).toBeVisible();

  // Check chart renders
  await expect(page.locator('svg circle')).toBeVisible();
});
```

---

## 🎨 Visual Polish Checklist

- [ ] All cards use consistent `p-5` padding
- [ ] Title font: `text-lg font-semibold`
- [ ] Subtitle font: `text-sm text-slate-500`
- [ ] Chart min-height: `260px`
- [ ] Axis labels: `text-xs text-slate-500`
- [ ] Grid gap: `gap-6`
- [ ] Page container: `max-w-7xl mx-auto px-6 md:px-8`
- [ ] Tooltip max-width: `320px`
- [ ] Political colors: Left `#3b82f6`, Neutral `#9ca3af`, Right `#ef4444`
- [ ] Focus rings on all interactive elements

---

## 🚀 Running the App

```bash
cd apps/algorithm-lens
npm run dev
```

**Run Tests:**
```bash
npm run test          # Vitest unit tests
npx playwright test   # E2E tests
```

**Build:**
```bash
npm run build
npm run preview
```

---

## 📊 Metric Definitions Reference

| Metric | Formula | Scale | Interpretation |
|--------|---------|-------|----------------|
| **Echo Chamber Score** | `round(100 * (0.6 * sourceConcentration + 0.4 * (1 - topicDiversity)))` | 0–100 | 0–40 Diverse, 41–70 Mixed, 71–100 Narrow |
| **Influence Spectrum** | `(left / total) * 100, (neutral / total) * 100, (right / total) * 100` | % | Political distribution |
| **Diversity** | `(uniqueSources / total) * 100 * 2` | 0–100% | Higher = more varied sources |
| **Tone** | `(toneCount / total) * 100` per tone | % | Distribution across 5 tones |
| **Product Categories** | `(categoryAds / totalAds) * 100` | % | Ad share by category |

---

## 🛠️ Troubleshooting

**Issue:** IndexedDB not persisting
- **Fix:** Ensure HTTPS or localhost. Some browsers block IndexedDB on HTTP.

**Issue:** Metrics return 0
- **Fix:** Check that samples are loaded. Call `useSamples().refresh()` after loading.

**Issue:** Charts not rendering
- **Fix:** Ensure parent container has explicit width/height.

**Issue:** TypeScript errors
- **Fix:** Run `npm run build` to check. May need to add type assertions for legacy code compatibility.

---

## 📝 Next Steps (Future Enhancements)

1. **Historical Tracking:** Store snapshots over time, plot trends
2. **Custom Recommendations:** User-specific account suggestions via API
3. **Real Data Import:** Parse actual platform exports (GDPR downloads)
4. **Comparative Analysis:** Compare to population averages
5. **Browser Extension:** Real-time feed analysis
6. **PDF Reports:** Exportable multi-page report with charts
7. **Accessibility Audit:** WCAG 2.1 AA compliance check
8. **Performance Optimization:** Virtual scrolling for large datasets
9. **Offline Mode:** Service worker for full offline capability
10. **Multi-Language Support:** i18n integration

---

## 📚 Documentation Links

- **Zod Docs:** https://zod.dev
- **idb Docs:** https://github.com/jakearchibald/idb
- **Recharts Docs:** https://recharts.org
- **Vitest Docs:** https://vitest.dev
- **Playwright Docs:** https://playwright.dev

---

**Document Version:** 1.0
**Last Updated:** 2025-01-13
**Author:** Claude (Anthropic)
