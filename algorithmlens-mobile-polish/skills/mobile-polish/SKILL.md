---
name: algorithmlens-mobile-polish
description: Use this skill whenever working on AlgorithmLens mobile app UI, visual design, component styling, screen layouts, or any task that touches the look and feel of the React Native/Expo mobile app. Trigger on any mention of "mobile UI", "visual polish", "design quality", "make it look better", "styling", "app appearance", "professional look", component beautification, dark mode styling, card layouts, navigation styling, animations, or micro-interactions in the context of AlgorithmLens mobile. Also trigger when auditing mobile UI quality, comparing mobile to the main website's polish level, or implementing new screens. This skill codifies the visual language of best-in-class iOS apps (Spotify, Apple Podcasts, App Store) adapted to AlgorithmLens's blue/green brand identity.
---

# AlgorithmLens Mobile Visual Polish Skill

## Purpose

Make AlgorithmLens's mobile app look and feel as polished as Spotify, Apple Podcasts, and the App Store — the gold standard of iOS consumer app design — while preserving AlgorithmLens's blue primary / green secondary brand identity.

This skill is the definitive visual reference for every component, screen, and interaction in the AlgorithmLens mobile app. Read this before writing any UI code.

## Brand Colors (Non-Negotiable)

These colors are drawn from the AlgorithmLens website and must remain consistent:

```
PRIMARY_BLUE:       #2563EB  (brand blue — buttons, active tabs, links, primary actions)
PRIMARY_BLUE_LIGHT: #3B82F6  (lighter variant for hover/active states)
PRIMARY_BLUE_DARK:  #1D4ED8  (deeper variant for pressed states, headers)
PRIMARY_BLUE_BG:    #EFF6FF  (very light blue for backgrounds, card tints — light mode)
PRIMARY_BLUE_BG_DARK: #172554 (deep blue for dark mode card surfaces)

SECONDARY_GREEN:    #10B981  (success states, positive metrics, secondary actions)
GREEN_LIGHT:        #34D399  (lighter green for badges, highlights)
GREEN_DARK:         #059669  (pressed/active green states)
GREEN_BG:           #ECFDF5  (light green background tint — light mode)
GREEN_BG_DARK:      #064E3B  (dark green tint — dark mode)
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

- Dark background: `#0F172A` (deep slate) or `#111827`
- Elevated surface: `#1E293B`
- Further elevated: `#334155`
- Text on dark: `#F1F5F9` primary, `#94A3B8` secondary
- Brand blue (`#2563EB`) works beautifully on dark backgrounds — no adjustment needed
- Brand green (`#10B981`) also works perfectly on dark

### 6. BOTTOM TAB BAR

All three apps: icon + label, 5 tabs max, active state uses brand color.

- Tab bar background: system blur or solid elevated surface
- Active icon: filled variant in PRIMARY_BLUE
- Inactive icon: `#94A3B8` (muted gray)
- Labels: 10–11pt
- Tab bar height: 49pt (iOS standard) + safe area

### 7. SECTION HEADER PATTERN

Every section follows: Title > (optional subtitle) > content

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

Check first: Run `grep -r "react-native-reusables" mobile/package.json` to see if it's available.

**If react-native-reusables IS installed:**

- Use its Card, Button, Badge, Separator, and other primitives
- Override its default theme tokens with AlgorithmLens brand colors
- Follow the component patterns in `references/component-recipes.md`

**If react-native-reusables is NOT installed:**

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
