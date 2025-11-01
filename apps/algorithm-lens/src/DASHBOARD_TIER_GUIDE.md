# Dashboard Tier Component Guide

## Overview
The Dashboard_Tier component is a comprehensive, visually engaging dashboard that showcases different features available across three pricing tiers: **Free**, **Pro**, and **Premium**.

## Features Implemented

### ✅ Component Structure
- **DashboardTier.tsx**: Main component with tier variants
- **DashboardTierDemo.tsx**: Interactive demo page with tier switcher
- Fully responsive design (desktop 1440px, mobile 390px)
- Smooth Motion animations with Smart Animate transitions (0.6s ease-out)

### 🎨 Visual Design
- **Typography**: Inter font, weights 400/500/700
- **Colors**: 
  - Primary Accent: `#7D66E6` (Purple)
  - Secondary Accent: `#4F9FA9` (Teal)
  - Background: `#FFFFFF`
  - Muted text: `#6B7280`
  - Light border: `#E5E7EB`
- **Corner radius**: 16px for all cards
- **Shadows**: `0 4px 12px rgba(0, 0, 0, 0.06)` for cards
- **Chart gradients**:
  - Free: `#F3F4F6` (gray)
  - Pro: `linear-gradient(90deg, #D9F3F2, #E4D9FF)`
  - Premium: `linear-gradient(90deg, #E4D9FF, #D9F3F2)`

### 📊 Dashboard Cards

#### Always Unlocked (All Tiers)
1. **Feed Breakdown by Category** - Pie chart
2. **Top 5 Topics You Engage With** - Bar chart

#### Pro Tier Unlocks
3. **Ad Transparency** - Horizontal bar chart with ad types
4. **Influencer Concentration** - Bubble chart showing reach
5. **Sentiment Trend Over Time** - Multi-line chart

#### Premium Tier Unlocks
6. **Platform Bias Map** - Heatmap grid
7. **Engagement by Platform** - Stacked bar chart
8. **Content Tone Chart** - Donut chart
9. **Algorithm Insights Summary** - Full-width summary with sparkline

### 🔒 Lock States
- Locked cards show semi-transparent overlay (60% opacity)
- Lock icon with upgrade message
- Blur effect on locked content
- Click upgrade banner to progress to next tier

### 🎯 Tier Badges
- **Free**: Gray background, dark gray text
- **Pro**: Purple background, white text
- **Premium**: Teal background, white text
- Positioned in top-right corner of dashboard header

### 📱 Responsive Behavior
- Desktop: 2-column grid (1440px max width)
- Tablet: Responsive grid with gaps
- Mobile: Single column stack (390px optimized)
- Padding adjusts: 24px mobile, 96px desktop

## How to Access

### In the Application
The tier demo is integrated into the main app routing:

1. **Direct Navigation**: Add a button that calls `onNavigate('tier-demo')`
2. **Browser Console**: Type:
   ```javascript
   // In React DevTools or browser console
   // Find the App component and trigger navigation
   ```
3. **URL Parameter** (if implementing routing): Navigate to `/tier-demo`

### Current Integration
- Route added to `App.tsx` as `tier-demo` page type
- Hidden from navbar/footer for full-screen experience
- Includes built-in tier switcher for easy testing

## Usage Example

```tsx
import { DashboardTier } from './components/DashboardTier';

function MyComponent() {
  const [tier, setTier] = useState<'free' | 'pro' | 'premium'>('free');
  
  const handleUpgrade = () => {
    // Handle upgrade logic
    if (tier === 'free') setTier('pro');
    else if (tier === 'pro') setTier('premium');
  };

  return (
    <DashboardTier 
      tier={tier} 
      onUpgrade={handleUpgrade} 
    />
  );
}
```

## Component Props

### DashboardTier
```typescript
interface DashboardTierProps {
  tier: 'free' | 'pro' | 'premium';  // Current user tier
  onUpgrade?: () => void;             // Callback when upgrade clicked
}
```

### DashboardCard
```typescript
interface DashboardCardProps {
  title: string;                      // Card title
  subtitle?: string;                  // Optional subtitle
  locked?: boolean;                   // Whether card is locked
  lockMessage?: string;               // Custom lock message
  chartType: 'pie' | 'bar' | 'bubble' | 'heatmap' | 'line' | 'stacked' | 'donut' | 'sparkline';
  tier: 'free' | 'pro' | 'premium';  // Current tier for styling
}
```

## Chart Types Implemented

1. **Pie Chart**: Circular segments with gradient colors
2. **Bar Chart**: Vertical bars with varying heights
3. **Bubble Chart**: Scattered circles of different sizes
4. **Heatmap**: 6x4 grid with opacity variations
5. **Line Chart**: Multi-line graph with smooth curves
6. **Stacked Bar Chart**: Layered vertical bars
7. **Donut Chart**: Ring chart with center cutout
8. **Sparkline**: Minimal line with gradient fill

## Upgrade Flow

### Free → Pro
- **Unlocks**: 3 new cards (Ad Transparency, Influencer Analysis, Sentiment Trend)
- **Banner**: "Upgrade to Pro for deeper insights"
- **Button**: Purple CTA

### Pro → Premium
- **Unlocks**: 4 new cards (Bias Map, Engagement by Platform, Content Tone, Summary)
- **Banner**: "Unlock the full picture with Premium"
- **Button**: Teal CTA

### Premium
- **All unlocked**: 8 total insights
- **Summary banner**: Success state with sparkline visual
- **No upgrade CTA**: Achievement message instead

## Design System Alignment

✅ Matches AlgorithmLens brand guidelines
✅ Uses Plus Jakarta Sans headlines (via CSS variables)
✅ Uses Inter body text
✅ 8-point grid system
✅ Teal-to-violet gradients
✅ Rounded corners (16px)
✅ Research-grade aesthetic
✅ Calm, minimalist design

## Next Steps

To integrate into navigation:
1. Add a "View Tier Demo" button to the landing page or pricing page
2. Update the Navbar to include an optional demo link
3. Add keyboard shortcuts for quick tier switching (dev mode)
4. Export Figma variants for design handoff

## Export Naming Convention

Component variants in Figma:
- `Dashboard_Tier=free`
- `Dashboard_Tier=pro`
- `Dashboard_Tier=premium`

Card naming:
- `Card_FeedBreakdown`
- `Card_TopTopics`
- `Card_AdTransparency`
- `Card_InfluencerAnalysis`
- `Card_BiasMap`
- `Card_SentimentTrend`
- `Card_EngagementByPlatform`
- `Card_ContentTone`
- `Card_Summary`
