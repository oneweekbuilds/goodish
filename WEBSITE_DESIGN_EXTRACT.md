# AlgorithmLens Website - Design Values Extract

**Document Purpose:** Extract exact design values from the website codebase for cross-platform consistency with mobile app.

**Source Files Analyzed:**
- `/src/DESIGN_TOKENS.json` (Canonical design tokens)
- `/src/index.css` (Global styles)
- `/tailwind.config.js` (Tailwind configuration)
- `/src/pages/dashboard/dashboardCatalog.js` (Tab definitions & copy)
- `/src/pages/dashboard/dashboardConstants.js` (Theme constants)
- `/src/components/Hero/HeroSection.jsx` (Landing page hero)
- `/src/pages/SettingsPage.jsx` (Settings page structure)
- `/src/pages/HistoryPage.jsx` (History page structure)

---

## 1. COLOR SYSTEM & DESIGN TOKENS

### Primary Colors
| Name | Value | Usage |
|------|-------|-------|
| Brand Blue | `#2563EB` | Primary CTA, primary tabs, core UI |
| Accent Green | `#10B981` | Secondary emphasis, status success |
| Primary Blue (Alternate) | `#2563EB` | Buttons, links, active states |

### Dashboard Tab Accent Colors
These colors are **per-tab** accent colors for dashboard navigation and visual differentiation.

| Tab ID | Tab Label | Accent Color | Hex |
|--------|-----------|-------------|-----|
| `overview` | Overview | Primary Blue | `#2563EB` |
| `sources` | Who Shapes Your Feed | Indigo | `#6366F1` |
| `ads` | Ads & Promotions | Amber | `#D97706` |
| `politics` | Political Exposure | Purple | `#7C3AED` |
| `tone` | Emotional Tone | Teal | `#0D9488` |
| `suggested_vs_followed` | Suggested vs. Followed | Rose | `#E11D48` |

### Text Colors
| Name | Hex | Usage |
|------|-----|-------|
| Text Main | `#1E293B` | Primary text, headings |
| Text Muted | `#4B5563` | Secondary text, descriptions |
| Text on Primary-Blue | `#FFFFFF` | Buttons, white text on blue |

### Background Colors
| Name | Hex | Usage |
|------|-----|-------|
| Page Background | `#F7F8FC` | Main page background |
| Surface Default | `#FFFFFF` | Cards, containers |
| Blue Light (Hero) | `#EFF6FF` | Hero section background |
| Green Light (Talk) | `#ECFDF5` | Green-themed sections |
| Section Tint | `#F8FAFC` | Alternating section backgrounds |

### Border Colors
| Name | Value | Usage |
|------|-------|-------|
| Border Light | `rgba(30, 41, 59, 0.08)` | Standard borders |
| Blue Border | `rgba(37, 99, 235, 0.2)` | Blue-themed borders |
| Green Border | `rgba(16, 185, 129, 0.15)` | Green-themed borders |

### Status Colors
| Status | Color | Hex |
|--------|-------|-----|
| Success | Green | `#059669` |
| Error | Red | `#DC2626` |
| Warning | Amber | `#D97706` |

### Color Palette (Extended)
**Blue Palette:**
- `#EFF6FF` (50)
- `#DBEAFE` (100)
- `#BFDBFE` (200)
- `#2563EB` (600)
- `#1D4ED8` (700)
- `#1E40AF` (800)

**Green Palette:**
- `#ECFDF5` (50)
- `#D1FAE5` (100)
- `#A7F3D0` (200)
- `#10B981` (500)
- `#059669` (600)
- `#047857` (700)

**Slate Palette (Grays):**
- `#F8FAFC` (50)
- `#F1F5F9` (100)
- `#E2E8F0` (200)
- `#94A3B8` (400)
- `#64748B` (500)
- `#475569` (600)
- `#334155` (700)
- `#1E293B` (800)
- `#0F172A` (900)

---

## 2. DASHBOARD TAB CATALOG

### Exact Tab Names as Displayed on Website

**Source:** `/src/pages/dashboard/dashboardCatalog.js` - Line 60-67 (TABS array)

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

### Comparison: Website vs. Mobile App

| Website Tab Label | Mobile Tab Label | Match |
|------------------|-----------------|-------|
| Overview | Overview | ✓ Exact |
| Who Shapes Your Feed | Sources | ✗ Different |
| Ads & Promotions | Ads | ✗ Abbreviated |
| Political Exposure | Politics | ✗ Abbreviated |
| Emotional Tone | Tone | ✗ Different |
| Suggested vs. Followed | Suggested | ✗ Different |

**Key Difference:** Mobile uses shorter, abbreviated names; Website uses full descriptive labels.

---

## 3. HERO/TAKEAWAY COPY PATTERNS

### Landing Page Hero (HeroSection.jsx)

**Main Headline:**
```
See how the algorithms see you.
```

**Subheadline:**
```
Algorithms learn what keeps you scrolling — the content, emotions, and topics that hold your attention. AlgorithmLens shows you what they've figured out.
```

**Platform Support Line:**
```
Works with TikTok, Instagram, YouTube, X, Facebook, LinkedIn, and Reddit.
```

**Credential Pill:**
```
Built at MIT
```

**Primary CTA:**
- Logged out: `Start a Scan — It's Free`
- Coming soon mode: `Join the Waitlist`

**Secondary CTA Text:**
```
Free forever. Upgrade to Plus for trends and deeper analysis.
```

### Tab-Specific Story Headers

**Source:** `/src/pages/dashboard/dashboardConstants.js` - TAB_STORY_HEADERS (Lines 74-186)

#### Overview Tab (Primary)
- Label: `Observed`
- Title: `Content patterns during this window`
- Subtext: `What content appeared based on your recent activity.`

#### Who Shapes Your Feed Tab (Sources)
- Label: `Observed`
- Title: `Influence during this window`
- Subtext: `Which accounts shaped what you saw. What appeared, not who you are.`

#### Ads & Promotions Tab
- Key Insight Label: `Observed`
- Key Insight Title: `Commercial content in your feed`
- Key Insight Subtext: `What share of your feed contains labeled ads and promotional content.`
- Context Label: `Context`
- Context Title: `Where commercial content comes from`
- Context Subtext: `Which advertisers and platforms account for the most commercial content during this window.`

#### Political Exposure Tab
- Key Insight Label: `Observed`
- Key Insight Title: `Political keywords during this window`
- Key Insight Subtext: `Measures exposure to political content, not belief formation.`
- Context Label: `Context`
- Context Title: `Where political exposure comes from`
- Context Subtext: `Which accounts and platforms drove political keywords during this window.`

#### Emotional Tone Tab
- Key Insight Label: `Observed`
- Key Insight Title: `Topics during this window`
- Key Insight Subtext: `What surfaced. Patterns in exposure, not preference.`

#### What Surfaced / Algorithm Tab
- Key Insight Label: `Observed`
- Key Insight Title: `Content patterns during this window`
- Key Insight Subtext: `What content appeared based on your recent activity.`

#### Suggested vs. Followed Tab
- No hero takeaway defined in constants (primary card handles this)
- First card title: `Your feed split`
- First card description: `How much of your feed comes from suggested posts vs accounts you follow.`

---

## 4. TYPOGRAPHY & SIZING

### Font Family
```javascript
fontFamily: ['Inter', 'Plus Jakarta Sans', 'sans-serif']
```

### Font Sizes
| Element | Size | Responsive |
|---------|------|------------|
| Hero Headline | `clamp(1.625rem, 4.5vw, 2.25rem)` | Fluid scaling |
| Tab Label | Desktop: `14px`, Mobile: `11px` | Breakpoint-based |
| Kicker / Pill Text | `11px` | Fixed |
| Body Text | `15px` | Fixed |
| Small Text | `12px-14px` | Range |

### Font Weights
| Weight | Value |
|--------|-------|
| Bold | 700 |
| Semibold | 600 |
| Medium | 500 |
| Regular | 400 |

### Letter Spacing
| Style | Value |
|-------|-------|
| Tight Hero | `-0.03em` |
| Tight Heading | `-0.02em` |
| Tight Card | `-0.01em` |
| Wide Label | `0.05em` |
| Wider Label | `0.1em` |

### Line Heights
| Element | Height |
|---------|--------|
| Hero Headline | 1.25 |
| Body Text | 1.65 |

---

## 5. SPACING & PADDING

### Hero Card Padding
```
Vertical: clamp(2rem, 5vw, 3.5rem)
Horizontal: clamp(1.75rem, 4vw, 3rem)
```

### Standard Spacing/Gaps
- Tab Navigation Gap: `gap-1.5`
- Button Content Gap: `gap-1.5 sm:gap-2`
- Card Header Gap: `gap-3`
- Standard Gaps: `gap-2`, `gap-3`, `gap-4`, `gap-5`

### Margins
| Element | Value |
|---------|-------|
| Hero Bottom Margin | `40px` |
| Feature Moment Bottom (sm) | `48px` |
| Feature Moment Bottom (md) | `64px` |
| Feature Moment Bottom (lg) | `80px` |
| Tab Container Bottom (algorithm) | `24px` |
| Tab Container Bottom (others) | `40px` |

---

## 6. BORDER RADIUS

| Element | Radius |
|---------|--------|
| Small | `12px` |
| Medium | `20px` |
| Large | `28px` |
| Pill / Full Round | `9999px` |
| Tab Navigation Container | `16px` |
| Tab Buttons | `12px` |
| Hero Card | `24px` |
| Meta Pill | `9999px` |

---

## 7. SHADOWS & DEPTH

| Shadow | Definition |
|--------|-----------|
| Soft | `0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)` |
| Medium | `0 8px 24px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.03)` |
| Strong | `0 20px 60px rgba(15, 23, 42, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)` |
| Glow | `0 0 20px rgba(37, 99, 235, 0.25), 0 0 6px rgba(37, 99, 235, 0.1)` |
| Card | `0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)` |
| Card Hover | `0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(15, 23, 42, 0.06)` |
| Hero | `0 8px 40px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(37, 99, 235, 0.04)` |
| Hero Card Custom | `0 1px 3px rgba(0,0,0,0.04), 0 8px 40px rgba(37, 99, 235, 0.08)` |

---

## 8. SETTINGS PAGE STRUCTURE

**Path:** `/settings`

### Page Layout
- Header: Settings icon + "Settings" title
- Max width: `max-w-2xl`
- Padding: `pt-20 md:pt-24 pb-16 px-4 sm:px-6`

### Sections (in order)

#### 1. Account Section
**Icon:** User
**Title:** Account
**Description:** Your account information
**Fields:**
- Email (display value)
- Member since (formatted date)
- Current plan (badge: Free/Plus/Anonymous)
- Sign out button

#### 2. AI Analysis Section
**Icon:** Brain
**Title:** AI Analysis
**Description:** Control how AI processes your scan data
**Content:**
- Toggle: "Enable AI analysis"
- Blue info box explaining:
  - What AI analysis does (Google Gemini for politics & tone)
  - What it does NOT do:
    - Data not used to train models
    - Results are observational
    - AI has limitations
    - Disabling only affects AI tabs

#### 3. Plan Management Section
**Icon:** CreditCard
**Title:** Plan Management
**Description:** Manage your subscription and billing
**Content:**
- Plus Users: Info card with checkmark + "AlgorithmLens Plus" label
  - Trial/Past due indicators if applicable
  - Billing portal link (Stripe)
- Free Users: Upgrade card
  - Free plan description
  - Upgrade to Plus link with pricing

#### 4. Footer
- Copyright/attribution text
- Links: Privacy Policy, Terms of Service

### Styling Notes
- Sections use `.bg-white rounded-2xl shadow-card border border-border-light`
- Section headers have icon with `w-9 h-9 rounded-xl bg-blue-50`
- Rows use flex with `justify-between gap-4 py-2`
- Buttons use primary blue (`bg-primary-blue`) with hover state

---

## 9. HISTORY PAGE STRUCTURE

**Path:** `/history`

### Page Layout
- Header: History icon + "Scan History" title
- Subtitle: User name + scan count
- Max width: `max-w-4xl`
- Padding: `pt-20 pb-24 md:pt-24 px-4 md:px-6`

### Header Section
- Left: Title + subtitle + scan count
- Right: Refresh button + New Scan button

### States

#### Loading State
- Skeleton loaders for header and 5 scan items

#### Empty State
- Search icon placeholder (40px)
- Title: "No scans yet"
- Description: Invitation to start first scan
- CTA: "Start Your First Scan" (primary blue button with ArrowRight icon)

#### Error State
- AlertCircle icon
- Title: "Unable to Load History"
- Description: Connection message
- CTA: "Try Again" button

#### List View (Populated)
**For each scan card:**
- Platform icon (colored square 12x12px)
- Left section:
  - Source badge (Desktop/Mobile upload)
  - Time (relative format: "2 hours ago")
  - Stats row: `[posts] posts · [duration]s duration · [%] ads`
- Right section:
  - Delete button (with inline confirmation: "Delete? Yes/No")
  - Arrow right icon

### Pagination (if >10 scans)
- Previous / Current page / Next buttons
- Centered, gap-4
- Smooth scroll to top on page change

### Quick Summary Section (if scans exist)
- Blue-50 background card
- Grid layout:
  - Total Scans count
  - Posts Analyzed (sum)
  - Platforms (unique count)
  - Avg Ads (percentage)

### Deletion UX
- Click trash icon → inline confirmation ("Delete? Yes/No")
- Confirm → loading spinner + opacity-50
- On error: red banner with AlertCircle, auto-dismiss after 5s

---

## 10. RESPONSIVE BREAKPOINTS

| Breakpoint | Width |
|------------|-------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |

### Adaptive Patterns
- **Hero padding:** `clamp()` for fluid scaling
- **Font sizes:** `clamp()` with breakpoint overrides
- **Tab labels:** Different sizes on mobile vs desktop
- **Layouts:** Stack on mobile, grid on desktop

---

## 11. ANIMATIONS

| Animation | Definition |
|-----------|-----------|
| Pulse Slow | `pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite` |
| Scroll Slow | `scroll 40s linear infinite` |
| Chevron Rotation | Closed: `0deg`, Open: `180deg`, `transition-transform` |

### Framer Motion
- Hero elements: staggered entrance with `delay` increments (0.1s, 0.15s, 0.17s, 0.2s, 0.3s)
- Easing: `[0.16, 1, 0.3, 1]` (custom cubic-bezier)
- Duration: `0.8s` base

---

## 12. ACCESSIBILITY

### Focus States
```
focus-visible:ring-2 focus-visible:ring-primary-blue/40 focus-visible:ring-offset-1
```

### ARIA Attributes
- Tabs: `role="tablist"`, `role="tab"`, `role="tabpanel"`
- Tab buttons: `aria-selected`, `aria-controls`, `aria-label`, `tabIndex`
- Toggles: `role="switch"`, `aria-checked`, `aria-label`

### Reduced Motion
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

---

## 13. SCROLLBAR STYLING

### Webkit (Chrome, Safari)
```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
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
::-webkit-scrollbar-track {
  background: transparent;
}
```

### Firefox
```css
scrollbar-width: thin;
scrollbar-color: #CBD5E1 transparent;
```

---

## 14. EPISTEMIC RESTRAINT LANGUAGE PATTERNS

**Source:** dashboardCatalog.js Lines 51-58 (TAB_TRUST_SENTENCES)

### Tab-Level Trust Sentences
These appear at the top of each tab to ground analysis in observation:

**Ads Tab:**
```
"This view estimates how often ads and sales-driven posts appeared in the content you scanned. It reflects what showed up, not what you believe or want."
```

**Politics Tab:**
```
"Counts and percentages are based only on the posts included in your scans."
```

**Patterns Tab:**
```
"Counts and percentages are based only on the posts included in your scans."
```

**Creators Tab:**
```
"Counts and percentages are based only on the posts included in your scans."
```

**Algorithm Tab:**
```
"These are content themes that appeared in your scans. They do not represent your identity or preferences."
```

### Counterfactual Language (on primary cards)
Primary view cards include `counterfactual` property for legitimizing disagreement:
- Ads: "This may not match your perception. Some ads blend in with regular content."
- Politics: "This measures exposure, not belief formation. Political content may be more memorable than other topics."
- Patterns: "This is what showed up during this window. It may not represent your typical feed."
- Creators: "This may not match who you follow or expect. It is what appeared in this specific scroll session."
- Algorithm: "This reflects what appeared in your scans, not who you are. These are observations, not predictions."

---

## 15. KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `/src/DESIGN_TOKENS.json` | Machine-readable canonical design tokens |
| `/src/index.css` | Global styles, scrollbar, animations |
| `/tailwind.config.js` | Tailwind CSS theme configuration |
| `/src/pages/dashboard/dashboardCatalog.js` | Tab definitions, copy, and view catalog (1300+ lines) |
| `/src/pages/dashboard/dashboardConstants.js` | Theme constants, tab headers, surfaces |
| `/src/components/Hero/HeroSection.jsx` | Landing page hero component |
| `/src/pages/SettingsPage.jsx` | Settings page implementation |
| `/src/pages/HistoryPage.jsx` | Scan history page implementation |

---

## NOTES FOR MOBILE IMPLEMENTATION

1. **Tab Names Mismatch:** Website uses full labels (e.g., "Who Shapes Your Feed"), mobile uses abbreviated names (e.g., "Sources"). Consider which naming convention to standardize on.

2. **Tab 6 Name Mismatch:** Website: "Suggested vs. Followed", Mobile: "Suggested". This needs alignment.

3. **Accent Colors:** All 6 tabs have distinct accent colors defined in both codebases. These should remain consistent.

4. **Copy Patterns:** Website uses "Observed / Context / Speculation" language framework. Mobile should adopt similar epistemic restraint patterns.

5. **Typography:** Font family is identical (Inter + Plus Jakarta Sans). Font sizes are fluid on web via `clamp()`. Mobile should use comparable scaling.

6. **Colors are Exactly Matched:** Primary Blue (`#2563EB`), Accent Green (`#10B981`), and all palette colors are identical in both systems.

---

**Document Version:** 1.0
**Last Updated:** February 24, 2026
**Source Codebase:** AlgorithmLens Website (Cowork Edition)
