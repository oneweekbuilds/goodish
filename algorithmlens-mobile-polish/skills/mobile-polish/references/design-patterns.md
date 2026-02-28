# Design Patterns Reference — Extracted from Best-in-Class iOS Apps

This document catalogs the specific visual patterns observed in Spotify, Apple Podcasts, and the App Store that should be applied to AlgorithmLens mobile. Every measurement is real, extracted from the actual apps.

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
  Section 1: Section Header → Content (cards/list)
  Section 2: Section Header → Content (cards/list)
  ... more sections ...
Mini Player / Status — Persistent, 64px tall
Tab Bar — 49pt + safe area
```

Key observation: The header area (title + optional filters) is NOT inside the ScrollView in Spotify — it's sticky. In Podcasts and App Store, the large title collapses on scroll (iOS native large title behavior). AlgorithmLens should use the collapsing large title pattern for a native feel.

---

## 2. Navigation and Tab Bars

### Bottom Tab Bar

**Spotify:** 5 tabs: Home, Search, Your Library, Premium, Create. Active: brand green icon (filled) + white label. Inactive: gray icon (outline) + gray label. Background: solid `#121212` with subtle top border.

**Podcasts:** 4 tabs: Home, Browse, Library, Search. Active: purple filled icon + purple label. Inactive: gray icon + gray label. Background: system blur (translucent).

**App Store:** 5 tabs: Today, Games, Apps, Arcade, Search. Active: blue filled icon + blue label. Inactive: gray icon + gray label. Background: system blur (translucent).

**For AlgorithmLens:**

- Active tab: PRIMARY_BLUE (`#2563EB`) filled icon + blue label
- Inactive tab: `#94A3B8` icon + label
- Background: solid elevated surface (`#1E293B` dark, `#FFFFFF` light) with top hairline border
- Use blur effect on iOS if possible (expo-blur)
- Tab icons should be the FILLED variant when active, OUTLINE when inactive

---

## 3. Section Headers

**Pattern A: Simple Header** (most common)
Title (20-24pt, semibold, primary text color) with optional "Show all >" right-aligned, 14pt, brand color.

**Pattern B: Header with Subtitle**
Title (20-24pt, semibold) with Subtitle (13-14pt, secondary text color) below, optional "Show all >".

**Pattern C: Header with Icon**
[Icon] Title (20-22pt, semibold) with Subtitle (13pt, secondary). Used in Spotify's "For fans of Caamp" pattern with artist avatar.

**For AlgorithmLens:**

- Dashboard tab names: Pattern A
- "Your Recent Scans": Pattern B with "3 scans this week" subtitle
- Insight sections: Pattern B with dimension name as title, brief description as subtitle

---

## 4. Card Variants

### Small Square Card (Spotify Recents)
- Width: ~(screenWidth - 48) / 2 (two per row)
- Height: 56-64px
- Layout: [Image 48x48] [Title + Subtitle]
- Radius: 8px
- Background: elevated surface

### Medium Card (Spotify playlists, Podcasts recommendations)
- Width: 150-180px
- Height: Image (150-180px square) + Text area (~60px)
- Layout: Vertical
- Radius: 8-12px

### Wide Card (Spotify "Your top mixes")
- Width: 260-300px
- Height: Image (160px) + Text (~50px)
- Radius: 12px

### Hero Card (App Store Today)
- Width: screenWidth - 40px
- Height: 380-420px
- Layout: Full-bleed image with gradient overlay at bottom
- Category label (12pt uppercase) at top-left
- Title (22-26pt bold white) at bottom-left
- Subtitle (14pt white/80%) below
- App info bar at bottom
- Radius: 16-20px
- Shadow: large

### For AlgorithmLens Insight Cards
- Width: screenWidth - 32px
- Layout: Eyebrow (12pt uppercase, GREEN or BLUE, letterspaced) → Title (18pt semibold) → Takeaway (14pt, secondary, 2-3 lines max) → Chart area → "How we measure" expandable
- Radius: 16px
- Background: elevated surface
- Padding: 20px internal

---

## 5. Horizontal Carousels

All three apps use the same pattern:

- FlatList with horizontal, showsHorizontalScrollIndicator=false
- snapToInterval or pagingEnabled for snap behavior
- First item has left margin matching screen padding (16-20px)
- Last item has right margin matching screen padding
- Gap between items: 12-16px
- **CRITICAL:** The rightmost visible card is partially cut off (~20% hidden) to indicate scrollability

**For AlgorithmLens**, use horizontal carousels for: Recent scans, "Related insights", Onboarding feature highlights.

---

## 6. List Items

### App Store List Item
- Height: ~72px
- Layout: [Rounded Image 48x48, radius 12px] [gap 12px] [Title + Subtitle stack] [Right action]
- Title: 16pt semibold
- Subtitle: 13pt secondary
- Divider: hairline indented past image

### Spotify Library List Item
- Height: ~64px
- Layout: [Square Image 48x48, radius 4-8px] [gap 12px] [Title + Metadata]
- Title: 15-16pt medium
- Meta: 13pt secondary with dot separator

### For AlgorithmLens Scan History Items
- Height: 72px
- Layout: [Platform Icon 44x44, radius 10px, tinted bg] [gap 12px] [Platform + Date stack] [Score badge]
- Platform: 16pt semibold
- Date: 13pt secondary ("2 hours ago")
- Badge: Pill with score, brand colors
- Divider: Hairline, indented past icon

---

## 7. Filter Chips / Pill Tabs

### Spotify Pattern
- Horizontal scrollable row
- Active pill: solid white bg, dark text
- Inactive pill: transparent with white border, white text
- Padding: 8px vertical, 16px horizontal
- Radius: full (height/2)
- Gap: 8px

### For AlgorithmLens
- Active pill: PRIMARY_BLUE solid bg, white text
- Inactive pill: transparent with border (`#334155` dark, `#E2E8F0` light), primary text
- Use for dashboard dimension tabs (Overview, Sources, Ads, Politics, Tone, Suggested)
- Scrollable if more than 4 visible

---

## 8. Hero Cards

### App Store Hero Pattern
- Background: Full-width image or gradient
- Gradient overlay from transparent (top) to rgba(0,0,0,0.7) (bottom)
- Text sits on gradient at bottom
- Category pill at top-left
- Large title (24-28pt bold) at bottom
- Subtitle (14-15pt) below

### For AlgorithmLens
- Use hero cards for: Dashboard welcome card, Feature promotion in onboarding
- Background: gradient using brand blue (`#1D4ED8` to `#2563EB`) instead of images

---

## 9. Mini Player / Status Bar

### Spotify Mini Player
- Height: 64px
- Fixed above tab bar
- Layout: [Album art 40x40] [Title + Artist] [Controls]
- Elevated surface, subtle top border

### For AlgorithmLens Scan Status Bar
- Height: 56px
- Above tab bar (only when relevant)
- Layout: [Platform icon 32x32] ["Last scan: Instagram - 2h ago" or "Scanning..."] [Arrow/chevron]
- Background: PRIMARY_BLUE_BG_DARK (dark) or PRIMARY_BLUE_BG (light)
- Active scan: animated progress using brand green

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

**Weight mapping:** System fonts (San Francisco iOS, Roboto Android). Weights: Regular (400), Medium (500), SemiBold (600), Bold (700).

---

## 11. Color Application

| Element | Light Mode | Dark Mode |
|---|---|---|
| Screen background | `#F8FAFC` | `#0F172A` |
| Card/surface | `#FFFFFF` | `#1E293B` |
| Elevated card | `#FFFFFF` (shadow) | `#334155` |
| Primary text | `#1E293B` | `#F1F5F9` |
| Secondary text | `#64748B` | `#94A3B8` |
| Tertiary text | `#94A3B8` | `#64748B` |
| Dividers/borders | `#E2E8F0` | `#334155` |
| Active/CTA | `#2563EB` | `#2563EB` |
| Success/positive | `#10B981` | `#10B981` |
| Error/negative | `#EF4444` | `#F87171` |
| Warning | `#F59E0B` | `#FBBF24` |
| Disabled | `#CBD5E1` | `#475569` |

**Never use:** Pure black (#000) for text, pure white (#FFF) for text on dark, any purple/orange/pink as accents, brand blue for errors, brand green for negative metrics.

---

## 12. Spacing System

4px base grid:

- **xs:** 4px (tight gaps)
- **sm:** 8px (between related inline elements)
- **md:** 12px (between list items, pill gap)
- **lg:** 16px (screen horizontal padding, card padding)
- **xl:** 20px (featured card padding)
- **2xl:** 24px (between card title and content)
- **3xl:** 32px (between distinct sections)
- **4xl:** 40px (between major page sections)
- **5xl:** 48px (top of screen to first content)

---

## 13. Shadows and Elevation

### Light Mode

- **shadow-sm:** offset {0,1}, opacity 0.05, radius 2, elevation 1
- **shadow-md:** offset {0,2}, opacity 0.08, radius 8, elevation 3
- **shadow-lg:** offset {0,4}, opacity 0.12, radius 16, elevation 6
- **shadow-xl:** offset {0,8}, opacity 0.15, radius 24, elevation 8

### Dark Mode

Shadows barely visible. Instead use surface color differentiation:
- Base: `#0F172A`
- Surface 1: `#1E293B`
- Surface 2: `#334155`
- Surface 3: `#475569`
- Optional 1px top border rgba(255,255,255,0.06)

---

## 14. Animations and Transitions

**Press feedback:** onPressIn scale to 0.97 (100ms), onPressOut scale to 1.0 (150ms spring).

**List item stagger:** opacity 0→1, translateY 8→0, 300ms per item, 50ms stagger, ease-out.

**Tab switching:** Animated indicator translateX 250ms ease-in-out. Content crossfade: outgoing opacity 150ms, incoming 200ms after 100ms delay.

**Skeleton shimmer:** Gradient slides left-to-right, 1500ms loop.

**Pull-to-refresh and screen transitions:** Use platform native. Don't custom-build.

---

## 15. Empty and Loading States

### Loading
- Skeleton screens mirroring content shape
- Rounded rectangles
- Shimmer animation
- Never spinner-only

### Empty State
- Centered vertically
- [Icon 80-120px muted] → Title (18pt semibold) → Description (14pt secondary) → CTA Button (brand blue pill)

### Error State
- Same layout as empty with error icon and retry button

---

## 16. Dark Mode Specifics

**What changes:** Background to deep slate, cards to elevated surface, text inverted, shadows replaced with surface differentiation, gradients shift to darker bases.

**What does NOT change:** Border radius, spacing, typography sizes/weights, icon sizes, touch targets, layout structure, animation timing.
