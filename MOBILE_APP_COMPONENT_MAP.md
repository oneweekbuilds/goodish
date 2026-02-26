# AlgorithmLens Mobile App - Component Mapping & Architecture
## Detailed Component Reference for React Native Implementation

**Last Updated:** February 24, 2026

---

## Complete Component Hierarchy

### 1. Dashboard Layout Architecture

```
DashboardPage (Orchestrator - 80% of logic)
├── DashboardHeader
│   ├── Logo
│   └── User info/settings
├── DashboardState hooks
│   ├── useDashboardState() → filters, date range
│   ├── useDashboardData() → fetch all scan data
│   ├── useDashboardInitialization() → plan tier detection
│   ├── useCheckoutSync() → payment state
│   └── useInsightData() → aggregate insights
├── PremiumFiltersBar
│   ├── Platform filter selector
│   └── Date range picker
├── MasterCountLine (Running total)
├── CheckoutBanners (Payment state)
├── TabNavigation (6 tabs)
│   └── TABS = [
│       { id: 'overview', label: 'Overview', accent: '#2563EB' },
│       { id: 'sources', label: 'Who Shapes Your Feed', accent: '#6366F1' },
│       { id: 'ads', label: 'Ads & Promotions', accent: '#D97706' },
│       { id: 'politics', label: 'Political Exposure', accent: '#7C3AED' },
│       { id: 'tone', label: 'Emotional Tone', accent: '#0D9488' },
│       { id: 'suggested_vs_followed', label: 'Suggested vs. Followed', accent: '#E11D48' }
│     ]
├── TabRenderer (Content switcher)
│   ├── OverviewTab
│   ├── SourcesTab
│   ├── AdsTab
│   ├── PoliticsTab
│   ├── ToneTab
│   └── SuggestedVsFollowedTab
├── TrendsPanel (Premium feature)
└── PageFooter
    └── Navigation links
```

---

## Tab-Specific Components

### OverviewTab Component
**File:** `/pages/dashboard/tabs/OverviewTab.jsx`
**Purpose:** Single-screen receipt of selected window

**Sub-components:**
```
OverviewTab
├── InsightHero (with buildOverviewHero data)
├── SectionHeader("Key metrics")
├── ToplineMetricCard (4 cards)
│   ├── Source concentration (%)
│   ├── Commercial composition (%)
│   ├── Political share (%)
│   └── Tone composition (%)
├── SectionHeader("Time value")
├── MiniCalculator (2 calculators)
│   ├── Ad minutes
│   └── Political minutes
├── SectionHeader("Experiment suggestions")
├── ExperimentSuggestionCard (1-3 suggestions)
├── SectionHeader("Master metrics")
└── MasterNumbersLine
```

**Key Props:**
- `scans`: Array of scan objects
- `scanDetails`: Aggregated metadata
- `onOpenTrends`: Callback for premium trends
- `isPlusUser`: Boolean for feature gating
- `showTrendsPanel`: Boolean visibility

---

### SourcesTab Component
**File:** `/pages/dashboard/tabs/SourcesTab.jsx`
**Purpose:** "Which accounts shaped what I saw?"

**Sub-components:**
```
SourcesTab
├── InsightHero (hero.id = 'creators-top')
│   ├── title: Data-grounded takeaway with value
│   ├── meaning: Plain English explanation
│   ├── whyCare: Behavioral implications
│   └── accent: '#6366F1' (Indigo)
├── SectionHeader (label: 'Observed')
├── CreatorsTalkToAlgorithm (Premium AI insights)
├── SectionHeader (label: 'Context')
├── CompositionBar100WithCounts (Concentration visualization)
├── DenominatorLine (Voice diversity)
├── SectionHeader (label: 'Cross-platform presence')
├── SimpleTable (Creator platform presence)
└── [Collapsible supporting views]
```

**Data Structure:**
```javascript
{
  hasData: boolean,
  top5Percent: number,           // % of posts from top 5 creators
  topCreators: [
    { name: string, posts: number, percentage: number },
    ...
  ],
  concentrationScore: number,    // 0-100 (100 = most concentrated)
  voiceDiversity: {
    uniqueCreators: number,
    repeatedCreators: number,
    newCreators: number,
  },
  platformPresence: {
    [creatorId]: [platforms],    // Multi-platform appearances
  }
}
```

---

### AdsTab Component
**File:** `/pages/dashboard/tabs/AdsTab.jsx`
**Purpose:** "How much commercial content appeared?"

**Sub-components:**
```
AdsTab
├── InsightHero (hero.id = 'ads-percentage')
│   ├── title: "X% of your feed was commercial content"
│   ├── meaning: What this means
│   ├── whyCare: Why user should care
│   └── accent: '#D97706' (Orange)
├── AdsTalkToAlgorithm (Premium AI insights - GREEN theme)
├── SectionHeader (label: 'Observed')
├── NumberLineRenderer (Percentage visualization)
├── SectionHeader (label: 'Context')
├── StackedBar100 (Commercial breakdown)
│   ├── Labeled ads
│   ├── Promotional content
│   └── Other commercial
├── SectionHeader (label: 'Where it came from')
├── SimpleTable (Platform breakdown)
└── [Collapsible supporting views]
```

**Data Structure:**
```javascript
{
  hasData: boolean,
  currentPercent: number,        // 0-100
  totalPosts: number,
  segments: [
    { label: 'Labeled ads', percentage: number, count: number },
    { label: 'Promotional content', percentage: number, count: number },
    ...
  ],
  byPlatform: {
    [platformId]: { percentage: number, count: number },
  }
}
```

**Takeaway Logic:**
- 0% → "No commercial content detected"
- 1-10% → "About X% of posts were commercial"
- 10-30% → "X% of your feed was commercial content"
- 30%+ → "More than X% of your feed was commercial"

---

### PoliticsTab Component
**File:** `/pages/dashboard/tabs/PoliticsTab.jsx`
**Purpose:** "How much political content am I exposed to?"

**Sub-components:**
```
PoliticsTab
├── InsightHero (hero.id = 'politics-share')
│   ├── title: "X% of your feed contained political keywords"
│   ├── meaning: Exposure measurement only
│   ├── whyCare: "Helps understand information diet"
│   └── accent: '#7C3AED' (Purple)
├── PoliticsTalkToAlgorithm (Premium AI insights)
├── SectionHeader (label: 'Observed')
├── NumberLineRenderer (Percentage visualization)
├── SectionHeader (label: 'Context')
├── SimpleTable (Creator breakdown)
├── SectionHeader (label: 'How this is measured')
├── TextRenderer (Explanation copy)
└── [Collapsible supporting views]
```

**Data Structure:**
```javascript
{
  hasData: boolean,
  politicalPercent: number,      // 0-100
  totalPosts: number,
  politicalPosts: number,
  keywords: [
    { term: string, frequency: number, percentage: number },
    ...
  ],
  byCreator: [
    { name: string, politicalPosts: number, percentage: number },
    ...
  ],
  byPlatform: {
    [platformId]: { percentage: number, count: number },
  }
}
```

**Important Notes:**
- Does NOT estimate viewpoint
- Does NOT judge content quality
- Measures EXPOSURE only
- Based on post text/captions
- NO moralizing in copy

---

### ToneTab Component
**File:** `/pages/dashboard/tabs/ToneTab.jsx`
**Purpose:** "What emotional tones dominated your feed?"

**Sub-components:**
```
ToneTab
├── InsightHero (hero.id = 'tone-distribution')
│   ├── title: "Dominant emotional tone: X%"
│   ├── meaning: What this tells about feed content
│   ├── whyCare: "Emotional diet implications"
│   └── accent: '#0D9488' (Teal)
├── SectionHeader (label: 'Observed')
├── StackedBar100 (Tone composition)
│   ├── Positive (uplifting, humorous)
│   ├── Negative (critical, fearful)
│   ├── Neutral (informational)
│   └── Mixed (complex)
├── SectionHeader (label: 'By Creator')
├── SimpleTable (Creator tone patterns)
├── SectionHeader (label: 'By Platform')
├── BarChartSimple (Platform tone comparison)
└── [Collapsible supporting views]
```

**Data Structure:**
```javascript
{
  hasData: boolean,
  dominantTone: 'positive' | 'negative' | 'neutral' | 'mixed',
  distribution: {
    positive: number,       // percentage
    negative: number,
    neutral: number,
    mixed: number,
  },
  byCreator: [
    { name: string, dominantTone: string, percentage: number },
    ...
  ],
  byPlatform: {
    [platformId]: {
      distribution: { positive, negative, neutral, mixed },
      dominantTone: string,
    }
  }
}
```

---

### SuggestedVsFollowedTab Component
**File:** `/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`
**Purpose:** "What share came from followed vs. suggested?"

**Sub-components:**
```
SuggestedVsFollowedTab
├── InsightHero (hero.id = 'promotion-share')
│   ├── title: "X% of your feed was suggested content"
│   ├── meaning: Algorithm's influence on what you saw
│   ├── whyCare: "Understand algorithmic vs. organic influence"
│   └── accent: '#E11D48' (Rose)
├── SectionHeader (label: 'Observed')
├── CompositionBar100WithCounts (Suggested vs. followed)
│   ├── Followed accounts
│   ├── Suggested/recommended
│   └── Promoted (if available)
├── SectionHeader (label: 'Where suggestions come from')
├── SimpleTable (Recommendation sources)
├── SectionHeader (label: 'Temporal pattern')
├── LineChartSimple (Suggestion over time)
└── [Collapsible supporting views]
```

**Data Structure:**
```javascript
{
  hasData: boolean,
  suggestedPercentage: number,   // 0-100
  followedPercentage: number,    // 0-100
  segments: [
    { label: 'Followed accounts', percentage: number, count: number },
    { label: 'Suggested/recommended', percentage: number, count: number },
    { label: 'Promoted', percentage: number, count: number },
  ],
  sources: [
    { type: string, percentage: number, count: number },  // e.g., "Explore", "Home Feed"
  ],
  timeline: [
    { date: string, suggestedPercentage: number },
    ...
  ]
}
```

---

## Shared Dashboard Primitives

### InsightHero
**File:** `/components/dashboard/InsightHero.jsx`
**Purpose:** Data-grounded hero card for tab summary

**Props:**
```typescript
{
  title: string;           // Data-grounded takeaway with value
  meaning: string;         // Plain English explanation
  whyCare?: string | null; // Behavioral implications (optional)
  meta?: string | null;    // Supporting metadata (optional)
  accent?: string;         // Hex color for theming (default: '#2563EB')
}
```

**Features:**
- Left gradient accent border (1.5px)
- Colored label chip ("Key Takeaway")
- Responsive font sizing (clamp 1.25-1.625rem)
- Subtle gradient background using accent color
- No em dashes allowed in copy

**Styling:**
```javascript
background: `linear-gradient(135deg, ${accent}08 0%, ${accent}04 50%, #FFFFFF 100%)`
border: `1px solid ${accent}18`
boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 8px 32px ${accent}0A`
borderLeft: `1.5px solid` (gradient)
borderRadius: '16px'
padding: '20px' (or '24px' on larger screens)
```

---

### SectionHeader
**File:** `/components/dashboard/SectionHeader.jsx`
**Purpose:** Consistent section header with accent bar

**Props:**
```typescript
{
  children?: string;     // Simple text (alternative to title)
  title?: string;        // Section title (advanced usage)
  label?: string;        // Kicker label (optional, uppercase)
  subtext?: string;      // Supporting text (optional)
  level?: 'h2' | 'h3';   // Heading level (default: 'h2')
  accent?: string;       // Hex color (default: '#2563EB')
}
```

**Sizing:**
- h2: font-size 18px (1.125rem), left bar 22px height
- h3: font-size 15px (0.9375rem), left bar 18px height
- Font-weight: 600 (semibold)
- Letter-spacing: -0.01em
- Line-height: 1.4
- Gap between bar and text: 12px

---

### ToplineMetricCard
**File:** `/components/dashboard/primitives/ToplineMetricCard.jsx`
**Purpose:** Simple metric display (4 used in Overview)

**Props:**
```typescript
{
  label: string;         // Metric name
  value: number | string;// Metric value
  unit?: string;        // Unit suffix (e.g., "%")
  context?: string;     // Supporting text
  accent?: string;      // Color accent
}
```

**Layout:**
- Card background: #FFFFFF
- Border: 1px solid #E2E8F0
- Border-radius: 16px
- Padding: 20px
- Font size: label = 12px, value = 28px bold

---

### MiniCalculator
**File:** `/components/dashboard/primitives/MiniCalculator.jsx`
**Purpose:** Two-value calculator (time-based calculations)

**Props:**
```typescript
{
  title: string;         // "Ad minutes", "Political minutes"
  totalMinutes: number;
  calculatedValue: number;
  unit: string;         // "min", "hours", etc.
}
```

**Example Output:**
```
Ad minutes
47 min (13% of your total scrolling time)
```

---

### ExperimentSuggestionCard
**File:** `/components/dashboard/primitives/ExperimentSuggestionCard.jsx`
**Purpose:** Optional action suggestions

**Props:**
```typescript
{
  title: string;         // Action title
  description: string;   // What to try
  reasoning: string;     // Why it might work
}
```

**Important:** Copy uses "you could try" not "you should"

---

### CompositionBar100WithCounts
**File:** `/components/dashboard/primitives/CompositionBar100WithCounts.jsx`
**Purpose:** Stacked 100% bar with counts

**Props:**
```typescript
{
  segments: Array<{
    label: string;
    percentage: number;
    count: number;
    color?: string;     // Optional segment color
  }>;
  title?: string;
}
```

**Data Example:**
```javascript
segments: [
  { label: 'Labeled ads', percentage: 15, count: 45 },
  { label: 'Promotional', percentage: 10, count: 30 },
  { label: 'Organic', percentage: 75, count: 225 }
]
```

---

### DenominatorLine
**File:** `/components/dashboard/primitives/DenominatorLine.jsx`
**Purpose:** Simple metric line with denominator

**Props:**
```typescript
{
  numerator: number;
  denominator: number;
  label: string;
  percentage?: boolean;
}
```

**Example:** "27 of 160 posts" or "35%"

---

### MasterNumbersLine
**File:** `/pages/dashboard/MasterCountLine.jsx`
**Purpose:** Running totals across all scans

**Props:**
```typescript
{
  totalScans: number;
  totalPosts: number;
  dateRange: string;
}
```

**Display Example:**
```
Analyzed 4 scans | 847 posts | Last 30 days
```

---

## Data Visualization Components

### NumberLineRenderer
**File:** `/components/dashboard/renderers/NumberLineRenderer.jsx`
**Purpose:** Render percentage as visual number line

**Props:**
```typescript
{
  value: number;       // 0-100
  unit?: string;       // "%" by default
  label?: string;      // Optional label
}
```

**Visual:** Horizontal line with indicator at position, colored by accent

---

### BarChartSimple
**File:** `/components/dashboard/charts/BarChartSimple.jsx`
**Purpose:** Simple horizontal bar chart

**Props:**
```typescript
{
  data: Array<{
    label: string;
    value: number;
  }>;
  maxValue?: number;
}
```

---

### StackedBar100
**File:** `/components/dashboard/charts/StackedBar100.jsx`
**Purpose:** Stacked horizontal bar for composition

**Props:**
```typescript
{
  segments: Array<{
    label: string;
    percentage: number;
    color?: string;
  }>;
}
```

---

### LineChartSimple
**File:** `/components/dashboard/charts/LineChartSimple.jsx`
**Purpose:** Simple line chart for trends

**Props:**
```typescript
{
  data: Array<{
    date: string;
    value: number;
  }>;
  label?: string;
}
```

---

### SimpleTable
**File:** `/components/dashboard/charts/SimpleTable.jsx`
**Purpose:** Data table renderer

**Props:**
```typescript
{
  rows: Array<{
    [key: string]: string | number;
  }>;
  columns: Array<{
    key: string;
    label: string;
    width?: string;
  }>;
}
```

---

### StatusCard
**File:** `/components/dashboard/charts/StatusCard.jsx`
**Purpose:** Status indicator card

**Props:**
```typescript
{
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
}
```

---

## UI Components

### Button Variants
**File:** `/components/ui/Button.jsx`

**ButtonPrimary** - Blue CTA button
```jsx
<ButtonPrimary size="md" to="/dashboard">
  View Dashboard
</ButtonPrimary>
```

**ButtonSecondary** - Bordered secondary
```jsx
<ButtonSecondary onClick={handleClick}>
  Cancel
</ButtonSecondary>
```

**ButtonGhost** - Text-only link style
```jsx
<ButtonGhost to="/history">
  View History
</ButtonGhost>
```

**ButtonSuccess** - Green confirmation
```jsx
<ButtonSuccess onClick={handleConfirm}>
  Confirm
</ButtonSuccess>
```

**Props:**
```typescript
{
  variant?: 'primary' | 'secondary' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  to?: string;              // React Router Link
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}
```

---

### Skeleton & SkeletonCard
**File:** `/components/ui/Skeleton.jsx`

**Skeleton** - Simple loading bar
```jsx
<Skeleton className="h-12 w-full rounded-lg" />
```

**SkeletonCard** - Full card skeleton
```jsx
<SkeletonCard count={3} />  // 3 skeleton cards
```

---

### Toast Notification
**File:** `/components/ui/Toast.jsx`

**Usage:**
```jsx
import { useToast } from './components/ui/Toast'

function MyComponent() {
  const { showToast } = useToast()

  return (
    <button onClick={() => showToast({
      message: 'Scan complete!',
      type: 'success',
      duration: 3000
    })}>
      Show Toast
    </button>
  )
}
```

---

## Data Aggregation Functions

### Aggregators
**File:** `/lib/dashboard/aggregators/`

**Functions:**
```javascript
aggregateAds()              // Ad percentage, segments
aggregatePolitics()         // Political exposure, keywords
aggregateTone()             // Emotional tone distribution
aggregateCreators()         // Top creators, concentration
aggregateDerived()          // Derived metrics
aggregateOverview()         // All overview metrics
aggregateSources()          // Source concentration
aggregatePromotion()        // Suggested vs. followed
aggregateTopicUniverse()    // Topic patterns
```

**Usage Example:**
```javascript
const adsData = aggregateAds(scans, dateRange)
// Returns: { hasData, currentPercent, segments, totalPosts }
```

### Data Helpers
**File:** `/lib/dashboard/dataHelpers.js`

**Key Functions:**
```javascript
getAdPercentageData(scans)
getPoliticalExposure(scans)
getCreatorInfluence(scans)
getToneDistribution(scans)
getPromotedContent(scans)
getTrendData(scans, metricsType)
```

---

## State Management Hooks

### useDashboardState
**Purpose:** Manage filters and date range

**Returns:**
```typescript
{
  platformFilter: string[];
  setPlatformFilter: (platforms: string[]) => void;
  dateRange: { start: Date; end: Date };
  setDateRange: (range: { start; end }) => void;
  datePreset: 'last7' | 'last30' | 'custom';
  handlePresetChange: (preset: string) => void;
  filtersActive: boolean;
  resetFilters: () => void;
  activeFilters: object;
  formatDateRange: () => string;
  deriveWindowLabel: () => string;
  heroEvidenceExpanded: boolean;
  setHeroEvidenceExpanded: (bool) => void;
}
```

---

### useDashboardData
**Purpose:** Fetch and aggregate all scan data

**Returns:**
```typescript
{
  scans: ScanData[];
  scanDetails: {
    totalScans: number;
    totalPosts: number;
    platforms: string[];
    dateRange: DateRange;
  };
  loading: boolean;
  error: Error | null;
}
```

---

### useDashboardInitialization
**Purpose:** Detect plan tier and demo mode

**Props:**
```typescript
{
  authReady: boolean;
}
```

**Returns:**
```typescript
{
  isDemoMode: boolean;
  planTier: 'free' | 'plus';
  setPlanTier: (tier: string) => void;
}
```

---

### useInsightData
**Purpose:** Aggregate insights for display

**Returns:**
```typescript
{
  overview: OverviewData;
  sources: SourcesData;
  ads: AdsData;
  politics: PoliticsData;
  tone: ToneData;
  suggestedVsFollowed: PromotionData;
}
```

---

## Platform Integration

### Authentication (Supabase)
**File:** `/lib/auth/supabaseClient.ts`

**Key Functions:**
```javascript
signInWithOAuth(provider)    // 'google', 'github'
signOut()
getSession()
getCurrentUser()
```

---

### Paywall System
**File:** `/lib/plan/PaywallProvider.jsx`

**Key Functions:**
```javascript
openPaywall(placement)       // Open upgrade modal
getCurrentPlanTier()         // 'free' | 'plus'
PLAN_TIERS                   // Constants
```

---

### Analytics
**File:** `/lib/analytics/index.js`

**Key Functions:**
```javascript
track(EVENTS.DASHBOARD_OPENED, { userId, planTier })
track(EVENTS.TAB_SWITCHED, { tabId, planTier })
track(EVENTS.UPGRADE_CTA_CLICKED, { placement })
```

---

## File Size & Performance Metrics

### Component Complexity
- **DashboardPage:** ~700 lines (orchestrator)
- **OverviewTab:** ~200 lines
- **Individual Tabs:** 150-250 lines each
- **Primitives:** 50-150 lines
- **Renderers:** 50-120 lines
- **UI Components:** 30-80 lines

### Bundle Size (Web)
- Main bundle: ~450KB (uncompressed)
- Gzipped: ~140KB
- Chart libraries: ~80KB
- Animation (Framer Motion): ~40KB

---

## Mobile App Adaptation Notes

### Tailwind → React Native Conversion

**Color Values** → Copy directly to theme
```javascript
// Web (Tailwind)
className="bg-primary-blue text-white"

// Mobile (React Native)
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF'
  }
})
```

**Font Sizes** → Scale appropriately
```javascript
// Web: 16px base
// Mobile: 14px base (smaller screens)
fontSize: 14  // md text → 14px on mobile
```

**Shadows** → Use `elevation` on Android, shadowProps on iOS
```javascript
// Web: shadow-medium
// iOS: shadowColor, shadowOffset, shadowOpacity, shadowRadius
// Android: elevation: 4
```

**Borders** → Direct pixel values
```javascript
// Web: border-radius-2xl
// Mobile: borderRadius: 16
```

**Layout** → Flexbox is native in React Native
```javascript
// Web: flex gap-4
// Mobile: flex, gap: 16 (no gap property, use margin)
```

---

## Testing Checklist

### Unit Tests
- [ ] Aggregator functions return correct data structure
- [ ] takeaway functions generate proper copy
- [ ] Data helpers extract metrics correctly
- [ ] Button variants render correctly

### Integration Tests
- [ ] Tab switching updates content
- [ ] Filters apply correctly
- [ ] Plan tier gating works (free vs. plus)
- [ ] Loading states display properly

### E2E Tests
- [ ] Dashboard loads all 6 tabs
- [ ] All charts/renderers display data
- [ ] Expand/collapse functionality works
- [ ] Premium features lock/unlock correctly

### Accessibility Tests
- [ ] Tab navigation with keyboard (arrow keys)
- [ ] Focus states visible on all interactive elements
- [ ] Color contrast ratios pass WCAG AA
- [ ] Touch targets are 44px minimum

---

**Generated:** 2026-02-24
**Version:** 1.0 (Complete component reference)
