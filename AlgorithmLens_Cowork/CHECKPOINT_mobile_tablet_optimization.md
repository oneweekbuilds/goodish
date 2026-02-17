# Checkpoint: Mobile & Tablet Optimization Plan

**Date:** February 15, 2026
**Author:** Claude (for Justin's review)
**Goal:** Make AlgorithmLens work beautifully on phones and tablets — matching the desktop experience.

---

## What I Found (Current State)

### What's Already Working Well
- **Mobile hamburger menu** in the navbar — slides in nicely from the right
- **Hero/landing pages** scale text and spacing well across screen sizes
- **Dashboard tabs** show just icons on phones, icons + labels on bigger screens
- **Hero insight cards** use `clamp()` for fluid padding (smart!)
- **Supporting card grids** properly go from 1 column on phones to 2 on tablets
- **Touch-friendly buttons** with proper 44px minimum tap targets
- **Viewport meta tag** is set correctly

### Problems I Found

#### 1. **Double padding on the dashboard — too cramped on phones**
The dashboard has two padding layers that stack: the outer wrapper adds 16px (`px-4`), and the inner content area adds another 24px (`px-6`). That's 40px of padding on each side of a phone — eating up 80px of your ~375px screen. Content gets squeezed into a narrow column.

#### 2. **Dashboard header controls don't fit on small screens**
The "Date range" dropdown, "Refresh" button, "New Scan" button, premium upgrade hint, and scan quota text all try to sit in one row. On a phone, they pile up messily because there's no phone-specific layout for this area.

#### 3. **Tab labels disappear entirely on phones**
Currently, phone users only see small icons with no text. This makes it hard to know which tab is "Ads" vs "Politics" vs "Tone" without tapping each one.

#### 4. **"More details" and "Try this" accordion buttons have no phone refinements**
These full-width buttons have padding that doesn't adjust for phones, so they feel cramped.

#### 5. **Inner card padding doesn't scale down enough**
Cards inside the "Key Insight" and "Context" sections use `p-7` (28px) on phones when `p-4` (16px) would feel more natural on small screens.

#### 6. **Chart text labels and bar widths don't adjust for phones**
The bar chart component uses a fixed `max-w-[70%]` for labels and hard-coded spacing. On a phone, labels can get cut off or overlap.

#### 7. **The FeatureMomentWrapper negative margins break on phones**
It uses `-mx-6 md:-mx-8` which can cause horizontal overflow on narrow screens.

#### 8. **Date filter inputs and custom date pickers are too wide on phones**
The date pickers don't have mobile-specific sizing and can cause horizontal scroll.

#### 9. **"No Scans Yet" empty state has excessive padding on phones**
The empty state card uses `p-12` (48px) padding, which takes up huge amounts of screen space on a phone.

#### 10. **Footer doesn't have enough padding adjustment for phones**
The footer in App.jsx uses `px-6 lg:px-12` — missing a smaller phone size.

---

## Proposed Changes

### Change Group A: Dashboard Layout & Padding (Biggest Impact)

**A1. Fix double-padding on dashboard**
- Change inner `px-6` to `px-2 sm:px-4 md:px-6` so phones get minimal padding
- This alone will recover ~40px of usable width on phones

**A2. Improve dashboard header for phones**
- Stack the title, filters, and action buttons vertically on phones
- Put "New Scan" and "Refresh" side by side; date filter below
- Add `w-full` to the date dropdown on phones so it doesn't look squeezed

**A3. Fix inner card padding**
- Change `p-7 md:p-9` to `p-4 sm:p-6 md:p-9` on Key Insight cards
- Change `px-6 pb-6 md:px-8` evidence areas to `px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8`

### Change Group B: Tab Navigation

**B1. Show abbreviated labels on phones**
- Instead of hiding all tab labels, show short labels (e.g., "Ads", "Tone", "Sources") even on small screens
- Reduce font size slightly on phones for this

### Change Group C: Cards & Content

**C1. Fix FeatureMomentWrapper negative margins**
- Change `-mx-6 md:-mx-8` to `-mx-4 sm:-mx-6 md:-mx-8` to match container padding at each breakpoint

**C2. Accordion button refinements**
- Add `px-3 sm:px-4` and `py-3 sm:py-3.5` for a slightly more compact feel on phones

**C3. Supporting card padding**
- Change `p-4` to `p-3 sm:p-4` on supporting insight cards for a bit more room on phones
- Change `p-5` in the "More details" cards to `p-3 sm:p-5`

### Change Group D: Charts & Data Display

**D1. Bar chart label overflow**
- Change fixed `max-w-[70%]` to `max-w-[60%] sm:max-w-[70%]` for phone label room
- Reduce bar text from `text-sm` to `text-xs sm:text-sm`

### Change Group E: Empty States & Edge Cases

**E1. "No Scans Yet" padding**
- Change `p-12` to `p-6 sm:p-8 md:p-12`

**E2. Loading/error state padding**
- Already decent, minor tweaks to match

### Change Group F: Global / App-Level

**F1. Footer padding**
- Add `px-4` for phones: `px-4 sm:px-6 lg:px-12`

**F2. Date inputs mobile sizing**
- Make date inputs `w-full` on phones when in "custom" mode so they don't cause horizontal scroll

---

## Files That Will Be Modified

1. `src/pages/dashboard/DashboardPage.jsx` — Most changes (padding, header, tabs, cards, empty states)
2. `src/components/Navbar.jsx` — Minor: Already good, no changes needed
3. `src/App.jsx` — Footer padding
4. `src/components/dashboard/charts/BarChartSimple.jsx` — Label sizing
5. `src/components/dashboard/ViewCard.jsx` — Minor padding adjustments

---

## What Won't Change
- No new files created
- No dependencies added
- No restructuring of components
- No color or visual design changes
- No changes to how data flows

---

## Risk Assessment
- **Low risk**: All changes are Tailwind CSS class additions/adjustments
- **No functionality changes**: Only visual layout
- **Easy to revert**: Every change is a class name swap
- **No backend changes**: Frontend only
