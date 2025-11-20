# AlgorithmLens Homepage Audit Report

## 1. React Entry for Homepage Route

### Router Files
- **Entry Point**: `apps/algorithm-lens/src/main.tsx`
  - Sets up `BrowserRouter` and renders `App` component
- **Router Configuration**: `apps/algorithm-lens/src/App.tsx`
  - Defines routes using `react-router-dom`
  - Homepage route: `<Route path="/" element={<Home />} />` (line 48)

### Homepage Component
- **Wrapper Component**: `apps/algorithm-lens/src/pages/Home.tsx`
  - Wraps `LandingPage` from `figma-ui/pages/LandingPage.tsx`
  - Uses `useNavigate` hook to handle navigation
- **Actual Homepage Component**: `apps/algorithm-lens/src/figma-ui/pages/LandingPage.tsx`
  - This is the component that renders the homepage screen

---

## 2. Navbar Component

- **Path**: `apps/algorithm-lens/src/components/Navbar.tsx`
- **Usage**: Imported and rendered in `src/App.tsx` (line 2, line 66)
- **Features**: 
  - Sticky header with backdrop blur
  - Navigation links: Dashboard, How It Works, Pricing, Export, Privacy & Terms
  - "Get Started" CTA button

---

## 3. Comparison Block ("Before vs With")

- **Component**: `apps/algorithm-lens/src/figma-ui/pages/HeroComparison.tsx`
- **Usage**: Imported in `LandingPage.tsx` (line 7) and rendered at line 234
- **Location in LandingPage**: 
  - Lines 228-235: Wrapped in `motion.div` with margin-top spacing
  - Inline within the hero section, below the CTA buttons
- **Structure**:
  - Two-column grid: "Before AlgorithmLens" (left) and "With AlgorithmLens" (right)
  - Shows pill badges for each state (Bias, Ads, Mindless, Opaque vs Transparent, Mindful, Aware, Balanced)

---

## 4. "Try it free" Button

- **Path**: `apps/algorithm-lens/src/figma-ui/pages/LandingPage.tsx`
- **Location**: Lines 248-269
- **onClick Handler**: `scrollToDashboard()` function (defined at line 16-20)
- **Navigation Target**: 
  - Calls `onNavigate('dashboard')` which navigates to `/dashboard` route
  - Uses React Router navigation (no hash or scroll anchor)
- **Why it lands in the middle of Dashboard**:
  - The button uses `navigate('/dashboard')` which loads the DashboardPage component
  - DashboardPage has content starting at line 385 with `paddingTop: '40px'`
  - There may be conditional banner/upgrade content above the main dashboard content (lines 380-383)
  - Browser scroll restoration may preserve previous scroll position
  - No explicit `scrollTo(0, 0)` or scroll restoration reset on route change

---

## 5. Section Heading "Your feed is an invisible mirror"

- **Path**: `apps/algorithm-lens/src/figma-ui/pages/LandingPage.tsx`
- **Location**: Line 321 (inside the "How It Works" section)
- **Padding/Margin Utilities**:
  - **Section wrapper** (line 296-303):
    - `className="container-content section-spacing"`
    - `paddingTop: 'var(--spacing-section)'` (120px)
    - `paddingBottom: '72px'`
  - **Heading container** (line 306-312):
    - `style={{ maxWidth: '600px', marginBottom: 'var(--spacing-3xl)' }}` (64px margin-bottom)
  - **Heading element** (line 314-319):
    - `style={{ marginBottom: 'var(--spacing-md)' }}` (24px margin-bottom)
  - **CSS Classes Applied**:
    - `.container-content`: Adds `padding-inline: var(--grid-margin)` (80px desktop, 48px tablet, 32px mobile)
    - `.section-spacing`: Adds `margin-block: var(--spacing-section)` (120px desktop, 64px mobile)

**Total gap above heading**: 
- `var(--spacing-section)` (120px) from section padding-top
- Plus any margin from `.section-spacing` utility (120px margin-top on desktop)
- Total: ~240px on desktop, ~128px on mobile

---

## 6. Technology Choices

### Stack Confirmation
- ✅ **React**: Version 18.3.1 (confirmed in `package.json`)
- ✅ **Vite**: Version 5.4.21 (confirmed in `package.json` and `vite.config.ts`)
- ✅ **Tailwind CSS**: Version 3.4.18 (confirmed in `package.json`)

### Tailwind Configuration
- **Config Path**: `apps/algorithm-lens/tailwind.config.ts`
- **Alternative Config**: `apps/algorithm-lens/tailwind.config.cjs` (also present)
- **Content Sources**: 
  - `./index.html`
  - `./src/**/*.{ts,tsx,jsx,js}`
  - `./src/figma-ui/**/*.{ts,tsx,jsx,js}`

### Layout Wrappers
- **Main App Wrapper**: `src/App.tsx` (lines 64-72)
  - `<div className="flex min-h-screen flex-col bg-background text-foreground">`
  - Contains: `<Navbar />`, `<AppRoutes />`, `<Footer />`
  - No global padding/margins on this wrapper
- **Homepage Wrapper**: `src/figma-ui/pages/LandingPage.tsx` (line 37)
  - `<div className="alg-fm min-h-screen">`
  - Hero section has inline styles: `paddingTop: 'var(--navbar-height)'` (92px), `paddingLeft/Right: 'var(--grid-margin)'` (80px)
- **CSS Variables**: Defined in `src/figma-ui/styles/globals.css`
  - Spacing tokens: `--spacing-xs` through `--spacing-6xl`
  - Layout tokens: `--grid-margin`, `--navbar-height`
  - Applied via `.alg-fm` scoped class

---

## Summary Table

| Component | File Path | Notes |
|-----------|-----------|-------|
| **Router Entry** | `src/main.tsx` | React entry point |
| **Router Config** | `src/App.tsx` | Route definitions |
| **Homepage Component** | `src/figma-ui/pages/LandingPage.tsx` | Main homepage render |
| **Navbar** | `src/components/Navbar.tsx` | Sticky header with nav links |
| **Comparison Block** | `src/figma-ui/pages/HeroComparison.tsx` | Before/With AlgorithmLens visual |
| **Try it free Button** | `src/figma-ui/pages/LandingPage.tsx:248-269` | Navigates to `/dashboard` |
| **Section Heading** | `src/figma-ui/pages/LandingPage.tsx:321` | "Your feed is an invisible mirror" |
| **Tailwind Config** | `tailwind.config.ts` | Primary config file |
| **Global Styles** | `src/figma-ui/styles/globals.css` | CSS variables and utilities |







