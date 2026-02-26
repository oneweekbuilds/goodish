# AlgorithmLens Mobile App - Quick Reference Guide
## Essential Design Tokens & Implementation Checklist

**Last Updated:** February 24, 2026

---

## 🎨 Brand Colors (Copy These Hex Codes)

### Primary & Secondary
```
Primary Blue:     #2563EB  (70% dominance)
Accent Green:     #10B981  (30% dominance)
Text Main:        #1E293B  (near-black)
Text Muted:       #4B5563  (secondary text)
Background:       #F7F8FC  (off-white page)
Surface:          #FFFFFF  (white cards)
```

### Tab Accent Colors
```
Overview:         #2563EB  (Blue)
Sources:          #6366F1  (Indigo)
Ads:              #D97706  (Orange)
Politics:         #7C3AED  (Purple)
Tone:             #0D9488  (Teal)
Suggested:        #E11D48  (Rose)
```

### Status Colors
```
Success:          #059669  (Green)
Error:            #DC2626  (Red)
Warning:          #D97706  (Orange)
```

---

## 📐 Typography Standards

### Font Family
```
Primary: Inter, Plus Jakarta Sans, sans-serif
Weights: 400, 600, 700, 800
```

### Font Sizes
```
Hero h1:          clamp(30px, 5vw, 32px)
Section h2:       clamp(20px, 3vw, 26px)
Header h3:        15px
Section titles:   18px (1.125rem)
Body text:        16px (default)
Small text:       14px
Labels/chips:     11px
```

### Font Weights & Usage
```
400 = Body text, description
600 = Emphasis, section headers, labels
700 = Headings, strong emphasis
800 = Hero headings only
```

### Letter Spacing
```
Hero titles:      -0.03em  (tight)
Section headers:  -0.02em  (tight)
Card text:        -0.01em  (tight)
Labels:           +0.05em to +0.1em (wide)
```

---

## 🎭 Shadow System (6 Levels)

```javascript
soft:        0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)
medium:      0 8px 24px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.03)
strong:      0 20px 60px rgba(15, 23, 42, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)
glow:        0 0 20px rgba(37, 99, 235, 0.25), 0 0 6px rgba(37, 99, 235, 0.1)
card:        0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)
card-hover:  0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(15, 23, 42, 0.06)
hero:        0 8px 40px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(37, 99, 235, 0.04)
```

---

## 🔲 Border Radius

```
12px    (rounded-xl, radius-sm)  - Default button radius
16px    (rounded-2xl, radius-md) - Default card radius
20px    (radius-md)              - Large components
28px    (radius-lg)              - Extra large components
9999px  (rounded-full, pill)     - Fully rounded
```

---

## 📏 Spacing Scale

```
4px  = p-1
8px  = p-2
12px = p-3
16px = p-4
20px = p-5
24px = p-6
32px = p-8
40px = p-10
48px = p-12
64px = p-16
```

---

## 🎯 Component Sizing

### Buttons
```
Small:   12px text, 8px vertical padding, 12px horizontal padding
Medium:  16px text, 12px vertical padding, 24px horizontal padding
Large:   18px text, 16px vertical padding, 32px horizontal padding

Touch Target: Minimum 44px height × 44px width
Border Radius: 12px (rounded-xl)
```

### Cards
```
Padding:        20px on mobile, 24px on desktop
Border Radius:  16px (rounded-2xl)
Border:         1px solid #E2E8F0
Shadow:         box-shadow: card
```

### Sections
```
Vertical Padding:   48px on mobile, 80px on desktop
Horizontal Padding: 16px on mobile, 24px on desktop
Max-width:          1280px (64rem)
```

---

## 🔄 Dashboard Tabs (6 Total)

```
1. Overview              id: overview
2. Who Shapes Your Feed  id: sources
3. Ads & Promotions     id: ads
4. Political Exposure   id: politics
5. Emotional Tone       id: tone
6. Suggested vs. Followed id: suggested_vs_followed
```

### Tab Button Styling
```
Active:   Gradient background (tab accent), white text, shadow
Inactive: Transparent, #64748B text
Hover:    rgba(255, 255, 255, 0.7) background
Focus:    2px ring of accent color

Padding:  12px horizontal (sm:20px), 10px vertical
Font:     semibold, 11px (sm:14px)
Border:   rounded-xl (12px)
```

---

## 📊 Insight Hero Card Pattern

**Every tab hero follows this structure:**

```
┌─────────────────────────────────────┐
│ ▌ [LABEL CHIP - accent color]       │
│   (e.g., "KEY TAKEAWAY")            │
│                                     │
│   Title: [Data value] + [meaning]   │
│   (font-weight: 700, -0.02em)       │
│                                     │
│   Meaning: Plain English explanation│
│   (font-weight: 400)                │
│                                     │
│   Why Care: Behavioral implications │
│   (optional, small text)            │
│                                     │
│   Meta: Data source footnote        │
│   (optional, very small)            │
└─────────────────────────────────────┘

Left Border: 1.5px gradient (accent color)
Background:  linear-gradient(135deg, accent8% → accent4% → white)
Border:      1px solid accent18%
Shadow:      0 1px 3px + 0 8px 32px with accent opacity
```

---

## 📋 Section Header Pattern

**Every section starts with this header:**

```
▌ [LABEL]        (optional, 11px, accent color, uppercase)
│ Section Title   (font-weight: 600, -0.01em)
│ Optional subtext (small, text-muted)

Left Bar: 4px width for h2, gradient from accent
Spacing:  12px gap between bar and text
Font:     h2=18px, h3=15px
```

---

## 🎬 Animation Principles

### Page Transitions
```javascript
opacity: 0 → 1 (duration: 200ms)
y: 20 → 0
```

### Card Entrance
```javascript
opacity: 0 → 1
y: 16 → 0
scale: 0.97 → 1
duration: 500ms
ease: [0.22, 1, 0.36, 1]
```

### Mobile Menu
```javascript
x: 100% → 0
spring: damping 30, stiffness 300
```

---

## ♿ Accessibility Requirements

### Touch Targets
```
Minimum: 44px × 44px
All interactive elements
Sufficient padding between adjacent targets
```

### Color Contrast
```
Text on background:    14.3:1 (AAA compliant)
Minimum requirement:   4.5:1 (AA for normal text)
                       3:1   (AA for large text)
```

### Keyboard Navigation
```
Tab:      Cycle through interactive elements
Shift+Tab: Reverse cycle
Arrow:    Navigate tab buttons (left/right/home/end)
Enter:    Activate buttons
Escape:   Close modals/menus
```

### Focus States
```
Visible ring: 2px solid accent-color
Offset:       2px (from element edge)
Always visible, never hidden
```

### Screen Reader
```
Use semantic HTML: <nav>, <main>, <footer>
aria-label on landmarks
aria-selected for tabs
role attributes where needed
Skip to main content link (visible on focus)
```

---

## 🚫 Never Do This

```
X DON'T: "The algorithm wants you to..."    (anthropomorphizes)
X DON'T: State unverifiable platform mechanics
X DON'T: Use vague adjectives: "mixed", "some", "moderate"
X DON'T: Tell users what to do: "You should..."
X DON'T: Make claims about user identity: "This shows who you are"
X DON'T: Use em dashes in hero copy (— character)
X DON'T: Moralizing about political exposure
X DON'T: Suggest specific behaviors/actions in hero cards

✓ DO:    State observable facts from the scan data
✓ DO:    Use hedging language: "may suggest", "based on data"
✓ DO:    Say "you could try" not "you should do"
✓ DO:    Focus on exposure, not identity or belief
✓ DO:    Explain WHY this matters for the user
```

---

## 📱 Responsive Breakpoints

```
Mobile:    < 640px    (default, mobile-first)
SM:        ≥ 640px    (small tablet)
MD:        ≥ 768px    (larger tablet)
LG:        ≥ 1024px   (desktop)
XL:        ≥ 1280px   (large desktop)
2XL:       ≥ 1536px   (extra large desktop)
```

### Common Mobile Adjustments
```
Padding:    px-4 → sm:px-6    (16px → 24px)
Spacing:    py-12 → sm:py-20  (48px → 80px)
Font:       text-sm → sm:text-base
Layout:     grid-cols-1 → sm:grid-cols-2
Gap:        gap-3 → gap-6
```

---

## 🔐 Plan Tier Gating

### Free Plan Can See
```
- Overview tab
- All 6 tabs (limited data)
- Static cards and charts
- Paywall prompts
```

### Plus Plan Can See
```
- All free features +
- "Talk to Algorithm" (green AI section)
- Trends comparison across time
- Premium filters
- Advanced insights
```

**Implementation:**
```javascript
const isPlusUser = planTier === PLAN_TIERS.PLUS

if (!isPlusUser) {
  openPaywall(placement)  // Show upgrade modal
}
```

---

## 📂 Source Code Locations (Web)

```
/AlgorithmLens_Cowork/src/

Dashboard System:
├── pages/dashboard/
│   ├── DashboardPage.jsx              (80% of logic)
│   ├── TabNavigation.jsx              (tab switcher)
│   ├── tabs/                          (6 individual tab files)
│   └── dashboardCatalog.js            (VIEW DEFINITIONS - source of truth)
│
Design Tokens:
├── lib/theme/tokens.js                (colors, semantic tokens)
└── tailwind.config.js                 (complete Tailwind configuration)

Components:
├── components/ui/Button.jsx           (4 button variants)
├── components/dashboard/
│   ├── InsightHero.jsx                (hero card)
│   ├── SectionHeader.jsx              (section headers)
│   ├── primitives/                    (reusable chart primitives)
│   ├── renderers/                     (data visualization)
│   └── charts/                        (chart components)
└── Navbar.jsx, Logo.jsx               (header)
```

---

## 🔗 Essential Files to Read First

1. **MOBILE_APP_DESIGN_SPEC.md** (this repo)
   - Complete design tokens
   - Tab specifications
   - Component patterns
   - Copy guidelines

2. **MOBILE_APP_COMPONENT_MAP.md** (this repo)
   - Component hierarchy
   - Props documentation
   - Data structures
   - Integration points

3. **/lib/theme/tokens.js**
   - Brand colors
   - Semantic tokens
   - Tailwind class mappings

4. **/pages/dashboard/dashboardCatalog.js**
   - View definitions
   - Data flow
   - Copy patterns

5. **/pages/dashboard/dashboardConstants.js**
   - Theme system
   - Surface tokens
   - Section headers

---

## ✅ Mobile Implementation Checklist

### Phase 1: Foundation
- [ ] Create React Native project
- [ ] Set up navigation (React Navigation tabs)
- [ ] Convert color system to theme
- [ ] Implement font stack (Inter equivalent)

### Phase 2: Layout
- [ ] Dashboard tab bar (6 tabs)
- [ ] Tab content area
- [ ] Insight hero card layout
- [ ] Section header layout

### Phase 3: Components
- [ ] Button variants (primary, secondary, ghost, success)
- [ ] Metric cards
- [ ] Data visualizations (bars, lines, tables)
- [ ] Loading skeletons

### Phase 4: Features
- [ ] Data aggregation (hook system)
- [ ] Plan tier gating
- [ ] Filter UI (platform, date)
- [ ] Paywall modal

### Phase 5: Polish
- [ ] Accessibility (VoiceOver/TalkBack)
- [ ] Touch feedback
- [ ] Error states
- [ ] Empty states
- [ ] Loading states

### Phase 6: Testing
- [ ] Unit tests (data functions)
- [ ] Integration tests (tab switching)
- [ ] E2E tests (user flows)
- [ ] Accessibility testing

---

## 🎯 Key Success Metrics

**Visual Fidelity:**
- Colors match to exact hex values
- Typography scale accurate to pixel
- Spacing consistent with Tailwind scale
- Component spacing (padding/margin) exact

**Functional Parity:**
- All 6 tabs functional
- Data aggregation working
- Plan tier gating active
- Tab switching smooth

**User Experience:**
- Touch targets 44px minimum
- Load time < 2 seconds
- Smooth animations
- Error handling graceful

**Accessibility:**
- WCAG AA color contrast
- Keyboard navigation works
- Screen reader compatible
- Focus states visible

---

## 💡 Pro Tips

1. **Start with Overview tab** - it has the most variety of components
2. **Use dashboardCatalog.js as reference** - it's the exact source of truth for all views
3. **Tab accent colors** - each tab should use its assigned color throughout
4. **InsightHero is critical** - all hero cards follow the same pattern
5. **Copy matters** - never anthropomorphize the algorithm
6. **Test early and often** - accessibility and performance matter

---

**Generated:** 2026-02-24
**Version:** 1.0 (Quick Reference)
