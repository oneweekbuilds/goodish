# AlgorithmLens Mobile App - Complete Design Documentation
## Official Source of Truth for Mobile Implementation

**Generated:** February 24, 2026
**Source:** `/AlgorithmLens_Cowork/src` (React + Tailwind web codebase)
**Target:** React Native mobile application

---

## 📚 Documentation Files

This package contains three comprehensive guides for implementing the AlgorithmLens mobile app:

### 1. **MOBILE_APP_DESIGN_SPEC.md** (35 KB, 1045 lines)
**Complete Design Token Reference** - Everything a designer/developer needs to match the web design exactly.

**Contents:**
- Project structure & file organization
- Design tokens (all hex colors, font sizes, spacing, shadows, borders)
- Dashboard tab specifications (6 tabs with exact names, accents, copy)
- Component patterns (Button, Tab Navigation, Insight Hero, Section Header)
- Typography scale (font families, sizes, weights, line heights, letter spacing)
- Spacing & layout system (padding, margins, max-widths, gaps, border radius)
- Shadow & border tokens (all 7 shadow levels + border system)
- User-facing copy (trust sentences, epistemic restraint guidelines)
- Accessibility standards (WCAG AA compliance, keyboard nav, ARIA labels)
- Routes & page structure
- State management hooks

**Read this if:** You need exact hex codes, font sizes, spacing values, or component specifications.

---

### 2. **MOBILE_APP_COMPONENT_MAP.md** (24 KB, 969 lines)
**Detailed Component Architecture** - How components fit together and what data they receive.

**Contents:**
- Complete component hierarchy (tree structure)
- Tab-specific components (OverviewTab, SourcesTab, AdsTab, PoliticsTab, ToneTab, SuggestedVsFollowedTab)
- Shared dashboard primitives (InsightHero, SectionHeader, metric cards, calculators)
- Data visualization components (BarChart, LineChart, Table, StackedBar, etc.)
- UI components (Button variants, Skeleton, Toast)
- Data aggregation functions (aggregators, data helpers)
- State management hooks (useDashboardState, useDashboardData, etc.)
- Platform integration (Auth, Paywall, Analytics)
- File size & performance metrics
- Mobile adaptation notes (Tailwind → React Native conversion guide)
- Testing checklist

**Read this if:** You need to understand component props, data structures, or how to wire components together.

---

### 3. **MOBILE_QUICK_REFERENCE.md** (13 KB, 501 lines)
**Fast Lookup Guide** - Essential values and implementation checklist for quick reference.

**Contents:**
- Brand colors (hex codes)
- Tab accent colors (6 tabs)
- Status colors
- Typography standards (font family, sizes, weights, letter spacing)
- Shadow system (6 levels)
- Border radius (5 standard values)
- Spacing scale
- Component sizing (buttons, cards, sections)
- Dashboard tab structure
- Insight Hero pattern
- Section Header pattern
- Animation principles
- Accessibility requirements
- Common pitfalls ("Never do this")
- Responsive breakpoints
- Plan tier gating
- Source code locations
- Essential files to read first
- Mobile implementation checklist
- Key success metrics
- Pro tips

**Read this if:** You want quick answers while coding, or need to verify specific values.

---

## 🎯 Quick Start (5 Minutes)

1. **Open MOBILE_QUICK_REFERENCE.md**
   - Copy the brand colors section (6 hex values)
   - Copy the tab accent colors section (6 hex values for each tab)
   - Skim the "Never Do This" section to understand copy guidelines

2. **Read MOBILE_APP_DESIGN_SPEC.md - Dashboard Tabs section**
   - Understand the 6 tab structure (Overview, Sources, Ads, Politics, Tone, Suggested)
   - Read one complete tab specification (e.g., Overview)
   - Note the data structure and component usage

3. **Read MOBILE_APP_COMPONENT_MAP.md - Tab-Specific Components section**
   - Find the component hierarchy for your first tab
   - Copy the props interface
   - Note the data structure

4. **Look at the source code**
   - Navigate to `/AlgorithmLens_Cowork/src/pages/dashboard/`
   - Open the corresponding tab file (e.g., `OverviewTab.jsx`)
   - Match the component structure to what you're building

---

## 🏗️ Implementation Path

### Phase 1: Foundation (Days 1-2)
1. Set up React Native project with Expo or React Native CLI
2. Create color theme from MOBILE_QUICK_REFERENCE.md (copy all hex codes)
3. Set up fonts (Inter or equivalent)
4. Create button component variants (see MOBILE_APP_COMPONENT_MAP.md - Button Variants)
5. Create basic layout (header, tab bar, content area)

### Phase 2: Tab System (Days 3-5)
1. Implement tab navigation with 6 tabs (names and accent colors from MOBILE_QUICK_REFERENCE.md)
2. Create InsightHero component (see MOBILE_APP_DESIGN_SPEC.md - Component Patterns)
3. Create SectionHeader component
4. Create metric card components (ToplineMetricCard, MiniCalculator)
5. Wire up tab content switching

### Phase 3: Data Integration (Days 6-8)
1. Implement useDashboardState hook (see MOBILE_APP_COMPONENT_MAP.md)
2. Create data aggregation functions (from /lib/dashboard/aggregators/)
3. Wire up data to components
4. Implement filter UI
5. Test data flow

### Phase 4: Visualizations (Days 9-11)
1. Create chart components (BarChart, LineChart, StackedBar100, Table)
2. Implement number line visualizer
3. Create status card component
4. Connect visualizations to data

### Phase 5: Features (Days 12-14)
1. Implement plan tier gating (free vs plus)
2. Create paywall modal
3. Add "Talk to Algorithm" green section (premium only)
4. Implement trends panel

### Phase 6: Polish (Days 15-20)
1. Add animations (Framer Motion equivalent for RN)
2. Implement loading states (skeletons)
3. Add error boundaries
4. Accessibility review (VoiceOver/TalkBack)
5. Performance optimization
6. Testing & QA

---

## 🎨 Design Token Hierarchy

All design values flow from three sources:

### Source 1: Brand Colors (Immutable)
```
Primary Blue:    #2563EB  (70% of color usage)
Accent Green:    #10B981  (30% of color usage)
```

### Source 2: Semantic Colors (Derived from Brand)
```
Text Main:       #1E293B
Text Muted:      #4B5563
Background:      #F7F8FC
Surface:         #FFFFFF
```

### Source 3: Tab Accent Colors (Applied per tab)
```
Each tab has a unique accent color from the palette
(Indigo, Orange, Purple, Teal, Rose, or Blue)
This color is used for:
- Tab button active state
- InsightHero left border
- Section header accent bar
- Button hover/focus states within that tab
```

---

## 📊 The Six Dashboard Tabs

All tabs follow the same structure:

```
┌─────────────────────────────────────────────────────┐
│ INSIGHT HERO (Key Takeaway Card)                    │
│ - Data-grounded takeaway with actual values         │
│ - Plain English explanation                         │
│ - Why it matters                                    │
│ - Optional metadata                                 │
│ - Tab-specific accent color                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SECTION: "Observed"                                 │
│ (What actually appeared in the scans)               │
│ - Primary metric visualization (chart/number/bar)   │
│ - Supporting data                                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SECTION: "Context" (or tab-specific label)          │
│ (How this metric distributed)                       │
│ - Secondary visualization                          │
│ - Breakdown by platform/creator/etc                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SECTION: "Additional Detail"                        │
│ (Optional, can be collapsed)                        │
│ - Tertiary insights                                 │
│ - Explanatory text                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ PREMIUM FEATURE: "Talk to Algorithm"                │
│ (GREEN theme, plus plan only)                       │
│ - AI-powered insights (placeholder)                 │
│ - Trend comparisons                                │
│ - Paywall upsell (for free users)                  │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 Key Files in Source Codebase

### Must Read (In Order)
1. **`/src/lib/theme/tokens.js`**
   - Brand colors and semantic tokens
   - Tailwind class mappings

2. **`/tailwind.config.js`**
   - Complete design system configuration
   - All colors, font families, shadows, spacing

3. **`/src/pages/dashboard/dashboardConstants.js`**
   - Theme system (blue for analysis, green for AI)
   - Surface tokens (HERO_BLUE, SUPPORT_WHITE, TALK_GREEN, etc)
   - Tab story headers (section labels and subtitles)
   - Tab trust sentences (epistemic restraint guidelines)

4. **`/src/pages/dashboard/dashboardCatalog.js`**
   - View definitions (the exact source of truth)
   - Data structure specs
   - Takeaway & action copy templates

5. **`/src/pages/dashboard/DashboardPage.jsx`**
   - Main dashboard orchestrator (read first 150 lines)
   - Shows how all pieces fit together

### Tab Implementations (Read One Full Tab)
- `/src/pages/dashboard/tabs/OverviewTab.jsx` (best to start with)
- `/src/pages/dashboard/tabs/SourcesTab.jsx`
- `/src/pages/dashboard/tabs/AdsTab.jsx`
- `/src/pages/dashboard/tabs/PoliticsTab.jsx`
- `/src/pages/dashboard/tabs/ToneTab.jsx`
- `/src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`

### Component Implementations
- `/src/components/dashboard/InsightHero.jsx` (critical pattern)
- `/src/components/dashboard/SectionHeader.jsx` (critical pattern)
- `/src/components/ui/Button.jsx` (4 variants)
- `/src/components/dashboard/primitives/ToplineMetricCard.jsx`
- `/src/components/dashboard/primitives/MiniCalculator.jsx`

---

## 💻 Tech Stack Decisions

### Already Decided (From Web)
- **Colors:** All hex codes (non-negotiable)
- **Typography:** Inter font (or equivalent)
- **Component structure:** Follow web component hierarchy
- **Data flow:** Use same aggregators and helpers where possible
- **Copy:** Use exact copy from dashboardConstants.js and dashboardCatalog.js

### For You To Decide (Mobile-Specific)
- **Framework:** React Native vs Flutter vs Native
- **State management:** Redux, MobX, Zustand, Context API, etc.
- **Navigation:** React Navigation, React Native Navigation, etc.
- **Charts:** Recharts equivalent for RN (Victory, React Native SVG, etc.)
- **Animations:** Reanimated vs React Native Animated vs Framer Motion RN
- **Styling:** StyleSheet vs Tamagui vs NativeWind vs Styled Components
- **Testing:** Jest, Detox, Appium, etc.

---

## 🚨 Critical Rules (Do Not Violate)

### Copy Guidelines (Epistemic Restraint)
```
✓ ALLOWED:
  "Your feed contained 70% content from accounts you don't follow"
  "Algorithms are designed to keep users scrolling"
  "This pattern may suggest..."
  "Based on observable data..."

✗ FORBIDDEN:
  "The algorithm wants you to..." (anthropomorphizes)
  "TikTok specifically uses X technique" (unverifiable)
  "You should follow more accounts" (prescriptive)
  "This proves you believe..." (assumes identity)
  "You are a person who..." (identity claim)
```

### Design Rules
```
✓ REQUIRED:
  All hex colors must match exactly
  Font sizes must match (or scale appropriately for mobile)
  Spacing must follow Tailwind scale
  Touch targets minimum 44px × 44px
  Card border radius 16px (rounded-2xl)
  Button border radius 12px (rounded-xl)

✗ DO NOT:
  Change the 6 tab names or order
  Change the tab accent colors
  Add additional colors to the palette
  Use different font family
  Remove InsightHero or SectionHeader patterns
  Anthropomorphize the algorithm in any copy
```

### Data Structure Rules
```
✓ REQUIRED:
  Match the data structures from dashboardCatalog.js
  Use the same aggregation functions (or port them)
  Implement the same state hooks (or equivalent)
  Return data in the same format

✗ DO NOT:
  Change the data structure shape
  Add extra fields without documenting why
  Use different naming conventions
  Skip aggregation (calculate on demand instead)
```

---

## 📱 Responsive Design for Mobile

### Standard Approach
- Mobile first (start with mobile layout)
- Desktop is not a concern for mobile app
- Use native mobile patterns (not web patterns)
- Bottom tab bar (standard mobile UX)
- Full-width cards with gutters (mobile standard)

### Typography on Mobile
```
Hero:         24px (smaller than desktop 32px)
Section head: 18px (same as desktop)
Body:         14px (smaller than desktop 16px)
Small:        12px (smaller than desktop 14px)
Labels:       10px (smaller than desktop 11px)
```

### Spacing on Mobile
```
Compact padding:  12px (instead of 20px on desktop)
Section gap:      32px (instead of 48px on desktop)
Card padding:     16px (instead of 24px on desktop)
```

---

## 🧪 Quality Checklist Before Launch

### Visual Quality
- [ ] All hex colors match exactly (use color picker)
- [ ] Font sizes compare to reference (measure in pixels)
- [ ] Spacing uses Tailwind scale (4px, 8px, 12px, etc)
- [ ] Shadows are pixel-perfect
- [ ] Border radius matches (12px, 16px, 20px, 28px)
- [ ] Component alignment is precise

### Functional Quality
- [ ] All 6 tabs load and display content
- [ ] Tab switching is smooth
- [ ] Data aggregation produces correct output
- [ ] Filters work (platform, date range)
- [ ] Plan tier gating blocks/unlocks correctly
- [ ] Paywall modal appears for upgrades

### User Experience Quality
- [ ] Touch targets are 44px minimum
- [ ] Tap response is instant (< 100ms)
- [ ] Scrolling is smooth
- [ ] Animations feel polished
- [ ] Loading states show (no blank screens)
- [ ] Error states are handled gracefully

### Accessibility Quality
- [ ] Color contrast passes WCAG AA (4.5:1)
- [ ] Screen reader works (VoiceOver/TalkBack)
- [ ] Focus states are visible
- [ ] Text sizes are legible
- [ ] Touch targets are well-spaced
- [ ] No text is critical in images

### Performance Quality
- [ ] Dashboard loads in < 2 seconds
- [ ] Tab switch < 500ms
- [ ] Scroll FPS > 55
- [ ] Charts render smoothly
- [ ] Bundle size reasonable

---

## 📞 When You Get Stuck

**Problem:** "What color should this be?"
**Solution:** Check MOBILE_QUICK_REFERENCE.md - Brand Colors section

**Problem:** "What props does this component take?"
**Solution:** Check MOBILE_APP_COMPONENT_MAP.md - the specific component section

**Problem:** "What data structure does this endpoint return?"
**Solution:** Check dashboardCatalog.js in source code for exact structure

**Problem:** "How should this copy be worded?"
**Solution:** Check MOBILE_APP_DESIGN_SPEC.md - User-Facing Copy section

**Problem:** "What's the exact spacing here?"
**Solution:** Check MOBILE_APP_DESIGN_SPEC.md - Spacing & Layout section

**Problem:** "I need the shadow value"
**Solution:** Check MOBILE_QUICK_REFERENCE.md - Shadow System section

---

## 📈 Success Metrics

### Launch Target
- Functional parity with web dashboard
- All 6 tabs working
- Data aggregation accurate
- Plan tier gating active
- Performance acceptable (< 2s load)

### Post-Launch Target
- Accessibility score AAA
- Performance score 90+
- User retention > 60%
- Crash-free rating > 99%

---

## 🎓 Learning Resources

### Understand the Domain
1. Read `/CLAUDE.md` (project instructions, epistemic restraint)
2. Read `/AlgorithmLens_Cowork/DASHBOARD_AUDIT.md` (context on decisions)

### Understand the Design
1. Read MOBILE_APP_DESIGN_SPEC.md (complete reference)
2. Read MOBILE_APP_COMPONENT_MAP.md (implementation details)
3. Read MOBILE_QUICK_REFERENCE.md (lookups while coding)

### Understand the Code
1. Start with `/pages/dashboard/DashboardPage.jsx` (orchestrator)
2. Read one full tab (e.g., `/pages/dashboard/tabs/OverviewTab.jsx`)
3. Read `/pages/dashboard/dashboardCatalog.js` (view definitions)
4. Read component files (InsightHero, SectionHeader, Button)

### Understand the Data
1. Read `/lib/dashboard/aggregators/` directory
2. Read `/lib/dashboard/dataHelpers.js`
3. Run the aggregators with sample data locally
4. Verify the output shape matches specs

---

## 📝 Documentation Maintenance

These documents are generated from the actual source code:
- `/AlgorithmLens_Cowork/src/lib/theme/tokens.js`
- `/AlgorithmLens_Cowork/tailwind.config.js`
- `/AlgorithmLens_Cowork/src/pages/dashboard/dashboardCatalog.js`
- `/AlgorithmLens_Cowork/src/pages/dashboard/dashboardConstants.js`

If the web design changes:
1. Update the source files in the React codebase
2. Regenerate these documentation files
3. Verify color codes, font sizes, component specifications
4. Update MOBILE_QUICK_REFERENCE.md accordingly

---

## 🎯 TL;DR (Too Long, Didn't Read)

**You have 3 files:**
1. **MOBILE_APP_DESIGN_SPEC.md** - Complete reference (start here)
2. **MOBILE_APP_COMPONENT_MAP.md** - How components fit together
3. **MOBILE_QUICK_REFERENCE.md** - Fast lookups while coding

**The 3 most important colors:**
- `#2563EB` (primary blue - 70%)
- `#10B981` (accent green - 30%)
- `#1E293B` (text - dark slate)

**The 6 tabs (in order):**
1. Overview (blue)
2. Who Shapes Your Feed (indigo)
3. Ads & Promotions (orange)
4. Political Exposure (purple)
5. Emotional Tone (teal)
6. Suggested vs. Followed (rose)

**The pattern every tab follows:**
1. InsightHero card (key takeaway with data)
2. SectionHeader (labeled "Observed")
3. Primary visualization
4. SectionHeader (labeled "Context")
5. Secondary visualization
6. Optional "Talk to Algorithm" (green, premium only)

**The critical rule:**
Never anthropomorphize the algorithm or make unverifiable claims.

---

**Generated:** 2026-02-24
**Version:** 1.0
**Status:** Complete & Ready for Implementation
