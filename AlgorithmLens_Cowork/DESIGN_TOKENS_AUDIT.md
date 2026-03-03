# AlgorithmLens Web Design Tokens Audit

**Document Purpose:** Complete extraction of all design tokens from the AlgorithmLens website for cross-referencing with mobile app implementation.

**Last Updated:** 2026-02-24

**Source Files:**
- `/src/tailwind.config.js` - Theme configuration
- `/src/index.css` - Global styles
- `/src/pages/dashboard/TabNavigation.jsx` - Tab component
- `/src/pages/dashboard/TabHero.jsx` - Hero insight component
- `/src/pages/dashboard/dashboardCatalog.js` - Dashboard catalog with tab definitions
- `/src/pages/dashboard/DashboardHeader.jsx` - Page header

---

## 1. COLOR PALETTE

### Primary Brand Colors
- **Primary Blue:** `#2563EB`
  - Used for: Primary buttons, links, active states, accents
  - Tailwind reference: `primary-blue`
  - Opacity variants in code: `#2563EB` with `30` (transparency suffix), `rgba(37, 99, 235, 0.25)`

- **Accent Green:** `#10B981`
  - Used for: Success states, alt accent
  - Tailwind reference: `accent-green`

### Background Colors
- **Page Background:** `#F7F8FC`
  - Tailwind reference: `bg-page`
  - Usage: Main page background

- **Surface Default:** `#FFFFFF`
  - Tailwind reference: `surface-default`
  - Usage: Cards, modals, surfaces

### Text Colors
- **Text Main:** `#1E293B`
  - Tailwind reference: `text-main`
  - Usage: Primary text, headings

- **Text Muted:** `#4B5563`
  - Tailwind reference: `text-muted`
  - Usage: Secondary text, labels, metadata
  - Note: Darkened from `#64748B` for WCAG AA contrast compliance

### Border Colors
- **Border Light:** `rgba(30, 41, 59, 0.08)`
  - Tailwind reference: `border-light`
  - Usage: Dividers, subtle borders

### Status Colors
- **Status Success:** `#059669`
  - Usage: Success states, positive indicators

- **Status Error:** `#DC2626`
  - Usage: Error states, alerts

- **Status Warning:** `#D97706`
  - Usage: Warning states, cautions

### Grayscale / Slate Palette
Extended palette used throughout:
- **Blue-50:** `#EFF6FF` (light blue backgrounds)
- **Blue-100:** `#DBEAFE` (light blue borders, hovers)
- **Blue-200:** `#BFDBFE` (medium light blue)
- **Blue-600:** `#2563EB` (primary blue)
- **Blue-700:** `#1D4ED8` (darker blue, hovers)
- **Blue-800:** `#1E40AF` (darkest blue)
- **Green-50:** `#ECFDF5` (light green backgrounds)
- **Green-100:** `#D1FAE5` (light green borders)
- **Green-200:** `#A7F3D0` (medium light green)
- **Green-500:** `#10B981` (accent green)
- **Green-600:** `#059669` (darker green)
- **Green-700:** `#047857` (darkest green)

### Additional Common Grays
- **Slate-50:** `#F8FAFC`
- **Slate-100:** `#F1F5F9`
- **Slate-200:** `#E2E8F0`
- **Slate-400:** `#94A3B8`
- **Slate-500:** `#64748B`
- **Slate-600:** `#475569`
- **Slate-700:** `#334155`
- **Slate-800:** `#1E293B`
- **Slate-900:** `#0F172A`

### Scrollbar Colors (Custom)
```css
scrollbar-thumb background: #CBD5E1
scrollbar-thumb hover: #94A3B8
scrollbar-track: transparent
```

---

## 2. TYPOGRAPHY

### Font Family
**System Font Stack (via Tailwind `sans` extend):**
```
font-family: 'Inter', 'Plus Jakarta Sans', 'sans-serif'
```

### Font Sizes (used in components)
- **Hero Headline:** `clamp(1.625rem, 4.5vw, 2.25rem)`
  - Line height: `1.25`
  - Font weight: `bold` (700)
  - Letter spacing: `-0.025em` (tight)

- **Standard H2 Heading:** `font-bold text-slate-800`

- **Tab Label:** `text-[11px]` (mobile) / `text-sm` (desktop)
  - Font weight: `semibold` (600)
  - Letter spacing: `-0.01em`

- **Kicker/Label:** `11px`
  - Font weight: `500` (medium)
  - Letter spacing: `0.04em` or `0.14em` (contextual)
  - Text transform: `uppercase` (sometimes)

- **Meta/Pill Text:** `11px`
  - Font weight: `500` (medium)

- **Body Text (Reading):** `15px`
  - Line height: `1.65`

- **Small Text / Metadata:** `12px` to `14px`

### Letter Spacing (Tailwind custom)
- **`tight-hero`:** `-0.03em` (hero headlines)
- **`tight-heading`:** `-0.02em` (section headings)
- **`tight-card`:** `-0.01em` (card titles)
- **`wide-label`:** `0.05em` (labels)
- **`wider-label`:** `0.1em` (uppercase labels)

### Font Weights
- **Bold:** `700`
- **Semibold:** `600`
- **Medium:** `500`
- **Regular:** `400`

---

## 3. SPACING & SIZING

### Padding (Clamp-based for responsiveness)
- **Hero Card Padding:** `clamp(2rem, 5vw, 3.5rem)` (top/bottom) × `clamp(1.75rem, 4vw, 3rem)` (left/right)
- **Standard Padding:** `1rem`, `1.5rem`, `2rem`, `2.5rem`, `3rem`, `3.5rem`

### Margins
- **Hero Margin Bottom:** `mb-10` (Standard Tailwind) or `mb-12 sm:mb-16 md:mb-20` (Feature moment wrapper)
- **Feature Moment:** `-mx-2 sm:-mx-4 md:-mx-8` (Negative margins for full-bleed effect)
- **Tab Container:** `mb-6` (algorithm tab) or `mb-10` (other tabs)

### Gap Spacing
- **Tab Navigation Gap:** `gap-1.5` (between tab buttons)
- **Button Gap:** `gap-1.5 sm:gap-2` (between icon and label in tabs)
- **Card Header Gap:** `gap-3` (between kicker and meta)
- **Standard Gaps:** `gap-2`, `gap-3`, `gap-4`, `gap-5`

### Min/Max Widths
- **Reading Column Wrapper:** `max-width: 1024px` (max-w-5xl equivalent)
- **Hero Meta Pill:** `padding: 0.375rem 0.875rem`

### Button/Input Sizing
- **Tab Button Min Height:** `min-h-[40px]`
- **Responsive Padding:** `px-3 sm:px-5 py-2.5` (tabs)

---

## 4. BORDER RADIUS

### Tailwind Custom Values
- **`radius-sm`:** `12px`
- **`radius-md`:** `20px`
- **`radius-lg`:** `28px`
- **`pill`:** `9999px` (fully rounded)

### Common Uses
- **Tab Navigation Container:** `rounded-2xl` (implies `16px`)
- **Tab Buttons:** `rounded-xl` (implies `12px`)
- **Hero Card:** `rounded-2xl` (implies `16px`)
- **Feature Moment:** `borderRadius: '24px'` (inline style)
- **Evidence Box:** `rounded-2xl` (inline `border-radius: 24px`)
- **Meta Pill:** `rounded-full` (completely circular)

---

## 5. SHADOWS

### Tailwind Custom Shadows
```javascript
'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)'
'medium': '0 8px 24px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.03)'
'strong': '0 20px 60px rgba(15, 23, 42, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)'
'glow': '0 0 20px rgba(37, 99, 235, 0.25), 0 0 6px rgba(37, 99, 235, 0.1)'
'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)'
'card-hover': '0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(15, 23, 42, 0.06)'
'hero': '0 8px 40px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(37, 99, 235, 0.04)'
```

### Component-Specific Shadows (inline styles)
- **Tab Navigation (inset):** `inset 0 1px 2px rgba(0, 0, 0, 0.03)`
- **Tab Button (active):** `0 2px 8px {accentColor}30, 0 1px 3px rgba(0,0,0,0.06)`
- **Hero Card:** `0 1px 3px rgba(0,0,0,0.04), 0 8px 40px rgba(37, 99, 235, 0.08)`
- **Feature Moment:** `0 1px 3px rgba(0,0,0,0.03), 0 8px 40px rgba(37, 99, 235, 0.05)`
- **Evidence Box:** `0 2px 4px rgba(0,0,0,0.04)` (minimal)

---

## 6. DASHBOARD TABS

### Tab Structure
**File Location:** `/src/pages/dashboard/dashboardCatalog.js`

### Tab Definitions (Exact Order)
```javascript
export const TABS = [
  { id: 'overview', label: 'Overview', accent: '#2563EB' },
  { id: 'sources', label: 'Who Shapes Your Feed', accent: '#6366F1' },
  { id: 'ads', label: "Ads & Promotions", accent: '#D97706' },
  { id: 'politics', label: 'Political Exposure', accent: '#7C3AED' },
  { id: 'tone', label: 'Emotional Tone', accent: '#0D9488' },
  { id: 'suggested_vs_followed', label: "Suggested vs. Followed", accent: '#E11D48' },
];
```

### Tab Accent Colors (Brand Coding)
1. **Overview:** `#2563EB` (Primary Blue)
2. **Who Shapes Your Feed (Sources):** `#6366F1` (Indigo)
3. **Ads & Promotions:** `#D97706` (Amber/Orange)
4. **Political Exposure:** `#7C3AED` (Purple/Violet)
5. **Emotional Tone:** `#0D9488` (Teal)
6. **Suggested vs. Followed:** `#E11D48` (Rose/Red)

### Tab Navigation Styling
- **Container Background:** `linear-gradient(180deg, rgba(241, 245, 249, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)`
- **Container Border:** `1px solid rgba(226, 232, 240, 0.6)`
- **Container Shadow:** `inset 0 1px 2px rgba(0, 0, 0, 0.03)`
- **Container Border Radius:** `rounded-2xl` (16px)

### Tab Button States
**Inactive State:**
- **Text Color:** `#64748B` (slate-500)
- **Background:** `transparent`
- **Hover Background:** `rgba(255, 255, 255, 0.7)`
- **Hover Text Color:** `#1E293B` (text-main)

**Active State:**
- **Text Color:** `#FFFFFF` (white)
- **Background:** `linear-gradient(135deg, {accentColor} 0%, {accentColor}DD 100%)`
- **Shadow:** `0 2px 8px {accentColor}30, 0 1px 3px rgba(0,0,0,0.06)`
- **Letter Spacing:** `-0.01em`

### Tab Button Sizing & Spacing
- **Padding:** `px-3 sm:px-5 py-2.5`
- **Gap Between Icon/Label:** `gap-1.5 sm:gap-2`
- **Font Size:** `text-[11px] sm:text-sm`
- **Font Weight:** `semibold` (600)
- **Border Radius:** `rounded-xl` (12px)
- **Min Height:** `min-h-[40px]`
- **Whitespace:** `whitespace-nowrap`

### Tab Focus State (A11y)
- **Focus Ring:** `focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/40 focus-visible:ring-offset-1`

### Tab Container Gap
- **Gap Between Tabs:** `gap-1.5`
- **Container Padding:** `p-1.5`
- **Scroll Behavior:** `scrollbar-hide` (custom utility)

---

## 7. HERO INSIGHT COMPONENT (TabHero)

### Hero Card Container Styling
**File Location:** `/src/pages/dashboard/TabHero.jsx`

### Main Hero Card
- **Background:** `linear-gradient(135deg, #FFFFFF 0%, #F0F5FF 40%, #EFF6FF 70%, #F0F5FF 100%)`
- **Border:** `1px solid rgba(37, 99, 235, 0.15)` (subtle blue tint)
- **Padding:** `clamp(2rem, 5vw, 3.5rem) clamp(1.75rem, 4vw, 3rem)`
- **Border Radius:** `rounded-2xl` (24px inline style)
- **Shadow:** `0 1px 3px rgba(0,0,0,0.04), 0 8px 40px rgba(37, 99, 235, 0.08)`
- **Transition:** `duration-300` (hover state)
- **Hover Shadow:** `hover:shadow-lg`

### Hero Header Row (Kicker + Meta)
- **Display:** `flex flex-wrap items-center justify-between gap-3 mb-6`

### Kicker (Editorial Label)
- **Font Size:** `11px`
- **Color:** `#64748B` (text-muted)
- **Letter Spacing:** `0.04em` (with scopeLabel) or `0.14em` (without)
- **Font Weight:** `500` (medium)
- **Text Transform:** conditional `uppercase`

### Meta Pill (Data Badge)
- **Background:** `rgba(255, 255, 255, 0.7)` (semi-transparent white)
- **Border:** `1px solid rgba(37, 99, 235, 0.2)` (subtle blue)
- **Padding:** `0.375rem 0.875rem`
- **Font Size:** `11px`
- **Color:** `#64748B` (text-muted)
- **Font Weight:** `500` (medium)
- **Border Radius:** `rounded-full` (9999px)
- **Icon Size:** `12px`
- **Icon Color:** `text-slate-400`

### Headline Section
- **Margin Left:** `-1rem` (negative indent)
- **Padding Left:** `1rem` (balance negative margin)

### Blue Accent Bar (Left Side)
- **Width:** `6px`
- **Height:** Full height of headline
- **Background:** `linear-gradient(180deg, #2563EB 0%, #60A5FA 100%)`
- **Border Radius:** `rounded-r-lg` (right corners only)

### H2 Headline
- **Font Family:** `system-ui` (var fallback)
- **Font Weight:** `bold` (700)
- **Font Size:** `clamp(1.625rem, 4.5vw, 2.25rem)` (responsive)
- **Line Height:** `1.25`
- **Letter Spacing:** `-0.025em`
- **Max Width:** `100%`
- **Color:** `text-slate-800`

### Body/Context Text (Optional)
- **Font Size:** `15px`
- **Line Height:** `1.65`
- **Max Width:** `680px`
- **Color:** `text-slate-600`

### "How We Know This" Button
- **Display:** `inline-flex items-center gap-2 text-sm font-medium`
- **Background:** `rgba(37, 99, 235, 0.06)` (light blue)
- **Border:** `1px solid rgba(37, 99, 235, 0.12)` (subtle blue)
- **Color:** `rgba(37, 99, 235, 0.85)` (muted blue)
- **Padding:** `0.5rem 1rem`
- **Border Radius:** `rounded-full` (9999px)
- **Hover Background:** `hover:bg-blue-100`
- **Transition:** `transition-all`
- **Chevron Rotation:** `rotate(0deg)` (closed) → `rotate(180deg)` (open)
- **Chevron Size:** `16px`

### Evidence Expansion Area
- **Top Border:** `1px solid rgba(226, 232, 240, 0.6)`
- **Top Padding:** `1rem`
- **Margin Top:** `mt-6`
- **Background (expanded):** `linear-gradient(180deg, rgba(37, 99, 235, 0.04) 0%, rgba(248, 250, 252, 0.85) 100%)`
- **Border (expanded):** `1px solid rgba(37, 99, 235, 0.10)`
- **Padding (expanded):** `1.25rem`
- **Border Radius (expanded):** `rounded-2xl` (24px)

### Feature Moment Wrapper
- **Background:** `linear-gradient(180deg, #FFFFFF 0%, rgba(239, 246, 255, 0.5) 40%, rgba(239, 246, 255, 0.3) 70%, #FFFFFF 100%)`
- **Border Radius:** `24px`
- **Border:** `1px solid rgba(37, 99, 235, 0.08)`
- **Shadow:** `0 1px 3px rgba(0,0,0,0.03), 0 8px 40px rgba(37, 99, 235, 0.05)`
- **Margin Top:** `2rem`
- **Padding:** `clamp(2rem, 5vw, 3.5rem) clamp(2rem, 5vw, 3rem)`
- **Negative Margins:** `-mx-2 sm:-mx-4 md:-mx-8` (full bleed)

### Decorative Elements
**Top Divider Bar:**
- **Width:** `48px`
- **Height:** `3px`
- **Background:** `linear-gradient(90deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.35), rgba(37, 99, 235, 0.1))`
- **Border Radius:** `0 0 3px 3px`
- **Position:** `absolute top-0 left-1/2 -translate-x-1/2`

**Premium Glow Effect:**
- **Type:** `radial-gradient(ellipse at top center, rgba(37, 99, 235, 0.03) 0%, transparent 50%)`
- **Position:** `absolute inset-0`
- **Border Radius:** `24px`
- **Pointer Events:** `none`

---

## 8. DASHBOARD HEADER

### Main Header Container
- **Display:** `flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4`
- **Margin Bottom:** `mb-4` (algorithm tab) or `mb-6 sm:mb-8` (other tabs)

### Title Section
- **H1 "Dashboard" Font Size:** `text-lg sm:text-xl` (algorithm tab) / `text-2xl sm:text-3xl` (other tabs)
- **Font Weight:** `bold` (700)
- **Color:** `text-text-main` (#1E293B)
- **Margin Bottom:** `mb-1` (algorithm) / `mb-2` (other)

### Subtitle / Description
- **Font Size:** `text-sm` or implicit text size
- **Color:** `text-text-muted` (#4B5563)

### Date Range Filter
- **Label Font Size:** `text-xs sm:text-sm`
- **Label Color:** `text-text-muted`
- **Select Element:**
  - Border: `1px solid #E2E8F0` (border-slate-200)
  - Padding: `px-3 py-1.5`
  - Font Size: `text-sm`
  - Background: `white`
  - Border Radius: `rounded-lg` (8px)
  - Hover Border: `hover:border-slate-300`
  - Focus: `focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue`

### Action Buttons Area
- **Display:** `flex flex-wrap items-center gap-2 sm:gap-3`

### Refresh Button
- **Display:** `flex items-center gap-2`
- **Padding:** `px-3 py-1.5`
- **Font Size:** `text-sm`
- **Color:** `text-text-muted`
- **Border:** `1px solid #E2E8F0`
- **Border Radius:** `rounded-lg` (8px)
- **Hover:** `hover:text-text-main hover:bg-white`
- **Transition:** `transition-colors`
- **Icon Spin (when loading):** `animate-spin`

---

## 9. ANIMATIONS & TRANSITIONS

### Tailwind Custom Animations
```javascript
'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite'
'scroll-slow': 'scroll 40s linear infinite'
```

### Keyframes
```javascript
scroll: {
  '0%': { transform: 'translateX(0)' },
  '100%': { transform: 'translateX(-50%)' }
}
```

### Common Transitions
- **Hover Effects:** `transition-all` or `transition-colors`
- **Duration:** `duration-200` (default in code)
- **Duration:** `duration-300` (hero card)

### Chevron Animation (Evidence Toggle)
- **Default:** `rotate(0deg)`
- **Expanded:** `rotate(180deg)`
- **Transition:** `transition-transform`

### Scroll Behavior
- **HTML:** `scroll-behavior: smooth`
- **Tab Navigation:** `scrollBehavior: 'smooth'`, `WebkitOverflowScrolling: 'touch'`

### Custom Utility: `.scrollbar-hide`
Hides scrollbar while maintaining scroll functionality for tab bars on mobile

---

## 10. RESPONSIVE DESIGN BREAKPOINTS

### Tailwind Breakpoints (Standard)
- **`sm`:** 640px
- **`md`:** 768px
- **`lg`:** 1024px
- **`xl`:** 1280px

### Common Responsive Patterns in Component
- **Tab Button Font:** `text-[11px] sm:text-sm`
- **Tab Button Padding:** `px-3 sm:px-5`
- **Tab Button Gap:** `gap-1.5 sm:gap-2`
- **Header Layout:** `flex-col md:flex-row` (stack on mobile, row on tablet+)
- **Feature Moment Negative Margins:** `-mx-2 sm:-mx-4 md:-mx-8`
- **Clamp Functions:** `clamp()` used for fluid typography and spacing

---

## 11. ACCESSIBILITY & FOCUS STATES

### Tab Navigation (WAI-ARIA)
- **Role:** `tablist`, `tab`, `tabpanel`
- **Focus Style:** `focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/40 focus-visible:ring-offset-1`
- **Aria Attributes:**
  - `aria-selected={isActive}`
  - `aria-controls={`tabpanel-${tab.id}`}`
  - `aria-label={tab.label}`
  - `tabIndex={isActive ? 0 : -1}`

### Scrollbar (Reduced Motion)
```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Button States (Hero Evidence Toggle)
- **aria-expanded:** `isEvidenceExpanded` (boolean)
- **aria-label:** Dynamic text ("Show evidence" vs "Hide details")

---

## 12. GLOBAL STYLES

### Scrollbar Styling (Custom)
```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}
```

### Firefox Scrollbar
```css
* {
  scrollbar-width: thin;
  scrollbar-color: #CBD5E1 transparent;
}
```

### Base Styles
- **Font Antialiasing:** `antialiased`
- **Default Text Color:** `text-gray-900` (Tailwind default)
- **Default Background:** `bg-white`

---

## 13. KEY COMPONENT FILES & STRUCTURE

### Navigation Structure
```
DashboardPage (orchestrator)
├── DashboardHeader (page title, filters, actions)
├── TabNavigation (tab switcher buttons)
├── TabRenderer (active tab content)
│   ├── TabHero (insight card with evidence toggle)
│   ├── ViewCard (data visualization)
│   └── Supporting Cards
└── PageFooter
```

### File Locations
| Component | File Path |
|-----------|-----------|
| Tab Definitions | `/src/pages/dashboard/dashboardCatalog.js` |
| Tab Navigation UI | `/src/pages/dashboard/TabNavigation.jsx` |
| Hero Component | `/src/pages/dashboard/TabHero.jsx` |
| Page Header | `/src/pages/dashboard/DashboardHeader.jsx` |
| Main Dashboard | `/src/pages/dashboard/DashboardPage.jsx` |
| Theme Config | `/tailwind.config.js` |
| Global Styles | `/src/index.css` |

---

## 14. CRITICAL DESIGN DECISIONS

### Color Coding Strategy
Each dashboard tab has a unique accent color for visual distinction and brand expression. These are applied to:
- Active tab button backgrounds (with gradient)
- Active tab shadows
- Icon/label colors in active state
- Sometimes used in card headers and accent bars

### Hero-First Design Pattern
The dashboard emphasizes insight over data:
1. Large, readable headline (takeaway)
2. Optional context line
3. Expandable evidence section (via "How We Know This" button)
4. All copy written in accessible, non-technical language

### Responsive Spacing (Clamp)
High-end production uses CSS `clamp()` function for fluid sizing:
- `clamp(min, preferred, max)`
- Example: `clamp(2rem, 5vw, 3.5rem)` scales between 32px and 56px based on viewport

### Scrollbar Customization
Custom scrollbar colors use slate palette to match the design system. Hidden on mobile tab bars while maintaining scroll functionality.

### Premium Visual Hierarchy
Multiple shadow layers create visual depth:
- `soft`: Subtle dividers and light content
- `medium`: Standard cards and components
- `strong`: Emphasized sections
- `glow`: Blue accent highlights
- `hero`: Featured hero cards
- `card`: Default card shadow
- `card-hover`: Enhanced card hover state

---

## 15. CROSS-PLATFORM CHECKLIST FOR MOBILE

Use this checklist when auditing the mobile app:

### Colors
- [ ] Primary blue `#2563EB` matches exactly
- [ ] Tab accent colors match (6 distinct accent colors)
- [ ] Text colors match (`#1E293B`, `#4B5563`)
- [ ] Border colors use correct opacity
- [ ] Shadows match all 7 custom shadow definitions

### Typography
- [ ] Font family: Inter + Plus Jakarta Sans
- [ ] Hero headline responsive sizing: `clamp(1.625rem, 4.5vw, 2.25rem)`
- [ ] Letter spacing values match (tight-hero, tight-heading, etc.)
- [ ] Font weights: 400, 500, 600, 700

### Spacing
- [ ] Hero padding clamps: `clamp(2rem, 5vw, 3.5rem)`
- [ ] Tab gaps: `gap-1.5`
- [ ] Standard padding/margins used consistently
- [ ] Negative margins for full-bleed effects preserved

### Tabs
- [ ] All 6 tabs rendered in correct order
- [ ] Tab labels match exactly (including capitalization)
- [ ] Accent colors applied to active states
- [ ] Focus/keyboard navigation accessible

### Components
- [ ] Hero card styling (gradient, border, shadow)
- [ ] "How We Know This" button styling
- [ ] Tab navigation styling (container, buttons, active state)
- [ ] Evidence expansion area styling

### Accessibility
- [ ] Keyboard navigation (arrow keys, Home, End)
- [ ] ARIA roles and attributes (tablist, tab, aria-selected)
- [ ] Focus ring color and offset
- [ ] Reduced motion media query respected

---

## 16. DESIGN TOKEN EXPORT FOR DEVELOPMENT

### CSS Variables (Suggested Implementation)
```css
:root {
  /* Colors */
  --color-primary-blue: #2563EB;
  --color-accent-green: #10B981;
  --color-bg-page: #F7F8FC;
  --color-surface-default: #FFFFFF;
  --color-text-main: #1E293B;
  --color-text-muted: #4B5563;
  --color-border-light: rgba(30, 41, 59, 0.08);

  /* Typography */
  --font-family-sans: 'Inter', 'Plus Jakarta Sans', 'sans-serif';
  --font-size-hero: clamp(1.625rem, 4.5vw, 2.25rem);
  --line-height-hero: 1.25;
  --letter-spacing-tight-hero: -0.025em;

  /* Spacing */
  --spacing-base: 1rem;
  --spacing-hero-padding: clamp(2rem, 5vw, 3.5rem);

  /* Borders */
  --border-radius-sm: 12px;
  --border-radius-md: 20px;
  --border-radius-lg: 28px;
  --border-radius-pill: 9999px;

  /* Shadows */
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  --shadow-hero: 0 8px 40px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(37, 99, 235, 0.04);
}
```

---

## 17. KNOWN VARIATIONS & EDGE CASES

### Tab Button Styling Edge Cases
1. **Inactive hover:** Changes to `rgba(255, 255, 255, 0.7)` background
2. **Active state:** Uses accent color-specific gradient
3. **Focus ring:** Applied with specific color and offset

### Hero Card Responsive
1. **Clamp-based padding:** Scales with viewport, not fixed
2. **Feature moment wrapper:** Uses negative margins for full-bleed on mobile
3. **Font size:** Responsive via clamp, not media queries

### Evidence Section
1. Only rendered when `isEvidenceExpanded === true`
2. Gradient background + border different from main card
3. Contains ViewCard component (sub-component)

---

## 18. VERSION HISTORY

| Date | Change | File |
|------|--------|------|
| 2026-02-24 | Initial comprehensive audit | All listed files |
| | Extracted all color codes | tailwind.config.js |
| | Documented typography | src/index.css, TabHero.jsx |
| | Mapped spacing tokens | TabNavigation.jsx, TabHero.jsx |
| | Tab definitions captured | dashboardCatalog.js |

---

**End of Document**

This audit provides a complete specification for replicating the AlgorithmLens web design system in the mobile app. All values are extracted from live source code and verified for accuracy.
