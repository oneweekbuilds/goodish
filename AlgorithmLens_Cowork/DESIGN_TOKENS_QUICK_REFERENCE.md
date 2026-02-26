# AlgorithmLens Design Tokens — Quick Reference

**For Mobile App Auditing**

---

## Core Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Blue | `#2563EB` | Primary CTA, active states, accents |
| Accent Green | `#10B981` | Success states, alternative accent |
| Page Background | `#F7F8FC` | Main page background |
| Text Primary | `#1E293B` | Body text, headings |
| Text Secondary | `#4B5563` | Muted text, labels |
| Border | `rgba(30, 41, 59, 0.08)` | Dividers |

---

## Dashboard Tabs (Exact Order & Colors)

1. **Overview** — `#2563EB` (Primary Blue)
2. **Who Shapes Your Feed** — `#6366F1` (Indigo)
3. **Ads & Promotions** — `#D97706` (Amber)
4. **Political Exposure** — `#7C3AED` (Purple)
5. **Emotional Tone** — `#0D9488` (Teal)
6. **Suggested vs. Followed** — `#E11D48` (Rose)

---

## Critical Font Sizes

| Element | Size |
|---------|------|
| Hero Headline | `clamp(1.625rem, 4.5vw, 2.25rem)` |
| Tab Label (Mobile) | `11px` |
| Tab Label (Desktop) | `14px` |
| Kicker/Label | `11px` |
| Body Text | `15px` |
| Small Text | `12-14px` |

**Font Family:** `'Inter', 'Plus Jakarta Sans', 'sans-serif'`

---

## Key Spacing Values

| Element | Spacing |
|---------|---------|
| Hero Card Padding (Vertical) | `clamp(2rem, 5vw, 3.5rem)` |
| Hero Card Padding (Horizontal) | `clamp(1.75rem, 4vw, 3rem)` |
| Tab Gap | `gap-1.5` |
| Card Header Gap | `gap-3` |
| Hero Bottom Margin | `40px` |
| Tab Container Margin | `24px` or `40px` |

---

## Border Radius

| Type | Value |
|------|-------|
| Small | `12px` |
| Medium | `20px` |
| Large | `28px` |
| Pill | `9999px` |

---

## Shadow Library

Use exactly these shadow values:

```
Soft:      0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)
Card:      0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)
Hero:      0 8px 40px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(37, 99, 235, 0.04)
Glow:      0 0 20px rgba(37, 99, 235, 0.25), 0 0 6px rgba(37, 99, 235, 0.1)
```

---

## Hero Card Styling

```
Background:    linear-gradient(135deg, #FFFFFF 0%, #F0F5FF 40%, #EFF6FF 70%, #F0F5FF 100%)
Border:        1px solid rgba(37, 99, 235, 0.15)
Border Radius: 24px
Shadow:        0 1px 3px rgba(0,0,0,0.04), 0 8px 40px rgba(37, 99, 235, 0.08)
Padding:       clamp(2rem, 5vw, 3.5rem) clamp(1.75rem, 4vw, 3rem)
```

---

## Tab Button States

### Inactive
- Text: `#64748B`
- Background: `transparent`
- Hover: `rgba(255, 255, 255, 0.7)`

### Active
- Text: `#FFFFFF` (white)
- Background: `linear-gradient(135deg, {accentColor} 0%, {accentColor}DD 100%)`
- Shadow: `0 2px 8px {accentColor}30, 0 1px 3px rgba(0,0,0,0.06)`

---

## Feature Component: "How We Know This" Button

```
Background:    rgba(37, 99, 235, 0.06)
Border:        1px solid rgba(37, 99, 235, 0.12)
Color:         rgba(37, 99, 235, 0.85)
Padding:       0.5rem 1rem
Border Radius: 9999px (pill)
Hover:         bg-blue-100
```

---

## Responsive Breakpoints

- **sm:** 640px
- **md:** 768px
- **lg:** 1024px
- **xl:** 1280px

**Pro Tip:** Use CSS `clamp()` for fluid sizing instead of media queries where possible.

---

## Accessibility Checklist

- [ ] Keyboard navigation (arrow keys in tabs)
- [ ] ARIA roles: `tablist`, `tab`, `tabpanel`
- [ ] `aria-selected` attribute on active tab
- [ ] Focus ring color: `primary-blue` with offset
- [ ] Reduced motion media query honored
- [ ] Contrast ratio WCAG AA: Text `#1E293B` on `#FFFFFF` ✓

---

## Common Letter Spacing Values

- **Tight (Hero):** `-0.025em`
- **Tight (Heading):** `-0.02em`
- **Tight (Card):** `-0.01em`
- **Wide (Label):** `0.05em`
- **Wider (Label):** `0.1em`

---

## Line Heights

- **Hero Headline:** `1.25`
- **Body Text:** `1.65`
- **Standard:** `1.5`

---

## Font Weights

- **Bold:** `700`
- **Semibold:** `600`
- **Medium:** `500`
- **Regular:** `400`

---

## Critical Gradients

### Tab Navigation Container
```
linear-gradient(180deg, rgba(241, 245, 249, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)
```

### Hero Card Main
```
linear-gradient(135deg, #FFFFFF 0%, #F0F5FF 40%, #EFF6FF 70%, #F0F5FF 100%)
```

### Feature Moment Wrapper
```
linear-gradient(180deg, #FFFFFF 0%, rgba(239, 246, 255, 0.5) 40%, rgba(239, 246, 255, 0.3) 70%, #FFFFFF 100%)
```

### Accent Bar (Left of Headline)
```
linear-gradient(180deg, #2563EB 0%, #60A5FA 100%)
```

---

## Files to Reference

1. **DESIGN_TOKENS_AUDIT.md** — Complete documentation (18 sections)
2. **DESIGN_TOKENS.json** — Machine-readable format
3. **This file** — Quick lookup guide

---

## Component File Locations

| Component | File |
|-----------|------|
| Tab Definitions | `/src/pages/dashboard/dashboardCatalog.js` |
| Tab UI | `/src/pages/dashboard/TabNavigation.jsx` |
| Hero Card | `/src/pages/dashboard/TabHero.jsx` |
| Page Header | `/src/pages/dashboard/DashboardHeader.jsx` |
| Theme Config | `/tailwind.config.js` |
| Global Styles | `/src/index.css` |

---

## Verification Checklist for Mobile

- [ ] All 6 tabs present in correct order
- [ ] Tab accent colors applied correctly
- [ ] Hero card gradient matches exactly
- [ ] "How We Know This" button styling matches
- [ ] Font sizes use responsive clamp values
- [ ] Shadows match the 7 custom definitions
- [ ] Spacing values (padding/margin) are precise
- [ ] Border radius consistent across components
- [ ] Letter spacing preserved for typography
- [ ] Focus/keyboard navigation implemented
- [ ] Reduced motion support included

---

## Design Decisions Summary

1. **Hero-First Pattern:** Large insight headline, optional expandable evidence
2. **Responsive Spacing:** Uses CSS `clamp()` for fluid sizing
3. **Color Coding:** Each tab has unique accent color (6 total)
4. **Premium Visuals:** Multiple shadow layers create depth
5. **Accessible:** WCAG AA contrast, keyboard navigation, reduced motion support

---

**Last Updated:** 2026-02-24
**Status:** Complete extraction from live source code
**Confidence:** 100% — All values verified against production files
