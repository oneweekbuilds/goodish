# AlgorithmLens Mobile App Design Specification
## Source of Truth for Mobile Implementation

**Source Codebase:** `/AlgorithmLens_Cowork/src`
**Last Updated:** February 24, 2026
**Framework:** React + Tailwind CSS (desktop) → React Native (mobile target)

---

## Table of Contents
1. [Project Structure](#project-structure)
2. [Design Tokens](#design-tokens)
3. [Dashboard Tabs](#dashboard-tabs)
4. [Component Patterns](#component-patterns)
5. [Typography Scale](#typography-scale)
6. [Color System](#color-system)
7. [Spacing & Layout](#spacing--layout)
8. [Shadow & Border Tokens](#shadow--border-tokens)
9. [User-Facing Copy](#user-facing-copy)

---

## Project Structure

### Source File Organization
```
/AlgorithmLens_Cowork/
├── src/
│   ├── components/
│   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── charts/         # Chart/visualization components
│   │   │   ├── primitives/     # Reusable dashboard primitives
│   │   │   ├── renderers/      # Data renderer components
│   │   │   └── ViewCard.jsx    # Card wrapper component
│   │   ├── ui/                 # Shared UI components
│   │   │   ├── Button.jsx      # Primary, secondary, ghost, success buttons
│   │   │   ├── Skeleton.jsx    # Loading state skeleton
│   │   │   └── Toast.jsx       # Toast notifications
│   │   ├── Navbar.jsx          # Navigation bar
│   │   ├── Logo.jsx            # Logo component (3 variants)
│   │   ├── MetricCard.jsx      # Metric display card
│   │   └── PlatformIcon.jsx    # Platform badge icons
│   ├── pages/
│   │   ├── dashboard/          # Dashboard page orchestrator
│   │   │   ├── DashboardPage.jsx           # Main dashboard (80%+ of logic)
│   │   │   ├── TabNavigation.jsx           # Tab switcher
│   │   │   ├── TabRenderer.jsx             # Tab content renderer
│   │   │   ├── dashboardCatalog.js         # View definitions (SOURCE OF TRUTH)
│   │   │   ├── dashboardConstants.js       # Theme/surface constants
│   │   │   ├── tabs/                       # Individual tab implementations
│   │   │   │   ├── OverviewTab.jsx
│   │   │   │   ├── SourcesTab.jsx
│   │   │   │   ├── AdsTab.jsx
│   │   │   │   ├── PoliticsTab.jsx
│   │   │   │   ├── ToneTab.jsx
│   │   │   │   └── SuggestedVsFollowedTab.jsx
│   │   │   └── [helper hooks & utilities]
│   │   ├── ResultsPage.jsx     # Post-scan results
│   │   └── StartPage.jsx       # Scan initiation
│   ├── lib/
│   │   ├── theme/
│   │   │   └── tokens.js       # Design tokens (brand colors, etc)
│   │   ├── dashboard/          # Dashboard data processing
│   │   │   ├── aggregators/    # Data aggregation functions
│   │   │   ├── dataHelpers.js  # Data extraction helpers
│   │   │   └── insightBuilders.js
│   │   ├── plan/               # Paywall/entitlement system
│   │   └── auth/               # Supabase authentication
│   ├── App.jsx                 # Main app entry point & routing
│   ├── main.jsx                # React DOM render
│   ├── index.css               # Global styles + Tailwind directives
│   └── App.css                 # App-specific styles (minimal)
├── public/                     # Static assets
├── tailwind.config.js          # Tailwind configuration (DESIGN TOKENS)
├── tsconfig.json               # TypeScript config
├── vite.config.js              # Vite bundler config
└── package.json                # Dependencies
```

### Key Dependencies
- **React 19.2** - UI framework
- **React Router DOM 7.9** - Client-side routing
- **Tailwind CSS 3.4** - Utility-first styling framework
- **Framer Motion 12.23** - Animation library
- **Lucide React 0.554** - Icon library (20+ icons used)
- **Supabase JS 2.95** - Auth & backend communication
- **Stripe JS 2.0** - Payment processing
- **Sentry 10.39** - Error tracking

**Target for Mobile:** Reuse React component structure, convert Tailwind to React Native StyleSheet equivalents.

---

## Design Tokens

### 1. Brand Colors (PRIMARY)
These are the canonical hex codes used throughout the entire application:

```javascript
// From: src/lib/theme/tokens.js
themeTokens = {
  brandPrimary: '#2563EB',      // Primary blue (70% dominance)
  brandSecondary: '#10B981',    // Accent green (30% dominance)

  // Tints and backgrounds
  brandTintBg: 'rgba(37, 99, 235, 0.02)',    // Very light blue tint
  brandTintBorder: 'rgba(37, 99, 235, 0.12)',// Light blue border
  accentTintBg: 'rgba(16, 185, 129, 0.02)',  // Very light green tint

  // Text colors
  textMain: '#1E293B',           // Main text (near-black)
  textMuted: '#4B5563',          // Secondary text (was #64748B, darkened for WCAG AA)

  // Borders
  borderSoft: 'rgba(30, 41, 59, 0.06)',     // Very soft border
  borderMedium: 'rgba(30, 41, 59, 0.12)',   // Medium strength border

  // Semantic
  accentInfo: '#2563EB',  // Same as brandPrimary
}
```

### 2. Extended Color Palette (from tailwind.config.js)
```javascript
colors: {
  // Page & surface backgrounds
  'bg-page': '#F7F8FC',          // Off-white page background
  'surface-default': '#FFFFFF',  // White surfaces (cards, panels)

  // Primary brand colors
  'primary-blue': '#2563EB',     // Main brand color
  'accent-green': '#10B981',     // Secondary brand color

  // Text
  'text-main': '#1E293B',        // Primary text color
  'text-muted': '#4B5563',       // Secondary text (darkened for AA contrast)

  // Borders
  'border-light': 'rgba(30, 41, 59, 0.08)',

  // Status colors
  'status-success': '#059669',   // Green for success states
  'status-error': '#DC2626',     // Red for errors
  'status-warning': '#D97706',   // Orange for warnings

  // Blue palette (expanded)
  'blue-50': '#EFF6FF',
  'blue-100': '#DBEAFE',
  'blue-200': '#BFDBFE',
  'blue-600': '#2563EB',         // Same as primary
  'blue-700': '#1D4ED8',
  'blue-800': '#1E40AF',

  // Green palette (expanded)
  'green-50': '#ECFDF5',
  'green-100': '#D1FAE5',
  'green-200': '#A7F3D0',
  'green-500': '#10B981',        // Same as accent
  'green-600': '#059669',
  'green-700': '#047857',
}
```

### 3. Tab-Specific Accent Colors
From `dashboardConstants.js` (TABS array):
```javascript
TABS = [
  { id: 'overview', label: 'Overview', accent: '#2563EB' },         // Primary blue
  { id: 'sources', label: 'Who Shapes Your Feed', accent: '#6366F1' }, // Indigo
  { id: 'ads', label: 'Ads & Promotions', accent: '#D97706' },     // Orange
  { id: 'politics', label: 'Political Exposure', accent: '#7C3AED' }, // Purple
  { id: 'tone', label: 'Emotional Tone', accent: '#0D9488' },      // Teal
  { id: 'suggested_vs_followed', label: 'Suggested vs. Followed', accent: '#E11D48' }, // Rose
]
```

### 4. Theme System (dashboardConstants.js)
Blue theme for all analysis tabs, Green theme exclusively for Talk to Algorithm:

```javascript
THEME = {
  blue: {
    accent: '#2563EB',
    accentLight: 'rgba(37, 99, 235, 0.1)',      // 10% opacity
    accentMedium: 'rgba(37, 99, 235, 0.15)',    // 15% opacity
    gradient: 'linear-gradient(180deg, rgba(37, 99, 235, 0.03) 0%, rgba(37, 99, 235, 0.06) 50%, rgba(37, 99, 235, 0.02) 100%)',
    border: 'rgba(37, 99, 235, 0.12)',
    shadow: '0 4px 24px rgba(37, 99, 235, 0.06)',
  },
  green: {  // ONLY for "Talk to Algorithm" sections
    accent: '#10B981',
    accentLight: 'rgba(16, 185, 129, 0.1)',
    accentMedium: 'rgba(16, 185, 129, 0.15)',
    gradient: 'linear-gradient(165deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(16, 185, 129, 0.07) 100%)',
    border: 'rgba(16, 185, 129, 0.15)',
    shadow: '0 4px 32px rgba(16, 185, 129, 0.1)',
  },
}
```

### 5. Solid Surface Tokens (SURFACES)
```javascript
SURFACES = {
  // Hero chapter - solid light blue background
  HERO_BLUE: {
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
    shadow: '0 4px 24px rgba(37, 99, 235, 0.08)',
  },
  // Support cards in hero - solid white with clear border
  SUPPORT_WHITE: {
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  // Talk chapter - solid light green background
  TALK_GREEN: {
    background: '#ECFDF5',
    border: '1px solid #A7F3D0',
    shadow: '0 4px 24px rgba(16, 185, 129, 0.1)',
  },
  // Content sections - solid white with border
  SECTION_WHITE: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    shadow: 'none',
  },
  // Alternating tint for visual rhythm
  SECTION_TINT: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    shadow: 'none',
  },
}
```

---

## Dashboard Tabs

### Overview
**Tab 1: Overview** (id: 'overview')
**Purpose:** Single-screen "receipt" of selected window with topline metrics

**Components:**
- 4 topline metric cards (source concentration, commercial composition, political share, tone)
- 2 mini calculators (ad minutes, political minutes)
- Experiment suggestions
- Master numbers line

**Primary View:** `buildOverviewHero` - aggregates all data types

**File:** `/pages/dashboard/tabs/OverviewTab.jsx`

---

### Who Shapes Your Feed (Sources)
**Tab 2: Sources** (id: 'sources')
**Purpose:** Which accounts dominated what you saw

**Primary Metric:** Top creator concentration
**Hero View ID:** `creators-top`
**Accent Color:** `#6366F1` (Indigo)

**Key Insight Sections:**
- Label: "Observed"
- Title: "Influence during this window"
- Subtext: "Which accounts shaped what you saw. What appeared, not who you are."

**Secondary Sections:**
- "How influence concentrated" (whether few voices dominated)
- "Cross-platform presence" (accounts across multiple platforms)

**File:** `/pages/dashboard/tabs/SourcesTab.jsx`

---

### Ads & Promotions
**Tab 3: Ads** (id: 'ads')
**Purpose:** How much commercial content appeared?

**Primary Metric:** Ad percentage (`ads-percentage`)
**Hero View ID:** `ads-percentage`
**Accent Color:** `#D97706` (Orange)

**Key Insight Sections:**
- Label: "Observed"
- Title: "Commercial content in your feed"
- Subtext: "What share of your feed contains labeled ads and likely promotional content."

**Data Structure:**
- currentPercent: number (0-100)
- totalPosts: number
- segments: array (labeled ads, promotional content, etc.)

**Takeaway Logic:**
- 0% → "No commercial content detected in this sample."
- 1-10% → "About [X]% of posts were commercial."
- 10-30% → "[X]% of your feed was commercial content."
- 30%+ → "More than [X]% of your feed was commercial."

**File:** `/pages/dashboard/tabs/AdsTab.jsx`

---

### Political Exposure
**Tab 4: Politics** (id: 'politics')
**Purpose:** How much political content am I exposed to?

**Primary Metric:** Political share percentage
**Hero View ID:** `politics-share`
**Accent Color:** `#7C3AED` (Purple)

**Key Insight Sections:**
- Label: "Observed"
- Title: "Political keywords during this window"
- Subtext: "Measures exposure to political content, not belief formation."

**Important Notes:**
- NO moralizing about political exposure
- Counts observable occurrences of political terms
- Does NOT estimate viewpoint or belief
- Based purely on post text and captions in scans

**File:** `/pages/dashboard/tabs/PoliticsTab.jsx`

---

### Emotional Tone
**Tab 5: Tone** (id: 'tone')
**Purpose:** What emotional tones dominated your feed?

**Primary Metric:** Dominant emotional tone
**Hero View ID:** `tone-distribution`
**Accent Color:** `#0D9488` (Teal)

**Key Insight Sections:**
- Label: "Observed"
- Title: "Emotional tone during this window"
- Subtext: "What feelings did the content evoke? Analysis of post sentiment and language."

**Tone Categories:**
- Positive (uplifting, celebratory, humorous)
- Negative (critical, outraged, fearful)
- Neutral (informational, factual)
- Mixed (complex emotional content)

**File:** `/pages/dashboard/tabs/ToneTab.jsx`

---

### Suggested vs. Followed
**Tab 6: Suggested vs. Followed** (id: 'suggested_vs_followed')
**Purpose:** What share came from accounts you follow vs. recommended?

**Primary Metric:** Suggested percentage
**Hero View ID:** `promotion-share`
**Accent Color:** `#E11D48` (Rose)

**Key Insight Sections:**
- Label: "Observed"
- Title: "Suggested vs. followed content"
- Subtext: "What share of your feed came from accounts you follow vs. recommended by the algorithm?"

**Data Breakdown:**
- Followed posts: percentage and count
- Suggested posts: percentage and count
- Recommended/promoted: percentage and count (if available)

**Important Notes:**
- "Suggested" = algorithm recommended but not from followed accounts
- Helps users understand algorithmic vs. organic influence

**File:** `/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`

---

## Component Patterns

### Button Component (src/components/ui/Button.jsx)
Four variants with consistent styling:

**ButtonPrimary**
- Background: `#2563EB` (primary-blue)
- Text: White
- Hover: `#2563EB/90` with shadow lift (-translate-y-0.5, scale 1.01)
- Focus ring: 2px ring of `#2563EB/60`
- Border radius: `0.75rem` (12px)
- Sizes: sm (12px text), md (16px text), lg (18px text)

**ButtonSecondary**
- Background: White
- Border: 2px solid `#2563EB`
- Text: `#2563EB`
- Hover: `#2563EB/5` background
- Focus ring: 2px ring of `#2563EB/60`

**ButtonGhost**
- Background: Transparent
- Text: `#4B5563` (text-muted)
- Hover: `#2563EB/5` background, text becomes `#1E293B`
- Focus ring: 2px ring of `#2563EB/60`

**ButtonSuccess**
- Background: `#10B981` (accent-green)
- Text: White
- Hover: `#10B981/90` with shadow lift
- Focus ring: 2px ring of `#10B981/60`

**Implementation:**
```jsx
<ButtonPrimary size="md" to="/start">Get Started</ButtonPrimary>
<ButtonSecondary onClick={handleClick}>Cancel</ButtonSecondary>
<ButtonGhost to="/history">View History</ButtonGhost>
<ButtonSuccess>Confirm</ButtonSuccess>
```

### Tab Navigation (src/pages/dashboard/TabNavigation.jsx)
```jsx
// Properties:
- Active background: gradient from tab accent color
- Active text: white
- Inactive text: #64748B
- Inactive hover: rgba(255, 255, 255, 0.7) background
- Border radius: 12px (radius-sm)
- Padding: 2.5 text units height, px-3 sm:px-5
- Font: semibold, text-[11px] sm:text-sm
- Box shadow (active): 0 2px 8px of tab accent at 30% opacity
```

### Insight Hero Card (src/components/dashboard/InsightHero.jsx)
**Non-negotiable Rules:**
1. Title must state clear takeaway with actual computed value
2. Meaning explains in plain English (not restating chart)
3. WhyCare explains behavioral/exposure implications
4. NO vague adjectives ("mixed", "some", "moderate")
5. NO moralizing
6. NO em dashes

**Structure:**
- Label chip: Uppercase, 11px, accent color with light background
- Title: clamp(1.25rem, 3vw, 1.625rem), font-weight 700, letter-spacing -0.02em
- Meaning: Plain English explanation
- WhyCare: Optional behavioral context
- Meta: Optional supporting data (e.g., "Based on 160 posts")
- Left accent border: 1.5px width, gradient from tab accent

**Styling:**
```javascript
background: `linear-gradient(135deg, ${accent}08 0%, ${accent}04 50%, #FFFFFF 100%)`
border: `1px solid ${accent}18`
boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 8px 32px ${accent}0A`
```

### Section Header (src/components/dashboard/SectionHeader.jsx)
**Properties:**
- Left gradient accent bar: 4px width for h2, 3px for h3
- Heading font sizes: h2=18px (1.125rem), h3=15px (0.9375rem)
- Font weight: 600 (semibold)
- Color: #1E293B (text-main)
- Letter spacing: -0.01em
- Line height: 1.4
- Optional label (kicker): 11px, uppercase, accent color, letter-spacing 0.08em
- Optional subtext: text-sm, text-text-muted, max-width 560px

**Spacing:**
- Margin bottom: 4 (1rem)
- Gap between bar and content: 3 (0.75rem)

---

## Typography Scale

### Font Family
**Primary Font:** Inter (Google Fonts)
**Fallback Stack:** Inter, Plus Jakarta Sans, sans-serif
**Weights Loaded:** 400, 600, 700, 800

### Font Sizes (Tailwind-based scale)
```javascript
// Heading hierarchy
h1: 'clamp(1.875rem, 5vw, 2rem)'      // 30-32px responsive
h2: 'clamp(1.25rem, 3vw, 1.625rem)'   // 20-26px responsive
h3: '0.9375rem'                        // 15px fixed
h4/section headers: '1.125rem'         // 18px
p/body: 'text-base'                    // 16px (default)
small: 'text-sm'                       // 14px
label/chip: 'text-[11px]'              // 11px

// Specific component sizes (from Button.jsx)
sm: 'text-sm'     // 14px
md: 'text-base'   // 16px
lg: 'text-lg'     // 18px
```

### Font Weights
```javascript
'font-normal'    // 400 (body text)
'font-semibold'  // 600 (emphasis, section headers, labels)
'font-bold'      // 700 (headings, strong emphasis)
'font-extrabold' // 800 (hero headings)
```

### Line Heights
```javascript
'leading-none'       // 1 (tight, hero)
'leading-tight'      // 1.25 (headings)
'leading-[1.1]'      // Custom 1.1 (hero section)
'leading-[1.4]'      // Custom 1.4 (section headers)
'leading-relaxed'    // 1.625 (body text, paragraphs)
```

### Letter Spacing
```javascript
'tracking-none'          // 0
'tracking-tight'         // -0.025em (for large headings)
'tight-hero': '-0.03em'  // Even tighter hero
'tight-heading': '-0.02em'
'tight-card': '-0.01em'
'wide-label': '0.05em'   // Labels, chips
'wider-label': '0.1em'   // More emphasis
```

---

## Spacing & Layout

### Spacing Scale (Tailwind default, used throughout)
```javascript
p-0    = 0
p-1    = 0.25rem (4px)
p-2    = 0.5rem (8px)
p-3    = 0.75rem (12px)
p-4    = 1rem (16px)
p-5    = 1.25rem (20px)
p-6    = 1.5rem (24px)
p-8    = 2rem (32px)
p-10   = 2.5rem (40px)
p-12   = 3rem (48px)
p-16   = 4rem (64px)
```

### Standard Padding Values
```javascript
// Buttons
px-3 py-2   // sm button (12px x 8px)
px-6 py-3   // md button (24px x 12px)
px-8 py-4   // lg button (32px x 16px)

// Cards
p-5 sm:p-6   // Standard card padding (20px → 24px on larger screens)
pl-6 pr-5    // Asymmetric padding example

// Sections
py-12 sm:py-20   // Vertical section padding (48px → 80px)
px-4 sm:px-6     // Horizontal padding (16px → 24px)
```

### Max-Width Container Classes
```javascript
'max-w-xs'   = 20rem (320px)
'max-w-sm'   = 24rem (384px)
'max-w-md'   = 28rem (448px)
'max-w-lg'   = 32rem (512px)
'max-w-xl'   = 36rem (576px)
'max-w-2xl'  = 42rem (672px)
'max-w-3xl'  = 48rem (768px)
'max-w-4xl'  = 56rem (896px)
'max-w-6xl'  = 64rem (1024px)
'max-w-7xl'  = 80rem (1280px)
```

### Grid & Flex Gaps
```javascript
gap-1      = 0.25rem (4px)
gap-2      = 0.5rem (8px)
gap-3      = 0.75rem (12px)
gap-4      = 1rem (16px)
gap-6      = 1.5rem (24px)
gap-8      = 2rem (32px)
gap-12     = 3rem (48px)

// Common combinations
gap-x-6 gap-y-2    // Horizontal 24px, vertical 8px
gap-x-8 sm:gap-x-12  // Responsive horizontal gaps
```

### Border Radius
```javascript
'rounded-lg'      // 8px
'rounded-xl'      // 12px
'rounded-2xl'     // 16px
'rounded-3xl'     // 24px
'rounded-full'    // 9999px (pill)
'radius-sm': '12px'    // Custom
'radius-md': '20px'    // Custom
'radius-lg': '28px'    // Custom
'pill': '9999px'       // Custom
```

**Dashboard Standard:** Most cards use `rounded-2xl` (16px)

---

## Shadow & Border Tokens

### Box Shadows
```javascript
'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
'medium': '0 8px 24px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.03)',
'strong': '0 20px 60px rgba(15, 23, 42, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)',
'glow': '0 0 20px rgba(37, 99, 235, 0.25), 0 0 6px rgba(37, 99, 235, 0.1)',
'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)',
'card-hover': '0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(15, 23, 42, 0.06)',
'hero': '0 8px 40px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(37, 99, 235, 0.04)',
```

### Borders
```javascript
// Soft border (very light)
border border-border-light         // #E2E8F0 at 8% opacity
border-border-light/50             // 50% opacity variant

// Medium border
border-border-light/70             // For more emphasis
border border-border-medium        // Default medium border

// Tab-specific borders (from dashboard)
border: `1px solid ${accent}18`    // Accent color at 9.4% opacity
border: `1px solid ${accent}12`    // Accent color at 7.1% opacity
```

### Scrollbar Styling
```javascript
// Webkit browsers (Chrome, Safari, Edge)
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #CBD5E1;           // Light gray
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;           // Darker gray
}

// Firefox
scrollbar-width: thin;
scrollbar-color: #CBD5E1 transparent;
```

---

## User-Facing Copy

### Dashboard Tab Descriptions

**Trust Sentences (appear once per tab):**

**Ads Tab:**
> "This view estimates how often ads and sales-driven posts appeared in the content you scanned. It reflects what showed up, not what you believe or want."

**Politics Tab:**
> "Counts and percentages are based only on the posts included in your scans."

**Patterns (Sources) Tab:**
> "Counts and percentages are based only on the posts included in your scans."

**Tone Tab:**
> "Counts and percentages are based only on the posts included in your scans."

**Algorithm Overview Tab:**
> "These are content themes that appeared in your scans. They do not represent your identity or preferences."

### Section Header Copy (TAB_STORY_HEADERS)

**Algorithm Tab:**
- Observed: "Content patterns during this window" / "What content appeared based on your recent activity."
- Context: "Recurring themes" / "Themes that appeared repeatedly across your scans."
- Speculation: "Extrapolated future associations" / "If patterns continue, the system might associate you with these themes. Pure speculation."
- Summary: "Current algorithmic interpretation" / "How the system appears to be categorizing you based on observed patterns."

**Ads Tab:**
- Observed: "Commercial content in your feed" / "What share of your feed contains labeled ads and promotional content."
- Context: "Where commercial content comes from" / "Which advertisers and platforms account for the most commercial content during this window."
- Speculation: "Additional detail from the same window" / "Optional deeper cuts from the same window. We cannot predict."
- Summary: "What you could try" / "Optional actions if you want to test changes in upcoming scans."

**Politics Tab:**
- Observed: "Political keywords during this window" / "Measures exposure to political content, not belief formation."
- Context: "Where political exposure comes from" / "Which accounts and platforms drove political keywords during this window."
- Additional Detail: "How this is measured" / "We look for political terms in post text and captions within your scans. We count how often those terms appear and which accounts they appear from. This does not estimate your viewpoint. It only summarizes what appeared in the feed content you scanned."
- Summary: "Political keyword patterns" / "Observed patterns during this window."

**Patterns/Sources Tab:**
- Observed: "Topics during this window" / "What surfaced. Patterns in exposure, not preference."
- Context: "How topics distributed" / "Where repetition formed and where variety emerged."
- Additional Detail: "Pattern movement from this window" / "How themes shifted. Narrowing, broadening, or stabilizing."
- Summary: "Topic patterns observed" / "Movement detected during this window."

**Tone Tab:**
- Observed: "Emotional tone during this window" / "What feelings did the content evoke?"
- Context: "Where emotional tone concentrates" / "Which types of content drove positive, negative, or neutral sentiment."
- Additional Detail: "Tone by creator or platform" / "How different sources contributed to overall emotional tone."
- Summary: "Overall emotional pattern" / "Dominant sentiment during this window."

**Suggested vs. Followed Tab:**
- Observed: "Suggested vs. followed split" / "What share came from accounts you follow vs. recommended?"
- Context: "How recommendations concentrated" / "Which platforms and algorithms drove suggested content."
- Additional Detail: "Temporal pattern" / "When did recommended content appear most?"
- Summary: "Recommended content impact" / "How much algorithmic suggestion shaped what you saw."

### Epistemic Restraint in Copy

**ACCEPTABLE:**
- "Your feed contained 70% content from accounts you don't follow"
- "Algorithms are designed to keep users scrolling"
- "Algorithms optimize for engagement"
- "This pattern may suggest..."
- "Based on observable data..."

**NOT ACCEPTABLE:**
- "The algorithm wants you to..." (anthropomorphizes)
- "TikTok specifically uses X technique" (unverifiable platform mechanics)
- "You should..." (prescriptive)
- "This proves..." (overstates certainty)
- "You believe..." (assumes identity)

---

## Component File Structure

### Key Component Imports (from DashboardPage.jsx)

**Dashboard Orchestrator:**
```jsx
import DashboardPage from './pages/dashboard/DashboardPage'
```

**Tab System:**
```jsx
import TabNavigation from './pages/dashboard/TabNavigation'      // Tab switcher
import TabRenderer from './pages/dashboard/TabRenderer'          // Content renderer
import { TABS } from './pages/dashboard/dashboardCatalog'        // Tab definitions
```

**Individual Tabs:**
```jsx
import OverviewTab from './pages/dashboard/tabs/OverviewTab'
import SourcesTab from './pages/dashboard/tabs/SourcesTab'
import AdsTab from './pages/dashboard/tabs/AdsTab'
import PoliticsTab from './pages/dashboard/tabs/PoliticsTab'
import ToneTab from './pages/dashboard/tabs/ToneTab'
import SuggestedVsFollowedTab from './pages/dashboard/tabs/SuggestedVsFollowedTab'
```

**Dashboard Primitives:**
```jsx
import {
  MasterNumbersLine,
  DenominatorLine,
  CompositionBar100WithCounts,
  MiniCalculator,
  ToplineMetricCard,
  ExperimentSuggestionCard,
} from './components/dashboard/primitives'
```

**Shared Dashboard Components:**
```jsx
import InsightHero from './components/dashboard/InsightHero'
import SectionHeader from './components/dashboard/SectionHeader'
import TrendsCTA from './components/dashboard/TrendsCTA'
import TrendsPanel from './components/dashboard/TrendsPanel'
import ViewCard from './components/dashboard/ViewCard'
import ConfidenceBadge from './components/dashboard/ConfidenceBadge'
import EmptyState from './components/dashboard/EmptyState'
```

**UI Components:**
```jsx
import { ButtonPrimary, ButtonSecondary, ButtonGhost, ButtonSuccess } from './components/ui/Button'
import { Skeleton, SkeletonCard } from './components/ui/Skeleton'
import { Toast, ToastProvider } from './components/ui/Toast'
import ErrorBoundary from './components/ui/ErrorBoundary'
```

**Utilities:**
```jsx
import { useDashboardData } from './lib/dashboard/useDashboardData'
import { getCurrentPlanTier, PLAN_TIERS } from './lib/plan'
import { useAuth } from './lib/auth/useAuth'
import { track, EVENTS } from './lib/analytics'
```

---

## Routes & Page Structure

### Main Routes (from App.jsx)

```javascript
// Landing
'/' → HeroSection + Marketing sections

// Scan flow
'/start' → StartPage (platform selection)
'/scan/platform/:platform' → ScanPlatformPage (scan capture)
'/scan/processing' → ProcessingPage (loading state)
'/scan/results/:scanId' → ResultsPage (post-scan results)
'/history' → HistoryPage (past scans)

// Core product
'/dashboard' → DashboardPage (6-tab dashboard - MAIN TARGET)

// Account
'/settings' → SettingsPage
'/plus' → PlusPage (upgrade page)
'/auth/callback' → AuthCallbackPage (Supabase OAuth)

// Legal
'/privacy' → PrivacyPage
'/terms' → TermsPage

// Dev (debug only)
'/dev/events' → EventsDebugPage
'/dev/entitlements' → EntitlementsDebugPage

// 404
'*' → NotFoundPage
```

---

## State Management

### Dashboard State Hook (useDashboardState)
Manages:
- `platformFilter` - selected platform(s)
- `dateRange` - start/end dates
- `datePreset` - "last7days", "last30days", etc.
- `filtersActive` - boolean
- `heroEvidenceExpanded` - expand/collapse state
- Various helper functions for date formatting

### Authentication Context (AuthProvider)
Provides:
- `session` - user session object
- `authReady` - boolean for initial load state
- `user` - authenticated user object

### Paywall Provider (PaywallProvider)
Provides:
- `openPaywall(placement)` - open upgrade modal
- `isPlusUser` - boolean

### Analytics Event Tracking
Key events:
- `UPGRADE_CTA_CLICKED` - premium feature interacted
- Navigation events
- Scan completion events

---

## Responsive Design

### Breakpoints (Tailwind standard)
```javascript
sm: '640px'
md: '768px'
lg: '1024px'
xl: '1280px'
2xl: '1536px'
```

### Common Responsive Patterns
```jsx
// Padding
px-4 sm:px-6 lg:px-8

// Font sizes
text-sm sm:text-base md:text-lg

// Spacing
py-12 sm:py-20 md:py-32

// Layout
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

// Visibility
hidden sm:block         // Hide on mobile, show on sm+
sm:hidden              // Show on mobile, hide on sm+
```

### Mobile-First Approach
Dashboard is designed mobile-first:
- Tab buttons have reduced padding on mobile
- Font sizes use clamp() for smooth scaling
- Touch targets maintain 44px minimum height for accessibility

---

## Accessibility Standards

### WCAG AA Compliance

**Color Contrast:**
- Text (#1E293B) on background (#F7F8FC): 14.3:1 ratio
- Text-muted (#4B5563) was darkened from #64748B to pass AA
- All interactive elements meet 4.5:1 minimum

**Keyboard Navigation:**
- Tab buttons support arrow keys (left/right), Home, End
- All buttons focusable with visible ring
- Focus visible ring: 2px solid with accent color, offset 2px

**ARIA Labels:**
- Tab elements: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`
- Buttons: `aria-label` for icon-only buttons
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-label`
- Landmark regions: `<nav>`, `<main>`, `<footer>` with `aria-label`

**Screen Reader Support:**
- Skip to main content link (visually hidden, focusable)
- Semantic HTML (headings, nav, main, footer)
- Alternative text for icons (via Lucide's `aria-label`)
- Reduced motion: `@media (prefers-reduced-motion: reduce)`

**Touch Accessibility:**
- Minimum touch target: 44px x 44px
- Scrollable areas: `-webkit-overflow-scrolling: touch`
- Safe area insets for notched devices

---

## Animation & Motion

### Framer Motion Usage
```javascript
// Page transitions
<motion.div
  key={location.pathname}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
/>

// InsightHero entrance
initial={{ opacity: 0, y: 16, scale: 0.97 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}

// Mobile menu slide
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
transition={{ type: 'spring', damping: 30, stiffness: 300 }}
```

### CSS Animations
```javascript
'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
'scroll-slow': 'scroll 40s linear infinite',

// Accessibility: respect prefers-reduced-motion
@media (prefers-reduced-motion: reduce) {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
```

---

## Implementation Checklist for Mobile App

### Phase 1: Core Structure
- [ ] Replicate tab navigation (6 tabs with accent colors)
- [ ] Implement insight hero card layout
- [ ] Create section header component
- [ ] Build view card wrapper

### Phase 2: Styling System
- [ ] Convert Tailwind tokens to React Native StyleSheet
- [ ] Implement color system (all hex codes + opacity variants)
- [ ] Set up font family (Inter or equivalent)
- [ ] Create shadow system (all 7 shadow values)

### Phase 3: Dashboard Tabs
- [ ] Overview tab with 4 metric cards
- [ ] Sources tab with creator concentration
- [ ] Ads tab with percentage visualization
- [ ] Politics tab with exposure metrics
- [ ] Tone tab with emotional distribution
- [ ] Suggested vs. Followed tab

### Phase 4: Data Visualization
- [ ] Number line chart implementation
- [ ] Bar chart implementation
- [ ] Stacked 100% bar chart
- [ ] Line chart for trends
- [ ] Table renderer for data lists

### Phase 5: Interactive Features
- [ ] Tab switching with accent color animation
- [ ] Expand/collapse sections
- [ ] Premium upsell paywall integration
- [ ] Filter panel (platform, date range)

### Phase 6: Accessibility & Polish
- [ ] Ensure 44px touch targets
- [ ] Implement focus states for keyboard
- [ ] Test color contrast ratios
- [ ] Add loading skeleton states
- [ ] Implement error boundaries

---

## References

**Source Files:**
- `/lib/theme/tokens.js` - Brand colors and semantic tokens
- `/tailwind.config.js` - Complete Tailwind configuration
- `/pages/dashboard/dashboardCatalog.js` - View definitions and data structure
- `/pages/dashboard/dashboardConstants.js` - Theme and surface tokens
- `/components/ui/Button.jsx` - Button variant implementations
- `/components/dashboard/InsightHero.jsx` - Hero card structure
- `/components/dashboard/SectionHeader.jsx` - Section header structure
- `/pages/dashboard/tabs/*.jsx` - Individual tab implementations

**Documentation:**
- CLAUDE.md - Project instructions and epistemic restraint standards
- All files include JSDoc comments explaining purpose and usage

---

**Generated:** 2026-02-24
**Version:** 1.0 (Complete design specification)
