# AlgorithmLens Mobile App — Visual Upgrade Prompts

Run in 5 waves. Within each wave, all prompts can run **in parallel** (they touch different files). Wait for each wave to finish before starting the next.

---

# WAVE 1 — Theme Foundation (run both in parallel)

These only touch `theme.ts`. Must finish before everything else.

---

## WAVE 1A: Platform Colors

```
The theme file defines platform colors but Twitter and TikTok use `#000000` (pure black), which violates the design system. Fix this.

**theme.ts** (`AlgorithmLens_Cowork/mobile/src/lib/theme.ts`):

1. **PLATFORMS object** (lines ~737-745):
   - Line 739: `twitter: { name: 'X', color: '#000000', icon: 'twitter' }` → Change to `color: '#14171A'` (X's actual dark gray, not pure black)
   - Line 742: `tiktok: { name: 'TikTok', color: '#000000', icon: 'music-2' }` → Change to `color: '#161823'` (TikTok's actual near-black brand color)

2. **DARK_PLATFORMS object** (lines ~747-750):
   - Line 749: `tiktok: { name: 'TikTok', color: '#FFFFFF', icon: 'music-2' }` — keep this (white on dark is correct)

Rules:
- Never use `#000000` anywhere for brand colors
- Only change the color property, don't change name or icon
```

---

## WAVE 1B: Dark Mode Contrast

```
Dark mode in the AlgorithmLens mobile app looks washed out because borders are nearly invisible and cards don't have enough contrast against the background.

**theme.ts** (`AlgorithmLens_Cowork/mobile/src/lib/theme.ts`):

1. **Increase dark border visibility** (lines ~277-283):
   - `borderDefault`: Change from `'rgba(148, 163, 184, 0.18)'` to `'rgba(148, 163, 184, 0.25)'`
   - `borderLight`: Change from `'rgba(148, 163, 184, 0.12)'` to `'rgba(148, 163, 184, 0.18)'`
   - `borderSoft`: Change from `'rgba(148, 163, 184, 0.08)'` to `'rgba(148, 163, 184, 0.12)'`
   - `borderMedium`: Change from `'rgba(148, 163, 184, 0.18)'` to `'rgba(148, 163, 184, 0.28)'`

2. **Add card surface differentiation** (line ~273-274):
   - `bgCard`: Keep as `'#1E293B'`
   - `bgCardGradientEnd`: Change from `'#1E293B'` to `'#232F42'` — a very slightly lighter shade so the gradient is visible in dark mode too

3. **Improve dark separator** (line ~382):
   - `separator`: Change from `'rgba(148, 163, 184, 0.20)'` to `'rgba(148, 163, 184, 0.25)'`

4. **Improve dark divider** (line ~295):
   - `dividerColor`: Change from `'rgba(148, 163, 184, 0.15)'` to `'rgba(148, 163, 184, 0.20)'`

5. **Brand tint visibility** (lines ~286-288):
   - `brandTintBg`: Change from `'rgba(59, 130, 246, 0.06)'` to `'rgba(59, 130, 246, 0.10)'`
   - `brandTintBorder`: Change from `'rgba(59, 130, 246, 0.20)'` to `'rgba(59, 130, 246, 0.28)'`
   - `accentTintBg`: Change from `'rgba(52, 211, 153, 0.06)'` to `'rgba(52, 211, 153, 0.10)'`

Rules:
- ONLY change values in the DARK_COLORS object, never touch LIGHT_COLORS
- These are subtle increases (2-10% opacity bumps) — don't overdo it
- Verify that text contrast ratios noted in the comments (lines ~209-214) remain valid after changes
- Don't change any shadow values (DARK_SHADOWS is separate)
```

---

# WAVE 2 — Core Visual Upgrades (run all 5 in parallel)

These touch different files with no overlap. Wait for Wave 1 to finish first.

---

## WAVE 2A: Card Surfaces

```
I need you to upgrade the visual quality of card surfaces across the AlgorithmLens mobile app (React Native/Expo). The theme file at `AlgorithmLens_Cowork/mobile/src/lib/theme.ts` defines rich tokens that components barely use. Fix this.

**FeedScoreCard.tsx** (`mobile/src/components/home/FeedScoreCard.tsx`):
- Import `LinearGradient` from `expo-linear-gradient` (see MetricCard.tsx for the pattern — it has a `GradientWrapper` that handles web fallback; reuse that exact pattern)
- Replace the flat `backgroundColor: colors.bgCard` container (appears 3 times: loading state ~line 70, empty state ~line 117, score state ~line 172) with a `GradientWrapper` using `colors={[colors.bgCard, colors.bgCardGradientEnd]}` — same as MetricCard already does
- Change `borderColor: colors.borderSoft` to `borderColor: colors.brandTintBorder` on the score state (line 176) to match MetricCard's brand-tinted border
- Change `...shadows.card` to `...shadows.lg` on the score state to elevate this important card above others

**StreakBadge.tsx** (`mobile/src/components/home/StreakBadge.tsx`):
- Same gradient wrapper upgrade: replace `backgroundColor: colors.bgCard` with `GradientWrapper` using `[colors.bgCard, colors.bgCardGradientEnd]` on all three states (NEW ~line 85, PAUSED ~line 137, ACTIVE ~line 228)
- On the ACTIVE state, upgrade `...shadows.card` to `...shadows.lg`
- On the ACTIVE state, change `borderColor` for the non-at-risk, non-grace case from `colors.borderSoft` to `colors.brandTintBorder`

**DailyTipCard.tsx** (`mobile/src/components/home/DailyTipCard.tsx`):
- Read this file. Apply the same gradient wrapper pattern if it uses flat `backgroundColor: colors.bgCard`
- Ensure it uses `shadows.card` (not `shadows.soft` or `shadows.sm`)

**RecentScanCard.tsx** (`mobile/src/components/home/RecentScanCard.tsx`):
- Read this file. Apply gradient wrapper if it uses flat background
- This is a secondary card, so keep `shadows.card` (don't elevate)

**Card.tsx** (`mobile/src/components/ui/Card.tsx`):
- Currently uses flat `backgroundColor: colors.bgCard` (line 68)
- Add the `GradientWrapper` pattern (copy from MetricCard.tsx) and wrap the card content in it
- Change `borderColor: colors.borderLight` (line 71) to `colors.borderDefault` for more visible borders
- The `elevated` variant should use `shadows.xl` instead of `shadows.lg` (line 58)

Rules:
- Import the GradientWrapper pattern exactly as MetricCard.tsx defines it (handles web vs native)
- Don't change any functionality, props, or accessibility labels
- Keep all existing spacing tokens (SPACING, RADIUS) unchanged
- Preserve React.memo wrappers
```

---

## WAVE 2B: Spacing & Breathing Room

```
The CalmHomeScreen needs better vertical rhythm. Cards are evenly spaced with `SPACING.xl` (20px) gaps, creating a monotone vertical rhythm. Key sections need more separation.

**CalmHomeScreen.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/CalmHomeScreen.tsx`):

1. **Top padding** (line ~221): Change `paddingTop: SPACING.lg` (16px) to `paddingTop: SPACING['2xl']` (24px) for more breathing room after the status bar/safe area.

2. **Greeting spacing** (line ~234): Change `marginBottom: SPACING['2xl']` (24px) to `marginBottom: SPACING['3xl']` (32px). The greeting is the anchor of the page and needs more separation from the first card.

3. **Section grouping** — Create visual groups by varying the gap sizes. Currently every card section uses `marginBottom: SPACING.xl` (20px). Change to:
   - Streak badge (line ~258): `marginBottom: SPACING.lg` (16px) — tighter, closely related to feed score
   - Feed score (line ~269): `marginBottom: SPACING.lg` (16px) — tighter, related to trend
   - Feed score trend (line ~275): `marginBottom: SPACING['2xl']` (24px) — end of "status" group
   - CTA button (line ~301): `marginBottom: SPACING['3xl']` (32px) — keep, it's the main divider
   - Weekly summary (line ~322): `marginBottom: SPACING['2xl']` (24px) — moderate
   - Achievement badges (line ~329): `marginBottom: SPACING['2xl']` (24px) — moderate
   - Smart suggestion (line ~339): `marginBottom: SPACING.xl` (20px) — keep
   - Recent scan (line ~349): `marginBottom: SPACING.xl` (20px) — keep
   - Daily tip (line ~358): `marginBottom: SPACING['3xl']` (32px) — more bottom padding

4. **Bottom padding** (line ~222): Change `paddingBottom: SPACING['5xl']` (48px) to `paddingBottom: SPACING['6xl']` (64px) for comfortable bottom scrolling with the tab bar.

Rules:
- Only change spacing values, nothing else
- Use exact SPACING tokens from theme.ts, never hardcode pixel values
```

---

## WAVE 2C: Icon Containers

```
Icons in the AlgorithmLens mobile app feel small and lack contextual color. The theme defines `ICON_SIZES` tokens (dot=10, md=24, lg=28, xl=36) but icons are often hardcoded at 14px in 28px containers, leaving too much empty space. Fix proportions and add semantic color.

**FeedScoreCard.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/FeedScoreCard.tsx`):
- Lines ~81, ~129, ~184: Icon containers use `width: ICON_SIZES.lg` (28px) with `BarChart3 size={14}`. Increase icon to `size={16}` and add `strokeWidth={1.8}` for better visual weight
- The icon background is always `colors.blue50`. This is correct for FeedScore (informational). Keep it.

**StreakBadge.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/StreakBadge.tsx`):
- Lines ~96, ~147: NEW and PAUSED states use hardcoded `width: 32, height: 32` for icon container. Replace with `width: ICON_SIZES.xl` (36px) and `height: ICON_SIZES.xl` to make the streak icon more prominent
- Line ~105: Flame icon in NEW state is `size={18}`. Increase to `size={20}` to fill the now-larger container
- Line ~156: Pause icon is `size={14}`. Increase to `size={16}`
- Lines ~96, ~147: Background color is `colors.blue50` for both. Change:
  - NEW state: use `colors.streakOrangeBg` instead (orange tint matches streak theme)
  - PAUSED state: keep `colors.blue50` (neutral is correct for paused)

**DailyTipCard.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/DailyTipCard.tsx`):
- Read this file. Find the icon container. If it uses a Lightbulb or similar icon:
  - Ensure container uses `ICON_SIZES.lg` token (not hardcoded)
  - Use `colors.green50` background with `colors.accentGreen` icon color (tips = positive/growth)
  - Icon should be at least `size={16}`

**SmartSuggestion.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/SmartSuggestion.tsx`):
- Read this file. Apply same icon sizing principles. Use context-appropriate background colors:
  - If suggestion is about scanning: `colors.blue50` bg + `colors.primaryBlue` icon
  - If suggestion is a warning: `colors.lowSampleBg` bg + `colors.warning` icon

**MetricCard.tsx** (`AlgorithmLens_Cowork/mobile/src/components/dashboard/MetricCard.tsx`):
- Line ~78: Icon container uses `ICON_SIZES.lg` (28px) with `RADIUS.sm` corner radius. Change to `RADIUS.md` (10px) for slightly rounder icon containers that match the card's `RADIUS.lg`

Rules:
- Always use ICON_SIZES tokens, never hardcode pixel values for icon containers
- Icon size should be roughly 55-60% of container size (e.g., 16px icon in 28px container)
- Use `strokeWidth={1.8}` for icons in containers ≤28px, `strokeWidth={2}` for larger
- Preserve all accessibility labels
```

---

## WAVE 2D: Bar Chart

```
The BarChart component in the AlgorithmLens mobile app needs visual polish. It works functionally but looks basic compared to the website's charts.

**BarChart.tsx** (`AlgorithmLens_Cowork/mobile/src/components/dashboard/BarChart.tsx`):

1. **Add background track** (line ~161-168): Each bar currently floats on nothing. Add a track behind it:
   ```tsx
   {/* Bar with background track */}
   <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
     <View style={{
       flex: 1,
       height: 28,
       backgroundColor: colors.stackedBarTrack,
       borderRadius: RADIUS.xs,
       overflow: 'hidden',
     }}>
       <Animated.View
         style={{
           width: widthAnim,
           height: 28,
           backgroundColor: barColor,
           borderRadius: RADIUS.xs,
         }}
       />
     </View>
     <Text style={{
       ...TYPOGRAPHY.label,
       color: colors.textSecondary,
       minWidth: 36,
       textAlign: 'right',
     }}>
       {itemPercentageOfTotal}%
     </Text>
   </View>
   ```
   Note: `height` increased from `24` to `28`, track uses `colors.stackedBarTrack` (already defined in theme but never used), percentage shows percentage of total (not normalized).

2. **Better label spacing** (line ~98): Increase the gap between bars from `SPACING.lg` (16px) to `SPACING.xl` (20px) for more breathing room.

3. **Value display improvement** (lines ~149-157): Add the percentage inline with the count:
   ```tsx
   <Text style={{
     ...TYPOGRAPHY.bodySmall,
     color: colors.textSecondary,
     marginLeft: SPACING.sm,
   }}>
     {item.value} ({itemPercentageOfTotal}%)
   </Text>
   ```

4. **Legend dots** (lines ~206-212): Keep size but add a subtle border:
   ```tsx
   <View style={{
     width: ICON_SIZES.dot,
     height: ICON_SIZES.dot,
     borderRadius: ICON_SIZES.dot / 2,
     backgroundColor: entry.color,
     borderWidth: 1,
     borderColor: colors.borderSubtle,
   }} />
   ```

Rules:
- Use `colors.stackedBarTrack` for the background track (already defined in theme.ts line 148 light / line 329 dark)
- Preserve all animation logic (staggered Animated.timing)
- Keep all accessibility labels and roles
- Don't change the color gradient system (barDarkest → barLightest)
```

---

## WAVE 2E: Achievement Badges

```
Achievement badges should feel rewarding. Read and upgrade the visual treatment.

**AchievementBadges.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/AchievementBadges.tsx`):
- Read this entire file first.

Apply these upgrades:

1. **Earned badge styling**: Earned badges should feel "alive":
   - Background: Use a tinted color based on badge type instead of generic gray
   - Border: `borderColor: colors.brandTintBorder` (or a badge-type-specific color at 20% opacity)
   - Shadow: `shadows.md` on earned badges (currently probably `shadows.sm` or none)

2. **Unearned/locked badge styling**: Should feel clearly locked:
   - Background: `colors.bgSecondary` (light gray)
   - Opacity: 0.5 on the entire badge
   - No shadow
   - Icon color: `colors.textTertiary`

3. **Newly earned animation**: The `newlyEarnedId` prop suggests animation support. Ensure the newly earned badge has:
   - A brief scale-up animation (1.0 → 1.1 → 1.0 over 400ms)
   - A subtle glow using `shadows.hero` (blue-tinted shadow)
   - The animation should only play once

4. **Badge container**: If badges are in a horizontal scroll or grid:
   - Use `SPACING.md` (12px) gap between badges
   - Ensure `showsHorizontalScrollIndicator={false}` if horizontal
   - Add slight horizontal padding so edge badges aren't flush with screen edge

Rules:
- Use `colors.tourAccents` colors (tourOverview=blue, tourSources=indigo, tourAds=amber, tourPolitics=purple, tourTone=teal, tourSuggested=rose) to tint badges by category if applicable
- Keep accessibility labels describing what each badge is for
- Respect reduced motion for the newly-earned animation
```

---

# WAVE 3 — Typography & Color (run all 3 in parallel)

Wait for Wave 2 to finish. These touch some of the same files as Wave 2.

---

## WAVE 3A: Typography Hierarchy

```
The AlgorithmLens mobile app defines rich typography tokens in `AlgorithmLens_Cowork/mobile/src/lib/theme.ts` (TYPOGRAPHY.display, TYPOGRAPHY.heroTitle, TYPOGRAPHY.bigNumber, TYPOGRAPHY.scoreLarge) but components underuse them. Fix the hierarchy so key numbers pop.

**CalmHomeScreen.tsx** (`mobile/src/components/home/CalmHomeScreen.tsx`):
- Line ~237: The greeting currently uses `TYPOGRAPHY.h1`. Change to `TYPOGRAPHY.heroTitle` — this is the main screen headline and should be larger (26pt vs 24pt) with tighter tracking (-0.52)

**FeedScoreCard.tsx** (`mobile/src/components/home/FeedScoreCard.tsx`):
- Line ~206: The "X scans this week" text uses just `fontSize: TYPOGRAPHY.captionSmall.fontSize`. Change to spread the full token: `...TYPOGRAPHY.captionSmall` so it gets lineHeight and letterSpacing too

**StreakBadge.tsx** (`mobile/src/components/home/StreakBadge.tsx`):
- Line ~256: The streak count uses `TYPOGRAPHY.scoreSmall` (20pt). For streaks of 7+ days, use `TYPOGRAPHY.scoreLarge` (32pt) to make long streaks feel more impressive. Add a conditional:
  ```tsx
  const countTypography = streakData.current_streak >= 7 ? TYPOGRAPHY.scoreLarge : TYPOGRAPHY.scoreSmall;
  ```
  Apply this as the style for the streak count Text element.

**MetricCard.tsx** (`mobile/src/components/dashboard/MetricCard.tsx`):
- Line ~92: The value uses `TYPOGRAPHY.h2` (18pt). This is the primary metric value and should use `TYPOGRAPHY.bigNumber` (32pt) when the value is a short number (1-4 characters). Add logic:
  ```tsx
  const valueTypography = value && value.length <= 4 ? TYPOGRAPHY.bigNumber : TYPOGRAPHY.h2;
  ```

**WeeklySummaryCard.tsx** (`mobile/src/components/home/WeeklySummaryCard.tsx`):
- Read this file. Find the primary metric display. If it uses `TYPOGRAPHY.h2` or smaller for the main number, upgrade to `TYPOGRAPHY.bigNumber` or `TYPOGRAPHY.scoreLarge`.

Rules:
- Use the exact token names from theme.ts — don't hardcode any font sizes
- Preserve all existing accessibility labels and roles
- Don't change colors, just typography tokens
```

---

## WAVE 3B: Semantic Status Colors

```
The mobile app uses generic text colors for everything. Numbers that represent positive or negative trends should use semantic status colors. The theme defines `colors.success`, `colors.warning`, `colors.error` — use them.

**FeedScoreCard.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/FeedScoreCard.tsx`):
- Lines ~161-164: The `getScoreColor` function only distinguishes ≥50 (blue) vs <50 (muted). Make it richer:
  ```tsx
  const getScoreColor = (score: number): string => {
    if (score >= 70) return colors.success;
    if (score >= 50) return colors.primaryBlue;
    if (score >= 30) return colors.warning;
    return colors.textMuted;
  };
  ```

**FeedScoreTrend.tsx** (`mobile/src/components/home/FeedScoreTrend.tsx`):
- Read this file. Find where `direction` prop ('up', 'down', 'stable') is used to display trend info.
- If direction colors aren't already semantic, add:
  - 'up' → `colors.success` (green)
  - 'down' → `colors.error` (red/coral)
  - 'stable' → `colors.textSecondary` (neutral)
- Also add trend arrows: `TrendingUp`, `TrendingDown`, `Minus` from lucide-react-native.

**WeeklySummaryCard.tsx** (`mobile/src/components/home/WeeklySummaryCard.tsx`):
- Read this file. If comparisons to previous week exist (e.g., "up 15%"), color them:
  - Positive → `colors.success`, Negative → `colors.error`, No change → `colors.textSecondary`
- Add corresponding trend icon next to the change value, sized at 12-14px.

**MetricCard.tsx** (`mobile/src/components/dashboard/MetricCard.tsx`):
- Line ~127: The `contextLine` uses `colors.primary`. Add an optional `contextLineColor?: string` prop to MetricCardProps and use it:
  ```tsx
  color: contextLineColor || colors.primary,
  ```

Rules:
- Use exact semantic color tokens: colors.success, colors.warning, colors.error
- Never hardcode hex values
- Trend icons should be 12-14px with strokeWidth={2}
```

---

## WAVE 3C: Loading & Empty States

```
The AlgorithmLens mobile app shows plain "Loading..." text and bare text empty states. Replace with polished skeleton screens and illustrated empty states. The app already has a `Skeleton.tsx` component at `mobile/src/components/ui/Skeleton.tsx`.

**First, read `mobile/src/components/ui/Skeleton.tsx`** to understand its API.

**FeedScoreCard.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/FeedScoreCard.tsx`):

1. Loading state (lines ~66-109): Replace "Loading..." text with skeleton placeholders:
   ```tsx
   if (feedScore === undefined) {
     return (
       <View style={{
         backgroundColor: colors.bgCard,
         borderRadius: RADIUS.lg,
         padding: SPACING.lg,
         borderWidth: 1,
         borderColor: colors.borderSoft,
         ...shadows.card,
       }}>
         <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
           <View style={{ width: ICON_SIZES.lg, height: ICON_SIZES.lg, borderRadius: RADIUS.lg, backgroundColor: colors.blue50 }} />
           <View style={{ width: 80, height: 14, borderRadius: RADIUS.xs, backgroundColor: colors.bgSecondary }} />
         </View>
         <View style={{ width: 64, height: 32, borderRadius: RADIUS.sm, backgroundColor: colors.bgSecondary, marginBottom: SPACING.sm }} />
         <View style={{ width: 120, height: 12, borderRadius: RADIUS.xs, backgroundColor: colors.bgSecondary }} />
       </View>
     );
   }
   ```
   If Skeleton component supports animation (pulse/shimmer), use `<Skeleton>` instead of plain Views.

2. Empty state (lines ~112-157): Replace bare text with tinted background:
   ```tsx
   <View style={{
     backgroundColor: colors.brandTintBg,
     borderRadius: RADIUS.md,
     padding: SPACING.md,
   }}>
     <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textSecondary }}>
       Complete 2 scans to see your Feed Score.
     </Text>
   </View>
   ```

**WeeklySummaryCard.tsx** (`mobile/src/components/home/WeeklySummaryCard.tsx`):
- Read this file. If it has a loading or empty state with plain text, apply the same skeleton/tinted-bg pattern.

Rules:
- Use existing Skeleton.tsx if it supports width/height/borderRadius props
- Empty states should use `colors.brandTintBg` or `colors.accentTintBg` as subtle background tints
- Keep all accessibility roles and labels
```

---

# WAVE 4 — Interactions & Polish (run all 4 in parallel)

Wait for Wave 3 to finish. These touch different files from each other.

---

## WAVE 4A: CTA Button

```
The primary CTA button on CalmHomeScreen ("Choose a Platform to Scan") needs to feel premium. Currently it's a flat colored rectangle. Add gradient background, improve press animation, and enhance shadow.

**CalmHomeScreen.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/CalmHomeScreen.tsx`):

The CTA is at lines ~285-318. Replace `TouchableOpacity` with `Pressable` + `Animated.View` for scale + `LinearGradient` for gradient.

1. Add a `useRef` for scale animation:
   ```tsx
   const ctaScale = useRef(new Animated.Value(1)).current;
   ```

2. Add press handlers:
   ```tsx
   const handleCtaPressIn = useCallback(() => {
     Animated.timing(ctaScale, { toValue: 0.97, duration: 80, useNativeDriver: true }).start();
   }, [ctaScale]);
   const handleCtaPressOut = useCallback(() => {
     Animated.timing(ctaScale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
   }, [ctaScale]);
   ```

3. Replace the TouchableOpacity CTA with:
   ```tsx
   <Animated.View style={{ transform: [{ scale: ctaScale }], marginBottom: SPACING['3xl'] }}>
     <Pressable onPress={handleCtaPress} onPressIn={handleCtaPressIn} onPressOut={handleCtaPressOut}
       accessibilityRole="button" accessibilityLabel="Scan your feed"
       accessibilityHint="Opens platform selection to start a new scan"
       hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
       <LinearGradient
         colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
         start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
         style={{
           borderRadius: RADIUS.lg, paddingVertical: SPACING.xl, paddingHorizontal: SPACING['2xl'],
           alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
           gap: SPACING.md, minHeight: 60, ...shadows.hero,
         }}>
         <Scan size={26} color={colors.textInverse} strokeWidth={2} />
         <Text style={{ ...TYPOGRAPHY.buttonLg, color: colors.textInverse, fontSize: TYPOGRAPHY.h2.fontSize }}>
           Choose a Platform to Scan
         </Text>
       </LinearGradient>
     </Pressable>
   </Animated.View>
   ```

**Button.tsx** (`mobile/src/components/ui/Button.tsx`):
- The `primary` variant (line ~141) uses flat `backgroundColor: colors.primary`
- For `primary` only, wrap content in `LinearGradient` with `[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]` instead of the flat background

Rules:
- Keep haptic feedback (`triggerImpactMedium()`)
- Preserve all accessibility props
- Scale animation: 0.97 on press (subtle, not bouncy)
```

---

## WAVE 4B: Entrance Animations

```
Add staggered entrance animations to the home screen cards.

**First, read `mobile/src/components/ui/StaggeredList.tsx` and `mobile/src/components/ui/ContentFadeIn.tsx`** to check if reusable animation wrappers exist.

**CalmHomeScreen.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/CalmHomeScreen.tsx`):

If `ContentFadeIn` exists and accepts `delay` prop, wrap each card section with staggered delays (0, 50, 100, 150ms...).

If it doesn't exist, create a simple `FadeInView` wrapper:
```tsx
const FadeInView = ({ delay = 0, children }: { delay?: number; children: React.ReactNode }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
};
```

Wrap: StreakBadge (delay=0), FeedScore (50), Trend (100), CTA (150), WeeklySummary (200), etc.

Rules:
- Don't animate the greeting (it should appear instantly)
- Respect reduced motion — skip animations when AccessibilityInfo reports it
- Use `useNativeDriver: true` for all transform/opacity animations
```

---

## WAVE 4C: Bottom Sheet & Modal Depth

```
Bottom sheets and modals need more visual depth.

**PlatformBottomSheet.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/PlatformBottomSheet.tsx`):
- Read this file first.
- Overlay: use `backgroundColor: colors.overlayDimBg`
- Sheet container:
  - `borderTopLeftRadius: RADIUS['2xl']` (28px)
  - `borderTopRightRadius: RADIUS['2xl']`
  - `...shadows.xl`
  - Add `borderTopWidth: 1, borderTopColor: colors.borderDefault` if missing
- Drag handle: `width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderSlate300, alignSelf: 'center', marginTop: SPACING.sm, marginBottom: SPACING.md`

**MilestoneModal.tsx** (`mobile/src/components/home/MilestoneModal.tsx`):
- Read this file. Apply:
  - `shadows.hero` (blue-tinted, celebration feel)
  - Corner radius `RADIUS['2xl']` (28px)
  - Backdrop `colors.overlayDimBg`

Rules:
- Use theme tokens for all values
- Don't add third-party blur libraries
- Preserve gesture handling and accessibility props
```

---

## WAVE 4D: Sparkline Polish

```
The FeedScoreTrend sparkline component could better convey data at a glance.

**FeedScoreTrend.tsx** (`AlgorithmLens_Cowork/mobile/src/components/home/FeedScoreTrend.tsx`):
- Read this entire file first.

1. **Trend direction indicator**: Add colored icon next to trend value:
   - Import `TrendingUp`, `TrendingDown`, `Minus` from lucide-react-native
   - Up: `<TrendingUp size={14} color={colors.success} />`
   - Down: `<TrendingDown size={14} color={colors.error} />`
   - Stable: `<Minus size={14} color={colors.textSecondary} />`

2. **Card surface**: Upgrade to gradient wrapper pattern:
   - `GradientWrapper colors={[colors.bgCard, colors.bgCardGradientEnd]}`
   - `borderColor: colors.brandTintBorder`, `...shadows.card`

3. **Sparkline area fill**: Add subtle gradient fill below the line (15% opacity of `colors.primary` at top → transparent at bottom)

4. **Current value emphasis**: Add a filled circle at the last data point:
   - `width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary`
   - Behind it: larger circle with `colors.primary` at 20% opacity for glow

Rules:
- Preserve all existing data logic and animations
- Use theme color tokens only
- Stay within the existing rendering paradigm (SVG or Views)
```

---

# WAVE 5 — Verification (run alone, after everything)

---

## WAVE 5: Final Verification

```
Run a final verification across the AlgorithmLens mobile app to confirm all visual upgrades are consistent. Do NOT make changes — only report issues.

Check each of these:

1. **No hardcoded colors**: Search all files in `mobile/src/components/` for hex color literals (#XXXXXX) that aren't in theme.ts imports. Every color should come from `useTheme()`.

2. **No hardcoded font sizes**: Search for `fontSize:` followed by a number (not `TYPOGRAPHY.` or `RFValue`). Every font size should use a TYPOGRAPHY token.

3. **No hardcoded spacing**: Search for `margin`, `padding`, `gap` followed by bare numbers that don't reference SPACING tokens. Small values (1-2) are acceptable.

4. **Shadow consistency**: Verify primary/hero cards use `shadows.lg` or `shadows.hero`, standard cards use `shadows.card`, secondary elements use `shadows.soft` or `shadows.md`.

5. **Gradient usage**: Verify FeedScoreCard, StreakBadge, MetricCard, and Card.tsx all use `GradientWrapper` with `[colors.bgCard, colors.bgCardGradientEnd]`.

6. **Icon proportions**: Verify icon sizes are 55-60% of container sizes.

7. **Dark mode borders**: Verify `borderSoft` at 0.12 opacity is visible against `bgCard` (#1E293B).

8. **Accessibility preserved**: Verify no `accessibilityLabel`, `accessibilityRole`, `accessibilityHint`, or `accessible` props were removed.

Report: List each check as PASS, FAIL (with specific files/lines), or NEEDS_REVIEW.
```
