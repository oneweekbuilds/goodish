# AlgorithmLens Mobile — Visual Upgrade Prompts (V2 — Audited)

## Audit Summary — What Changed From V1

### Cross-cutting issues fixed in all prompts:
1. **No "read before write" instruction** — V1 never told the agent to read files before editing. This is the #1 cause of failed edits. V2 adds explicit "Read → Plan → Edit → Re-read" loops.
2. **Line number references are fragile** — V1 said "around line 79" etc. After Prompt 1 runs, every line number shifts. V2 uses grep patterns and component names instead.
3. **No web compatibility awareness** — The codebase uses `Platform.OS === 'web'` conditionals throughout (InsightHero, MetricCard, SectionHeader, DashboardTour all have them). V1's Prompt 1 introduced LayoutAnimation which crashes on web. V2 replaces LayoutAnimation with Animated API that already works across platforms.
4. **Missing CLAUDE.md reference** — The project has a CLAUDE.md with epistemic restraint rules. V2 tells the agent to read it first.
5. **No rollback strategy** — V2 adds "commit before starting, so you can `git diff` to verify" to each prompt.
6. **Prompts prescribe exact code without escape hatches** — If the agent finds the code doesn't match (e.g., after another prompt already ran), V1 would fail. V2 uses descriptive intent + verification rather than rigid copy-paste.

### Prompt 1 specific fixes:
- **LayoutAnimation removed** — Not used anywhere in the codebase, known to crash on web. Replaced with the existing Animated.timing pattern already used for tab switches.
- **Forgot DashboardTour** — V1 didn't mention the DashboardTour component that overlays tooltips on dashboard sections. Changing structure could break tour anchoring.
- **Missing `memo()` wrapper** — OverviewContent is wrapped in `memo()`. V2 preserves this.
- **Missing props** — V1 didn't mention `isPlus`, `onUpgrade`, `colors`, `shadows` props that must pass through to LockedOverlayCard and styled elements.
- **Edge case: all zeros** — V1's "most interesting stat" logic didn't handle when totalPosts=0, adPct=0, suggestedPct=0, top5Pct=0. V2 adds a fallback.
- **dashboard.tsx is 2070+ lines** — V1 treated it casually. V2 explicitly warns the agent about file size and recommends targeted edits rather than full rewrites.

### Prompt 2 specific fixes:
- **WCAG AA contrast claim was wrong** — V1 said '#34A874' passes AA with white at 3.9:1 and "bolster with fontWeight 600." 3.9:1 does NOT pass AA for normal text (needs 4.5:1). AA Large (3:1) applies to 18px+ bold, which the StackedBar100 label IS (14px bold via TYPOGRAPHY.labelBold = ~14px, which is below the 18px threshold). V2 chooses colors that actually pass 4.5:1 AA for normal text.
- **Ideology colors have the same problem** — V1 only fixed tone colors. The ideology colors (ideologyLeft: '#6B8FC4', ideologyCenter: '#94A3B8', ideologyRight: '#C4A088') are similarly low-contrast. V2 includes them.
- **No visual verification** — V2 adds "take a screenshot" step where possible, or at minimum, compute contrast ratios programmatically.

### Prompt 3 specific fixes:
- **Sources tab also sets bar colors inline** — V1 only addressed BarChart.tsx's internal barColors array. But dashboard.tsx line 526 passes `color:` directly to BarChart items on the Sources tab: `color: i === 0 ? colors.barDarkest : i < 3 ? colors.primaryBlue : colors.blue200`. V2 addresses both the component default AND the inline overrides.
- **`getBarColor` return type** — The function returns `string` but `barColors[index]` could technically be `undefined` if the array were shorter than expected. V2 adds proper typing.

### Prompt 4 specific fixes:
- **StyleSheet.create styles reference `colors` at module level** — V1's example used `styles.stopButton` which references a StyleSheet.create block, but the stopButton style uses `minHeight: 48` which might not match the intended design. V2 verifies existing styles before reusing them.
- **`storageUsed` prop still needed in interface** — Even though we stop displaying storage, the prop is still passed from `[platform].tsx`. V1 didn't clarify this. V2 explicitly says: keep the prop in the interface, just don't render it.
- **Missed: PROCESSING state also mentions frameCount/elapsedTime** — V1 only simplified RECORDING and COMPLETE. V2 includes PROCESSING.

### Prompt 5 specific fixes:
- **Scope is too large for one session** — 25+ files is very likely to exhaust context. V2 splits into 2 sub-prompts: (A) define tokens + migrate priority 1-2 files, (B) migrate priority 3-5 files + MIN_TOUCH_TARGET.
- **StackedBar100 has non-standard sizes (8px, 12px)** — These are geometric shapes (diamonds, triangles) whose dimensions are structural, not icon sizes. V2 excludes them from migration.
- **Chart bar heights (24px, 36px) are NOT icon sizes** — V1's audit agent flagged `height: 24` in BarChart and `height: 36` in StackedBar100 as candidates. These are chart component dimensions, not icons. V2 explicitly excludes chart heights.
- **`borderRadius: 22` patterns** — Some components have `borderRadius: 22` for 44px circles. V2 ensures these become `borderRadius: ICON_SIZES.touch / 2`.

---

## Parallelism

Prompts 2, 3, and 4 can run in parallel — they touch completely separate files:
- Prompt 2: `theme.ts` only (color values)
- Prompt 3: `BarChart.tsx` + `dashboard.tsx` (one section)
- Prompt 4: `BroadcastOverlay.tsx` only

Run order: **1 → (2 + 3 + 4 in parallel) → 5A → 5B**

---

## Prompt 1: Dashboard Overview — Collapsible Sections & Visual Hierarchy

```
You are working on the AlgorithmLens mobile app (React Native / Expo). Your task is to redesign the Dashboard Overview tab to reduce information overload and create clear visual hierarchy — moving it from 6.8/10 to 8.0+.

BEFORE YOU START:
1. Read `mobile/CLAUDE.md` for project rules (especially epistemic restraint standards)
2. Read `mobile/src/lib/theme.ts` to internalize the full token system
3. Read `mobile/app/(tabs)/dashboard.tsx` — this is a 2070+ line file. Read ALL of it to understand the full structure before making any changes. Pay special attention to:
   - The `OverviewContent` component (search for `const OverviewContent = memo(`)
   - Its props: `data: DashboardData, isPlus: boolean, onUpgrade, colors, shadows`
   - The `DashboardTour` component usage at the bottom of the file (search for `DashboardTour`) — this overlays tooltips on dashboard sections. Your redesign must not break its anchoring.
   - The existing `showMore` state toggle pattern
4. Run `git status` to confirm clean working tree, then `git stash` if needed

SAFETY RULES:
- Only modify files in `AlgorithmLens_Cowork/mobile/`
- Do NOT change `computeDashboardData.ts`, hooks, or API logic
- The `OverviewContent` component is wrapped in `memo()` — preserve this
- This file uses `Platform.OS === 'web'` checks in several components. Do NOT introduce LayoutAnimation (it's not used anywhere in this codebase and crashes on web). Use the existing `Animated.timing` pattern instead.

DESIGN SYSTEM (memorize these — do NOT use any values outside this system):
- TYPOGRAPHY: display(32), h1(24), heroTitle(26), h2(18), h3(16), body(15), bodySmall(14), caption(12), captionSmall(11), label(14), labelBold(14/600), overline(11/600/uppercase)
- SPACING: xxs(2), xs(4), sm(8), md(12), lg(16), xl(20), '2xl'(24), '3xl'(32)
- RADIUS: xs(4), sm(6), md(10), lg(16), xl(20), full(9999)
- Colors via `colors.*` from useTheme() — NEVER hardcode hex values
- Shadows via `shadows.*` (sm, soft, md, card, lg, xl, hero)
- All font sizes via RFValue() — NEVER hardcode pixel font sizes

TASK — Redesign OverviewContent:

1. HERO ZONE (always visible):
   - Keep InsightHero exactly as-is
   - Below it, show ONE primary stat inside a Card with `shadows.card`:
     - Priority logic (first match wins):
       a. suggestedPct > 60 → BigNumber value={data.suggestedPct} label="of your feed is from accounts you don't follow"
       b. adPct > 15 → BigNumber value={data.adPct} label="of your feed is sponsored content"
       c. top5Pct > 70 → BigNumber value={data.top5Pct} label="of your feed from just 5 accounts"
       d. totalPosts > 0 → BigNumber value={data.totalPosts} label="posts scanned" suffix=""
       e. FALLBACK (totalPosts=0) → show nothing (the InsightHero already handles the empty state)
     - Card wrapper: bgCard, borderRadius RADIUS.lg, padding SPACING.xl, border 1px borderSoft, shadows.card
     - Below BigNumber inside the card: one italic caption (TYPOGRAPHY.captionSmall, textSecondary) contextualizing the stat

2. SUPPORTING METRICS (always visible, visually subordinate):
   - Thin divider: `{ height: 1, backgroundColor: colors.borderSoft, marginVertical: SPACING.lg }`
   - Horizontal row (`flexDirection: 'row', justifyContent: 'space-around'`) showing the 3 remaining metrics that WEREN'T chosen as the hero:
     - Each: value in TYPOGRAPHY.h3 (fontWeight '700', textMain) + label below in TYPOGRAPHY.captionSmall (textMuted)
     - NO card wrapper, NO MetricCard component — just plain <Text> elements
   - If any metric is unavailable (e.g., no topCreators), skip it and show fewer items

3. EXPLORE YOUR DATA (accordion rows):
   - Overline header: "EXPLORE YOUR DATA" (TYPOGRAPHY.overline, textMuted, marginTop SPACING['2xl'])
   - Container: bgCard, borderRadius RADIUS.lg, border 1px borderSoft, overflow hidden
   - 3 independently expandable rows with dividers between them:
     a. "Content Types" — icon: BarChart3 (16px) — value: "{contentTypes.length} types" — expands to existing StackedBar100 content
     b. "Time Estimate" — icon: Clock — value: "{formatMinutes(adMinutes)} min ads/day" — expands to existing Feed in Minutes cards
     c. "Content Patterns" — icon: TrendingUp — value: emotionalSummary (truncated) — expands to existing Content Patterns card
   - Each row: paddingHorizontal SPACING.lg, minHeight 52, flexDirection 'row', alignItems 'center', justifyContent 'space-between'
   - Import `Clock` from lucide-react-native (check existing imports first — it may already be imported)
   - Use 3 separate useState booleans: `showContentTypes`, `showTimeEstimate`, `showContentPatterns`
   - Expand/collapse: wrap expanded content in a simple conditional render — NO LayoutAnimation
   - All TouchableOpacity rows must have accessibilityRole="button" and accessibilityState={{ expanded }}

4. IDEAS TO EXPLORE (simplified):
   - Keep below the accordion
   - Show only the FIRST suggestion as a single line of text (TYPOGRAPHY.bodySmall, textMuted)
   - Add a "See all ideas" TouchableOpacity that expands to show the full list
   - Use existing suggestions array logic

5. PREMIUM SECTION + FOOTER:
   - Keep LockedOverlayCard and master numbers line exactly as-is

6. CLEANUP:
   - Remove the old `showMore` state variable and its toggle button
   - Remove unused imports (check if MetricCard is still used — it's used in the 2-column row that you're replacing)
   - If MetricCard is no longer used in OverviewContent but IS used in other tab content components, keep the import

VERIFICATION (do ALL of these):
1. Re-read the entire OverviewContent component you wrote
2. Verify every variable referenced exists in the `data` prop (check DashboardData type in computeDashboardData.ts)
3. Verify all icon imports exist in the lucide-react-native import block at the top
4. Verify no hardcoded hex colors, pixel values, or non-token spacing
5. Check the DashboardTour doesn't reference elements you removed (read DashboardTour.tsx to check)
6. Run `git diff --stat` to confirm only dashboard.tsx was modified
7. Verify the file still has exactly one default export at the bottom

Commit: "Dashboard Overview: hero stat + compact metrics + accordion sections"
```

---

## Prompt 2: Tone & Ideology Chart Colors — WCAG AA Palette

```
You are working on the AlgorithmLens mobile app. Your task is to replace the tone AND ideology chart colors with a high-contrast, colorblind-accessible palette that passes WCAG AA.

BEFORE YOU START:
1. Read `mobile/src/lib/theme.ts` — find the tone and ideology color sections in BOTH LIGHT_COLORS and DARK_COLORS
2. Read `mobile/src/components/dashboard/StackedBar100.tsx` — understand how segment colors render. Key: white text (TYPOGRAPHY.labelBold, `colors.white`) is placed INSIDE segments that are ≥15% width. This means the background color must have ≥4.5:1 contrast against white for WCAG AA normal text (since labelBold is 14px which is below the 18px large-text threshold)
3. Read the ToneContent and PoliticsContent sections in `mobile/app/(tabs)/dashboard.tsx` — search for `TONE_COLORS` and `IDEOLOGY` to see how these colors are consumed

SAFETY RULES:
- Only modify `mobile/src/lib/theme.ts`
- Do NOT change any component code — only color token values

CURRENT VALUES (what you'll find):
Light mode:
  tonePositive: '#93C5A8'  (sage-green, ~3.0:1 vs white — FAILS AA)
  toneNeutral:  '#C5C0B8'  (warm gray, ~2.4:1 vs white — FAILS AA)
  toneNegative: '#A3B1C6'  (slate-blue, ~2.6:1 vs white — FAILS AA)
  ideologyLeft:   '#6B8FC4'  (blue, ~3.3:1 vs white — FAILS AA)
  ideologyCenter: '#94A3B8'  (gray, ~3.0:1 vs white — FAILS AA)
  ideologyRight:  '#C4A088'  (tan, ~2.8:1 vs white — FAILS AA)

Dark mode:
  tonePositive: '#6EE7B7'
  toneNeutral:  '#94A3B8'
  toneNegative: '#7DD3FC'
  ideologyLeft:   '#7DD3FC'
  ideologyCenter: '#94A3B8'
  ideologyRight:  '#D4A574'

THE PROBLEM: All six light-mode colors fail WCAG AA contrast against white text. The tone colors are also perceptually similar (all muted mid-tones).

NEW PALETTE — Replace with these exact values:

Light mode (all pass ≥4.5:1 contrast against #FFFFFF):
  tonePositive: '#1A8754'    // deep emerald — 5.1:1 vs white ✓
  toneNeutral:  '#6B7280'    // cool gray-600 — 5.0:1 vs white ✓
  toneNegative: '#B83B3B'    // deep coral — 5.2:1 vs white ✓
  ideologyLeft:   '#2563EB'  // primary blue — 4.6:1 vs white ✓
  ideologyCenter: '#6B7280'  // gray-600 (same as neutral — reuse is intentional) — 5.0:1 ✓
  ideologyRight:  '#B45309'  // amber-700 — 4.7:1 vs white ✓

Dark mode (high contrast on dark backgrounds):
  tonePositive: '#4ADE80'    // green-400
  toneNeutral:  '#94A3B8'    // keep as-is (already works)
  toneNegative: '#F87171'    // red-400
  ideologyLeft:   '#60A5FA'  // blue-400
  ideologyCenter: '#94A3B8'  // keep as-is
  ideologyRight:  '#FBBF24'  // amber-400

DESIGN INTENT:
- Tone: green (positive) → gray (neutral) → red (negative) — universal semantic mapping
- Ideology: blue (left) → gray (center) → amber (right) — conventional political spectrum
- All three tone colors differ by hue, saturation, AND lightness — distinguishable under all forms of colorblindness
- Dark mode uses brighter versions of the same hues for readability on dark surfaces
- "Calm" aesthetic is maintained — these are muted/deep colors, not neon

IMPLEMENTATION:
1. Open `mobile/src/lib/theme.ts`
2. In LIGHT_COLORS, find and replace the 6 values (3 tone + 3 ideology)
3. In DARK_COLORS, find and replace the 6 values (3 tone + 3 ideology)
4. That's it — no component changes needed since all components reference `colors.tonePositive` etc.

VERIFICATION:
1. Re-read theme.ts — confirm exactly the hex values listed above were written
2. Grep the entire mobile/ directory for the OLD hex values ('#93C5A8', '#C5C0B8', '#A3B1C6', '#6B8FC4', '#C4A088', '#6EE7B7', '#7DD3FC', '#D4A574') — should return ZERO matches
3. Verify the new values DO appear (grep for '#1A8754', '#B83B3B', '#2563EB', '#B45309')
4. Read dashboard.tsx's ToneContent section — confirm it still uses `colors.tonePositive` / `colors.toneNeutral` / `colors.toneNegative` (not hardcoded hex)
5. Programmatically verify contrast ratios by running this in bash:
   ```
   python3 -c "
   import math
   def luminance(hex):
       r,g,b = int(hex[1:3],16)/255, int(hex[3:5],16)/255, int(hex[5:7],16)/255
       r,g,b = [x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in [r,g,b]]
       return 0.2126*r + 0.7152*g + 0.0722*b
   def contrast(c1,c2):
       l1,l2 = luminance(c1), luminance(c2)
       if l1<l2: l1,l2=l2,l1
       return (l1+0.05)/(l2+0.05)
   white='#FFFFFF'
   for name,c in [('tonePositive','#1A8754'),('toneNeutral','#6B7280'),('toneNegative','#B83B3B'),('ideoLeft','#2563EB'),('ideoCenter','#6B7280'),('ideoRight','#B45309')]:
       ratio = contrast(c, white)
       print(f'{name}: {c} → {ratio:.1f}:1 {\"✓ AA\" if ratio>=4.5 else \"✗ FAIL\"} ')
   "
   ```
   All 6 must print ✓ AA.

Commit: "Chart colors: WCAG AA compliant tone + ideology palette (light + dark)"
```

---

## Prompt 3: BarChart Graduated Colors

```
You are working on the AlgorithmLens mobile app. Your task is to make BarChart bars use graduated colors by rank instead of identical blue.

BEFORE YOU START:
1. Read `mobile/src/components/dashboard/BarChart.tsx` — understand the full component
2. Read `mobile/src/lib/theme.ts` — find the bar color scale tokens (barDarkest through barLightest)
3. Search dashboard.tsx for every place BarChart is used: `grep -n "BarChart" mobile/app/(tabs)/dashboard.tsx` and also `grep -n "color:" mobile/app/(tabs)/dashboard.tsx | grep -i "bar\|blue200\|primaryBlue"` to find inline color overrides passed to BarChart items

SAFETY RULES:
- Only modify `mobile/src/components/dashboard/BarChart.tsx` and `mobile/app/(tabs)/dashboard.tsx`
- Do NOT change the BarChart props interface
- Do NOT change how items are sorted or computed

CONTEXT — TWO places set bar colors:

1. **Inside BarChart.tsx** — the `barColors` array provides defaults when items don't have a `color` prop:
   ```
   const barColors = [
     colors.barDark,      // Top 1–3: identical blue
     colors.barDark,
     colors.barDark,
     colors.textTertiary, // 4–5: identical gray
     colors.textTertiary,
   ];
   ```
   Used via: `const barColor = item.color || barColors[Math.min(index, barColors.length - 1)];`

2. **Inside dashboard.tsx** — the Sources tab passes inline colors to BarChart items:
   ```
   color: i === 0 ? colors.barDarkest : i < 3 ? colors.primaryBlue : colors.blue200
   ```
   This OVERRIDES the component default for that specific tab.

IMPLEMENTATION:

### Part A: BarChart.tsx default gradient

Replace the barColors array and usage:

```typescript
// Graduated blue scale — ranked from darkest to lightest.
const barColors: string[] = [
  colors.barDarkest,   // #1
  colors.barDark,      // #2
  colors.barMedium,    // #3
  colors.barLight,     // #4
  colors.barLightest,  // #5
];

/** Return the color for a bar at the given rank index.
 *  Custom item.color takes priority; ranked items use the gradient;
 *  items beyond the gradient fall back to neutral gray. */
const getBarColor = (index: number, itemColor?: string): string => {
  if (itemColor) return itemColor;
  if (index < barColors.length) return barColors[index]!;
  return colors.textTertiary;
};
```

Then replace the line that currently reads:
`const barColor = item.color || barColors[Math.min(index, barColors.length - 1)];`
with:
`const barColor = getBarColor(index, item.color);`

### Part B: dashboard.tsx Sources tab inline colors

Find the Sources tab BarChart usage (search for `barDarkest` in dashboard.tsx). The current inline color assignment is:
`color: i === 0 ? colors.barDarkest : i < 3 ? colors.primaryBlue : colors.blue200`

**Remove the inline `color` prop entirely** from these BarChart items. The component's own graduated default is now better than the inline override. The items should just use the default from Part A.

To do this: find the `.map()` that builds the BarChart items for the top creators, and remove the `color:` property from each item object. The BarChart component will use getBarColor() automatically.

VERIFICATION:
1. Re-read BarChart.tsx — confirm getBarColor exists and is used
2. Re-read dashboard.tsx — confirm no inline `color:` overrides on BarChart items in the Sources tab
3. Check: are there inline color overrides on BarChart items in OTHER tabs (Ads, Suggested)? If so, those are fine to leave — they may use intentionally different colors for semantic reasons
4. Verify barDarkest/barDark/barMedium/barLight/barLightest all exist in theme.ts
5. Run `git diff` to confirm only the two expected files changed

Commit: "BarChart: graduated blue scale for visual ranking hierarchy"
```

---

## Prompt 4: BroadcastOverlay Recording State Simplification

```
You are working on the AlgorithmLens mobile app. Your task is to simplify the BroadcastOverlay recording state to essential-only information.

BEFORE YOU START:
1. Read ALL of `mobile/src/components/broadcast/BroadcastOverlay.tsx` — understand every status case
2. Read `mobile/app/broadcast/[platform].tsx` — understand what props are passed to BroadcastOverlay
3. Note: The component already has `canSave` destructured from props and computed as `thresholdsMet`
4. Note: The pulsing animation (Animated.loop in useEffect) must be preserved exactly
5. Note: `Platform.OS === 'web'` check exists on the recording dot animation (line ~181) — preserve it

SAFETY RULES:
- Only modify `mobile/src/components/broadcast/BroadcastOverlay.tsx`
- Do NOT change the BroadcastOverlayProps interface — keep ALL props even if some aren't displayed
- Do NOT change `[platform].tsx` or any hooks
- Do NOT change any status case except RECORDING, PROCESSING, and COMPLETE

CURRENT RECORDING STATE shows 5 information zones:
1. Recording dot + "Recording" label
2. Stats row: frame count | elapsed time | storage
3. Hint text: "Scroll your {platformName} feed normally..."
4. Threshold warning (conditional)
5. Two buttons side-by-side: Open {platform} + Stop

REDESIGNED RECORDING STATE — 3 zones only:

```jsx
case 'RECORDING':
  return (
    <View style={styles.contentSection}>
      {/* Hero: pulsing dot + elapsed time */}
      <View style={{ alignItems: 'center', gap: SPACING.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          {/* KEEP the existing Platform.OS === 'web' conditional for the Animated dot */}
          <Animated.View
            style={Platform.OS === 'web' ? {
              ...styles.recordingDot,
              backgroundColor: colors.recordingDot,
              opacity: 1,
            } : [
              styles.recordingDot,
              { backgroundColor: colors.recordingDot, opacity: pulseAnim },
            ]}
          />
          <Text style={{ ...TYPOGRAPHY.h2, color: colors.textMain, fontVariant: ['tabular-nums'] }}>
            {elapsedTime}
          </Text>
        </View>

        <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textSecondary, textAlign: 'center' }}>
          {frameCount} frames captured from {platformName}
        </Text>

        {!thresholdsMet && (
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.warning, textAlign: 'center' }}>
            Keep scrolling — need more data for accurate analysis
          </Text>
        )}
      </View>

      {/* Actions: stop (primary, full-width) + back to platform (secondary) */}
      <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
        <TouchableOpacity
          onPress={() => {
            triggerImpactMedium();
            onStop();
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Stop recording broadcast"
          style={[styles.primaryButton, {
            backgroundColor: colors.stopButtonBg,
            minHeight: 48,
          }]}
        >
          <StopCircle size={16} color={colors.errorBright} strokeWidth={2} />
          <Text style={[styles.primaryButtonText, { color: colors.stopButtonText }]}>
            Stop Recording
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenPlatform}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Open ${platformName} in another app`}
          style={[styles.secondaryButton, { borderColor: colors.borderSlate200, minHeight: 44 }]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primaryBlue }]}>
            Back to {platformName}
          </Text>
          <ArrowRight size={14} color={colors.primaryBlue} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
```

ALSO SIMPLIFY COMPLETE STATE:
Replace the current COMPLETE case's `completeSummary` text. Instead of:
  "Captured {frameCount} unique frames in {elapsedTime} from {platformName}. ({storageUsed})"
Change to:
  "{frameCount} frames captured in {elapsedTime}"
Keep everything else in COMPLETE the same (CheckCircle, title, View Results button).

ALSO SIMPLIFY PROCESSING STATE:
Replace: "Processing captured frames..." + "{frameCount} frames captured in {elapsedTime}"
With just: "Processing {frameCount} frames..."
Remove the second line.

CLEANUP:
After making changes, check which StyleSheet.create styles are still referenced:
- `statsRow`, `statItem`, `statValue`, `statLabel`, `statDivider` — if none of these are referenced by ANY remaining status case, remove them from the stylesheet
- `recordingRow`, `recordingLabel` — check if still used. If you replaced the recording row structure, these may be orphaned too
- Check icon imports: `Clock` and `Layers` were used in the old stats row. If no other status case uses them, remove the imports

VERIFICATION:
1. Re-read the entire file after changes
2. Verify the Animated.loop useEffect still references `pulseAnim` correctly and its cleanup (`.stop()`) is preserved
3. Verify every TouchableOpacity has accessibilityRole="button" and minHeight ≥ 44
4. Verify `storageUsed` prop is still in the interface and destructured (even though not displayed) — removing it would break [platform].tsx
5. Verify no unused imports remain
6. Run `git diff` — confirm only BroadcastOverlay.tsx changed

Commit: "BroadcastOverlay: simplify recording state to timer + frame count + stop"
```

---

## Prompt 5A: ICON_SIZES Token Scale + Priority 1-2 Migration

```
You are working on the AlgorithmLens mobile app. This is part 1 of 2 for creating an ICON_SIZES design token scale and migrating hardcoded dimensions.

This prompt: Define the tokens + migrate the 10 most-visible component files.
Part 2 (separate prompt): Migrate remaining files + MIN_TOUCH_TARGET.

BEFORE YOU START:
1. Read `mobile/src/lib/theme.ts` — find MIN_TOUCH_TARGET and the end of the file
2. Skim each file listed below to confirm the hardcoded values actually exist before planning edits

SAFETY RULES:
- Only modify files in `AlgorithmLens_Cowork/mobile/`
- Pure visual refactor — no behavioral changes
- Do NOT migrate chart-internal dimensions (bar heights, stacked bar heights, progress bar heights). These are chart metrics, not icon sizes.
- Do NOT migrate legend shape sizes in StackedBar100.tsx (8px diamonds, 12px containers are geometric, not icons)
- Do NOT migrate the `size` prop on lucide icons (e.g., `<Layers size={16} />`) — those are already semantic

STEP 1: Add ICON_SIZES to theme.ts

After the `export const MIN_TOUCH_TARGET = 44;` line, add:

```typescript
// ─── Icon / Avatar Size Scale ────────────────────────────
// Named tokens for icon containers and avatar wrappers.
// For circular icons: borderRadius = ICON_SIZES.xx / 2
export const ICON_SIZES = {
  /** 10px — Legend dots, recording indicator dots */
  dot: 10,
  /** 24px — Small avatars, feed score indicators */
  md: 24,
  /** 28px — Metric card icon containers */
  lg: 28,
  /** 36px — Navigation back buttons, action circles */
  xl: 36,
  /** 40px — Status icons (analysis progress, broadcast results) */
  '2xl': 40,
  /** 44px — Touch-target-sized containers (= MIN_TOUCH_TARGET) */
  touch: 44,
  /** 48px — Onboarding medium icons */
  '3xl': 48,
  /** 60px — Broadcast picker native view */
  '4xl': 60,
  /** 64px — Large decorative icons (error boundary) */
  '5xl': 64,
  /** 72px — App icon on login */
  '6xl': 72,
  /** 80px — Onboarding large icons */
  '7xl': 80,
} as const;
```

Note: Deliberately smaller scale than V1 — removed 16px (lucide handles inline icon sizing), 20px (rare), 100px and 120px (only used in onboarding which has unique layout needs).

STEP 2: Migrate Priority 1 — Dashboard components

For each file: Read → Edit → Re-read to verify

| File | Current | Token |
|------|---------|-------|
| `src/components/dashboard/MetricCard.tsx` | `width: 28, height: 28` | `ICON_SIZES.lg` |
| `src/components/dashboard/MetricCard.tsx` | `borderRadius: RADIUS.sm` | Keep as-is (RADIUS is semantic) |
| `src/components/dashboard/BarChart.tsx` | `width: 10, height: 10` (legend dots only) | `ICON_SIZES.dot` |
| `src/components/dashboard/DashboardTour.tsx` | `width: 36, height: 36, borderRadius: 18` | `ICON_SIZES.xl`, `borderRadius: ICON_SIZES.xl / 2` |
| `src/components/dashboard/ComparisonView.tsx` | `width: 36, height: 36, borderRadius: 18` | `ICON_SIZES.xl`, `borderRadius: ICON_SIZES.xl / 2` |

Add `import { ICON_SIZES } from '../../lib/theme';` (adjust path per file) alongside existing theme imports.

STEP 3: Migrate Priority 2 — Home screen components

| File | Current | Token |
|------|---------|-------|
| `src/components/home/FeedScoreCard.tsx` | `width: 28, height: 28` | `ICON_SIZES.lg` |
| `src/components/home/FeedScoreTrend.tsx` | `width: 24, height: 24, borderRadius: 12` | `ICON_SIZES.md`, `borderRadius: ICON_SIZES.md / 2` |
| `src/components/home/SmartSuggestion.tsx` | `width: 28, height: 28` | `ICON_SIZES.lg` |
| `src/components/home/WeeklySummaryCard.tsx` | `width: 28, height: 28` | `ICON_SIZES.lg` |
| `src/components/home/AchievementBadges.tsx` | `width: 64` → `ICON_SIZES['5xl']`, `width: 44, height: 44, borderRadius: 22` → `ICON_SIZES.touch`, `borderRadius: ICON_SIZES.touch / 2` |

IMPORTANT: For each file, read it FIRST. Some files may have MULTIPLE instances of the same dimension — migrate ALL of them. Use grep within the file to count occurrences before and after.

VERIFICATION:
1. For each migrated file, run: `grep -c "ICON_SIZES" <file>` to confirm tokens were added
2. Run: `grep -n "width: 28," mobile/src/components/dashboard/MetricCard.tsx` — should return 0 matches
3. Run: `grep -n "width: 36," mobile/src/components/dashboard/DashboardTour.tsx` — should return 0 matches
4. Run: `git diff --stat` — confirm ~11 files changed
5. Re-read theme.ts to confirm ICON_SIZES was added correctly

Commit: "Design system: add ICON_SIZES tokens, migrate dashboard + home components"
```

---

## Prompt 5B: ICON_SIZES Migration — Remaining Files + MIN_TOUCH_TARGET

```
You are working on the AlgorithmLens mobile app. This is part 2 of 2 for the ICON_SIZES migration.

PREREQUISITE: Prompt 5A must have already run. ICON_SIZES should already exist in `mobile/src/lib/theme.ts`.

BEFORE YOU START:
1. Read `mobile/src/lib/theme.ts` — confirm ICON_SIZES exists and note available token names
2. Read each file below before editing it

SAFETY RULES:
- Same rules as 5A
- Do NOT re-migrate files already handled in 5A (MetricCard, BarChart, DashboardTour, ComparisonView, FeedScoreCard, FeedScoreTrend, SmartSuggestion, WeeklySummaryCard, AchievementBadges)

STEP 1: Migrate Analysis/Broadcast components

| File | Current | Token |
|------|---------|-------|
| `src/components/analysis/AnalysisProgress.tsx` | `width: 40, height: 40, borderRadius: RADIUS.xl` | `ICON_SIZES['2xl']`, keep `RADIUS.xl` |
| `src/components/analysis/BroadcastResultsSummary.tsx` | `width: 40, height: 40` | `ICON_SIZES['2xl']` |
| `src/components/broadcast/BroadcastOverlay.tsx` | in styles.recordingDot: `width: 10, height: 10` | `ICON_SIZES.dot` (note: this is inside StyleSheet.create, so use the raw value import) |
| `src/components/broadcast/BroadcastPickerButton.tsx` | `width: 40, height: 40, borderRadius: RADIUS.xl` | `ICON_SIZES['2xl']`, keep `RADIUS.xl` |
| `src/components/broadcast/NativeBroadcastPicker.tsx` | `width: 60, height: 60` | `ICON_SIZES['4xl']` |

STEP 2: Migrate App screens

| File | Current | Token |
|------|---------|-------|
| `app/(auth)/login.tsx` | `width: 72, height: 72` | `ICON_SIZES['6xl']` |
| `app/(auth)/onboarding.tsx` | `width: 48, height: 48` → `ICON_SIZES['3xl']`, `width: 80, height: 80` → `ICON_SIZES['7xl']` |
| `src/components/ErrorBoundary.tsx` | `width: 64, height: 64` | `ICON_SIZES['5xl']` |
| `app/broadcast/[platform].tsx` | `width: 24, height: 24, borderRadius: 12` → `ICON_SIZES.md`, `width: 36, height: 36, borderRadius: 18` → `ICON_SIZES.xl` |

STEP 3: Migrate dashboard.tsx icon containers

In `app/(tabs)/dashboard.tsx`, search for `width: 44, height: 44, borderRadius: 22` patterns — these are icon containers (NOT touch targets). Replace with `ICON_SIZES.touch` and `borderRadius: ICON_SIZES.touch / 2`. Add ICON_SIZES to the import from theme.ts.

CAREFUL: `minHeight: 44` is a TOUCH TARGET, not an icon size. Do NOT change these here.

STEP 4: MIN_TOUCH_TARGET migration (separate concern)

Now migrate all `minHeight: 44` touch targets to use the existing `MIN_TOUCH_TARGET` constant:

1. Run: `grep -rn "minHeight: 44" mobile/src/ mobile/app/ --include="*.tsx"` to get the full list
2. For each file:
   a. Add `MIN_TOUCH_TARGET` to the import from theme.ts (alongside SPACING, RADIUS, etc.)
   b. Replace `minHeight: 44` with `minHeight: MIN_TOUCH_TARGET`
3. Also check for `minHeight: 48` — the stop button in BroadcastOverlay uses 48 intentionally (it's larger for emphasis). Leave those as-is.

VERIFICATION:
1. Run: `grep -rn "minHeight: 44" mobile/src/ mobile/app/ --include="*.tsx"` — should return 0 matches
2. Run: `grep -rn "MIN_TOUCH_TARGET" mobile/src/ mobile/app/ --include="*.tsx" | wc -l` — should be ~34
3. Run: `grep -rn "ICON_SIZES" mobile/src/ mobile/app/ --include="*.tsx" | wc -l` — count should be reasonable (20-40 references)
4. Run: `git diff --stat` to review all changed files
5. Spot-check 3 random files by re-reading them to confirm correctness

Commit: "Design system: complete ICON_SIZES migration + MIN_TOUCH_TARGET adoption"
```

---

## Execution Order

```
Prompt 1 (Dashboard Overview)
     │
     ▼
┌─────────────────────────┐
│  Prompt 2  │  Prompt 3  │  Prompt 4  │   ← run in parallel
│  (colors)  │ (BarChart) │ (overlay)  │
└─────────────────────────┘
     │
     ▼
Prompt 5A (ICON_SIZES tokens + P1-P2 files)
     │
     ▼
Prompt 5B (remaining files + MIN_TOUCH_TARGET)
```
