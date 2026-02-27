# AlgorithmLens Mobile — Visual Upgrade Prompts

Five self-contained prompts to achieve each recommendation from the UI Audit Final Report. Each is designed to be pasted into a Claude Code / Cowork session with full codebase access.

---

## Prompt 1: Dashboard Overview — Collapsible Sections & Visual Hierarchy

```
You are working on the AlgorithmLens mobile app. Your task is to redesign the Dashboard Overview tab to reduce information overload and create clear visual hierarchy. The goal is to lift this screen from 6.8/10 to 8.0+ — think Arc browser or Headspace level of polish.

SAFETY RULES:
- Only modify files in AlgorithmLens_Cowork/mobile/
- Do NOT change any analysis logic, API calls, or business logic
- Do NOT change computeDashboardData.ts
- Verify every file change compiles (re-read modified files and check imports)

CONTEXT — Current State:
The Overview tab is the `OverviewContent` component in `mobile/app/(tabs)/dashboard.tsx` (starts around line 79). It currently has:
- InsightHero card (title, meaning, expand for more context)
- "Key Metrics" section with MetricCard components (Posts scanned, Ads %, Suggested %, Top 5 concentration)
- "See more details" toggle that reveals: Content Types, Feed in Minutes, Content Patterns, Ideas to Explore
- Locked LockedOverlayCard for premium Trends
- A master numbers footer line

The problem: Even with the "See more details" toggle, the top section shows 4 MetricCards at once. When expanded, 8+ sections compete at equal visual weight. Users see a wall of cards rather than a guided story.

DESIGN SYSTEM (from mobile/src/lib/theme.ts):
- TYPOGRAPHY: display(32), h1(24), heroTitle(26), h2(18), h3(16), body(15), bodySmall(14), caption(12), label(14), overline(11)
- SPACING: xxs(2), xs(4), sm(8), md(12), lg(16), xl(20), 2xl(24), 3xl(32)
- RADIUS: xs(4), sm(6), md(10), lg(16), xl(20), full(9999)
- SHADOWS: sm, soft, md, card, lg, xl, hero
- Colors accessed via `const { colors, shadows } = useTheme();`
- All font sizes use RFValue() for responsive scaling
- 4pt grid for all spacing

REFERENCE APPS for inspiration:
- Opal (screen time): Single hero stat, progressive disclosure, calm whitespace
- Finch (wellness): One focus metric, supporting details tucked below
- Arc browser: Bold typography hierarchy, clear primary vs. secondary

TASK — Implement this redesign:

1. HERO ZONE (always visible):
   - Keep InsightHero exactly as-is (it's well-designed)
   - Below it, show ONE primary stat — the most interesting metric for this scan. Logic:
     - If suggestedPct > 60: show BigNumber with suggestedPct + "of your feed is from accounts you don't follow"
     - Else if adPct > 15: show BigNumber with adPct + "of your feed is sponsored content"
     - Else if top5Pct > 70: show BigNumber with top5Pct + "of your feed from just 5 accounts"
     - Else: show BigNumber with totalPosts + " posts scanned" (suffix="")
   - This single primary stat should be inside a Card with `shadows.card` and subtle gradient (`colors.bgCard` → `colors.bgCardGradientEnd`)
   - Below the BigNumber, add a single-line caption: `TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontStyle: 'italic'`

2. SUPPORTING METRICS (always visible, but visually subordinate):
   - Show the remaining 3 metrics in a compact horizontal row
   - Each metric: just the value (TYPOGRAPHY.h3, fontWeight 700) + label below (TYPOGRAPHY.captionSmall, textMuted)
   - No MetricCard wrapper — just plain text in a `flexDirection: 'row'` container with `justifyContent: 'space-around'`
   - Add a thin divider line above this row: `{ height: 1, backgroundColor: colors.borderSoft, marginVertical: SPACING.lg }`

3. "EXPLORE YOUR DATA" SECTION:
   - Replace the current "See more details" button with a section that has an overline header: "EXPLORE YOUR DATA" using TYPOGRAPHY.overline
   - Below the overline, show 3 tappable summary rows (not full cards). Each row:
     - Left: small icon (16px) + label (TYPOGRAPHY.label, textMuted)
     - Right: value (TYPOGRAPHY.labelBold, textMain) + ChevronDown (if expandable)
     - Height: 52px (minHeight: 44 + padding)
     - When tapped, expand to show the full content that's currently behind the toggle
   - Rows to show:
     a. "Content Types" → expands to StackedBar100
     b. "Time Estimate" → expands to Feed in Minutes cards
     c. "Content Patterns" → expands to emotional + source summaries
   - Each row should independently expand/collapse (use separate state booleans)
   - Add subtle `backgroundColor: colors.bgCard` and `borderRadius: RADIUS.lg` around the group
   - Between rows, add thin dividers: `{ height: 1, backgroundColor: colors.borderSoft }`

4. "IDEAS TO EXPLORE" SECTION:
   - Keep this section but move it fully below the explore section
   - Change from bullet points to a single sentence summary of the most relevant suggestion
   - Add "See more ideas" link that expands to show the full list

5. PREMIUM SECTION:
   - Keep LockedOverlayCard exactly as-is

6. ANIMATION:
   - Use `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` before each expand/collapse state change
   - Import LayoutAnimation from 'react-native'
   - For Android, call `UIManager.setLayoutAnimationEnabledExperimental?.(true)` in a useEffect on mount (guard with Platform.OS === 'android')

7. VERIFICATION:
   - After all changes, re-read dashboard.tsx and verify:
     - All imports are present
     - No TypeScript errors (check for missing types)
     - All spacing uses SPACING tokens, all fonts use TYPOGRAPHY tokens
     - All colors come from `colors.*`, never hardcoded hex
     - All touchable elements have minHeight: 44 and accessibilityRole="button"
   - Check that MetricCard, BarChart, StackedBar100, BigNumber, InsightHero imports are all still used or remove unused ones

After implementation, commit with message: "Dashboard Overview: redesign with hero stat, compact metrics, accordion sections"
```

---

## Prompt 2: Tone Chart Colors — High-Contrast Palette

```
You are working on the AlgorithmLens mobile app. Your task is to replace the tone chart colors with a high-contrast, colorblind-accessible palette.

SAFETY RULES:
- Only modify files in AlgorithmLens_Cowork/mobile/
- Do NOT change any analysis logic or business logic

CONTEXT — Current State:
In `mobile/src/lib/theme.ts`, the tone colors are:

LIGHT_COLORS (line ~132-135):
  tonePositive: '#93C5A8',   // muted sage-green
  toneNeutral: '#C5C0B8',    // warm gray
  toneNegative: '#A3B1C6',   // muted slate-blue

DARK_COLORS (line ~313-316):
  tonePositive: '#6EE7B7',
  toneNeutral: '#94A3B8',
  toneNegative: '#7DD3FC',

The problem: All three light-mode colors sit in a narrow band of muted mid-tones (similar lightness ~60-70%, low saturation). They are nearly indistinguishable at small sizes, especially for colorblind users.

These colors are used in StackedBar100 segments on the Tone tab in `mobile/app/(tabs)/dashboard.tsx` (ToneContent component, around line 1525-1530):
  { label: 'Positive', color: TONE_COLORS.positive }
  { label: 'Neutral',  color: TONE_COLORS.neutral }
  { label: 'Negative', color: TONE_COLORS.negative }

They're also used in a stacked bar on the "Suggested vs. Followed" tab for tone-by-source-origin.

REQUIREMENTS:
1. The new palette must pass WCAG AA contrast when white text is placed on top (the StackedBar100 renders white text labels on segments ≥15%)
2. Colors must be distinguishable under deuteranopia, protanopia, and tritanopia
3. Colors should feel "calm" — not alarming. This app's aesthetic is Calm × Duolingo, not Bloomberg Terminal
4. Maintain the semantic mapping: positive=warm/green, neutral=gray, negative=cool/blue-red

NEW PALETTE — implement exactly these values:

Light mode:
  tonePositive: '#34A874',   // saturated but calm emerald (passes AA with white text: 3.9:1 → bolster with fontWeight 600)
  toneNeutral: '#8B95A5',    // cool gray with enough saturation to read
  toneNegative: '#D46B6B',   // muted coral-red — warm, not alarming

Dark mode:
  tonePositive: '#4ADE80',   // bright green (already good contrast on dark bars)
  toneNeutral: '#94A3B8',    // keep as-is (already works well in dark)
  toneNegative: '#F87171',   // coral-red for dark mode

IMPLEMENTATION:
1. Open `mobile/src/lib/theme.ts`
2. Replace the 3 tonePositive/toneNeutral/toneNegative values in LIGHT_COLORS
3. Replace the 3 values in DARK_COLORS
4. Verify no other files reference these color values by hex (grep for '#93C5A8', '#C5C0B8', '#A3B1C6', '#6EE7B7', '#7DD3FC')
5. Verify the StackedBar100 component in `mobile/src/components/dashboard/StackedBar100.tsx` — it should render white text (TYPOGRAPHY.labelBold, color: colors.white) inside segments ≥15%. Confirm this existing behavior works with the new darker tone colors.

VERIFICATION:
- Re-read theme.ts and verify the exact hex values match what's specified above
- Grep the codebase for any hardcoded old hex values to ensure none were missed
- Read the ToneContent section of dashboard.tsx to confirm TONE_COLORS still references colors.tonePositive/toneNeutral/toneNegative correctly

Commit with message: "Tone chart: high-contrast colorblind-accessible palette (light + dark)"
```

---

## Prompt 3: BarChart Graduated Colors

```
You are working on the AlgorithmLens mobile app. Your task is to add graduated bar colors to the BarChart component so bars have distinct, ranked hues instead of identical blue.

SAFETY RULES:
- Only modify files in AlgorithmLens_Cowork/mobile/
- Do NOT change any analysis logic or business logic

CONTEXT — Current State:
In `mobile/src/components/dashboard/BarChart.tsx`, the bar colors are assigned on lines 66-74:

  const barColors = [
    colors.barDark,      // Top 1 — primary blue
    colors.barDark,      // Top 2 — primary blue
    colors.barDark,      // Top 3 — primary blue
    colors.textTertiary, // Rest — neutral gray
    colors.textTertiary,
  ];

The theme defines a gradient scale in `mobile/src/lib/theme.ts`:
  barDarkest: '#1E40AF'  (LIGHT) / '#93C5FD' (DARK)
  barDark:    '#2563EB'  (LIGHT) / '#60A5FA' (DARK)
  barMedium:  '#3B82F6'  (LIGHT) / '#3B82F6' (DARK)
  barLight:   '#60A5FA'  (LIGHT) / '#2563EB' (DARK)
  barLightest:'#93C5FD'  (LIGHT) / '#1D4ED8' (DARK)

The BarChart receives an `items` array (sorted by value, descending) and renders horizontal bars. It's used on multiple dashboard tabs:
- Sources tab: "Top creators" BarChart
- Ads tab: "Top advertiser categories" BarChart
- Suggested tab: "Who shapes your suggested feed" BarChart

The problem: Top 3 bars are identical blue, then items 4+ are identical gray. This provides no visual ranking signal — users can't quickly perceive "1st is bigger than 2nd" because the color is the same.

IMPLEMENTATION:
1. Open `mobile/src/components/dashboard/BarChart.tsx`
2. Replace the barColors array with a graduated scale:

```typescript
  // Graduated blue scale — darker = higher ranked, lighter = lower ranked.
  // This provides immediate visual hierarchy beyond just bar length.
  const barColors = [
    colors.barDarkest,   // #1 — deepest blue
    colors.barDark,      // #2 — primary blue
    colors.barMedium,    // #3 — medium blue
    colors.barLight,     // #4 — light blue
    colors.barLightest,  // #5 — lightest blue
  ];
```

3. The existing code at line 111 already handles overflow gracefully:
   `const barColor = item.color || barColors[Math.min(index, barColors.length - 1)];`
   So items 6+ will also use barLightest. This is correct behavior.

4. However, also add a fallback for items beyond 5 — they should use a subtle neutral rather than the lightest blue, to separate "ranked" from "rest":

```typescript
  const getBarColor = (index: number, itemColor?: string): string => {
    if (itemColor) return itemColor;
    if (index < barColors.length) return barColors[index];
    return colors.textTertiary;  // Items beyond top 5 → neutral gray
  };
```

Then update line 111 to use: `const barColor = getBarColor(index, item.color);`

5. Also update the legend behavior: when `showLegend` is true, the graduated colors should appear in the legend entries. No change needed — the existing legend code already picks up per-item colors.

VERIFICATION:
- Re-read BarChart.tsx to confirm the graduated colors are applied correctly
- Verify the `colors.barDarkest` through `colors.barLightest` tokens exist in theme.ts (they do — confirmed above)
- Check that the component still handles the case where items have a custom `color` prop (it should — the `item.color ||` guard remains)
- Grep for any other files that reference `barColors` to ensure no side effects

Commit with message: "BarChart: graduated blue scale for visual ranking hierarchy"
```

---

## Prompt 4: BroadcastOverlay Recording State Simplification

```
You are working on the AlgorithmLens mobile app. Your task is to simplify the BroadcastOverlay recording state to show only essential stats, reducing visual clutter.

SAFETY RULES:
- Only modify files in AlgorithmLens_Cowork/mobile/
- Do NOT change broadcast logic, session management, or any hooks
- Do NOT change the useBroadcast hook or broadcastSessionManager
- Only modify the visual rendering in BroadcastOverlay.tsx and optionally BroadcastPickerButton.tsx

CONTEXT — Current State:
The recording state of `BroadcastOverlay` is in `mobile/src/components/broadcast/BroadcastOverlay.tsx`, case 'RECORDING' (around line 175-274).

Currently it shows:
1. Recording dot + "Recording" label (row)
2. Stats row: frames count | elapsed time | storage used (3 stats with dividers)
3. Hint text: "Scroll your {platformName} feed normally..."
4. Threshold warning (if not met): "Keep recording — more frames and time needed..."
5. Button row: "Open {platformName}" + "Stop" button

The problem: 5 distinct information zones in a single card. The user is supposed to be looking at another app (Instagram, TikTok) — when they glance back, they need ONE number (elapsed time) and ONE action (stop). The stats row, storage, and threshold warning add cognitive load without aiding the primary task.

DESIGN REFERENCES:
- Opal's "focus session" overlay: just a timer + stop button
- iOS screen recording indicator: just a red dot and time
- Headspace meditation timer: time + stop

IMPLEMENTATION:

1. REDESIGN THE RECORDING STATE:
Replace the entire 'RECORDING' case content with this structure:

```
<View style={styles.contentSection}>
  {/* Minimal recording indicator */}
  <View style={{ alignItems: 'center', gap: SPACING.md }}>
    {/* Pulsing dot + time — the only thing the user needs */}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
      <Animated.View style={/* keep existing pulse animation */} />
      <Text style={{ ...TYPOGRAPHY.h2, color: colors.textMain }}>
        {elapsedTime}
      </Text>
    </View>

    {/* Single line of context */}
    <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textSecondary, textAlign: 'center' }}>
      {frameCount} frames captured from {platformName}
    </Text>

    {/* Threshold hint — only when NOT met, and in a subtle style */}
    {!thresholdsMet && (
      <Text style={{ ...TYPOGRAPHY.caption, color: colors.warning, textAlign: 'center' }}>
        Keep scrolling — need more data for accurate analysis
      </Text>
    )}
  </View>

  {/* Action buttons — stop is primary, open platform is secondary */}
  <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
    <TouchableOpacity
      onPress={() => { triggerImpactMedium(); onStop(); }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Stop recording broadcast"
      style={[styles.stopButton, { backgroundColor: colors.stopButtonBg, width: '100%' }]}
    >
      <StopCircle size={16} color={colors.errorBright} strokeWidth={2} />
      <Text style={[styles.stopButtonText, { color: colors.stopButtonText }]}>
        Stop Recording
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={onOpenPlatform}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open ${platformName}`}
      style={[styles.secondaryButton, { borderColor: colors.borderSlate200, width: '100%', minHeight: 44 }]}
    >
      <Text style={[styles.secondaryButtonText, { color: colors.primaryBlue }]}>
        Back to {platformName}
      </Text>
      <ArrowRight size={14} color={colors.primaryBlue} strokeWidth={2} />
    </TouchableOpacity>
  </View>
</View>
```

2. KEY CHANGES FROM CURRENT:
   - REMOVE: Storage used stat (users don't care about MB)
   - REMOVE: Separate "frames" and "elapsed" stat items with dividers
   - COMBINE: Elapsed time is now the hero element (TYPOGRAPHY.h2)
   - COMBINE: Frame count is a single supporting line
   - SIMPLIFY: Threshold warning shortened to one line
   - REORDER: Stop button is now full-width and primary (was side-by-side)
   - RENAME: "Open {platform}" → "Back to {platform}" (clearer intent)

3. KEEP UNCHANGED:
   - The pulsing animation logic for the recording dot (useEffect with Animated.loop)
   - All other status cases (INITIALIZING, AWAITING_BROADCAST_START, PROCESSING, COMPLETE, FAILED, CANCELLED)
   - All props and their types
   - The container styling
   - The `statDivider` style can be removed from StyleSheet.create since it's no longer used

4. ALSO SIMPLIFY THE COMPLETE STATE (around line 288-317):
   - Currently shows: CheckCircle icon + "Broadcast complete" title + summary text + "View Results" button
   - Change to: CheckCircle icon + "{frameCount} frames captured in {elapsedTime}" (single line, TYPOGRAPHY.h3) + "View Results" button
   - Remove the storage size mention from the summary
   - This reduces the COMPLETE card from 4 elements to 3

5. REMOVE NOW-UNUSED STYLES:
   - Remove `statsRow`, `statItem`, `statValue`, `statLabel`, `statDivider` from StyleSheet.create if they're no longer referenced by any status case
   - Keep `recordingRow`, `recordingDot`, `recordingLabel` only if still used

VERIFICATION:
- Re-read BroadcastOverlay.tsx and verify:
  - All imports are used (remove any now-unused icon imports like Clock, Layers)
  - No TypeScript errors
  - The pulsing animation still works (references pulseAnim correctly)
  - All buttons have minHeight: 44 and accessibilityRole
  - The `canSave` prop is still destructured and used for `thresholdsMet`
- Read `mobile/app/broadcast/[platform].tsx` to confirm BroadcastOverlay props haven't changed

Commit with message: "BroadcastOverlay: simplify recording state to timer + frame count + stop"
```

---

## Prompt 5: ICON_SIZES Token Scale & Migration

```
You are working on the AlgorithmLens mobile app. Your task is to create an ICON_SIZES design token scale in the theme and migrate all hardcoded icon/avatar dimensions to use these tokens.

SAFETY RULES:
- Only modify files in AlgorithmLens_Cowork/mobile/
- Do NOT change any analysis logic, API calls, or business logic
- This is a pure visual refactor — no behavioral changes

CONTEXT — Current Problem:
The codebase has 50+ hardcoded dimension values for icons and avatars scattered across components. Examples:
  - `width: 10, height: 10` (legend dots, recording dot)
  - `width: 24, height: 24` (small avatars, feed score indicators)
  - `width: 28, height: 28` (metric card icons)
  - `width: 36, height: 36` (back buttons, action circles)
  - `width: 40, height: 40` (broadcast picker icon, analysis progress icon, broadcast results icon)
  - `width: 44, height: 44` (achievement badges)
  - `width: 48, height: 48` (onboarding icons)
  - `width: 60, height: 60` (broadcast picker native view)
  - `width: 64, height: 64` (error boundary icon, achievement containers)
  - `width: 72, height: 72` (login app icon)
  - `width: 80, height: 80` (onboarding large icons)
  - `width: 100, height: 100, width: 120, height: 120` (onboarding hero icons)

The theme already has MIN_TOUCH_TARGET = 44 defined but unused.

IMPLEMENTATION:

### Step 1: Define the token scale in theme.ts

Open `mobile/src/lib/theme.ts` and add this block after the `MIN_TOUCH_TARGET` line (around line 705):

```typescript
// ─── Icon / Avatar Size Scale ────────────────────────────
// Named tokens for all icon container dimensions.
// Always use width + height + borderRadius: ICON_SIZES.xx / 2 for circles.
export const ICON_SIZES = {
  /** 10px — Legend dots, indicator dots */
  dot: 10,
  /** 16px — Inline text icons (lucide default) */
  inline: 16,
  /** 20px — Small inline icons */
  sm: 20,
  /** 24px — Small avatars, indicators, feed score */
  md: 24,
  /** 28px — Metric card icon containers */
  lg: 28,
  /** 36px — Back buttons, action circles */
  xl: 36,
  /** 40px — Broadcast/analysis status icons */
  '2xl': 40,
  /** 44px — Touch-target-sized badges (= MIN_TOUCH_TARGET) */
  touch: 44,
  /** 48px — Onboarding medium icons */
  '3xl': 48,
  /** 60px — Broadcast picker native view */
  '4xl': 60,
  /** 64px — Large icons, error boundary */
  '5xl': 64,
  /** 72px — Login app icon */
  '6xl': 72,
  /** 80px — Onboarding large icons */
  '7xl': 80,
  /** 100px — Onboarding hero medium */
  hero: 100,
  /** 120px — Onboarding hero large */
  heroLg: 120,
} as const;
```

Also add `ICON_SIZES` to any barrel exports if theme.ts has them.

### Step 2: Migrate files systematically

For each file, follow this exact process:
1. Read the file
2. Find all hardcoded `width: N, height: N` patterns where N matches a token
3. Replace with the appropriate ICON_SIZES token
4. Add `ICON_SIZES` to the import from theme.ts
5. Verify borderRadius values: if `borderRadius: N/2` (making a circle), replace with `borderRadius: ICON_SIZES.xx / 2`
6. Re-read the file to verify

FILES TO MIGRATE (in priority order):

**Priority 1 — Dashboard components (most visible):**
- `mobile/src/components/dashboard/MetricCard.tsx` — 28px icon containers → ICON_SIZES.lg
- `mobile/src/components/dashboard/BarChart.tsx` — 10px legend dots → ICON_SIZES.dot
- `mobile/src/components/dashboard/StackedBar100.tsx` — 8px, 10px, 12px legend shapes → ICON_SIZES.dot (approximate — keep custom sizes for diamond/triangle shapes, only change the circle and square)
- `mobile/src/components/dashboard/DashboardTour.tsx` — 36px action buttons → ICON_SIZES.xl
- `mobile/src/components/dashboard/ComparisonView.tsx` — 36px buttons → ICON_SIZES.xl

**Priority 2 — Home screen:**
- `mobile/src/components/home/FeedScoreCard.tsx` — 28px icons → ICON_SIZES.lg
- `mobile/src/components/home/FeedScoreTrend.tsx` — 24px icons → ICON_SIZES.md
- `mobile/src/components/home/SmartSuggestion.tsx` — 28px icons → ICON_SIZES.lg
- `mobile/src/components/home/WeeklySummaryCard.tsx` — 28px icons → ICON_SIZES.lg
- `mobile/src/components/home/AchievementBadges.tsx` — 64px containers → ICON_SIZES['5xl'], 44px badges → ICON_SIZES.touch
- `mobile/src/components/home/MilestoneModal.tsx` — sizes present, check and migrate

**Priority 3 — Analysis/Broadcast:**
- `mobile/src/components/analysis/AnalysisProgress.tsx` — 40px icon → ICON_SIZES['2xl']
- `mobile/src/components/analysis/BroadcastResultsSummary.tsx` — 40px icon → ICON_SIZES['2xl']
- `mobile/src/components/broadcast/BroadcastOverlay.tsx` — 10px dot → ICON_SIZES.dot
- `mobile/src/components/broadcast/BroadcastPickerButton.tsx` — 40px icon → ICON_SIZES['2xl']
- `mobile/src/components/broadcast/NativeBroadcastPicker.tsx` — 60px picker → ICON_SIZES['4xl']

**Priority 4 — App screens:**
- `mobile/app/(auth)/login.tsx` — 72px app icon → ICON_SIZES['6xl']
- `mobile/app/(auth)/onboarding.tsx` — 48px, 80px, 100px, 120px icons → respective tokens
- `mobile/src/components/ErrorBoundary.tsx` — 64px icon → ICON_SIZES['5xl']
- `mobile/app/(tabs)/dashboard.tsx` — 44px buttons, 10px legend dots → respective tokens; also add ICON_SIZES to the import

**Priority 5 — Scan/Other:**
- `mobile/app/broadcast/[platform].tsx` — 24px, 36px elements
- `mobile/app/scanner/[platform].tsx` — various

### Step 3: Replace MIN_TOUCH_TARGET = 44 usages

After defining ICON_SIZES, also grep for `minHeight: 44` across the codebase. DO NOT change these to ICON_SIZES — these are touch targets, not icon sizes. Instead, change them to reference the existing `MIN_TOUCH_TARGET` constant:
- Add `MIN_TOUCH_TARGET` to imports alongside SPACING, RADIUS, etc.
- Replace `minHeight: 44` with `minHeight: MIN_TOUCH_TARGET`
- This affects ~34 locations across the codebase

### Step 4: Verification

After all migrations:
1. Grep for remaining hardcoded `width: 10,` `width: 24,` `width: 28,` `width: 36,` `width: 40,` `width: 44,` `width: 48,` `width: 60,` `width: 64,` `width: 72,` patterns in .tsx files to find any missed instances
2. Verify all files that import from theme.ts still compile (re-read each modified file)
3. Confirm no functional changes — only dimension values should have changed, nothing behavioral

Commit with message: "Design system: add ICON_SIZES tokens and migrate all hardcoded icon dimensions"
```

---

## Usage Notes

- **Run order matters**: Prompt 1 restructures dashboard.tsx significantly, so run it first. Prompts 2-4 are independent of each other. Prompt 5 should run last since it touches many files.
- **Each prompt is self-contained**: You can paste any single prompt into a fresh session with codebase access and it will have everything it needs.
- **Verification is built in**: Every prompt includes explicit verification steps — the agent should catch its own mistakes.
- **No time constraints**: These prompts are designed for thoroughness over speed. The agent should read every file before and after modification.
