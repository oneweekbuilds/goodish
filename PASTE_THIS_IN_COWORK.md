Create a new Cowork skill/plugin called "algorithmlens-mobile-polish". This skill should automatically trigger whenever I work on AlgorithmLens mobile app UI, visual design, component styling, screen layouts, or any task that touches the look and feel of the React Native/Expo mobile app.

The skill has 3 files. Create all three exactly as specified below.

---

FILE 1: SKILL.md (the main skill file)

---
name: algorithmlens-mobile-polish
description: Use this skill whenever working on AlgorithmLens mobile app UI, visual design, component styling, screen layouts, or any task that touches the look and feel of the React Native/Expo mobile app. Trigger on any mention of "mobile UI", "visual polish", "design quality", "make it look better", "styling", "app appearance", "professional look", component beautification, dark mode styling, card layouts, navigation styling, animations, or micro-interactions in the context of AlgorithmLens mobile. Also trigger when auditing mobile UI quality, comparing mobile to the main website's polish level, or implementing new screens. This skill codifies the visual language of best-in-class iOS apps (Spotify, Apple Podcasts, App Store) adapted to AlgorithmLens's blue/green brand identity.
---

# AlgorithmLens Mobile Visual Polish Skill

## Purpose

Make AlgorithmLens's mobile app look and feel as polished as Spotify, Apple Podcasts, and the App Store — the gold standard of iOS consumer app design — while preserving AlgorithmLens's blue primary / green secondary brand identity.

This skill is the definitive visual reference for every component, screen, and interaction in the AlgorithmLens mobile app. **Read this before writing any UI code.**

## Brand Colors (Non-Negotiable)

These colors are drawn from the AlgorithmLens website and must remain consistent:

```
PRIMARY_BLUE:     #2563EB  (brand blue — buttons, active tabs, links, primary actions)
PRIMARY_BLUE_LIGHT: #3B82F6  (lighter variant for hover/active states)
PRIMARY_BLUE_DARK:  #1D4ED8  (deeper variant for pressed states, headers)
PRIMARY_BLUE_BG:    #EFF6FF  (very light blue for backgrounds, card tints — light mode)
PRIMARY_BLUE_BG_DARK: #172554 (deep blue for dark mode card surfaces)

SECONDARY_GREEN:  #10B981  (success states, positive metrics, secondary actions)
GREEN_LIGHT:      #34D399  (lighter green for badges, highlights)
GREEN_DARK:       #059669  (pressed/active green states)
GREEN_BG:         #ECFDF5  (light green background tint — light mode)
GREEN_BG_DARK:    #064E3B  (dark green tint — dark mode)
```

Do NOT introduce purples, oranges, reds (except for errors), or any colors from Spotify/Podcasts/App Store. The color identity is blue + green.

## Core Design Principles (Learned from Spotify, Podcasts, App Store)

Read `references/design-patterns.md` for the full pattern library. Here is the summary:

### 1. GENEROUS SPACING IS EVERYTHING
The #1 thing separating amateur apps from pro apps is whitespace. Every section needs breathing room.
- Section-to-section vertical gap: 32–40px minimum
- Card internal padding: 16–20px
- Content never touches screen edges: 16–20px horizontal margin
- Between a section header and its content: 12–16px

### 2. TYPOGRAPHY HIERARCHY
Three apps, same pattern: bold oversized headers, medium subheads, regular body.
- Screen titles: 28–34pt, bold/heavy weight (like Spotify's "Home", App Store's "Today")
- Section headers: 20–24pt, semibold (like "Recents", "Must-Play Games")
- Card titles: 16–18pt, semibold
- Body/description text: 14–15pt, regular weight
- Metadata/captions: 12–13pt, regular, secondary color (gray)
- Line height: 1.3–1.5x for body text

### 3. CARD-BASED LAYOUTS WITH GENEROUS RADIUS
Every piece of content lives in a card or card-like container.
- Card corner radius: 12–16px (never less than 10px, never more than 20px for content cards)
- Pill buttons/chips: full radius (height/2)
- Image corners inside cards: match the card radius minus padding
- Cards should have subtle shadows in light mode, elevated backgrounds in dark mode

### 4. HORIZONTAL SCROLLABLE CAROUSELS
All three apps use horizontal carousels extensively for content browsing.
- Cards in carousels: consistent width (150–180px for square, 260–300px for wide)
- Peek the next card by ~20px to signal scrollability
- Snap to card boundaries
- No visible scrollbar

### 5. DARK MODE AS FIRST-CLASS
All three apps are dark-mode-first. For AlgorithmLens:
- Dark background: #0F172A (deep slate) or #111827
- Elevated surface: #1E293B
- Further elevated: #334155
- Text on dark: #F1F5F9 primary, #94A3B8 secondary
- Brand blue (#2563EB) works beautifully on dark backgrounds — no adjustment needed
- Brand green (#10B981) also works perfectly on dark

### 6. BOTTOM TAB BAR
All three apps: icon + label, 5 tabs max, active state uses brand color.
- Tab bar background: system blur or solid elevated surface
- Active icon: filled variant in PRIMARY_BLUE
- Inactive icon: #94A3B8 (muted gray)
- Labels: 10–11pt
- Tab bar height: 49pt (iOS standard) + safe area

### 7. SECTION HEADER PATTERN
Every section follows: **Title > (optional subtitle) > content**
- Title is left-aligned, bold, 20–24pt
- Optional chevron ">" or "Show all" link on the right
- Optional subtitle below in secondary color, 13–14pt
- This pattern repeats throughout — consistency is key

### 8. SMOOTH TRANSITIONS AND MICRO-INTERACTIONS
- Screen transitions: native stack push/pop animations (don't fight the platform)
- List items: fade-in with slight upward translate on mount (staggered, 50ms per item)
- Cards: subtle scale on press (0.97–0.98x)
- Tabs: animated underline or background indicator sliding between tabs
- Loading: skeleton shimmer (not spinners) using the existing DashboardSkeleton pattern
- Pull-to-refresh: native feel

### 9. IMAGE AND ICON TREATMENT
- All images: rounded corners matching their container
- Placeholder: branded skeleton shimmer while loading
- Icons: use a consistent icon set (Lucide, SF Symbols, or whatever the app already uses)
- Icon sizing: 20–24px for inline, 28–32px for navigation, 48–64px for featured

### 10. PERSISTENT MINI-PLAYER / STATUS BAR
Spotify and Podcasts both have a persistent bottom bar showing current activity. For AlgorithmLens:
- Consider a persistent "last scan" mini-bar above the tab bar
- Shows platform icon + "Scanned 3 hours ago" or scan-in-progress indicator
- Tapping it navigates to results

## Implementation with react-native-reusables

If react-native-reusables (shadcn/ui port for React Native) is installed, leverage it. If not, the same patterns can be achieved with the existing theme.ts tokens and React Native primitives.

**Check first:** Run `grep -r "react-native-reusables" mobile/package.json` to see if it's available.

### If react-native-reusables IS installed:
- Use its Card, Button, Badge, Separator, and other primitives
- Override its default theme tokens with AlgorithmLens brand colors
- Follow the component patterns in `references/component-recipes.md`

### If react-native-reusables is NOT installed:
- Use the existing theme.ts token system
- Follow the component recipes in `references/component-recipes.md` using raw React Native Views, Texts, and Pressables
- Use expo-linear-gradient for gradient backgrounds and hero sections
- Use react-native-reanimated for animations (if available)

## The Visual Quality Checklist

Before considering ANY screen done, verify every item:

```
[ ] Background is not plain white — uses off-white (#F8FAFC light) or dark (#0F172A dark)
[ ] No content touches screen edges — minimum 16px horizontal padding
[ ] Section spacing is 32px+ between distinct sections
[ ] Typography uses at least 3 weight levels (bold header, semibold subhead, regular body)
[ ] All interactive elements have a visible pressed state (opacity drop or scale)
[ ] Cards have 12–16px rounded corners and subtle elevation
[ ] Colors are from the brand palette — no rogue grays, no black text (#000)
[ ] Primary text is #1E293B (light) or #F1F5F9 (dark), never pure black or white
[ ] Secondary text is #64748B (light) or #94A3B8 (dark)
[ ] Loading states use skeleton shimmer, not spinners
[ ] Touch targets are minimum 44x44pt
[ ] The screen looks good in BOTH light and dark mode
[ ] No orphaned text (single word on its own line in headers)
[ ] Icons are consistent size and style throughout
[ ] The screen passes the "squint test" — if you squint, visual hierarchy is still clear
```

## File References

For detailed implementation patterns and code recipes:
- `references/design-patterns.md` — Full pattern library with measurements from Spotify, Podcasts, and App Store
- `references/component-recipes.md` — Copy-pasteable component patterns for AlgorithmLens

Read these files when you need specific implementation details for a component or layout.

---

FILE 2: references/design-patterns.md

# Design Patterns Reference — Extracted from Best-in-Class iOS Apps

This document catalogs the specific visual patterns observed in Spotify, Apple Podcasts, and the App Store that should be applied to AlgorithmLens mobile. Every measurement is real, extracted from the actual apps.

---

## Table of Contents
1. Screen Structure
2. Navigation and Tab Bars
3. Section Headers
4. Card Variants
5. Horizontal Carousels
6. List Items
7. Filter Chips / Pill Tabs
8. Hero Cards
9. Mini Player / Status Bars
10. Typography Scale
11. Color Application
12. Spacing System
13. Shadows and Elevation
14. Animations and Transitions
15. Empty and Loading States
16. Dark Mode Specifics

---

## 1. Screen Structure

All three apps follow this vertical structure:

```
Status Bar (system)
Screen Header — Large title, 28-34pt bold, optional filter chips (horizontal scrollable)
Scrollable Content Area — ScrollView or FlatList
  Section 1: Section Header then Content (cards/list)
  Section 2: Section Header then Content (cards/list)
  ... more sections ...
Mini Player / Status — Persistent, 64px tall
Tab Bar — 49pt + safe area
```

Key observation: The header area (title + optional filters) is NOT inside the ScrollView in Spotify — it's sticky. In Podcasts and App Store, the large title collapses on scroll (iOS native large title behavior). AlgorithmLens should use the collapsing large title pattern for a native feel.

---

## 2. Navigation and Tab Bars

### Bottom Tab Bar

**Spotify:** 5 tabs: Home, Search, Your Library, Premium, Create. Active: brand green icon (filled) + white label. Inactive: gray icon (outline) + gray label. Background: solid #121212 with subtle top border.

**Podcasts:** 4 tabs: Home, Browse, Library, Search. Active: purple filled icon + purple label. Inactive: gray icon + gray label. Background: system blur (translucent).

**App Store:** 5 tabs: Today, Games, Apps, Arcade, Search. Active: blue filled icon + blue label. Inactive: gray icon + gray label. Background: system blur (translucent).

### For AlgorithmLens:
- Active tab: PRIMARY_BLUE (#2563EB) filled icon + blue label
- Inactive tab: #94A3B8 icon + label
- Background: solid elevated surface (#1E293B dark, #FFFFFF light) with top hairline border
- Use blur effect on iOS if possible (expo-blur)
- Tab icons should be the FILLED variant when active, OUTLINE when inactive

---

## 3. Section Headers

**Pattern A: Simple Header (most common):**
Title (20-24pt, semibold, primary text color) with optional "Show all >" right-aligned, 14pt, brand color.

**Pattern B: Header with Subtitle:**
Title (20-24pt, semibold) with Subtitle (13-14pt, secondary text color) below, optional "Show all >".

**Pattern C: Header with Icon:**
[Icon] Title (20-22pt, semibold) with Subtitle (13pt, secondary). Used in Spotify's "For fans of Caamp" pattern with artist avatar.

### For AlgorithmLens:
- Dashboard tab names: Pattern A
- "Your Recent Scans": Pattern B with "3 scans this week" subtitle
- Insight sections: Pattern B with dimension name as title, brief description as subtitle

---

## 4. Card Variants

**Small Square Card (Spotify Recents):** Width: ~(screenWidth - 48) / 2 (two per row), Height: 56-64px, Layout: [Image 48x48] [Title + Subtitle], Radius: 8px, Background: elevated surface.

**Medium Card (Spotify playlists, Podcasts recommendations):** Width: 150-180px, Height: Image (150-180px square) + Text area (~60px), Layout: Vertical, Radius: 8-12px.

**Wide Card (Spotify "Your top mixes"):** Width: 260-300px, Height: Image (160px) + Text (~50px), Radius: 12px.

**Hero Card (App Store Today):** Width: screenWidth - 40px, Height: 380-420px, Layout: Full-bleed image with gradient overlay at bottom, Category label (12pt uppercase) at top-left, Title (22-26pt bold white) at bottom-left, Subtitle (14pt white/80%) below, App info bar at bottom, Radius: 16-20px, Shadow: large.

### For AlgorithmLens Insight Cards:
Width: screenWidth - 32px. Layout: Eyebrow (12pt uppercase, GREEN or BLUE, letterspaced) then Title (18pt semibold) then Takeaway (14pt, secondary, 2-3 lines max) then Chart area then "How we measure" expandable. Radius: 16px. Background: elevated surface. Padding: 20px internal.

---

## 5. Horizontal Carousels

All three apps use the same pattern:
- FlatList with horizontal, showsHorizontalScrollIndicator=false
- snapToInterval or pagingEnabled for snap behavior
- First item has left margin matching screen padding (16-20px)
- Last item has right margin matching screen padding
- Gap between items: 12-16px
- CRITICAL: The rightmost visible card is partially cut off (~20% hidden) to indicate scrollability

For AlgorithmLens, use horizontal carousels for: Recent scans, "Related insights", Onboarding feature highlights.

---

## 6. List Items

**App Store List Item:** Height: ~72px, Layout: [Rounded Image 48x48, radius 12px] [gap 12px] [Title + Subtitle stack] [Right action], Title: 16pt semibold, Subtitle: 13pt secondary, Divider: hairline indented past image.

**Spotify Library List Item:** Height: ~64px, Layout: [Square Image 48x48, radius 4-8px] [gap 12px] [Title + Metadata], Title: 15-16pt medium, Meta: 13pt secondary with dot separator.

### For AlgorithmLens Scan History Items:
Height: 72px. Layout: [Platform Icon 44x44, radius 10px, tinted bg] [gap 12px] [Platform + Date stack] [Score badge]. Platform: 16pt semibold. Date: 13pt secondary ("2 hours ago"). Badge: Pill with score, brand colors. Divider: Hairline, indented past icon.

---

## 7. Filter Chips / Pill Tabs

**Spotify Pattern:** Horizontal scrollable row. Active pill: solid white bg, dark text. Inactive pill: transparent with white border, white text. Padding: 8px vertical, 16px horizontal. Radius: full (height/2). Gap: 8px.

### For AlgorithmLens:
Active pill: PRIMARY_BLUE solid bg, white text. Inactive pill: transparent with border (#334155 dark, #E2E8F0 light), primary text. Use for dashboard dimension tabs (Overview, Sources, Ads, Politics, Tone, Suggested). Scrollable if more than 4 visible.

---

## 8. Hero Cards

**App Store Hero Pattern:** Background: Full-width image or gradient. Gradient overlay from transparent (top) to rgba(0,0,0,0.7) (bottom). Text sits on gradient at bottom. Category pill at top-left. Large title (24-28pt bold) at bottom. Subtitle (14-15pt) below.

### For AlgorithmLens:
Use hero cards for: Dashboard welcome card, Feature promotion in onboarding. Background: gradient using brand blue (#1D4ED8 to #2563EB) instead of images.

---

## 9. Mini Player / Status Bar

**Spotify Mini Player:** Height: 64px. Fixed above tab bar. Layout: [Album art 40x40] [Title + Artist] [Controls]. Elevated surface, subtle top border.

### For AlgorithmLens Scan Status Bar:
Height: 56px. Above tab bar (only when relevant). Layout: [Platform icon 32x32] ["Last scan: Instagram - 2h ago" or "Scanning..."] [Arrow/chevron]. Background: PRIMARY_BLUE_BG_DARK (dark) or PRIMARY_BLUE_BG (light). Active scan: animated progress using brand green.

---

## 10. Typography Scale

```
display:   34pt  heavy/black   — Splash screens only
title1:    28pt  bold          — Screen titles ("Dashboard", "Settings")
title2:    22pt  bold          — Section titles ("Source Diversity")
title3:    20pt  semibold      — Subsection titles
headline:  17pt  semibold      — Card titles, emphasis
body:      15pt  regular       — Primary content text
callout:   14pt  regular       — Secondary content, descriptions
subhead:   13pt  regular       — Metadata, timestamps
footnote:  12pt  regular       — Captions, legal text
caption:   11pt  regular       — Smallest text (badge labels, tab labels)
overline:  11pt  medium, uppercase, letterspacing 1.5px — Eyebrow/category labels
```

Weight mapping: System fonts (San Francisco iOS, Roboto Android). Weights: Regular (400), Medium (500), SemiBold (600), Bold (700).

---

## 11. Color Application

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Screen background | #F8FAFC | #0F172A |
| Card/surface | #FFFFFF | #1E293B |
| Elevated card | #FFFFFF (shadow) | #334155 |
| Primary text | #1E293B | #F1F5F9 |
| Secondary text | #64748B | #94A3B8 |
| Tertiary text | #94A3B8 | #64748B |
| Dividers/borders | #E2E8F0 | #334155 |
| Active/CTA | #2563EB | #2563EB |
| Success/positive | #10B981 | #10B981 |
| Error/negative | #EF4444 | #F87171 |
| Warning | #F59E0B | #FBBF24 |
| Disabled | #CBD5E1 | #475569 |

Never use: Pure black (#000) for text, pure white (#FFF) for text on dark, any purple/orange/pink as accents, brand blue for errors, brand green for negative metrics.

---

## 12. Spacing System

4px base grid:
- xs: 4px (tight gaps)
- sm: 8px (between related inline elements)
- md: 12px (between list items, pill gap)
- lg: 16px (screen horizontal padding, card padding)
- xl: 20px (featured card padding)
- 2xl: 24px (between card title and content)
- 3xl: 32px (between distinct sections)
- 4xl: 40px (between major page sections)
- 5xl: 48px (top of screen to first content)

---

## 13. Shadows and Elevation

**Light Mode:**
- shadow-sm: offset {0,1}, opacity 0.05, radius 2, elevation 1
- shadow-md: offset {0,2}, opacity 0.08, radius 8, elevation 3
- shadow-lg: offset {0,4}, opacity 0.12, radius 16, elevation 6
- shadow-xl: offset {0,8}, opacity 0.15, radius 24, elevation 8

**Dark Mode:** Shadows barely visible. Instead use surface color differentiation: Base #0F172A, Surface 1 #1E293B, Surface 2 #334155, Surface 3 #475569. Optional 1px top border rgba(255,255,255,0.06).

---

## 14. Animations and Transitions

**Press feedback:** onPressIn scale to 0.97 (100ms), onPressOut scale to 1.0 (150ms spring).

**List item stagger:** opacity 0-1, translateY 8-0, 300ms per item, 50ms stagger, ease-out.

**Tab switching:** Animated indicator translateX 250ms ease-in-out. Content crossfade: outgoing opacity 150ms, incoming 200ms after 100ms delay.

**Skeleton shimmer:** Gradient slides left-to-right, 1500ms loop.

**Pull-to-refresh and screen transitions:** Use platform native. Don't custom-build.

---

## 15. Empty and Loading States

**Loading:** Skeleton screens mirroring content shape. Rounded rectangles. Shimmer animation. Never spinner-only.

**Empty State:** Centered vertically. [Icon 80-120px muted] then Title (18pt semibold) then Description (14pt secondary) then CTA Button (brand blue pill).

**Error State:** Same layout as empty with error icon and retry button.

---

## 16. Dark Mode Specifics

**What changes:** Background to deep slate, cards to elevated surface, text inverted, shadows replaced with surface differentiation, gradients shift to darker bases.

**What does NOT change:** Border radius, spacing, typography sizes/weights, icon sizes, touch targets, layout structure, animation timing.

---

FILE 3: references/component-recipes.md

# Component Recipes for AlgorithmLens Mobile

Copy-pasteable patterns for building polished components. All recipes use the AlgorithmLens brand palette and follow the design patterns from design-patterns.md.

Adapt these to your project's existing patterns: if the app uses StyleSheet, use that. If it uses a theme context, reference that. These are structural templates, not drop-in code.

---

## 1. Polished Card (Base card wrapper for everything)

```tsx
import { View, StyleSheet, useColorScheme } from 'react-native';

interface PolishedCardProps {
  children: React.ReactNode;
  elevated?: boolean;
  noPadding?: boolean;
}

export function PolishedCard({ children, elevated, noPadding }: PolishedCardProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={[
      styles.card,
      {
        backgroundColor: isDark ? (elevated ? '#334155' : '#1E293B') : '#FFFFFF',
        ...(isDark
          ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }
          : { shadowOffset: {width:0, height:2}, shadowOpacity:0.08, shadowRadius:8, elevation:3 }
        ),
      },
      noPadding && { padding: 0 },
    ]}>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, marginHorizontal: 16 },
});
```

## 2. Section Header

```tsx
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, subtitle, onSeeAll }: SectionHeaderProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={styles.container}>
      <View style={styles.textStack}>
        <Text style={[styles.title, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>{subtitle}</Text>}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
          <Text style={{ fontSize:14, fontWeight:'500', color:'#2563EB' }}>Show all</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', paddingHorizontal:16, marginBottom:12 },
  textStack: { flex:1 },
  title: { fontSize:22, fontWeight:'700', letterSpacing:-0.3 },
  subtitle: { fontSize:13, marginTop:2 },
});
```

## 3. Horizontal Carousel

```tsx
import { FlatList, View } from 'react-native';

interface CarouselProps<T> {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  itemWidth: number;
  gap?: number;
}

export function HorizontalCarousel<T>({ data, renderItem, itemWidth, gap = 12 }: CarouselProps<T>) {
  return (
    <FlatList
      data={data}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      ItemSeparatorComponent={() => <View style={{ width: gap }} />}
      snapToInterval={itemWidth + gap}
      decelerationRate="fast"
      renderItem={({ item, index }) => (
        <View style={{ width: itemWidth }}>{renderItem({ item, index })}</View>
      )}
    />
  );
}
```

## 4. Filter Pill Tabs (Spotify-style, for dashboard dimension tabs)

```tsx
import { ScrollView, Pressable, Text, StyleSheet, useColorScheme } from 'react-native';

interface FilterPillsProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export function FilterPills({ options, selected, onSelect }: FilterPillsProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:16, gap:8, paddingVertical:4 }}>
      {options.map((option) => {
        const isActive = option === selected;
        return (
          <Pressable key={option} onPress={() => onSelect(option)}
            style={[styles.pill, isActive ? styles.pillActive : { borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor:'transparent' }]}>
            <Text style={[styles.pillText, isActive ? { color:'#FFF' } : { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  pill: { paddingVertical:8, paddingHorizontal:18, borderRadius:50, borderWidth:1.5 },
  pillActive: { backgroundColor:'#2563EB', borderColor:'#2563EB' },
  pillText: { fontSize:14, fontWeight:'600' },
});
```

## 5. Insight Card (Dashboard primary content card)

```tsx
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';

interface InsightCardProps {
  eyebrow: string;
  title: string;
  takeaway: string;
  eyebrowColor?: string;
  chart?: React.ReactNode;
  howWeMeasure?: string;
}

export function InsightCard({ eyebrow, title, takeaway, eyebrowColor = '#10B981', chart, howWeMeasure }: InsightCardProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <PolishedCard>
      <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>
      <Text style={[styles.title, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{title}</Text>
      <Text style={[styles.takeaway, { color: isDark ? '#94A3B8' : '#64748B' }]}>{takeaway}</Text>
      {chart && <View style={styles.chartContainer}>{chart}</View>}
      {howWeMeasure && (
        <Pressable style={styles.howWeMeasure}>
          <Text style={{ fontSize:13, fontWeight:'500', color: isDark ? '#64748B' : '#94A3B8' }}>How we measure this →</Text>
        </Pressable>
      )}
    </PolishedCard>
  );
}
const styles = StyleSheet.create({
  eyebrow: { fontSize:11, fontWeight:'600', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 },
  title: { fontSize:18, fontWeight:'700', lineHeight:24, marginBottom:8 },
  takeaway: { fontSize:14, lineHeight:20, marginBottom:16 },
  chartContainer: { marginBottom:16, borderRadius:12, overflow:'hidden' },
  howWeMeasure: { paddingTop:12, borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:'rgba(148,163,184,0.2)' },
});
```

## 6. Scan History List Item

```tsx
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';

interface ScanHistoryItemProps {
  platform: string;
  platformIcon: React.ReactNode;
  timestamp: string;
  postCount: number;
  onPress: () => void;
}

export function ScanHistoryItem({ platform, platformIcon, timestamp, postCount, onPress }: ScanHistoryItemProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && { opacity:0.7, transform:[{ scale:0.98 }] }]}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>{platformIcon}</View>
      <View style={styles.textContainer}>
        <Text style={[styles.platform, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{platform}</Text>
        <Text style={[styles.timestamp, { color: isDark ? '#94A3B8' : '#64748B' }]}>{timestamp} · {postCount} posts</Text>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection:'row', alignItems:'center', paddingVertical:14, paddingHorizontal:16, gap:12 },
  iconContainer: { width:44, height:44, borderRadius:10, justifyContent:'center', alignItems:'center' },
  textContainer: { flex:1 },
  platform: { fontSize:16, fontWeight:'600' },
  timestamp: { fontSize:13, marginTop:2 },
});
```

## 7. Hero Gradient Card (requires expo-linear-gradient)

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HeroCardProps { title: string; subtitle: string; eyebrow?: string; }

export function HeroCard({ title, subtitle, eyebrow }: HeroCardProps) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={['#1D4ED8', '#2563EB', '#3B82F6']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.gradient}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { marginHorizontal:16, borderRadius:20, overflow:'hidden', shadowOffset:{width:0,height:8}, shadowOpacity:0.2, shadowRadius:24, shadowColor:'#1D4ED8', elevation:8 },
  gradient: { padding:24, minHeight:160, justifyContent:'flex-end' },
  eyebrow: { fontSize:11, fontWeight:'600', textTransform:'uppercase', letterSpacing:1.5, color:'rgba(255,255,255,0.7)', marginBottom:8 },
  title: { fontSize:24, fontWeight:'800', color:'#FFFFFF', lineHeight:30, marginBottom:4 },
  subtitle: { fontSize:14, color:'rgba(255,255,255,0.8)', lineHeight:20 },
});
```

## 8. Empty State

```tsx
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';

interface EmptyStateProps { icon: React.ReactNode; title: string; description: string; actionLabel?: string; onAction?: () => void; }

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={[styles.title, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{title}</Text>
      <Text style={[styles.description, { color: isDark ? '#94A3B8' : '#64748B' }]}>{description}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.cta, pressed && { opacity:0.85, transform:[{ scale:0.97 }] }]}>
          <Text style={styles.ctaText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal:40, paddingVertical:60 },
  iconWrapper: { marginBottom:20, opacity:0.6 },
  title: { fontSize:20, fontWeight:'700', textAlign:'center', marginBottom:8 },
  description: { fontSize:15, textAlign:'center', lineHeight:22, marginBottom:28 },
  cta: { backgroundColor:'#2563EB', paddingVertical:14, paddingHorizontal:32, borderRadius:50 },
  ctaText: { color:'#FFF', fontSize:16, fontWeight:'600' },
});
```

## 9. Skeleton Loader

```tsx
import { useEffect, useRef } from 'react';
import { View, Animated, useColorScheme } from 'react-native';

interface SkeletonProps { width: number | string; height: number; radius?: number; }

export function SkeletonBox({ width, height, radius = 8 }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const isDark = useColorScheme() === 'dark';
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue:1, duration:1000, useNativeDriver:true }),
      Animated.timing(shimmer, { toValue:0, duration:1000, useNativeDriver:true }),
    ])).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange:[0,1], outputRange:[0.3,0.7] });
  return <Animated.View style={{ width, height, borderRadius:radius, backgroundColor: isDark ? '#334155' : '#E2E8F0', opacity }} />;
}

export function InsightCardSkeleton() {
  return (
    <View style={{ padding:20, gap:12, marginHorizontal:16, borderRadius:16 }}>
      <SkeletonBox width={80} height={12} radius={4} />
      <SkeletonBox width="70%" height={20} radius={4} />
      <SkeletonBox width="100%" height={14} radius={4} />
      <SkeletonBox width="90%" height={14} radius={4} />
      <SkeletonBox width="100%" height={120} radius={12} />
    </View>
  );
}
```

## 10. Pressable with Scale Feedback

```tsx
import { Pressable, Animated, PressableProps } from 'react-native';
import { useRef } from 'react';

interface PressableScaleProps extends PressableProps { children: React.ReactNode; scaleValue?: number; }

export function PressableScale({ children, scaleValue = 0.97, style, ...props }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => { Animated.spring(scale, { toValue:scaleValue, useNativeDriver:true, speed:50, bounciness:4 }).start(); };
  const onPressOut = () => { Animated.spring(scale, { toValue:1, useNativeDriver:true, speed:40, bounciness:6 }).start(); };
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} {...props}>
      <Animated.View style={[style, { transform:[{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
```

## 11. Badge / Pill

```tsx
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

type BadgeVariant = 'blue' | 'green' | 'gray' | 'red';

const BADGE_COLORS: Record<BadgeVariant, { bg:string; bgDark:string; text:string; textDark:string }> = {
  blue:  { bg:'#EFF6FF', bgDark:'#172554', text:'#2563EB', textDark:'#60A5FA' },
  green: { bg:'#ECFDF5', bgDark:'#064E3B', text:'#059669', textDark:'#34D399' },
  gray:  { bg:'#F1F5F9', bgDark:'#334155', text:'#64748B', textDark:'#94A3B8' },
  red:   { bg:'#FEF2F2', bgDark:'#450A0A', text:'#DC2626', textDark:'#F87171' },
};

export function Badge({ label, variant = 'blue' }: { label:string; variant?:BadgeVariant }) {
  const isDark = useColorScheme() === 'dark';
  const c = BADGE_COLORS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: isDark ? c.bgDark : c.bg }]}>
      <Text style={[styles.text, { color: isDark ? c.textDark : c.text }]}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: { paddingVertical:4, paddingHorizontal:10, borderRadius:50, alignSelf:'flex-start' },
  text: { fontSize:12, fontWeight:'600' },
});
```

## 12. Bottom Tab Bar Styling

Apply to React Navigation tab bar config:

```tsx
<Tabs screenOptions={{
  tabBarStyle: {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderTopColor: isDark ? '#334155' : '#E2E8F0',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 49 + (insets?.bottom ?? 0),
    paddingTop: 6,
  },
  tabBarActiveTintColor: '#2563EB',
  tabBarInactiveTintColor: '#94A3B8',
  tabBarLabelStyle: { fontSize:10, fontWeight:'500', marginTop:2 },
}} />
```

## 13. Metric Display

```tsx
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

interface MetricDisplayProps { value: string | number; label: string; trend?: 'up'|'down'|'neutral'; trendLabel?: string; }

export function MetricDisplay({ value, label, trend, trendLabel }: MetricDisplayProps) {
  const isDark = useColorScheme() === 'dark';
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#94A3B8';
  return (
    <View style={{ alignItems:'center', gap:4 }}>
      <Text style={{ fontSize:32, fontWeight:'800', letterSpacing:-0.5, color:'#2563EB' }}>{value}</Text>
      <Text style={{ fontSize:13, fontWeight:'500', color: isDark ? '#94A3B8' : '#64748B' }}>{label}</Text>
      {trendLabel && <Text style={{ fontSize:12, fontWeight:'600', color:trendColor }}>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}</Text>}
    </View>
  );
}
```

## 14. Score Ring (requires react-native-svg)

```tsx
import { View, Text, useColorScheme } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ScoreRingProps { score: number; size?: number; strokeWidth?: number; label?: string; }

export function ScoreRing({ score, size = 80, strokeWidth = 6, label }: ScoreRingProps) {
  const isDark = useColorScheme() === 'dark';
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / 100);
  const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <View style={{ width:size, height:size, justifyContent:'center', alignItems:'center' }}>
      <Svg width={size} height={size} style={{ transform:[{ rotate:'-90deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={radius} stroke={isDark ? '#334155' : '#E2E8F0'} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size/2} cy={size/2} r={radius} stroke={scoreColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </Svg>
      <View style={{ position:'absolute', alignItems:'center' }}>
        <Text style={{ fontSize:20, fontWeight:'800', color: isDark ? '#F1F5F9' : '#1E293B' }}>{score}</Text>
        {label && <Text style={{ fontSize:9, fontWeight:'500', textTransform:'uppercase', letterSpacing:0.5, color: isDark ? '#94A3B8' : '#64748B' }}>{label}</Text>}
      </View>
    </View>
  );
}
```

## General Rules — Apply to EVERY Component

1. Border radius: 12-16px for cards, full radius for pills
2. Spacing: multiples of 4 from the spacing system
3. Typography: weights from the scale only
4. Colors: brand palette only — no hardcoded #333 or random grays
5. Dark mode: every color needs light AND dark variant
6. Press feedback: every tappable element needs opacity/scale change
7. Touch targets: nothing interactive smaller than 44x44pt

---

END OF SKILL FILES. Create all three files with this exact content in the skill folder structure:
algorithmlens-mobile-polish/SKILL.md
algorithmlens-mobile-polish/references/design-patterns.md
algorithmlens-mobile-polish/references/component-recipes.md
