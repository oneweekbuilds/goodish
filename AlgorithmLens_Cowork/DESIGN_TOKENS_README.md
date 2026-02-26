# AlgorithmLens Design Tokens Documentation

This directory contains a complete extraction of all design tokens from the AlgorithmLens website for cross-referencing with the mobile app implementation.

## Documents in This Audit

### 1. DESIGN_TOKENS_AUDIT.md (Primary Reference)
**Size:** 24KB | **Sections:** 18 | **Updated:** 2026-02-24

The complete, comprehensive design specification including:
- Color palette (primary, secondary, status, extended palette)
- Typography specifications (fonts, sizes, weights, spacing)
- Spacing & sizing tokens (padding, margin, gaps, clamps)
- Border radius definitions (4 custom sizes)
- Complete shadow library (7 custom shadow definitions)
- Dashboard tab specifications (6 tabs with exact order and accent colors)
- Hero component styling (card, button, evidence section)
- Tab navigation styling (container, buttons, states)
- Global styles and scrollbar customization
- Component file structure and locations
- Critical design decisions and rationale
- Accessibility and focus states
- Cross-platform verification checklist (17 points)
- Design token export recommendations

**Best for:** Detailed specification review, understanding design decisions, comprehensive auditing

**Key Sections:**
- Section 1: Color Palette (25+ colors with hex codes)
- Section 6: Dashboard Tabs (6 tabs with exact accent colors)
- Section 7: Hero Insight Component (complete styling reference)
- Section 14: Critical Design Decisions
- Section 15: Cross-Platform Verification Checklist

---

### 2. DESIGN_TOKENS.json (Programmatic Reference)
**Size:** 9.8KB | **Format:** JSON | **Updated:** 2026-02-24

Machine-readable format of all design tokens structured for:
- Programmatic access to color values
- Typography specifications in nested structure
- Spacing and sizing metrics
- Shadow definitions with full values
- Tab configurations with accent colors
- Hero card styling specifications
- Responsive breakpoints and fluid patterns
- Accessibility configuration

**Best for:** Automated validation, design system tooling, programmatic comparison

**Structure:**
```json
{
  "colors": { ... },
  "typography": { ... },
  "spacing": { ... },
  "borderRadius": { ... },
  "shadows": { ... },
  "dashboard": { ... },
  "heroCard": { ... },
  "accessibility": { ... },
  "responsive": { ... }
}
```

---

### 3. DESIGN_TOKENS_QUICK_REFERENCE.md (Fast Lookup)
**Size:** 6.1KB | **Format:** Markdown Tables | **Updated:** 2026-02-24

Quick reference guide for rapid lookup including:
- Core brand colors table
- Dashboard tabs in exact order with accent colors
- Critical font sizes
- Key spacing values
- Border radius quick reference
- Shadow library at a glance
- Tab button states
- Feature component specifications
- Responsive breakpoints
- Accessibility checklist
- Component file locations
- Verification checklist (17 points)

**Best for:** Quick color lookups, team reference, spot-checking values

**Key Tables:**
| Item | Purpose |
|------|---------|
| Core Brand Colors | Quick color reference |
| Dashboard Tabs | Tab names and accent colors |
| Critical Font Sizes | Typography quick reference |
| Key Spacing Values | Common spacing patterns |
| Shadow Library | Shadow definitions |
| Verification Checklist | Mobile app audit checklist |

---

## How to Use This Audit

### For Design Verification
1. Open **DESIGN_TOKENS_QUICK_REFERENCE.md** for color/size lookup
2. Cross-reference against mobile implementation
3. Use **DESIGN_TOKENS_AUDIT.md** Section 15 for detailed verification checklist

### For Detailed Analysis
1. Start with **DESIGN_TOKENS_AUDIT.md** Section 1 (Color Palette)
2. Review Section 6 (Dashboard Tabs) for tab specifications
3. Read Section 7 (Hero Component) for complex styling
4. Check Section 14 (Critical Design Decisions) for design rationale

### For Programmatic Access
1. Load **DESIGN_TOKENS.json** into your tooling
2. Extract specific token categories as needed
3. Validate mobile app values programmatically against these definitions

### For Team Reference
1. Share **DESIGN_TOKENS_QUICK_REFERENCE.md** with design/dev team
2. Post color table as team reference
3. Use verification checklist for code reviews

---

## Key Metrics at a Glance

### Colors
- **Primary Blue:** `#2563EB` (dominates UI)
- **Accent Green:** `#10B981` (success states)
- **Text Primary:** `#1E293B`
- **Text Secondary:** `#4B5563` (WCAG AA darkened)
- **Page Background:** `#F7F8FC`

### Typography
- **Font Family:** `'Inter', 'Plus Jakarta Sans', 'sans-serif'`
- **Hero Headline:** `clamp(1.625rem, 4.5vw, 2.25rem)` (responsive)
- **Tab Label:** `11px` (mobile) / `14px` (desktop)
- **Body Text:** `15px` with `1.65` line height

### Spacing
- **Hero Padding:** `clamp(2rem, 5vw, 3.5rem)` (responsive)
- **Tab Gap:** `gap-1.5`
- **Card Header Gap:** `gap-3`

### Shadows (7 Total)
- **Soft:** Subtle dividers
- **Card:** Default component shadow
- **Hero:** Featured hero cards
- **Glow:** Blue accent highlights
- Plus 3 more in documentation

### Dashboard Tabs (6 Total)
1. Overview — `#2563EB` (Primary Blue)
2. Who Shapes Your Feed — `#6366F1` (Indigo)
3. Ads & Promotions — `#D97706` (Amber)
4. Political Exposure — `#7C3AED` (Purple)
5. Emotional Tone — `#0D9488` (Teal)
6. Suggested vs. Followed — `#E11D48` (Rose)

---

## Source Files Referenced

All tokens extracted from these production files:
- `/src/tailwind.config.js` — Theme configuration
- `/src/index.css` — Global styles
- `/src/pages/dashboard/TabNavigation.jsx` — Tab navigation UI
- `/src/pages/dashboard/TabHero.jsx` — Hero insight component
- `/src/pages/dashboard/dashboardCatalog.js` — Tab definitions
- `/src/pages/dashboard/DashboardHeader.jsx` — Page header
- `/src/pages/dashboard/DashboardPage.jsx` — Main orchestrator

**Verification Status:** 100% verified against live production source code

---

## Mobile App Audit Checklist

Use this 17-point checklist when auditing the mobile implementation:

### Colors (5 points)
- [ ] Primary blue `#2563EB` matches exactly
- [ ] Tab accent colors match (6 distinct colors)
- [ ] Text colors match (`#1E293B`, `#4B5563`)
- [ ] Border colors use correct opacity values
- [ ] Shadows match all 7 custom shadow definitions

### Typography (4 points)
- [ ] Font family matches (Inter + Plus Jakarta Sans)
- [ ] Hero headline uses responsive clamp sizing
- [ ] Letter spacing values match (tight-hero, tight-heading, etc.)
- [ ] Font weights accurate (400, 500, 600, 700)

### Layout & Spacing (4 points)
- [ ] Hero padding uses clamp values
- [ ] Tab gaps and spacing consistent
- [ ] Border radius values match (12px, 20px, 28px, 9999px)
- [ ] Responsive breakpoints honored (640px, 768px, etc.)

### Components (2 points)
- [ ] Tab navigation styling matches (container, buttons, active state)
- [ ] Hero component and "How We Know This" button match

### Accessibility (2 points)
- [ ] Keyboard navigation implemented (arrow keys, Home, End)
- [ ] ARIA roles and focus ring styling correct

---

## Document Navigation

```
┌─ DESIGN_TOKENS_README.md (You are here)
│  ├─ How to Use This Audit
│  ├─ Key Metrics at a Glance
│  └─ Mobile App Checklist
│
├─ DESIGN_TOKENS_QUICK_REFERENCE.md (Fast lookup)
│  ├─ Color table
│  ├─ Tab definitions
│  └─ Verification checklist
│
├─ DESIGN_TOKENS_AUDIT.md (Complete specification)
│  ├─ 18 detailed sections
│  ├─ Component styling reference
│  └─ Cross-platform checklist
│
└─ DESIGN_TOKENS.json (Programmatic format)
   └─ Structured data for tooling
```

---

## Common Tasks

### "I need to check the primary blue color"
→ See **DESIGN_TOKENS_QUICK_REFERENCE.md**, Core Brand Colors table
→ Value: `#2563EB`

### "What's the hero card background gradient?"
→ See **DESIGN_TOKENS_AUDIT.md**, Section 7 (Hero Card Styling)
→ Or **DESIGN_TOKENS.json** → heroCard.main.background

### "I need all 6 tab names and colors"
→ See **DESIGN_TOKENS_QUICK_REFERENCE.md**, Dashboard Tabs table
→ Or **DESIGN_TOKENS_AUDIT.md**, Section 6

### "What font sizes do we use?"
→ See **DESIGN_TOKENS_QUICK_REFERENCE.md**, Critical Font Sizes table
→ Or **DESIGN_TOKENS_AUDIT.md**, Section 2 (Typography)

### "Are the shadows matching?"
→ See **DESIGN_TOKENS_QUICK_REFERENCE.md**, Shadow Library section
→ Or **DESIGN_TOKENS_AUDIT.md**, Section 5 (Shadows)

### "I need the responsive spacing values"
→ See **DESIGN_TOKENS_AUDIT.md**, Section 3 (Spacing & Sizing)
→ Key: Look for `clamp()` values for fluid sizing

### "Let me audit the mobile app"
→ See **DESIGN_TOKENS_QUICK_REFERENCE.md**, Verification Checklist
→ Or **DESIGN_TOKENS_AUDIT.md**, Section 15 (17-point checklist)

---

## Technical Notes

### CSS Variables
All tokens can be converted to CSS custom properties. See **DESIGN_TOKENS_AUDIT.md**, Section 16 for example implementation.

### Responsive Design
Many values use CSS `clamp()` function for fluid sizing:
```
clamp(min, preferred, max)
Example: clamp(2rem, 5vw, 3.5rem) scales between 32px and 56px
```

### Tailwind Integration
All color and sizing tokens align with the Tailwind configuration in `/tailwind.config.js`.

### Accessibility
- WCAG AA contrast ratios verified
- ARIA roles and keyboard navigation documented
- Reduced motion support included

---

## Version History

| Date | Event |
|------|-------|
| 2026-02-24 | Initial comprehensive audit completed |
| | All source files extracted and verified |
| | 100% confidence verification status |
| | 3 document formats created |

---

## Questions?

Refer to the specific document:
- **Quick answer?** → DESIGN_TOKENS_QUICK_REFERENCE.md
- **Need details?** → DESIGN_TOKENS_AUDIT.md
- **Programmatic?** → DESIGN_TOKENS.json
- **Getting started?** → This README

---

**Last Updated:** 2026-02-24
**Status:** Complete and Verified
**Confidence:** 100% (all values from live production source)
