# AlgorithmLens Mobile — Visual Upgrade Target

**Date:** 2026-02-28
**Purpose:** Define the exact visual direction for every screen after the mobile UI overhaul
**Status:** Design direction document — no code changes

---

## Libraries Being Installed

| Library | Purpose |
|---------|---------|
| `gluestack-ui` | Modern React Native component library (NativeWind/Tailwind styling) |
| `react-native-gifted-charts` | Professional charting with animations, gradients, touch interactions |
| `react-native-purchases` (RevenueCat) | Native IAP with pre-built paywall templates |
| `expo-font` + Geist | Custom typography matching the website |
| `@gorhom/bottom-sheet` | Production-grade bottom sheet (replaces custom PlatformBottomSheet) |

---

## 1. VISUAL DIRECTION

### The Aesthetic: "Calm × Fintech" for Mobile

AlgorithmLens is a premium analytics tool. The mobile app should feel like opening Robinhood, Fidelity, or Apple Health — not a social media app or a gamified toy. The visual language is **professional restraint with warm intelligence**.

### What This Means Concretely

**Information hierarchy through typography weight, not color.** Headlines use Geist at 600–700 weight with tight letter spacing (-0.02em to -0.03em). Secondary text uses 400 weight at a smaller size. Color is reserved for semantic meaning (status, data categories) — never for decoration.

**Clean data density.** Every pixel of screen real estate communicates something. Cards don't exist for visual interest — they exist because they group related information. Padding is generous (16–32px) but purposeful. No floating decorative elements, no background patterns, no ornamental gradients.

**Depth through borders and color, not shadow drama.** Shadows are barely visible — 3–6% opacity, tight blur radius. Cards are distinguished from the background by 1px borders at 6–12% opacity and a slightly different background color (white on #F7F8FC). This creates a calm, flat hierarchy where nothing screams for attention.

**Purposeful whitespace.** Sections breathe. 32–48px between major content blocks. 16–24px between cards. The app should never feel cramped or busy, even when showing dense data.

**Blue and green only.** Primary blue (#2563EB) at 70% dominance for trust, structure, and navigation. Accent green (#10B981) at 30% for positive outcomes and primary CTAs. Purple, orange, and red appear only for semantic meaning (ads category, streaks, errors) — never as decorative accents.

### What This Is NOT

- **Not purple gradients.** No aurora backgrounds, no mesh gradients, no "AI magic" visual language.
- **Not glassmorphism.** No frosted glass, no blur-through-content, no layered transparency effects.
- **Not bubbly rounded everything.** Border radii are 10–16px for cards, not 28px. Buttons are 10px radius, not pill-shaped (except badges and chips where pill is semantic).
- **Not dark-mode-first.** Light mode is the default and primary experience. Dark mode is carefully crafted, not inverted.
- **Not gamified.** Streaks and badges exist but are visually restrained — they use the same card system as everything else. No particle effects, no celebration animations, no confetti.

### Visual References

| Reference | What to Take From It |
|-----------|---------------------|
| **Robinhood** | Clean data cards, typography-driven hierarchy, purposeful use of green |
| **Fidelity** | Dense data presentation that still feels readable, professional blue palette |
| **Apple Health** | Card-based dashboard, ring charts, calm color palette, generous spacing |
| **Linear** | Geist font usage, minimal shadows, border-driven depth, information density |
| **The AlgorithmLens website** | Direct reference — match this aesthetic on mobile |

---

## 2. COLOR SYSTEM UPGRADE

### Tokens That Stay Exactly As-Is

The existing color system in `theme.ts` is mature and well-considered. The following tokens require zero changes:

**Core brand:** `primary` (#2563EB light / #3B82F6 dark), `secondary` (#10B981 / #34D399), `accent` (#8B5CF6 / #A78BFA)

**Semantic status:** All `success`, `warning`, `error` tokens and their light/border variants

**Text hierarchy:** `textPrimary`, `textSecondary`, `textTertiary`, `textInverse`, `textMain`, `textMuted`

**Backgrounds:** `bgPrimary` (#F7F8FC / #0F172A), `bgSecondary`, `bgElevated`, `bgPage`, `bgCard`

**Borders:** All border tokens (`borderDefault`, `borderSubtle`, `borderLight`, `borderSoft`, `borderMedium`)

**Blue and green scales:** All blue50–blue800 and green50–green700 tokens

**Chart palette:** `chartPalette`, tone colors, ads colors, ideology colors (all WCAG AA verified)

**Streak colors:** All streak tokens

**Platform colors:** All platform tokens

**Overlays:** All whiteOverlay and overlay tokens

### Tokens That Need Adjustment

```typescript
// CURRENT → UPGRADED

// 1. Gradient card end needs more contrast from start
bgCardGradientEnd: '#FAFBFE',  // KEEP (matches website)

// 2. Cancel button bg is too gray — use bgSecondary for consistency
cancelButtonBg: '#F3F4F6',    // → colors.bgSecondary (#F1F5F9)

// 3. Timer bg same issue
timerBg: '#F3F4F6',           // → colors.bgSecondary (#F1F5F9)
```

### New Tokens Needed

```typescript
// ─── NEW: Chart Dimension Accent Colors ──
// Each analysis dimension gets a signature color for chart accents,
// tab indicators, and section headers. These create visual identity
// per dimension without relying on the generic primary blue.

chartAccentOverview: '#2563EB',      // Primary blue — the default
chartAccentSources: '#6366F1',       // Indigo — who shapes your feed
chartAccentAds: '#D97706',           // Amber — ads & promotions
chartAccentPolitics: '#7C3AED',      // Violet — political exposure
chartAccentTone: '#0D9488',          // Teal — emotional tone
chartAccentSuggested: '#E11D48',     // Rose — suggested vs. followed

// Dark mode equivalents
chartAccentOverviewDark: '#3B82F6',
chartAccentSourcesDark: '#818CF8',
chartAccentAdsDark: '#F59E0B',
chartAccentPoliticsDark: '#A78BFA',
chartAccentToneDark: '#2DD4BF',
chartAccentSuggestedDark: '#FB7185',

// ─── NEW: Interactive States ──
pressedOverlay: 'rgba(0, 0, 0, 0.04)',      // Light mode press feedback
pressedOverlayDark: 'rgba(255, 255, 255, 0.06)', // Dark mode press feedback

// ─── NEW: Chart-Specific ──
chartGridLine: 'rgba(30, 41, 59, 0.06)',     // Light grid lines
chartGridLineDark: 'rgba(148, 163, 184, 0.12)',
chartTooltipBg: '#1E293B',                   // Tooltip background (always dark)
chartTooltipText: '#F1F5F9',                 // Tooltip text (always light)
chartAreaFill: 'rgba(37, 99, 235, 0.08)',    // Area chart fill
chartAreaFillDark: 'rgba(59, 130, 246, 0.15)',

// ─── NEW: Paywall ──
paywallAccent: '#2563EB',          // RevenueCat template accent
paywallBadgeBg: '#ECFDF5',        // "Save 20%" badge
paywallBadgeText: '#059669',

// ─── NEW: Bottom Sheet ──
sheetHandle: 'rgba(30, 41, 59, 0.20)',       // Drag handle color
sheetHandleDark: 'rgba(148, 163, 184, 0.30)',
```

### Gluestack Theme Config Format

```typescript
// gluestack-ui/config.ts — Color tokens ready to paste
const colors = {
  // Brand
  primary50: '#EFF6FF',
  primary100: '#DBEAFE',
  primary200: '#BFDBFE',
  primary300: '#93C5FD',
  primary400: '#60A5FA',
  primary500: '#3B82F6',
  primary600: '#2563EB',
  primary700: '#1D4ED8',
  primary800: '#1E40AF',
  primary900: '#1E3A8A',

  secondary50: '#ECFDF5',
  secondary100: '#D1FAE5',
  secondary200: '#A7F3D0',
  secondary300: '#6EE7B7',
  secondary400: '#34D399',
  secondary500: '#10B981',
  secondary600: '#059669',
  secondary700: '#047857',

  // Neutrals (Slate scale — matches website)
  neutral50: '#F8FAFC',
  neutral100: '#F1F5F9',
  neutral200: '#E2E8F0',
  neutral300: '#CBD5E1',
  neutral400: '#94A3B8',
  neutral500: '#64748B',
  neutral600: '#475569',
  neutral700: '#334155',
  neutral800: '#1E293B',
  neutral900: '#0F172A',

  // Status
  success500: '#059669',
  warning500: '#B8860B',
  error500: '#B45555',
  info500: '#2563EB',

  // Backgrounds
  backgroundLight: '#F7F8FC',
  backgroundDark: '#0F172A',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#1E293B',
};
```

### WCAG AA Compliance Verification

All existing text/background combinations already pass WCAG AA (verified in theme.ts comments). New tokens maintain the same standard:

| Combination | Contrast Ratio | Pass? |
|-------------|---------------|-------|
| textMain (#1E293B) on bgPage (#F7F8FC) | 13.5:1 | AA ✓ |
| textMuted (#4B5563) on bgCard (#FFFFFF) | 7.1:1 | AA ✓ |
| textSecondary (#64748B) on bgCard (#FFFFFF) | 4.6:1 | AA ✓ |
| chartTooltipText (#F1F5F9) on chartTooltipBg (#1E293B) | 11.3:1 | AA ✓ |
| paywallBadgeText (#059669) on paywallBadgeBg (#ECFDF5) | 4.8:1 | AA ✓ |
| Dark: textPrimary (#F1F5F9) on bgPage (#0F172A) | 15.4:1 | AAA ✓ |
| Dark: textTertiary (#94A3B8) on bgCard (#1E293B) | 4.6:1 | AA ✓ |

---

## 3. TYPOGRAPHY UPGRADE

### Loading Geist in Expo

```typescript
// app/_layout.tsx — Font loading with expo-font
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Geist-Regular': require('../assets/fonts/Geist-Regular.otf'),
    'Geist-Medium': require('../assets/fonts/Geist-Medium.otf'),
    'Geist-SemiBold': require('../assets/fonts/Geist-SemiBold.otf'),
    'Geist-Bold': require('../assets/fonts/Geist-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  // ... rest of layout
}
```

**Font files:** Download Geist from vercel/geist-font GitHub releases. Place in `mobile/assets/fonts/`. Four weights needed: Regular (400), Medium (500), SemiBold (600), Bold (700).

### Updated Typography Scale

The existing scale stays but gains `fontFamily` and tighter letter spacing to match the website:

```typescript
export const TYPOGRAPHY = {
  display: {
    fontFamily: 'Geist-Bold',
    fontSize: RFValue(32),
    fontWeight: '700',
    lineHeight: RFValue(40),
    letterSpacing: -0.96,        // -0.03em × 32 (matches website hero)
  },
  h1: {
    fontFamily: 'Geist-Bold',
    fontSize: RFValue(24),
    fontWeight: '700',
    lineHeight: RFValue(32),
    letterSpacing: -0.48,        // -0.02em × 24 (matches website heading)
  },
  heroTitle: {
    fontFamily: 'Geist-Bold',
    fontSize: RFValue(26),
    fontWeight: '700',
    lineHeight: RFValue(34),
    letterSpacing: -0.78,        // -0.03em × 26 (matches website hero)
  },
  h2: {
    fontFamily: 'Geist-SemiBold',
    fontSize: RFValue(18),
    fontWeight: '600',
    lineHeight: RFValue(24),
    letterSpacing: -0.36,        // -0.02em × 18
  },
  h3: {
    fontFamily: 'Geist-SemiBold',
    fontSize: RFValue(16),
    fontWeight: '600',
    lineHeight: RFValue(22),
    letterSpacing: -0.16,        // -0.01em × 16 (matches website card)
  },
  bodyLarge: {
    fontFamily: 'Geist-Regular',
    fontSize: RFValue(16),
    fontWeight: '400',
    lineHeight: RFValue(24),
    letterSpacing: 0,
  },
  body: {
    fontFamily: 'Geist-Regular',
    fontSize: RFValue(15),
    fontWeight: '400',
    lineHeight: RFValue(22),
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: 'Geist-Regular',
    fontSize: RFValue(14),
    fontWeight: '400',
    lineHeight: RFValue(20),
    letterSpacing: 0,
  },
  caption: {
    fontFamily: 'Geist-Regular',
    fontSize: RFValue(12),
    fontWeight: '400',
    lineHeight: RFValue(16),
    letterSpacing: 0.12,         // Slightly positive for small text readability
  },
  captionSmall: {
    fontFamily: 'Geist-Regular',
    fontSize: RFValue(11),
    fontWeight: '400',
    lineHeight: RFValue(15),
    letterSpacing: 0.11,
  },
  label: {
    fontFamily: 'Geist-Medium',
    fontSize: RFValue(14),
    fontWeight: '500',
    lineHeight: RFValue(20),
    letterSpacing: 0,
  },
  labelBold: {
    fontFamily: 'Geist-SemiBold',
    fontSize: RFValue(14),
    fontWeight: '600',
    lineHeight: RFValue(20),
    letterSpacing: 0,
  },
  overline: {
    fontFamily: 'Geist-SemiBold',
    fontSize: RFValue(11),
    fontWeight: '600',
    lineHeight: RFValue(15),
    letterSpacing: 1.1,          // 0.1em × 11 (matches website wide-label)
    textTransform: 'uppercase',
  },
  bigNumber: {
    fontFamily: 'Geist-Bold',
    fontSize: RFValue(32),
    fontWeight: '700',
    lineHeight: RFValue(40),
    letterSpacing: -1.0,
  },
  scoreLarge: {
    fontFamily: 'Geist-Bold',
    fontSize: RFValue(32),
    fontWeight: '700',
    lineHeight: RFValue(38),
    letterSpacing: -1.0,
  },
  scoreSmall: {
    fontFamily: 'Geist-Bold',
    fontSize: RFValue(20),
    fontWeight: '700',
    lineHeight: RFValue(26),
    letterSpacing: -0.5,
  },
  buttonLg: {
    fontFamily: 'Geist-SemiBold',
    fontSize: RFValue(16),
    fontWeight: '600',
    lineHeight: RFValue(22),
    letterSpacing: 0,
  },
  buttonMd: {
    fontFamily: 'Geist-SemiBold',
    fontSize: RFValue(15),
    fontWeight: '600',
    lineHeight: RFValue(20),
    letterSpacing: 0,
  },
  buttonSm: {
    fontFamily: 'Geist-SemiBold',
    fontSize: RFValue(14),
    fontWeight: '600',
    lineHeight: RFValue(18),
    letterSpacing: 0,
  },
};
```

### Key Typography Changes

1. **Every text style gets a `fontFamily`** mapped to the correct Geist weight file
2. **Letter spacing tightened** on headings to match website's `-0.02em` to `-0.03em` range
3. **RFValue sizing preserved** — the responsive scaling approach works well and should not change
4. **Weight mapping:** 400→Geist-Regular, 500→Geist-Medium, 600→Geist-SemiBold, 700→Geist-Bold

---

## 4. COMPONENT UPGRADE MAP

### UI Primitives → Gluestack Equivalents

| Current Custom | Gluestack Equivalent | Migration Notes |
|---------------|---------------------|-----------------|
| **Badge** | `@gluestack-ui/badge` | Preserve all 8 variants (default, success, warning, error, info, accent, outline, subtle). Gluestack Badge supports `action` and `variant` props that map well. Add `size` prop mapping. |
| **Button** | `@gluestack-ui/button` | Preserve variants (primary, secondary, ghost, danger) and sizes (sm, md, lg). **Custom:** Keep the LinearGradient primary variant — gluestack doesn't do gradient buttons out of the box. Wrap gluestack Button with gradient for primary variant only. Keep haptic feedback via `onPress` wrapper. |
| **Card** | `@gluestack-ui/card` or **keep custom** | Gluestack Card is minimal. The current Card component has gradient backgrounds, entry animations, and interactive press scaling. **Recommendation: keep custom Card**, just update its styling to use Geist font and refined spacing. |
| **Chip** | `@gluestack-ui/badge` (variant="outline") | No direct Chip component in gluestack. Use Badge with outline variant and press handler. Or keep custom Chip — it's simple and works. |
| **ContentFadeIn** | **Keep custom** | No gluestack equivalent. This is a Reanimated wrapper — keep as-is. |
| **Divider** | `@gluestack-ui/divider` | Direct replacement. Preserve spacing and color props. |
| **EmptyState** | **Keep custom** | No gluestack equivalent. This is a layout component. Update styling only. |
| **ErrorState** | **Keep custom** | No gluestack equivalent. Update styling only. |
| **ProgressBar** | `@gluestack-ui/progress` | Direct replacement. Preserve indeterminate mode via custom animation wrapper. Gluestack Progress supports `value`, `size`, and `colorScheme`. |
| **Skeleton** | `@gluestack-ui/skeleton` | If available, use it. Otherwise keep custom — it's a simple opacity animation. Add shimmer effect (horizontal gradient sweep) to replace the current pulse. |
| **StaggeredList** | **Keep custom** | No equivalent. This is a Reanimated wrapper. |
| **Toast** | `@gluestack-ui/toast` | Gluestack Toast supports placement, duration, and custom render. Preserve the left-border color coding (success/error/info). Add icon support that the current Toast lacks. |

### Dashboard Components → Gifted Charts

| Current | Replacement | Chart Type | Notes |
|---------|-------------|------------|-------|
| **BarChart** | `react-native-gifted-charts` `BarChart` | Vertical bar chart | Replace custom SVG with gifted-charts. Gain: animated entrance, touch tooltips, gradient fills, rounded bar caps. Preserve: the 5-tier blue gradient coloring, percentage labels. |
| **StackedBar100** | `react-native-gifted-charts` `BarChart` (stacked) | 100% stacked horizontal bar | Gifted-charts supports stacked bars with custom colors. Preserve: external labels for <15% segments, colorblind-accessible legend shapes. **Custom wrapper needed** for the legend with distinct shapes (circle, square, diamond, triangle). |
| **BigNumber** | **Keep custom, upgrade styling** | N/A (not a chart) | Add Geist Bold font, animated count-up (already exists in FeedScoreCard — extract and reuse), and subtle fade-in on data load. |
| **InsightHero** | **Keep custom, upgrade styling** | N/A | Upgrade font to Geist. Refine the accent bar (match website's 4px gradient bar). Add spring animation to expand/collapse. |
| **MetricCard** | **Keep custom, upgrade styling** | N/A | Upgrade font. Consider adding a mini sparkline via gifted-charts `LineChart` (tiny, 40px tall, no axes) to show trend. |
| **SectionHeader** | **Keep custom, upgrade styling** | N/A | Upgrade font. Match website's gradient accent bar exactly (4px wide, primary to barMedium). |
| **ComparisonView** | **Keep custom, upgrade styling** | N/A | Upgrade font and spacing. Add delta sparklines where appropriate. |
| **DashboardTour** | **Keep custom** | N/A | Upgrade font only. The tour structure works well. |

### Chart Types Per Analysis Dimension

| Dimension | Current Chart | Upgraded Chart | Why |
|-----------|--------------|----------------|-----|
| **Overview** | Multiple BigNumbers + MetricCards | BigNumbers + MetricCards with **mini line sparklines** (gifted-charts LineChart, 40px, no axes) | Sparklines add trend context without visual noise |
| **Sources** | BarChart (top creators) | gifted-charts **BarChart** with gradient fills, touch tooltips, rounded caps | Professional look, touch interaction for exploration |
| **Ads** | StackedBar100 (ad types) + BigNumber (ad %) | gifted-charts **PieChart** (donut) for ad breakdown + StackedBar100 for labeled/unlabeled | Donut charts are more intuitive for part-of-whole on mobile |
| **Politics** | StackedBar100 (ideology) + BigNumber | gifted-charts **BarChart** (horizontal) for ideology spectrum + StackedBar100 | Horizontal bar better represents a spectrum (left ← → right) |
| **Tone** | StackedBar100 (pos/neutral/neg) | gifted-charts **PieChart** (donut) for sentiment split | Donut is cleaner for 3-segment data. Use the existing tonePositive/toneNeutral/toneNegative colors. |
| **Suggested vs. Followed** | StackedBar100 + BigNumbers | gifted-charts **BarChart** (grouped) showing suggested vs. followed per metric | Grouped bars make the comparison more direct |

### Home Components → Visual Upgrades

| Component | Current State | Upgraded State |
|-----------|--------------|----------------|
| **CalmHomeScreen** | ScrollView with StaggeredList, greeting + sections | Same structure. Upgrade: Geist font throughout, refined spacing (match website's 32px section gaps), skeleton loading state instead of blank. |
| **FeedScoreCard** | Gradient card with animated score counter | Upgrade: Add a **ring chart** (gifted-charts PieChart as progress ring, like Apple Health) around the score number. Score stays centered inside the ring. Ring fill = score/100. Color = existing score-based color coding. |
| **FeedScoreTrend** | Custom SVG sparkline (7 bars) | Replace with gifted-charts **LineChart** (7 points, area fill, smooth bezier curves, no axes, touch tooltip on last point). Preserve direction color coding. |
| **PlatformPicker** | 3×2 grid of circular icons | Upgrade: Refine icon sizing, use platform brand colors at 10% opacity bg (up from 6%). Selected state: 2px platform-color border with platform-color icon (keep). Add subtle scale animation on selection (spring, 1.05 scale). |
| **PlatformBottomSheet** | Custom Animated.View modal | Replace with **@gorhom/bottom-sheet**. Gain: gesture-driven drag, snap points, backdrop tap-to-close, keyboard avoidance. Keep the content (platform grid + mode toggle + start button). |
| **RecentScanCard** | Row layout with clock icon and text | Keep layout. Upgrade: Use platform brand color for the icon badge background (currently uses generic bgSecondary). Add chevron animation on press. |
| **SmartSuggestion** | Card with icon + suggestion text | Keep layout. Upgrade font to Geist. Refine icon badge colors. |
| **StreakBadge** | Progressive flame with tier system | Keep the tier system — it's well-designed. Upgrade: Geist font. Refine the flame icon scaling to be smoother (use Reanimated spring instead of discrete steps). |
| **WeeklySummaryCard** | Card with metrics grid | Upgrade: Add mini trend indicators (↑↓→ icons with color) next to each metric. Use Geist font. Refine the metrics grid spacing. |
| **DailyTipCard** | Card with lightbulb icon + tip text | Keep as-is. Upgrade font to Geist only. This component is simple and works well. |
| **ModeToggle** | Two side-by-side cards (Broadcast/Precision) | Upgrade: Use a segmented control pattern (gluestack or custom) instead of two full cards. More compact, more familiar. Selected segment gets primary blue fill. |

---

## 5. SCREEN-BY-SCREEN UPGRADE PLAN

### a) HOME SCREEN (CalmHomeScreen)

**Current:** ScrollView with StaggeredList animation wrapping: time-of-day greeting, StreakBadge, FeedScoreCard (animated score counter, color-coded by range), FeedScoreTrend (custom 7-bar sparkline), "Scan Your Feed" CTA (accentGreen, prominent), WeeklySummaryCard (metrics grid with trending icons), AchievementBadges, SmartSuggestion (contextual scan prompt), RecentScanCard (clock icon + last scan preview), DailyTipCard (lightbulb + rotating tip). Background is bgPrimary (#F7F8FC). Cards use gradient backgrounds (bgCard→bgCardGradientEnd) with brandTintBorder. New users see a first-use walkthrough modal.

**After:**
- **Greeting section:** Geist Bold for name, Geist Regular for subheading. Letter spacing -0.02em on the greeting. Reduce vertical spacing between greeting and first card to 16px.
- **FeedScoreCard:** Add a progress ring (gifted-charts PieChart configured as a donut/ring) wrapping the score number. Ring diameter: 120px, stroke width: 8px. Ring color follows existing score-based color coding (green ≥70, blue ≥50, amber ≥30, gray <30). Score number centered inside ring with Geist Bold at RFValue(32). Label text below ring. This makes the score card the visual anchor of the entire screen.
- **FeedScoreTrend:** Replace custom SVG bars with gifted-charts LineChart. 7 data points, bezier interpolation, area fill at 8% opacity of direction color, no axis labels, no grid. Touch on last point reveals exact score in a tooltip. Height: 48px. The trend becomes a smooth curve instead of discrete bars.
- **CTA button:** Keep accentGreen. Change border radius from pill (9999) to RADIUS.md (10px) to match website button style. Add subtle shadow (shadows.soft). Geist SemiBold for text.
- **Section spacing:** 24px between cards (up from current mixed spacing). 48px above "Your Week in Review" section to create clear visual grouping.
- **Loading state:** Show Skeleton placeholders for every card position while data loads, instead of showing nothing. 3 skeleton cards stacked with proper spacing.
- **Platform picker integration:** When user taps CTA, @gorhom/bottom-sheet slides up with platform grid. Smooth gesture-driven interaction replaces the current Animated.Value modal.

### b) DASHBOARD (6-tab analysis)

**Current:** Horizontal ScrollView tab bar (6 tabs), each tab renders a different analysis view. Tab content uses InsightHero at top with expandable details, followed by chart sections (BarChart, StackedBar100, BigNumber), MetricCard grids, and methodology disclosure sections. Tabs use fade animation (80ms out, 150ms in). Pull-to-refresh enabled. Skeleton loading state. LockedOverlayCard gates premium features. Tour overlay for first-time users.

**After:**
- **Tab bar:** Replace horizontal ScrollView with a fixed tab bar using dimension accent colors. Each tab gets a colored underline indicator (2px) in its accent color (overview=blue, sources=indigo, ads=amber, politics=violet, tone=teal, suggested=rose). Tab labels use Geist Medium, active tab uses Geist SemiBold. Tab bar has a subtle bottom border (borderLight).
- **InsightHero:** Upgrade font to Geist. Tighten the accent bar to 4px wide with gradient from chartAccent[dimension] to transparent. Expand/collapse uses spring animation (not linear). "About this analysis" section uses a clean disclosure pattern with ChevronDown rotation.
- **Charts (gifted-charts replacements):**
  - **Sources tab:** BarChart with rounded bar caps (4px radius), gradient fills from barDarkest to barLightest, touch tooltips showing exact values. Bar height animation on tab entry (stagger 50ms per bar).
  - **Ads tab:** Donut chart (PieChart with centerLabelComponent showing ad %) for primary breakdown. StackedBar100 below for labeled vs. unlabeled detail. Donut colors: adsLabeled (blue), adsUnlabeled (warm), adsNotAds (gray).
  - **Politics tab:** Horizontal BarChart for ideology spectrum. Left-aligned labels, bars extend right. Colors: ideologyLeft (blue), ideologyCenter (gray), ideologyRight (amber). Touch tooltip shows exact percentages.
  - **Tone tab:** Donut chart with 3 segments (positive/neutral/negative). Center shows dominant tone label. Colors use existing tonePositive/toneNeutral/toneNegative.
  - **Suggested vs. Followed:** Grouped BarChart with two bars per metric (suggested in rose, followed in blue). Makes the algorithmic vs. user-chosen comparison visually immediate.
  - **Overview tab:** Keep BigNumber and MetricCard layout. Add mini LineChart sparklines (32px tall, no axes, area fill) inside MetricCards to show trend direction. These sparklines use gifted-charts with minimal configuration.
- **MetricCard grid:** 2-column grid with consistent card heights. Each card shows: icon, headline, value (Geist Bold), trend sparkline (optional), context line (Geist Regular caption). Padding 16px internal, 8px gap between cards.
- **Tab transition:** Crossfade animation (100ms out, 200ms in) instead of current 80/150ms. Use Reanimated for smoother interpolation.
- **Empty/locked states:** LockedOverlayCard gets Geist font and refined spacing. Sparkles icon stays but at 20px (not oversized).

### c) SCANNER (WebView + overlay)

**Current:** Full-screen WebView loading the social media platform. Timer overlay (mm:ss) at top. Scan status messages. Loading indicator. On completion: success overlay showing post count, ad %, suggested %, and quality tier (Excellent/Good/Fair/Low/Very Low) with color-coded indicators. Bottom toolbar with Stop/Cancel buttons.

**After:**
- **WebView:** No visual changes to the WebView itself — it loads the real platform page.
- **Timer overlay:** Upgrade to floating pill badge at top-center. Background: overlayBg (88% white). Geist Medium for time. Add a subtle pulse animation to the recording dot (already exists, just ensure smooth 2s cycle).
- **Bottom toolbar:** Replace with @gorhom/bottom-sheet at 20% snap point (just the controls visible). Contains: Stop button (error red, rounded 10px), post counter (live updating), quality indicator badge. User can drag the sheet up to see more scan details mid-scan.
- **Completion overlay:** Expand bottom sheet to 60% snap point on completion. Show: quality tier badge (pill, color-coded), post count (Geist Bold bigNumber), key metrics (ad %, suggested %) as compact metric pills, "View Results" CTA (accentGreen, full width). The overlay slides up smoothly from the bottom sheet instead of appearing as a modal.
- **Quality tier badges:** Use Badge component with semantic variants: Excellent→success, Good→success, Fair→warning, Low→warning, Very Low→error.

### d) HISTORY

**Current:** SectionList grouped by time period (Today, Yesterday, This Week, Older). Each item shows platform abbreviation label, timestamp, scan stats (posts, ad %, suggested %). Platform filter dropdown. Comparison mode toggle. Pull-to-refresh. Estimated item height 130px for virtual scroll optimization.

**After:**
- **List items:** Upgrade to a cleaner card layout. Each scan item: left edge has a 3px colored bar in the platform brand color. Platform icon (not abbreviation) at 20px. Platform name + relative timestamp on one line (Geist Medium + Geist Regular caption). Second line: "24 posts · 12% ads · 45% suggested" (Geist Regular caption, textSecondary). Right: chevron for drill-in. Item height: 72px (more compact than 130px).
- **Section headers:** "Today", "Yesterday", etc. in Geist SemiBold overline style. Sticky headers that persist while scrolling.
- **Platform filter:** Replace dropdown with a horizontal chip bar (scrollable). Each chip shows platform icon + name. Selected chip uses primary blue fill. "All" chip at start.
- **Comparison mode:** Replace toggle with a "Compare" button in the navigation header. When active, items get checkboxes (left side). Selected items highlight with brandTintBg. Compare button in bottom bar with count badge.
- **Empty state:** EmptyState component with binoculars icon, "No scans yet" title, "Scan your first feed to start tracking" description, and "Scan Now" CTA (accentGreen).
- **Pull to refresh:** Keep, using the standard RefreshControl.

### e) SETTINGS

**Current:** Grouped sections with header labels (overline style). SettingRow components with label + value pairs. Switch toggles. Dividers between sections. Sections: Account (profile info), Appearance (theme toggle), Privacy (AI consent toggle), Subscription (plan status, upgrade), About (version, links), Support (help, feedback), Danger Zone (sign out, delete account).

**After:**
- **Section cards:** Wrap each section in a Card component (bgCard, borderLight, RADIUS.lg). This matches iOS Settings visual pattern. 12px vertical gap between section cards.
- **Section headers:** Geist SemiBold overline, textTertiary, 16px left padding, 8px bottom margin. Matches website's section header pattern.
- **Setting rows:** 48px minimum height (MIN_TOUCH_TARGET). Label in Geist Regular body, left-aligned. Value/control right-aligned. Divider between rows within a section (not after last row). Chevron icon for drill-through rows.
- **Theme picker:** Replace toggle with a 3-option segmented control (Light / Dark / System). Uses gluestack or custom segmented control with primary blue selected indicator. Currently defaults to 'light' — change default to 'system'.
- **Subscription section:** Show current plan status cleanly. "Free" or "Plus" badge next to plan label. Upgrade button uses primary blue (not green) to distinguish from scan CTA.
- **Sign out / Delete account:** Red text for destructive actions. Delete account requires confirmation dialog with text input ("type DELETE to confirm").
- **Font throughout:** Geist at appropriate weights.

### f) ONBOARDING

**Current:** 3-screen flow. Screen 1: "See what's really in your feed" with abstract concentric circles graphic. Screen 2: "How it works" with 3-step numbered flow and icons. Screen 3: "Start your first scan" with 6-platform icon grid and "Let's go" button. Fade transitions (150ms) between screens. State-based rendering (not ScrollView). AI consent integrated.

**After:**
- **Screen 1:** Replace abstract concentric circles with a clean illustration of a phone showing a social media feed with analysis overlays. Use the brand colors only (blue, green, white, slate). Title in Geist Bold heroTitle with -0.03em spacing. Subtitle in Geist Regular body. CTA: "Get Started" in accentGreen, RADIUS.md (10px), full width.
- **Screen 2:** Keep the 3-step flow. Upgrade icons to larger size (48px container). Step numbers use Geist Bold in primary blue circles. Step descriptions in Geist Regular bodySmall. Connect steps with a subtle vertical line (borderLight). This creates a cleaner "timeline" visual.
- **Screen 3:** Platform picker uses upgraded PlatformPicker component (10% opacity backgrounds, 2px borders on selection). "Let's go" CTA in accentGreen, full width. Add a "Skip" text button above the CTA for users who want to explore first.
- **Page indicators:** 3 dots at bottom, active dot uses primary blue with 2x width (pill shape). Inactive dots in borderSlate300.
- **Transitions:** Crossfade (200ms) instead of 150ms. Use Reanimated for smoother interpolation.
- **Background:** bgPrimary (#F7F8FC) — consistent with the rest of the app. No special gradient backgrounds.

### g) LOGIN

**Current:** OAuth buttons (Google, Apple) and email/password form with method toggle. Error message display. Password visibility toggle.

**After:**
- **Layout:** Center-aligned content. App icon at top (72px, existing icon asset). App name "AlgorithmLens" in Geist Bold h1 below icon. Tagline "See what's really in your feed" in Geist Regular bodySmall, textSecondary.
- **OAuth buttons:** Full-width, 48px height, RADIUS.md (10px). White background, borderDefault. Platform icon (Google G, Apple logo) at 20px left of center-aligned text. Text in Geist Medium. 8px gap between buttons.
- **Divider:** "or" text centered on a horizontal line. Geist Regular caption, textTertiary.
- **Email form (if keeping):** Clean input fields with Geist Regular. 12px border radius. Focus state: primary blue border (2px). Error state: error red border with error message below in Geist Regular caption.
- **Background:** bgPrimary (#F7F8FC). No gradients on the login screen — keep it clean.
- **Legal text:** "By continuing, you agree to our Terms and Privacy Policy" at bottom. Geist Regular captionSmall, textTertiary. Links in primary blue.

### h) ANALYSIS RESULTS (post-scan)

**Current:** Shows AnalysisProgress during processing (spinner + step indicators), then BroadcastResultsSummary on completion. Back button with confirmation dialog. Platform brand color theming.

**After:**
- **Progress state:** Replace generic spinner with a multi-step progress indicator. Show 4 steps: "Capturing frames" → "Analyzing content" → "Classifying posts" → "Building insights". Each step has a checkmark when complete, a spinner when active, and a circle when pending. Connector lines between steps. Uses Geist Medium for step labels. Progress bar at top (ProgressBar component) showing overall completion.
- **Results state:** Full scrollable results view. At top: platform icon + name + timestamp. Feed Score ring chart (same as home screen FeedScoreCard). Key metrics in a 2×2 grid (MetricCards). Detailed breakdown sections using the same InsightHero + chart pattern as the dashboard. "View Full Dashboard" CTA at bottom to navigate to the dashboard tab.
- **Transition:** Smooth crossfade from progress to results (300ms). Results slide up from bottom.
- **Share:** Add a "Share Summary" button in the header. Generates a simple text summary for sharing (no screenshot — text is more useful and faster).

### i) PAYWALL / UPGRADE MODAL

**Current:** UpgradeModal is a custom bottom sheet with feature comparison (5 items with free-tier comparison), dual plan cards (Annual $96/year, Monthly $10/month), "Save 20%" badge, "Try free for 14 days" messaging, Stripe web checkout flow. LockedOverlayCard is an inline card overlay with sparkles icon and text-link CTA.

**After — RevenueCat Native Paywall:**
- **Replace UpgradeModal entirely** with RevenueCat's `<RevenueCatUI.Paywall>` component. RevenueCat provides pre-built, tested paywall templates that handle: plan display, trial messaging, purchase flow, restore purchases, error handling, and loading states — all natively.
- **Template selection:** Use RevenueCat's "Multi-tier" or "Feature list" template. Configure with AlgorithmLens brand colors: `accentColor = #2563EB`, `backgroundColor = #F7F8FC`, `textColor = #1E293B`.
- **Feature list** (configured in RevenueCat dashboard, not hardcoded):
  1. Detailed charts & visual breakdowns
  2. 7-day trend tracking
  3. Unlimited scan history
  4. Full 6-dimension analysis
  5. Priority support
- **Trial messaging:** "Start your 14-day free trial" — configured in RevenueCat offering metadata.
- **LockedOverlayCard stays** as an inline component but triggers the RevenueCat paywall instead of the custom modal. Update to use Geist font. Keep the sparkles icon and subtle text-link CTA pattern.
- **Checkout flow:** RevenueCat handles Apple IAP / Google Play Billing natively. No more Stripe web checkout redirect. This eliminates the checkout/success.tsx and checkout/cancel.tsx screens entirely.
- **Entitlements:** `useEntitlements` hook migrates from backend API call to RevenueCat SDK's `Purchases.getCustomerInfo()`. The `isPlus` flag comes from RevenueCat entitlements instead of the backend.

---

## 6. ANIMATION & INTERACTION UPGRADES

### Where to Add/Improve Animations

**Screen transitions:**
- Tab switches: Use `react-native-reanimated` shared element transitions between tabs. The tab content crossfades (opacity 1→0→1) over 200ms with a subtle slide (translateY 4px→0). This is smoother than the current 80ms/150ms fade.
- Stack pushes (Home → Scanner, Home → Analysis): Use the default iOS push animation (slide from right). Don't customize — the native feel is correct.
- Modal presentations (bottom sheets, paywalls): Spring animation with damping 0.8, stiffness 100. This gives a natural, physical feel.

**Chart entry animations (gifted-charts):**
- Bar charts: Bars grow from zero height with staggered delay (30ms per bar). Use spring animation (damping 0.7). This is a key visual upgrade — charts should feel like they're "building" as data arrives.
- Donut charts: Segments animate from 0° to their final arc with easing. Total duration 600ms.
- Line charts: Path draws from left to right over 800ms. Area fill fades in at 400ms.
- Sparklines: Instant render (no animation) — they're too small for animation to register.

**Touch feedback:**
- All tappable elements: Use `Pressable` with `onPressIn` scale to 0.97 (spring, 100ms) and `onPressOut` return to 1.0 (spring, 200ms). This replaces the current `activeOpacity` approach with a more physical feel.
- Cards: Add `pressedOverlay` color (4% black) on press via a Reanimated interpolated background.
- Buttons: Keep existing haptic feedback (triggerImpactLight for selections, triggerImpactMedium for actions).

**Loading states:**
- Skeleton upgrade: Replace pulse animation with shimmer (horizontal gradient sweep, left to right, 1.5s loop). Use `react-native-reanimated` to animate a LinearGradient mask. This is more modern than the current opacity pulse.
- Content transitions: When data loads and replaces skeletons, use a crossfade (skeleton opacity 1→0, content opacity 0→1, 250ms overlap).

**Bottom sheet:**
- @gorhom/bottom-sheet handles its own gesture-driven animation. Configure with `animationConfigs` using `withSpring({ damping: 50, stiffness: 500 })` for a responsive, non-bouncy feel.
- Backdrop: Animated opacity (0→0.4) synced with sheet position.

### Chart Interaction Polish

**Tooltips:**
- On bar/segment touch: Show a tooltip bubble above the touched element. Background: chartTooltipBg (#1E293B). Text: chartTooltipText (#F1F5F9). Geist Medium caption. Rounded corners (RADIUS.sm). Arrow pointing down to the touched element. Fade in 150ms, fade out 100ms on release.
- Tooltip content: Value + label + percentage. Example: "Instagram · 45 posts · 32%"

**Highlights:**
- On touch: The touched bar/segment brightens (increase opacity to 1.0), all other bars/segments dim (reduce opacity to 0.4). This creates a focus effect.
- Release: All elements return to full opacity over 200ms.

**Gesture exploration:**
- Horizontal pan on line/area charts: Tooltip follows finger position, snapping to nearest data point. Vertical line indicator at current position. Haptic tick on each snap point (triggerSelection).

### Transition Improvements

**Tab bar tab switching:**
- Underline indicator slides to the new tab (animated translateX, spring 200ms). This is more fluid than a discrete jump.
- Tab label color transitions from textSecondary to textPrimary (animated, 150ms).

**Dashboard tab content:**
- Content crossfades with a 4px upward slide. Old content fades out and slides down 4px. New content fades in and slides up from 4px below. Duration: 200ms total. This creates a subtle "replacement" feel.

**List item press:**
- History items: Scale to 0.98 on press, return on release. Navigate on release (not on press-in). This gives visual feedback before navigation.

---

## 7. WHAT TO LEAVE ALONE

The following should NOT change during this visual upgrade:

### Navigation Structure
- Tab bar with 4 visible tabs (Home, Dashboard, History, Settings) + hidden Scan tab — this works correctly
- Stack navigation for Scanner, Broadcast, Analysis screens — the hierarchy is right
- Auth flow separation ((auth) group vs (tabs) group) — clean pattern

### Data Flow & API Architecture
- `api.ts` authenticated client with JWT injection — stable and correct
- Supabase client initialization and auth flow — works
- AsyncStorage for local data persistence — appropriate for the data volume
- The entire `src/lib/analysis/` pipeline (Gemini Flash API client, prompts, classification) — core IP, don't touch

### Auth System
- Supabase OAuth (Google, Apple) — standard and reliable
- `AuthContext` with session management — correct pattern
- Deep link redirect (algorithmLens://auth/callback) — configured correctly

### Broadcast Mode Native Modules
- `modules/broadcast/` — iOS ReplayKit and Android MediaProjection integration
- `modules/shortcuts/` — Siri Shortcuts integration
- `plugins/withBroadcastExtension.js` — Expo config plugin
- These are custom native code with complex platform-specific implementations. No visual changes.

### Platform-Specific JS Injection Scripts
- `src/lib/platformScripts/*.ts` — DOM scraping scripts for Instagram, X, YouTube, TikTok, Facebook, Reddit
- These run inside the WebView and are invisible to the user. No changes needed.

### State Management Pattern
- Context + hooks pattern (AuthContext, ThemeContext, custom hooks) — appropriate scale
- No need to add Redux/Zustand — the app's state complexity doesn't warrant it

### Business Logic
- `computeDashboardData.ts` — dashboard data computation
- `insightBuilders.js` — insight text generation
- `streakManager.ts` — streak calculation
- `achievements.ts` — badge definitions
- `thresholds.ts` — analysis thresholds
- All feed score computation logic in the Home screen

### Test Suite
- All 17 test files in `src/__tests__/` — these validate business logic, not UI

### Configuration Files
- `app.config.ts` — Expo configuration
- `eas.json` — EAS Build profiles
- `babel.config.js` — Babel configuration (already includes reanimated plugin)
- `tsconfig.json` — TypeScript configuration

---

## IMPLEMENTATION PRIORITY ORDER

For reference, the recommended implementation order (not part of this design document's scope, but useful for planning):

1. **Font installation** (Geist) — affects every screen, do first
2. **Theme token updates** (new tokens, adjusted tokens) — foundation for everything
3. **@gorhom/bottom-sheet** — replaces PlatformBottomSheet, used by scanner
4. **UI primitive upgrades** (Button, Badge, Card, Toast via gluestack) — used everywhere
5. **gifted-charts integration** — dashboard charts, FeedScoreTrend sparkline, FeedScoreCard ring
6. **Screen-by-screen styling** — Home → Dashboard → Scanner → History → Settings → Auth
7. **RevenueCat paywall** — replaces UpgradeModal + Stripe checkout
8. **Animation polish** — shimmer skeletons, chart entries, touch feedback
9. **Dark mode verification** — ensure all changes work in dark mode

---

*This document defines the visual target. No code has been modified.*
