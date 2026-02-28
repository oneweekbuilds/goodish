# AlgorithmLens UI Fix Prompts — Apple-Grade Polish

## EXECUTION ORDER

```
WAVE 1 (run all 5 in parallel — zero dependencies between them):
  ├── Prompt 3:  Card Elevation (theme.ts + Card.tsx + inline shadows)
  ├── Prompt 5:  Bar Chart Polish (BarChart.tsx + StackedBar100.tsx)
  ├── Prompt 6:  Feed Score Neutral Color (FeedScoreCard.tsx)
  ├── Prompt 7:  History Neutral Badges (history.tsx)
  └── Prompt 10: Platform Picker Cleanup (PlatformBottomSheet.tsx)

WAVE 2 (run all 6 in parallel — depend only on Wave 1's theme.ts shadow changes):
  ├── Prompt 8:  Scan Overlay Colors (ScanOverlay.tsx)
  ├── Prompt 9:  Settings Upgrade Banner (settings.tsx)
  ├── Prompt 13: Emoji → Lucide Icons (MetricCard.tsx + BigNumber.tsx)
  ├── Prompt 15: Paywall Checkmarks (UpgradeModal.tsx)
  ├── Prompt 17: Tab Bar Weight (tabs/_layout.tsx)
  └── Prompt 18: Scan Complete Screen (scanner results)

WAVE 3 (run all 4 in parallel — depend on Wave 1/2 being done):
  ├── Prompt 4:  Insight Hero Refinement (InsightHero.tsx)
  ├── Prompt 11: Tab Scroll Fade (dashboard.tsx)
  ├── Prompt 14: Upsell Cards Softer (dashboard.tsx + LockedOverlayCard.tsx)
  └── Prompt 16: Home Screen Greeting (index.tsx + DailyTipCard.tsx)

WAVE 4 (run both in parallel — touches InsightHero.tsx after Wave 3 Prompt 4):
  ├── Prompt 12: Combine "About this analysis" (InsightHero.tsx)
  └── Prompt 20: "Learn more" arrows (global search-replace)

WAVE 5 (run alone LAST — touches every file, needs all prior changes):
  ├── Prompt 1:  Typography Enforcement (all .tsx files)
  └── Prompt 2:  Section Label Casing (all dashboard files)
     ↑ Run 1 before 2 (Prompt 2 depends on TYPOGRAPHY tokens being in place)

WAVE 6 (run alone — final spacing pass after all content changes):
  └── Prompt 19: Reduce Information Density (dashboard.tsx + SectionHeader.tsx)
```

**Total: 6 waves instead of 20 sequential runs. ~3.5x faster.**

---

## WAVE 1 — No Dependencies (run all 5 in parallel)

---

### PROMPT 3: Card Elevation & Depth System

```
You are editing the AlgorithmLens React Native mobile app.

Problem: Cards are flat white rectangles with nearly invisible borders. They blend into the white background and lack the subtle depth that Apple uses to create visual hierarchy.

Task: Update the Card.tsx component at mobile/src/components/ui/Card.tsx and the shadow system to add perceptible but elegant depth.

Step 1: In mobile/src/lib/theme.ts, update LIGHT_SHADOWS.soft (the default card shadow) to be more visible:

soft: {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 2,
},

And update LIGHT_SHADOWS.card to:

card: {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 3,
},

Step 2: In Card.tsx, change the default variant to use shadows.card instead of shadows.soft:

case 'default':
default:
  return shadows.card;

Step 3: Search all files in mobile/src/components/ that create card-like containers with inline styles (look for patterns like backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.soft). For each one:
- Change ...shadows.soft to ...shadows.card
- This includes: FeedScoreCard.tsx, DailyTipCard.tsx, RecentScanCard.tsx, StreakBadge.tsx, WeeklySummaryCard.tsx, and any other card-like components in the home/ or dashboard/ directories.

Do not change the borderWidth: 1 or borderColor — keep borders as subtle structural hints in addition to the shadows.

List every file modified and what shadow value you changed.
```

---

### PROMPT 5: Bar Chart Polish — Rounded Bars

```
You are editing mobile/src/components/dashboard/BarChart.tsx.

Problem: The horizontal bar charts use flat rectangular bars with borderRadius: 4. Apple Health and Fitness use fully rounded bar ends for a softer, more polished look.

Task: In BarChart.tsx, find the Animated.View that renders each bar and change:

BEFORE:
borderRadius: 4,

AFTER:
borderRadius: 6,

Also, the bar height of 24 is too chunky. Change:

BEFORE:
height: 24,

AFTER:
height: 20,

Next, in mobile/src/components/dashboard/StackedBar100.tsx, the stacked bar has height: 44 and borderRadius: 12. Change to:

BEFORE:
height: 44,
borderRadius: 12,

AFTER:
height: 36,
borderRadius: 18,

This gives it a more pill-like shape matching Apple's Health app bar charts.

Make these exact changes. Do not modify any other logic, animations, or colors.
```

---

### PROMPT 6: Feed Score — Neutral Color Instead of Green

```
You are editing mobile/src/components/home/FeedScoreCard.tsx.

Problem: The Feed Score number (72, 73) renders in bright green (colors.accentGreen) when >= 70. This implies a judgment ("good!") which conflicts with AlgorithmLens's non-judgmental, informational philosophy. The score should use the brand's primary blue instead — it's informational, not evaluative.

Task: Find the getScoreColor function and change it:

BEFORE:
const getScoreColor = (score: number): string => {
  if (score >= 70) return colors.accentGreen;
  if (score >= 50) return colors.primaryBlue;
  return colors.textMuted;
};

AFTER:
const getScoreColor = (score: number): string => {
  if (score >= 50) return colors.primaryBlue;
  return colors.textMuted;
};

This means scores 50+ are blue (informational), below 50 are muted gray. No green, no red, no judgment.

Make this exact change. Do not modify anything else in the file.
```

---

### PROMPT 7: History Screen — Neutral Sample Quality Indicators

```
You are editing the Scan History screen. The file is at mobile/app/(tabs)/history.tsx.

Problem: The scan history cards use traffic-light colored pills for sample quality: green for "Excellent", yellow for "Low", red for "Very low". This color-coding implies judgment, violating the calm, non-judgmental design philosophy.

Task: Read mobile/app/(tabs)/history.tsx completely first. Find where sample quality badges are rendered — they'll be using colors like colors.success, colors.successLight, colors.warning, colors.warningLight, colors.error, colors.errorLight, or hardcoded green/yellow/red colors.

Replace ALL sample quality badge colors with a single, neutral scheme:
- Background: colors.blue50 (light blue tint)
- Text color: colors.primaryBlue
- Border (if any): colors.blue100 or colors.borderDefault

This means "Excellent sample", "Fair sample", "Low sample", and "Very low sample" ALL get the same neutral blue styling. The text content still communicates the quality level — we're just removing the emotional color-coding.

If the component uses a separate Badge.tsx or Chip.tsx component for these, update the color props passed to it rather than editing the shared component itself (since Badge/Chip are used elsewhere).

List every color change you made.
```

---

### PROMPT 10: Platform Picker — Remove "Coming Soon" Option

```
You are editing the platform picker bottom sheet. The file is at mobile/src/components/home/PlatformBottomSheet.tsx or mobile/src/components/home/PlatformPicker.tsx.

Problem: The platform selection sheet shows a "Screen Capture / COMING SOON" card alongside "Quick Scan". Showing a disabled feature in a primary user flow is an anti-pattern — it creates confusion and makes the app feel unfinished.

Task: Read both PlatformBottomSheet.tsx and PlatformPicker.tsx. Find where the "Screen Capture" option with the "COMING SOON" badge is rendered.

Change: Do NOT delete the Screen Capture code — just hide it from the UI. Wrap it in a condition:

{/* Screen Capture — hidden until feature is ready */}
{false && (
  // ... existing Screen Capture card code
)}

This preserves the code for when the feature ships, but removes it from the user-facing UI right now.

Also, since there's now only one scan method ("Quick Scan"), simplify the bottom of the sheet. Instead of showing two cards side by side (Screen Capture vs Quick Scan), just show the "Start Quick Scan" button directly after the platform grid. The user selects a platform → taps "Start Scan". Clean and simple.

If the "Quick Scan" card has a description or checkmark, those can be removed too since there's no comparison to make anymore. Keep the button text as "Start Quick Scan" or simplify to "Start Scan".
```

---

## WAVE 2 — Depends on Wave 1 (run all 6 in parallel)

---

### PROMPT 8: Scan Overlay Panel — Brand Color Alignment

```
You are editing the scan overlay that appears during the YouTube scrolling scan flow. The file is at mobile/src/components/scanner/ScanOverlay.tsx.

Problem: The scanning overlay panel uses golden/amber colors for status text and accents, which visually disconnects it from the rest of the app's blue/green palette.

Task: Read ScanOverlay.tsx completely. Find any amber, gold, orange, or warm-toned colors used for:
- Status text ("Keep scrolling — building your sample")
- Bullet/dot indicators
- Timer or progress accents
- The "Keep scrolling — X more posts & Xs more needed" banner

Replace these warm colors with the brand palette:
- Status/instruction text: colors.primaryBlue or colors.textMain
- Accent dots: colors.primaryBlue
- The completion pill that turns green when scan is done: keep colors.accentGreen (this is the correct use of green — indicating completion)
- The "Save scan" button at the bottom: colors.accentGreen background with colors.white text (this is correct)

Also look for the "Keep scrolling" banner at the bottom. If it uses a warm/amber background, change it to:
- Background: colors.blue50
- Text: colors.primaryBlue

Make these changes. Do not modify any scanning logic, WebView behavior, or post counting.
```

---

### PROMPT 9: Settings Screen — Integrate Upgrade Banner

```
You are editing mobile/app/(tabs)/settings.tsx.

Problem: There is a floating "Upgrade to Plus — track trends over time" dark banner at the bottom of the Settings screen. It looks like a web ad banner, not a native iOS element.

Task: Read settings.tsx completely. Find the upgrade/upsell banner component at the bottom.

Replace the floating dark banner with an inline settings row that matches the rest of the list. Remove the dark background overlay banner and instead insert a row in the settings list (ideally in the "ABOUT" section or as its own section) that looks like a standard iOS settings row:

<TouchableOpacity
  onPress={handleUpgrade}
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  }}
>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
    <View style={{
      width: 32, height: 32, borderRadius: 8,
      backgroundColor: colors.blue50,
      justifyContent: 'center', alignItems: 'center',
    }}>
      <TrendingUp size={16} color={colors.primaryBlue} />
    </View>
    <View>
      <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain }}>
        Upgrade to Plus
      </Text>
      <Text style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary }}>
        Track trends over time
      </Text>
    </View>
  </View>
  <ChevronRight size={16} color={colors.textTertiary} />
</TouchableOpacity>

Delete the old floating banner entirely. Make sure the necessary imports exist (TrendingUp, ChevronRight from lucide-react-native, TYPOGRAPHY from theme).

Also check mobile/src/components/home/CalmHomeScreen.tsx or wherever the home screen is composed — if there's a floating upgrade banner there too, apply the same treatment.
```

---

### PROMPT 13: Metric Cards — Replace Emoji With Lucide Icons

```
You are editing the dashboard's metric cards. These are in mobile/src/components/dashboard/MetricCard.tsx and/or mobile/src/components/dashboard/BigNumber.tsx.

Problem: The metric cards (Posts Scanned, Ads Detected, Suggested, Top 5 Concentration) use emoji icons mixed with Lucide icons. Apple never mixes emoji with system icons. All iconography should use Lucide (the project's icon library).

Task: Read MetricCard.tsx and BigNumber.tsx. Find any instances where emoji characters are used as icons — they'll be rendered inside <Text> elements with large font sizes.

Replace each emoji with the appropriate Lucide icon:
- chart emoji → <BarChart3 size={16} color={colors.primaryBlue} />
- lock emoji → <Lock size={16} color={colors.primaryBlue} />
- people emoji → <Users size={16} color={colors.primaryBlue} />
- megaphone emoji → <Megaphone size={16} color={colors.primaryBlue} />
- target emoji → <Target size={16} color={colors.primaryBlue} />
- lightning emoji → <Zap size={16} color={colors.primaryBlue} />
- link emoji → <Link size={16} color={colors.primaryBlue} />

For any emoji not in this list, find the closest Lucide icon equivalent.

Each icon should be wrapped in a consistent icon container:

<View style={{
  width: 28,
  height: 28,
  borderRadius: 8,
  backgroundColor: colors.blue50,
  justifyContent: 'center',
  alignItems: 'center',
}}>
  <IconName size={14} color={colors.primaryBlue} strokeWidth={2} />
</View>

Also check mobile/app/(tabs)/dashboard.tsx for any inline emoji usage in metric displays.

Import all needed Lucide icons at the top of each file.
```

---

### PROMPT 15: Paywall Modal — Blue Dots to Green Checkmarks

```
You are editing the paywall/upgrade modal. Check mobile/src/components/plan/UpgradeModal.tsx.

Problem: The "Unlock Plus" feature list uses blue dots as bullet indicators. Apple's standard for feature comparison lists uses checkmarks.

Task: Read UpgradeModal.tsx. Find where the feature list is rendered with blue dot indicators.

Replace each blue dot with a green checkmark using Lucide:

BEFORE (blue dot):
<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryBlue }} />

AFTER (green checkmark in circle):
<View style={{
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: colors.green50,
  justifyContent: 'center',
  alignItems: 'center',
}}>
  <Check size={12} color={colors.accentGreen} strokeWidth={3} />
</View>

Import Check from lucide-react-native.

Also, increase the vertical spacing between feature rows. Find the gap or marginBottom between rows and ensure it's at least SPACING.lg (16pt).

Make these exact changes. Do not modify pricing logic, button behavior, or plan selection.
```

---

### PROMPT 17: Bottom Tab Bar — Visual Weight Balance

```
You are editing the tab bar layout. The file is at mobile/app/(tabs)/_layout.tsx.

Problem: The bottom tab bar icons have slightly different visual weights — the Dashboard icon (4 squares) appears heavier than the others.

Task: Read _layout.tsx. Find where the tab bar icons are configured (likely in <Tabs.Screen> options or a custom tab bar component).

Ensure all tab bar icons use:
- Consistent size={22} (not 24, which is often too large for tab bars)
- Consistent strokeWidth={1.75} for uniform line weight
- Active color: colors.primaryBlue
- Inactive color: colors.textTertiary

If any icons use filled variants when active (like a filled home icon), keep that pattern but ensure all four tabs follow the same filled/outline convention.

Also check if the tab bar background has a subtle top border or shadow. If not, add:

tabBarStyle: {
  borderTopWidth: 0.5,
  borderTopColor: colors.borderDefault,
  backgroundColor: colors.bgCard,
  ...shadows.sm,
}
```

---

### PROMPT 18: Scan Complete Screen — Stat Pills Refinement

```
You are editing the scan completion screen. This is likely in mobile/src/components/scanner/ or a results/analysis screen.

Problem: The "Scan Complete" screen shows three stat pills (49 Posts, 4% Ads, 100% Suggested) in a horizontal row of rounded boxes. The layout doesn't match iOS patterns.

Task: Find the scan completion screen (search for "Scan Complete" text). The stat display currently uses three side-by-side rounded boxes.

Restyle the stats to be cleaner:

1. Remove the rounded box borders from the stat containers
2. Display each stat as a large number with a small label below (like Apple Health summary):

<View style={{ flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: SPACING.xl }}>
  {stats.map(stat => (
    <View key={stat.label} style={{ alignItems: 'center' }}>
      <Text style={{ ...TYPOGRAPHY.h1, color: colors.primaryBlue }}>
        {stat.value}
      </Text>
      <Text style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: SPACING.xs }}>
        {stat.label}
      </Text>
    </View>
  ))}
</View>

3. The three action buttons below ("View Your Dashboard", "Scan Another Platform", "Go Home") — ensure they follow this hierarchy:
   - Primary (filled blue): "View Your Dashboard"
   - Secondary (outlined): "Scan Another Platform"
   - Tertiary (text only): "Go Home"

This is already close in the recording but verify the button styles match this hierarchy.
```

---

## WAVE 3 — Depends on Wave 1+2 (run all 4 in parallel)

---

### PROMPT 4: Insight Hero Card Refinement

```
You are editing mobile/src/components/dashboard/InsightHero.tsx.

Problem: The hero insight cards at the top of each dashboard tab have several issues:
1. The title text is too large (RFValue(26)) for the card width, causing ugly 3-4 line breaks
2. The "Tap for more context" button is a solid-color pill that looks like a web tooltip trigger
3. The left accent bar is good but the overall card feels cramped

Task — make these exact changes:

Change 1: Reduce the title font size. In the title <Text> style, replace:

BEFORE:
fontSize: RFValue(26),
fontWeight: '700',
color: colors.textMain,
marginBottom: SPACING.sm,
letterSpacing: -0.52,

AFTER:
...TYPOGRAPHY.h1,
color: colors.textMain,
marginBottom: SPACING.md,

Change 2: Replace the solid "Tap for more context" pill with a subtler outline-style button. Replace this style block:

BEFORE:
backgroundColor: accent,
alignSelf: 'flex-start',
paddingHorizontal: SPACING.md,
paddingVertical: SPACING.sm,
borderRadius: RADIUS.md,

AFTER:
backgroundColor: 'transparent',
borderWidth: 1,
borderColor: accent,
alignSelf: 'flex-start',
paddingHorizontal: SPACING.md,
paddingVertical: SPACING.xs,
borderRadius: RADIUS.full,

And change the text color inside from colors.white to accent.
And change the ChevronDown icon color from colors.white to accent.

Change 3: Increase overall card padding. In the GradientWrapper style:

BEFORE:
padding: SPACING.lg,

AFTER:
padding: SPACING.xl,

Change 4: Increase inner padding for accent bar. Replace:

BEFORE:
<View style={{ paddingLeft: SPACING.sm }}>

AFTER:
<View style={{ paddingLeft: SPACING.md }}>

Make sure TYPOGRAPHY is imported from the theme. Make these exact changes. Do not modify any other logic.
```

---

### PROMPT 11: Tab Bar — Horizontal Scroll Fade Edges

```
You are editing the dashboard screen. The file is at mobile/app/(tabs)/dashboard.tsx.

Problem: When the horizontal tab bar (Overview / Sources / Ads & Promos / Political / Tone / Suggested vs. Followed) is scrolled, tab labels get clipped mid-word at the screen edges. Apple's approach uses fade gradients at the edges.

Task: Read dashboard.tsx and find where the tab pills are rendered inside a ScrollView or FlatList with horizontal={true}.

Wrap the horizontal scroll container with edge fade gradients using LinearGradient from expo-linear-gradient:

<View style={{ position: 'relative' }}>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{
      paddingHorizontal: SPACING.lg,
      gap: SPACING.sm,
    }}
  >
    {/* existing tab pills */}
  </ScrollView>

  {/* Left fade */}
  <LinearGradient
    colors={[colors.bgPage, 'transparent']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 20,
      pointerEvents: 'none',
    }}
  />

  {/* Right fade */}
  <LinearGradient
    colors={['transparent', colors.bgPage]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 20,
      pointerEvents: 'none',
    }}
  />
</View>

Also increase the gap between tab pills from whatever it currently is to SPACING.sm (8pt), and ensure each pill has paddingHorizontal: SPACING.lg (16pt) for comfortable tap targets.

Import LinearGradient from expo-linear-gradient if not already imported.
```

---

### PROMPT 14: Upsell Cards — Softer Integration

```
You are editing the dashboard tab content. Check mobile/app/(tabs)/dashboard.tsx and any tab-specific components.

Problem: The "Trend analysis" and "Creator breakdowns" upsell/paywall cards look like web banner ads — they have a sparkle icon, a prominent CTA button, and "Free for 14 days" text. They feel foreign to the dashboard's data presentation.

Task: Find all upsell/teaser/locked components in the dashboard. They might be in:
- mobile/src/components/plan/LockedOverlayCard.tsx
- mobile/src/components/dashboard/TrendsStubPanel.tsx (check if this exists in mobile)
- Or inline in dashboard.tsx

Restyle each upsell card to be subtler:

1. Background: Change from any prominent gradient or tinted background to colors.bgCard with colors.borderDefault border (matching normal cards)
2. Icon: Keep the sparkle but render it smaller (size={16}) in colors.primaryBlue instead of any large/prominent treatment
3. Title: Keep the title text but use ...TYPOGRAPHY.h3, color: colors.textMain
4. Description: Keep the description but use ...TYPOGRAPHY.caption, color: colors.textSecondary
5. CTA button: Replace the full-width blue "Start exploring" button with a small text link:

<Text style={{ ...TYPOGRAPHY.label, color: colors.primaryBlue }}>
  Try free for 14 days →
</Text>

6. Remove the "Free for 14 days" subtitle — it's now in the CTA text

The goal: the upsell cards should look like natural extensions of the dashboard content, not like ads.
```

---

### PROMPT 16: Home Screen — Consistent Greeting + Stronger Daily Tip

```
You are editing the home screen. The file is at mobile/app/(tabs)/index.tsx or mobile/src/components/home/CalmHomeScreen.tsx.

Problem: The "Good morning" greeting shows inconsistently, and the "Daily tip" card shows generic filler content.

Task:

Part A — Consistent greeting: Find where the greeting ("Good morning", "Good afternoon", etc.) is conditionally rendered. Make it ALWAYS render (remove any condition that hides it). If there's no greeting logic, add one at the top of the home screen:

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

Render it with:

<Text style={{ ...TYPOGRAPHY.h1, color: colors.textMain, marginBottom: SPACING.xs }}>
  {getGreeting()}
</Text>
<Text style={{ ...TYPOGRAPHY.body, color: colors.textSecondary, marginBottom: SPACING.xl }}>
  See what's in your social media feed
</Text>

Part B — Daily tip: Find DailyTipCard.tsx at mobile/src/components/home/DailyTipCard.tsx. Improve the visual treatment:
- Change the lightbulb/tip icon from any yellow/warm color to colors.accentGreen
- Ensure the card uses ...shadows.card for consistent depth
- Change the "Daily tip" label to use ...TYPOGRAPHY.overline style for consistency with dashboard section labels
```

---

## WAVE 4 — Depends on Wave 3 (run both in parallel)

---

### PROMPT 12: Combine "About this analysis" Section

```
You are editing mobile/src/components/dashboard/InsightHero.tsx.

Problem: Every dashboard tab has two identical expandable sections below the insight card: "What this might also mean" and "HOW WE MEASURE". This creates visual repetition across all 6 tabs. Apple consolidates methodology information into a single disclosure section.

Task: Instead of rendering two separate collapsible TouchableOpacity sections below the insight card, combine them into a single expandable section:

1. Replace the two separate collapsible sections (counterfactual + howWeMeasure) with ONE collapsible section titled "About this analysis".

2. The single section should contain both pieces of information when expanded, separated by a subtle divider:

{(counterfactual || (howWeMeasure && (howWeMeasure.what || howWeMeasure.how || howWeMeasure.limitations))) && (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => {
      setShowCounterfactual(!showCounterfactual);
      setShowHowWeMeasure(!showCounterfactual);
    }}
    style={{
      marginTop: SPACING.sm,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgCardGradientEnd,
      overflow: 'hidden',
      minHeight: 44,
    }}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel="About this analysis"
    accessibilityHint="Tap to see context and methodology"
  >
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
    }}>
      <Text style={{
        ...TYPOGRAPHY.label,
        color: colors.textMuted,
      }}>
        About this analysis
      </Text>
      <ChevronDown
        size={14}
        color={colors.textSecondary}
        strokeWidth={2}
        style={{
          transform: [{ rotate: showCounterfactual ? '180deg' : '0deg' }],
        }}
      />
    </View>
    {showCounterfactual && (
      <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.md }}>
        {counterfactual && (
          <Text style={{
            ...TYPOGRAPHY.caption,
            color: colors.textSecondary,
            fontStyle: 'italic',
          }}>
            {counterfactual}
          </Text>
        )}
        {counterfactual && howWeMeasure && (howWeMeasure.what || howWeMeasure.how) && (
          <View style={{ height: 1, backgroundColor: colors.borderSoft }} />
        )}
        {howWeMeasure?.what && (
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }}>
            <Text style={{ fontWeight: '600', color: colors.textMain }}>What this measures: </Text>
            {howWeMeasure.what}
          </Text>
        )}
        {howWeMeasure?.how && (
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }}>
            <Text style={{ fontWeight: '600', color: colors.textMain }}>How we measure it: </Text>
            {howWeMeasure.how}
          </Text>
        )}
        {howWeMeasure?.limitations && (
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }}>
            <Text style={{ fontWeight: '600', color: colors.textMain }}>Limitations: </Text>
            {howWeMeasure.limitations}
          </Text>
        )}
        {howWeMeasure?.learnMoreUrl && (
          <TouchableOpacity
            onPress={() => Linking.openURL(howWeMeasure.learnMoreUrl!)}
            activeOpacity={0.7}
            accessibilityRole="link"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{
              ...TYPOGRAPHY.caption,
              color: colors.primaryBlue,
              fontWeight: '500',
            }}>
              Learn more
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )}
  </TouchableOpacity>
)}

3. Delete the old separate counterfactual and howWeMeasure collapsible sections that this replaces.

This reduces two repetitive sections per tab into one clean "About this analysis" section.
```

---

### PROMPT 20: Global — "Learn more →" Links Restyled

```
You are doing a global search-and-replace across all .tsx files in mobile/src/ and mobile/app/.

Problem: "Learn more →" links throughout the app use a blue text + arrow pattern that feels like 2015 web design.

Task: Find all instances of the text "Learn more →" or "Learn more→" or "Learn more >" across all .tsx files.

For each instance, change the text from "Learn more →" to "Learn more" (remove the arrow), and ensure the style uses:

style={{
  ...TYPOGRAPHY.caption,
  color: colors.primaryBlue,
  fontWeight: '500',
}}

Do NOT add any icon after it. The blue color alone signals interactivity. The arrow is redundant.

Count and list every instance you changed.
```

---

## WAVE 5 — Run Sequentially (Prompt 1 then Prompt 2)

---

### PROMPT 1: Typography Hierarchy Enforcement (run first)

```
You are editing the AlgorithmLens React Native mobile app. The theme file is at mobile/src/lib/theme.ts.

Problem: The app uses too many ad-hoc font sizes via inline RFValue() calls instead of the centralized TYPOGRAPHY tokens. This creates an inconsistent type hierarchy.

Task: Search every .tsx file under mobile/src/components/ and mobile/app/ for inline fontSize: RFValue(...) declarations that do NOT use a TYPOGRAPHY token. For each one, replace it with the correct TYPOGRAPHY spread.

Mapping rules (use these exact substitutions):
- fontSize: RFValue(26) with fontWeight: '700' → replace with ...TYPOGRAPHY.heroTitle
- fontSize: RFValue(24) with fontWeight: '700' → replace with ...TYPOGRAPHY.h1
- fontSize: RFValue(18) with fontWeight: '600' → replace with ...TYPOGRAPHY.h2
- fontSize: RFValue(16) with fontWeight: '600' → replace with ...TYPOGRAPHY.h3
- fontSize: RFValue(16) with fontWeight: '400' → replace with ...TYPOGRAPHY.bodyLarge
- fontSize: RFValue(15) with any weight → replace with ...TYPOGRAPHY.body
- fontSize: RFValue(14) with fontWeight: '400' or '500' → replace with ...TYPOGRAPHY.label or ...TYPOGRAPHY.bodySmall (use label for UI labels, bodySmall for paragraph text)
- fontSize: RFValue(14) with fontWeight: '600' → replace with ...TYPOGRAPHY.labelBold
- fontSize: RFValue(12) → replace with ...TYPOGRAPHY.caption
- fontSize: RFValue(11) → replace with ...TYPOGRAPHY.captionSmall

When you spread a TYPOGRAPHY token, remove the individual fontSize, fontWeight, lineHeight, and letterSpacing properties that it replaces. Keep other style properties (like color, marginTop, etc.) intact.

Make sure every file that uses TYPOGRAPHY imports it: import { TYPOGRAPHY } from '../../lib/theme'; (adjust relative path as needed).

Do not change theme.ts itself. Only change component files.

After making all changes, list every file you modified and how many inline font sizes you replaced in each.
```

---

### PROMPT 2: Section Label Casing Consistency (run after Prompt 1)

```
You are editing the AlgorithmLens React Native mobile app.

Problem: Section labels use inconsistent casing. Some are ALL CAPS ("HOW WE MEASURE", "SOURCE DIVERSITY"), others are Title Case ("Key Metrics", "Content Patterns Observed"), and others are Sentence case ("What this might also mean"). Apple uses consistent casing within the same hierarchy level.

Task: Enforce these exact casing rules across all dashboard tab content:

1. Overline labels (small, secondary section headers like "HOW WE MEASURE", "AD POSTS", "SOURCE DIVERSITY", "CONTENT ORIGIN"): Keep these as UPPERCASE. They should use ...TYPOGRAPHY.overline which already includes textTransform: 'uppercase'. Find any overline-style labels that are manually uppercased in the string itself (e.g., "HOW WE MEASURE") and change the string to title case (e.g., "How We Measure") while ensuring the style uses TYPOGRAPHY.overline or textTransform: 'uppercase'.

2. Primary section headers (like "Key Metrics", "Top Creators", "Content Types", "Your Feed in Minutes", "Content Patterns Observed", "Ideas to Explore"): These should all be Title Case in the string, styled with ...TYPOGRAPHY.h3 (or ...TYPOGRAPHY.h2 if they're major sections). They should NOT have textTransform: 'uppercase'.

3. Disclosure/accordion labels (like "What this might also mean", "How concentrated is your feed?"): These should be Sentence case in the string, styled with ...TYPOGRAPHY.label.

Files to check: All files in mobile/src/components/dashboard/, mobile/app/(tabs)/dashboard.tsx, and mobile/src/components/dashboard/InsightHero.tsx (the counterfactual and howWeMeasure sections).

The SectionHeader.tsx component: Read it first. If it exists and is used for section headers, ensure it enforces the correct casing and typography token internally, so all consumers inherit consistency.

After making changes, list every string you modified and what casing rule you applied.
```

---

## WAVE 6 — Run Last (after all content changes)

---

### PROMPT 19: Global — Reduce Information Density by 30%

```
You are editing all dashboard tab content. The main file is mobile/app/(tabs)/dashboard.tsx.

Problem: Every dashboard tab shows too many sections stacked vertically, creating an overwhelming scroll experience. The Overview tab alone has 9+ sections.

Task: Read dashboard.tsx completely. For each tab's content rendering, add marginBottom: SPACING['2xl'] (24pt) between major sections. Currently, sections likely have marginBottom: SPACING.lg (16pt) or less.

Specifically:

1. Between the InsightHero card and the first metric section: marginBottom: SPACING['2xl']
2. Between each major section (Key Metrics, Content Types, Your Feed in Minutes, Content Patterns, Ideas to Explore): marginBottom: SPACING['2xl']
3. The SectionHeader component (if it exists at mobile/src/components/dashboard/SectionHeader.tsx): ensure it has marginBottom: SPACING.md between the header text and the content below it, and marginTop: SPACING['2xl'] above it (if not the first section).

Also, add paddingBottom: SPACING['6xl'] (64pt) to the ScrollView's contentContainerStyle on each tab so the last section isn't cut off by the bottom tab bar.

This creates more breathing room between sections without removing any content.
```

---

## VERIFICATION CHECKLIST (run after all waves)

```
Run these commands to verify everything compiles:

npx tsc --noEmit
npx eslint mobile/src/ mobile/app/ --ext .tsx,.ts

Then manually verify:
- Every file that uses TYPOGRAPHY imports it correctly
- Every file that uses Lucide icons imports the specific icons used
- No remaining inline RFValue() calls in component files (all should use TYPOGRAPHY tokens)
- The theme.ts changes (shadows only) don't break the ThemeColors type
- No green/red/yellow colors remain in Feed Score or History sample quality badges
```
