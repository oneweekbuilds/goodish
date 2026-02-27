---
name: ui-ux-philosophy
description: >
  This skill should be used when working on "UI", "UX", "design", "layout",
  "dashboard", "components", "styling", "CSS", "colors", "typography",
  "charts", "data visualization", "tooltips", "empty states", "responsive
  design", "accessibility", or any visual or interaction design work on the
  AlgorithmLens project. Also use when reviewing the dashboard's look and feel.
version: 0.2.0
---

# AlgorithmLens UI/UX Philosophy & Design System

## 1. Design Baseline Configuration

AlgorithmLens uses three design dials to drive consistent, intentional visual and interaction decisions across all platforms.

**DESIGN_VARIANCE: 5** (Moderate Offset Layout)
- Layouts are asymmetric but not extreme. Use margin overlapping, varied aspect ratios, left-aligned headers over center-aligned data.
- Primary content flows naturally without forced symmetry.
- Avoid rigid 1:1:1 column grids; prefer 2:1 or 3:2 ratio splits.
- Headers and labels can be offset from their associated content to create visual rhythm.
- Never grid-breaking at level 5—stay balanced.

**MOTION_INTENSITY: 4** (Fluid, Restrained Transitions)
- Use CSS transitions only (no Framer Motion or advanced choreography).
- Standard cubic-bezier: `cubic-bezier(0.16, 1, 0.3, 1)` for ease.
- Apply animation-delay cascades for staggered load-ins (e.g., `animation-delay: calc(var(--item-index) * 50ms)`).
- Animate only `transform` and `opacity`—never layout properties.
- Use `will-change: transform` sparingly, only on elements animating frequently.
- Tactile feedback on `:active` state: `-translate-y-[1px]` or `scale-[0.98]`.
- Respect `prefers-reduced-motion: reduce`—disable all animations for users with this preference.
- No flashing or animation exceeding 3x per second.

**VISUAL_DENSITY: 7** (Packed Data, Approaching Cockpit Mode)
- Minimize padding and margin; use border-top or divide-y instead of card boxes where possible.
- Data breathes through negative space, not card containers.
- Monospace font (tabular-nums or `font-family: monospace`) for all numeric metrics.
- Use only essential borders; prefer hairline or subtle dividers.
- Aim for maximum information per viewport without feeling cramped.
- Tooltips and secondary info appear on interaction, not always visible.
- Density 7 is ideal for dashboards and extension popups.

---

## 2. AlgorithmLens Design Identity

### Product Narrative
AlgorithmLens is inspired by **Oura Ring**—a health device that distills complex biometric data into calm, actionable insights. The design mirrors that philosophy: progressive disclosure (headline metrics first, drill-down on demand), trustworthy tone (clinical but approachable), and high data density without cognitive overload.

### Core Aesthetic
- **Not a SaaS tool.** This is a health dashboard. Think "annual health report" or "biometric device companion," not "project management app."
- **Calm, Trustworthy Tone.** Neutral color palette, clear hierarchy, no aggressive CTAs. Users trust AlgorithmLens because it respects their time and attention.
- **Headline-First Insight.** The metric that matters most appears first, largest, and boldest. Supporting data is secondary and accessible on demand.
- **High-Density Data.** Density 7 means a lot of information per screen, but every element serves a purpose. No decoration.

### Forbidden Anti-Patterns ("100 AI Tells")
**Never include:**
- Neon glows, prismatic effects, or laser-beam gradients
- Pure black (`#000000`); use `zinc-950` or `slate-950`
- Oversaturated accent colors (saturation > 80%)
- Inter, Roboto, Arial, or system fonts for body or headers
- Generic 3-column card layouts
- AI-purple or AI-blue color schemes (purple-500, blue-500 with white backgrounds)
- Startup slop naming or generic copywriting clichés
- Emoji in the UI (stickers, decorative icons are fine; text emojis are not)
- Unsplash stock photos with broken links (use `picsum.photos` or real data)
- Shadcn/ui components used unmodified with default styling
- Placeholder text that says "Lorem Ipsum" or "Heading"
- Spinning loading indicators (use skeleton screens instead)

---

## 3. Cross-Platform Rules

These rules apply to iOS app, Chrome extension, and Next.js website equally.

### Accessibility (Non-Negotiable)
- **Contrast.** Minimum 4.5:1 for text on background, 3:1 for UI components and borders.
- **Color is not the only indicator.** If an element is interactive because it's red, also add an icon, text label, or underline.
- **Screen Reader Labels.** Every interactive element must have `aria-label`, `aria-describedby`, or semantic `<label>` on web; `accessibilityLabel` on React Native.
- **Keyboard Navigation.** Web: full keyboard support with Tab, Enter, Escape, arrow keys where applicable. iOS: VoiceOver rotor and standard gestures. Android: TalkBack navigation.
- **Reduce Motion.** Detect `prefers-reduced-motion: reduce` and disable all transitions and animations; show final state immediately.

### Typography Hierarchy
- **Headline.** Largest size, boldest weight (600–700), tight tracking. Sets page topic.
- **Subheading.** Secondary level, medium weight (500–600), slightly tighter tracking than body.
- **Body.** Standard reading size, regular weight (400–500), relaxed line height (≥1.5).
- **Caption/Small.** For timestamps, meta, secondary stats. Smaller size, lighter weight (400), can be slightly tighter line height.
- **All sizes must scale for Dynamic Type (iOS) and font scaling (web).** Avoid hardcoded pixel sizes; use semantic styles.

### Color Philosophy
- **Semantic Color Roles.** Use semantic naming: `primary`, `secondary`, `success`, `warning`, `error`, `info`—never `color-1`, `color-2`.
- **Calm, Muted Palette.** Saturation < 70% for all colors. Backgrounds approach `#f9fafb` or `#f5f5f5`. No bright, jarring colors.
- **Max 1 Accent Color.** All interactive elements (buttons, links, toggles, focus states) use a single accent color. Saturation < 80%, hue from calm spectrum (slate, teal, amber, indigo—not neon pink or cyber purple).
- **No AI Purple/Blue.** Ban `purple-500` + white, `blue-600` + white, and `indigo-400` + white combinations as primary brand colors. They signal "generic AI."
- **Neutral Bases.** Use `zinc`, `slate`, `gray`, or `stone` for backgrounds, borders, and text. These feel professional and calm.
- **Light and Dark Mode.** Support both. Use CSS custom properties for theming; never hardcode colors. Dark mode should dim (not invert) and preserve contrast.

### Interaction States
**Every interactive element must have at least three states:**

1. **Default/Rest.** Normal appearance.
2. **Hover/Focus.** Visible change (background shift, border highlight, shadow lift). Minimum 3:1 contrast for focus indicator.
3. **Active/Pressed.** Tactile feedback: `-translate-y-[1px]` or `scale-[0.98]` on `:active`. No lag.

**Full Interaction Cycles:**
- **Loading.** Skeleton screen (never spinner). Show placeholder boxes matching the final content layout.
- **Empty State.** If no data, show a message with optional action button (e.g., "No data yet. Add a measurement to get started.").
- **Error State.** Clear, actionable error message. Include retry button if applicable.
- **Success State.** Brief confirmation (toast, inline message, or subtle color flash). Don't block user flow.

### Touch Targets & Spacing
- **Minimum size:** 44×44 px on iOS/web, 48×48 dp on Android.
- **Spacing around targets:** 24 px between interactive elements (no accidental taps).
- **Padding inside targets:** 12–16 px minimum, more for primary actions.

---

## 4. iOS App (React Native / Expo)

### Safe Areas & Layout
- **Respect Safe Areas.** Notches, Dynamic Island, and home indicator must not overlap content.
  - Use `useSafeAreaInsets()` from `react-native-safe-area-context`.
  - Horizontal padding: 16 pt minimum. Vertical padding: 8 pt minimum.
- **Screen Size Support.** Target 375 pt to 430 pt width (iPhone SE to iPhone Pro Max).
- **8pt Grid Alignment.** All spacing in multiples of 8 pt: 8, 16, 24, 32, 40, etc.

### Navigation & Information Architecture
- **Tab Bar, Never Hamburger.** iOS users expect a bottom tab bar for 3–5 top-level sections.
  - Each tab has icon + label (labels always visible, not hidden on scroll).
  - Use native `TabNavigator` from React Navigation with `screenOptions.tabBarLabel`.
  - Never override the swipe-back gesture—it's fundamental to iOS UX.
- **Large Titles in Primary Views.** Use `headerLargeTitle` option; titles collapse on scroll for a native feel.
- **Back Navigation.** Automatic swipe-back gesture on all screens with a previous route. Never disable it.

### Typography & Dynamic Type
- **Semantic Text Styles.** Use `RFValue()` (React Native Scale Helper) or scale factors to support Dynamic Type.
  - `title-1`: ~34 pt, weight 700
  - `headline`: ~17 pt, weight 600
  - `body`: ~17 pt, weight 400 (default, must be readable at 11 pt minimum scaled down, 28 pt maximum scaled up)
  - `caption`: ~13 pt, weight 400
- **Custom Fonts Must Scale.** If using custom fonts (not system fonts), they must respect Dynamic Type by scaling proportionally.
- **Minimum Text Size.** Never smaller than 11 pt on the default Dynamic Type setting. Users can increase this; your app must scale.
- **Preferred Font.** Use system fonts (San Francisco) unless brand requires custom; custom fonts must not lose readability at extremes.

### Colors
- **Semantic System Colors.** Use `UIColor.label`, `UIColor.secondaryLabel`, `UIColor.tertiaryLabel` for text; these adapt to light/dark automatically.
- **Light/Dark Variants for Custom Colors.** Define all custom colors with explicit light and dark values; use `colorScheme` detection or `Appearance.addChangeListener()`.
- **No Color-Only Indicators.** If a data point is "red" because it's bad, also show an icon (e.g., ⚠ or downward arrow) or text label.

### Interaction Patterns
- **Standard iOS Gestures.**
  - Swipe back (left edge).
  - Swipe to dismiss (top modal).
  - Double tap to zoom (images).
  - Long press to reveal context menu.
  - Never override these; always provide them.
- **Haptic Feedback.** Trigger feedback on significant actions:
  - `impactOccurred('medium')` on button press.
  - `selectionChanged()` on toggle/switch.
  - `notificationOccurred('success')` on task completion.
- **VoiceOver Support.**
  - `accessibilityLabel` on all interactive elements and images.
  - `accessibilityHint` for non-obvious interactions.
  - `accessibilityElement={true}` on custom components.
  - Announce state changes with `AccessibilityInfo.announceForAccessibility()`.

### Loading & Skeleton Screens
- **Never use a blocking spinner.** Show skeleton screens that match the final layout.
- **Skeleton Structure:**
  ```jsx
  <View style={styles.skeletonContainer}>
    <View style={[styles.skeletonBox, { width: '80%', height: 24 }]} />
    <View style={[styles.skeletonBox, { width: '100%', height: 64, marginTop: 12 }]} />
  </View>
  ```
- **Animate the skeleton** with a subtle opacity pulse or shimmer effect using `Animated` API.

### Onboarding & Permissions
- **Onboarding.** Maximum 3 screens. All skippable ("Skip" button visible on each screen). Focus on value, not features.
- **Permission Requests.** Request permission at the moment of use, not at launch. Example: show "Add a measurement" action, then request Health Kit permission only when user taps "Add."
- **Transient Dialogs.** Use `Alert.alert()` sparingly; prefer inline messaging when possible.

---

## 5. Chrome Extension

### Core Constraints
- **Manifest V3.** All code must be compatible with MV3 (no content scripts with inline scripts, service workers instead of background pages).
- **Popup Size.** Standard popup is 360×600 px. Responsive at narrower widths if user resizes.
- **Content Script Scope.** Inject only styling and minimal interaction—avoid blocking page load.

### Semantic HTML & Accessibility
- **Semantic Elements.** Never div soup. Use `<button>`, `<input>`, `<label>`, `<nav>`, `<main>`, `<section>`, `<article>` as appropriate.
- **ARIA Labels.** Every interactive element must have `aria-label` or `aria-labelledby`.
  - For icon-only buttons: `<button aria-label="Open settings">⚙️</button>`
  - For form inputs: `<label for="metric">Metric</label><input id="metric" />`
- **Keyboard Navigation.** Tab through all interactive elements in logical order. Use `:focus-visible` for visible focus indicators.
- **Focus Indicator.** Minimum 2 px, contrast 3:1, outline or border—never remove default focus without providing an alternative.

### Responsive Popup & Compact Layout
- **Mobile-First.** Assume narrow width (360 px) as baseline.
- **No Horizontal Scrolling.** Content must fit in 360 px without horizontal scroll at any time.
- **VISUAL_DENSITY 7 is Perfect Here.** Use compact spacing, monospace for numbers, divide-y instead of cards.
- **Inline Validation.** Show validation errors on blur, not after form submission. Example: "Email format invalid" appears below input field immediately.

### Dark Mode & Color
- **CSS Custom Properties.** Define all colors as CSS custom properties in `:root` or `[data-theme]` selector.
  ```css
  :root {
    --bg-primary: #ffffff;
    --text-primary: #1a1a1a;
    --accent-color: #2563eb;
  }
  [data-theme="dark"] {
    --bg-primary: #1a1a1a;
    --text-primary: #ffffff;
    --accent-color: #60a5fa;
  }
  ```
- **System Preference Detection.** Use `prefers-color-scheme` media query and `window.matchMedia()` to detect and apply dark mode.
- **Contrast.** Minimum 4.5:1 for text, 3:1 for components, in both light and dark modes.

### Performance
- **Lazy Load Below-Fold Content.** Use Intersection Observer to defer loading images and data sections not immediately visible.
- **Minimize DOM.** No unnecessary wrapper divs. Combine CSS for layout—use Grid or Flexbox, not nested divs.
- **Code Splitting.** If popup is large, split into smaller bundles loaded on demand (e.g., settings panel loaded only when settings button is clicked).
- **Cache Strategically.** Store fetch results in `chrome.storage.local` with TTL. Check cache before making API call.
- **No Third-Party Scripts.** Minimize external JS dependencies. Polyfills add significant payload.

### Styling Rules
- **No Global Styles Affecting Page.** Content scripts must not inject styles affecting the host page's layout or visibility.
- **Use Shadow DOM if Injecting.** Isolate injected UI from page styles: `const shadow = element.attachShadow({ mode: 'open' })`.
- **Tailwind CSS or Plain CSS.** Both work in extensions; Tailwind is fine if bundle is optimized.

---

## 6. Next.js Website

### Server Components & Code Organization
- **Default to Server Components.** All components are Server Components unless they require `'use client'`.
- **Isolate Client Components.** Move `'use client'` boundaries as low in the tree as possible.
  ```jsx
  // app/page.jsx (Server Component)
  export default function Page() {
    const data = await fetchData(); // Server-only
    return <Dashboard data={data} /> // Client Component prop
  }

  // app/dashboard.jsx ('use client')
  'use client'
  export default function Dashboard({ data }) {
    const [filter, setFilter] = useState(''); // Client state
    return ...
  }
  ```
- **No API Routes for Everything.** Use Server Components to access databases and APIs directly. API routes only for webhooks or client-side mutations.

### Responsive Design & Layout
- **Mobile-First.** Base styles target 320 px width. Use `min-width` media queries to add tablet/desktop styles.
  ```css
  /* Base: mobile */
  .container { padding: 1rem; }
  @media (min-width: 768px) {
    .container { padding: 2rem; }
  }
  ```
- **Fluid Layouts.** Use `clamp()`, `min()`, `max()` for responsive sizing:
  ```css
  font-size: clamp(1rem, 2vw, 1.5rem); /* 16px to 24px, scales with viewport */
  padding: clamp(1rem, 5%, 2rem); /* 16px to 32px padding, responsive to viewport width */
  ```
- **Container Queries.** For component-level responsiveness (component adapts based on its container width, not viewport):
  ```css
  @container (max-width: 400px) {
    .card { flex-direction: column; }
  }
  ```
- **No Horizontal Scrolling.** At 320 px width, no element should overflow horizontally.

### Typography
- **Relative Units.** Use `rem` for font sizes, spacing, and media query breakpoints (never `px` for these).
  - 1 rem = 16 px (default).
  - Body text: 1rem (16 px) on mobile, 1.125rem (18 px) on desktop.
- **Responsive Font Sizes:**
  ```css
  h1 { font-size: clamp(1.75rem, 5vw, 3rem); } /* 28px to 48px */
  h2 { font-size: clamp(1.25rem, 3vw, 2rem); }
  p { font-size: clamp(1rem, 2vw, 1.125rem); }
  ```
- **Line Height.** Minimum 1.5 for body text for readability. Headlines can be tighter (1.2–1.3).
- **Line Length.** Maximum 65–75 characters per line (roughly 40–50 rem). Longer lines are harder to read.
- **Approved Fonts:** Geist, Satoshi, Cabinet Grotesk, Outfit. Not: Inter, Roboto, Arial, serif fonts for dashboards.

### Tailwind CSS & Styling
- **Tailwind CSS as Primary.** All styling via Tailwind utility classes.
- **CSS Custom Properties for Theming.** Define accent color, semantic colors in CSS vars:
  ```css
  :root {
    --accent: hsl(210, 100%, 50%); /* Calm teal-ish blue */
    --text-primary: hsl(0, 0%, 10%);
    --bg-primary: hsl(0, 0%, 98%);
  }
  ```
- **No h-screen; Use min-h-[100dvh].** `100dvh` (dynamic viewport height) respects mobile browser UI chrome; `100vh` can cause scroll on mobile.
- **CSS Grid Over Complex Flexbox Math.** Use Grid for layouts with fixed columns:
  ```html
  <div class="grid grid-cols-3 gap-4 md:grid-cols-6">...</div>
  ```
- **Tailwind Dark Mode:**
  ```html
  <div class="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">...</div>
  ```

### Performance Optimization
- **Preconnect/Preload Critical Resources.**
  ```jsx
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preload" as="font" href="/fonts/geist.woff2" />
  ```
- **Lazy Load Images Below Fold.**
  ```jsx
  <Image src={...} loading="lazy" placeholder="blur" />
  ```
- **Always Include Explicit Image Dimensions.**
  ```jsx
  <Image width={400} height={300} src={...} />
  ```
- **Code Splitting with Dynamic Import.**
  ```jsx
  const HeavyChart = dynamic(() => import('./HeavyChart'), { loading: () => <Skeleton /> })
  ```
- **Next.js Image Optimization.** Use `next/image`, not `<img>`. It auto-optimizes formats and sizes.

### URL & Navigation
- **URL Reflects State.** Filters, search queries, and page state are encoded in URL:
  ```
  /dashboard?metric=heart_rate&range=7d&sort=date
  ```
- **Support Browser Back/Forward.** Use `useRouter().push(pathname + '?' + queryString)` to update URL on filter changes.
- **Active Navigation States.** Mark current page in navigation with `aria-current="page"`:
  ```jsx
  <a href="/dashboard" aria-current={pathname === '/dashboard' ? 'page' : undefined}>
    Dashboard
  </a>
  ```
- **Skip Navigation Link.** Add a skip link at the top of each page to jump to main content:
  ```jsx
  <a href="#main-content" class="sr-only">Skip to main content</a>
  <main id="main-content">...</main>
  ```

### Dashboard Aesthetic (Bento Layout)
At VISUAL_DENSITY 7, the AlgorithmLens dashboard uses a specific aesthetic:
- **Background.** `#f9fafb` (slightly off-white, almost invisible grid).
- **Cards/Sections.** White backgrounds (or `white` in light mode, `slate-900` in dark) with `border-slate-200/50` or `border-t` top border.
- **Card Radius.** `rounded-[2.5rem]` (large, rounded, not sharp corners).
- **Shadows.** Diffusion shadows (soft, large blur radius) rather than sharp drop shadows:
  ```css
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
  ```
- **Grid Layout.** Use CSS Grid with varying column spans:
  ```html
  <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
    <div class="col-span-1">Card 1</div>
    <div class="col-span-2">Wide Card 2</div>
    <div class="col-span-1">Card 3</div>
  </div>
  ```
- **Typography Stack.** Geist or Satoshi for display, body, and UI. Tracking-tight for headlines (`tracking-tight`). Labels sit above or below data.
- **Monospace Numbers.** All numeric metrics in `font-mono` (tabular-nums):
  ```html
  <div class="font-mono tabular-nums text-2xl font-bold">72.5 bpm</div>
  ```
- **No Generic Card Boxes.** Instead of wrapping every stat in a card, use border-t or divide-y to separate items:
  ```html
  <div class="divide-y divide-slate-200">
    <div class="py-4">Heart Rate: <span class="font-mono">72</span></div>
    <div class="py-4">Sleep: <span class="font-mono">8.2h</span></div>
  </div>
  ```

---

## 7. Typography Rules

### Approved Font Families
**Desktop & Web:**
- **Geist** (primary, modern, clean).
- **Satoshi** (secondary, rounded, friendly).
- **Cabinet Grotesk** (geometric, bold headers).
- **Outfit** (alternative, geometric, trendy).

**iOS (React Native):**
- **San Francisco** (system default, always available, scales with Dynamic Type).
- Only use custom fonts if brand requires; ensure they scale with Dynamic Type.

**Banned Fonts (Never Use):**
- Inter (generic, uninspiring, overused)
- Roboto (generic, default Android)
- Arial (outdated)
- Any serif font for dashboards (use serif only for marketing content, never data UIs)
- System fonts on web (too generic)

### Size & Scale
**Mobile (Baseline: 16 px = 1 rem):**
- Headline (h1): 28–32 px (1.75–2rem)
- Subheading (h2): 20–24 px (1.25–1.5rem)
- Body: 16 px (1rem)
- Small/Caption: 14 px (0.875rem)
- Tiny/Meta: 12 px (0.75rem)

**Desktop (Baseline: 16 px = 1 rem):**
- Headline (h1): 40–48 px (2.5–3rem)
- Subheading (h2): 28–32 px (1.75–2rem)
- Body: 18 px (1.125rem)
- Small/Caption: 14 px (0.875rem)
- Tiny/Meta: 12 px (0.75rem)

**Responsive Formula:**
```css
/* Use clamp() for automatic scaling */
h1 { font-size: clamp(1.75rem, 5vw, 3rem); }
h2 { font-size: clamp(1.25rem, 3vw, 2rem); }
p { font-size: clamp(1rem, 2vw, 1.125rem); }
```

### Weight & Hierarchy
- **Headlines (h1, h2):** 600–700 weight, tight tracking (`tracking-tight`), usually uppercase or capitalized.
- **Subheadings (h3, h4):** 500–600 weight, normal tracking.
- **Body (p):** 400 weight, normal or relaxed tracking.
- **Small/Caption:** 400 weight, normal or tight tracking.
- **Interactive (buttons, links):** 500–600 weight to stand out from body.

### Line Height & Spacing
- **Headlines:** 1.2–1.3 line height (tight, confident).
- **Body:** 1.5–1.6 line height (loose, readable).
- **Small/Caption:** 1.4–1.5 line height.
- **Line Length:** 40–50 rem (65–75 characters) for paragraphs. Narrow columns reduce readability.

### Hardcoded Sizes Forbidden
- Never use fixed pixel sizes for font or spacing: `style={{ fontSize: '14px' }}` or `px-6` that don't respond to viewport changes.
- Always use relative units: `rem` on web, `pt` on iOS with scaling functions.

---

## 8. Color & Theming

### Semantic Color Roles
Define colors by purpose, not by name:
- **Primary:** Main brand action color (links, primary buttons, highlights). Must have 4.5:1 contrast on light background.
- **Secondary:** Supporting interactive elements. Lower emphasis than primary.
- **Success:** Positive actions, confirmations. Avoid pure green (`#00ff00`); use `emerald-600` or `teal-600`.
- **Warning:** Caution, pending actions. Use `amber-500` or `yellow-600`, not bright yellow.
- **Error:** Destructive actions, failures. Use `red-600` or `rose-600`, not pure red.
- **Info:** Informational messages. Use `blue-600` or `sky-600`.
- **Neutral:** Backgrounds, borders, text hierarchy. Use `zinc`, `slate`, `gray`, `stone`.

### Calm, Muted Palette
- **Saturation < 70% for all colors.** No bright, jarring colors.
- **Avoid pure hues.** Don't use HSL(0, 100%, 50%) colors. Instead, desaturate and shift lightness:
  - Not: `#ff0000` (red). Use: `#dc2626` (red-600, HSL 0, 80%, 45%).
  - Not: `#00ff00` (green). Use: `#16a34a` (green-600, HSL 120, 70%, 45%).
- **Examples of Calm Colors:**
  - Teal: `#0d9488` (emerald-600)
  - Blue-Gray: `#475569` (slate-600)
  - Warm Gray: `#78716c` (stone-600)
  - Soft Amber: `#d97706` (amber-600)

### Max 1 Accent Color
- **Single Accent.** All interactive elements (buttons, links, focus states, toggles, badges, underlines) use the same accent color.
- **Accent Selection.** Choose from: teal, slate-blue, soft-indigo, warm-amber, sage-green. Saturation < 80%, avoid cyber colors.
- **Not AI Purple.** Never use `purple-500` (#a855f7) or `purple-600` (#9333ea) as primary accent on white backgrounds—it screams "generic AI."
- **Light & Dark Variants.** Provide light and dark versions of the accent:
  ```css
  :root {
    --accent: #0d9488; /* Teal-600 */
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --accent: #14b8a6; /* Teal-500, lighter for dark backgrounds */
    }
  }
  ```

### Neutral Bases
- **Background.** `#f9fafb` (zinc-50) in light mode, `#09090b` (zinc-950) in dark mode. Slightly off-white/off-black, never pure white/black.
- **Text Primary.** `#18181b` (zinc-900) in light mode, `#fafafa` (zinc-50) in dark mode.
- **Text Secondary.** `#71717a` (zinc-500) in light mode, `#a1a1aa` (zinc-400) in dark mode.
- **Border.** `#e4e4e7` (zinc-200) in light mode, `#27272a` (zinc-800) in dark mode.

### Contrast Requirements
- **4.5:1 for text on background.** Ensure all body text, labels, and small text meet this ratio.
- **3:1 for UI components.** Buttons, badges, borders, icons must have 3:1 contrast minimum.
- **Test with WCAG AA.** Use WebAIM Contrast Checker or similar tools. No exceptions.
- **No Color Alone.** If a UI element is interactive or communicates status solely by color (e.g., red background for error), add an icon, text label, or border pattern.

### Light & Dark Mode
- **CSS Custom Properties.**
  ```css
  :root {
    --color-bg: #f9fafb;
    --color-text: #18181b;
    --color-accent: #0d9488;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --color-bg: #09090b;
      --color-text: #fafafa;
      --color-accent: #14b8a6;
    }
  }
  ```
- **No Inversion.** Dark mode should not simply invert colors. Adjust brightness, saturation, and contrast for readability and mood.
- **Backgrounds with Atmosphere.** Never flat solid colors. Add subtle gradients, texture, or noise:
  ```css
  background: linear-gradient(135deg, #f9fafb 0%, #f0f0f0 100%);
  /* Or noise texture for depth */
  background-image: url('data:image/svg+xml,<svg>...</svg>');
  ```

### Wide Gamut Color (iOS P3)
- **iOS Only.** Support Display P3 color space for vibrant colors on newer iPhones:
  ```css
  @supports (color: color(display-p3 1 0 0)) {
    .accent { color: color(display-p3 0 0.6 0.5); }
  }
  ```
- **Fallback to sRGB.** All colors must have sRGB fallbacks for older devices.

---

## 9. Motion & Animation

### CSS Transitions (MOTION_INTENSITY: 4)
- **Easing Function.** Use `cubic-bezier(0.16, 1, 0.3, 1)` for smooth, responsive feel:
  ```css
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  ```
- **Duration.** 200–300 ms for most interactions. 500 ms+ for page transitions.
  - Button hover: 200 ms
  - Modal slide-in: 300 ms
  - Page fade: 500 ms
- **Properties.** Animate only `transform` and `opacity`. Never animate layout properties (`width`, `height`, `margin`, `padding`).
  ```css
  /* Good */
  transition: transform 0.3s, opacity 0.3s;

  /* Bad */
  transition: width 0.3s, height 0.3s; /* Layout thrashing */
  ```

### Animation Cascades & Stagger
- **Load-In Stagger.** For lists or grids, stagger animations with `animation-delay`:
  ```css
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .item {
    animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: calc(var(--item-index) * 50ms);
  }
  ```
  ```jsx
  {items.map((item, i) => (
    <div key={i} style={{ '--item-index': i }} className="item">
      {item}
    </div>
  ))}
  ```

### `will-change` & Performance
- **Use Sparingly.** Only on elements that animate frequently (e.g., hover effects on many buttons):
  ```css
  button { will-change: transform; }
  ```
- **Not Default.** Remove `will-change` when not animating; it consumes memory.

### Tactile Feedback on `:active`
- **Button Press.** Slight scale down or translate up on click:
  ```css
  button {
    transition: transform 0.1s, box-shadow 0.1s;
  }
  button:active {
    transform: translateY(-1px) scale(0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  ```
- **No Lag.** Active state must feel immediate (no delay). Users expect instant feedback on press.

### Respect `prefers-reduced-motion`
- **Detect & Disable Animations.**
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- **React Component:**
  ```jsx
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  ```
- **iOS:** Detect `AccessibilityInspector.isScreenReaderEnabled()` and disable haptic/animations.

### Micro-Interactions
- **Hover State.** Subtle color shift, slight scale, or shadow lift:
  ```css
  a { transition: color 0.2s, text-decoration 0.2s; }
  a:hover { color: var(--accent-color); text-decoration: underline; }
  ```
- **Loading Indicator.** Show skeleton screen with subtle pulse animation (not spinner).
- **Success Confirmation.** Brief flash of success color (100–200 ms) or checkmark animation.
- **Error State.** Shake or red flash to draw attention (200 ms).

### Animation Guidelines
- **No Flashing.** No element should flash more than 3x per second (28 Hz). WCAG2.1 Level A requirement.
- **No Infinite Animations.** Spinners, loading indicators, etc., should stop when loading completes. Infinite animations are annoying.
- **No Auto-play.** Video or auto-animating content (e.g., carousel) must not autoplay. Let user initiate.
- **Scroll-Triggered Animations.** Use Intersection Observer for subtle animations on scroll (fade-in, slide-up). Keep subtle; don't overuse.

---

## 10. Data Visualization

### Chart Types & Simplicity
- **Permitted Charts:** Bar charts, line charts, donut/pie charts (if percentage totals 100%).
- **Avoid:** Complex types (waterfall, sunburst, radial area) unless data complexity demands it.
- **No 3D or Decorative Charts.** 2D, flat charts only. 3D adds no information and reduces accessibility.

### Labeling & Clarity
- **Axis Labels.** Always include x-axis and y-axis labels. Example: "Heart Rate (bpm)" not just "Heart Rate."
- **Legends.** Clear legend identifying series colors. Position legend to the side or above, not overlapping data.
- **No Hover-Only Labels.** Critical labels must be visible by default. Hover tooltips provide additional detail, not primary info.
- **Data Point Labels.** For small datasets (≤5 points), include value labels on or near each point.
  ```
  Heart Rate Chart:
  72 bpm ——— Time: 9:00am
  74 bpm ——— Time: 10:00am
  ```

### Color in Charts
- **Distinct Colors.** If multiple series, each must have distinct color (no shades of the same hue for different series unless hierarchy is intentional).
- **Semantic Colors.** Use semantic meaning: green for positive/healthy, red for negative/caution, gray for neutral.
- **Accessibility.** Avoid red-green combinations alone. Add patterns, icons, or labels to distinguish.
- **Saturation.** Chart colors can be slightly more saturated than UI colors, but stay < 85% saturation.

### Numeric Display
- **Monospace Font.** All numbers in charts and metrics must use `font-family: monospace` or `font-feature-settings: 'tnum'` (tabular numbers).
  ```css
  .metric { font-family: 'Courier New', monospace; }
  ```
- **Significant Figures.** Show only necessary precision. "72.5 bpm" not "72.513 bpm."
- **Units.** Always include units in axis label, not per-value: "Heart Rate (bpm)" once on axis, then "72" on value (not "72 bpm" repeated).

### Empty States & No Data
- **Clear Message.** If no data: "No data available. Check back soon." or "Add your first measurement to get started."
- **Optional Action.** Include CTA button if applicable: "Log a measurement" or "Connect device."
- **Illustration Optional.** Small, simple icon or illustration is fine; no generic stock imagery.

### Mobile Responsiveness for Charts
- **Touch-Friendly Tooltips.** On mobile, tap to show tooltip (not hover). Tooltip should not overlap critical data.
- **Reduced Complexity.** Simplify charts on small screens (e.g., show last 7 days on mobile, full month on desktop).
- **No Rotation.** Never rotate chart to fit screen; use scroll or reflow layout.

---

## 11. Anti-Patterns Checklist

**NEVER include ANY of these:**

- **Hamburger Menu.** iOS requires tab bar. Web requires persistent nav. No hamburgers.
- **Blocking Spinners.** Show skeleton screens. Never block interaction with a spinner overlay.
- **Splash Screens.** No loading screens that delay app startup. Launch should be instant.
- **Hardcoded Font Sizes.** All sizes must scale (Dynamic Type on iOS, rem on web, font scaling on Android).
- **Color-Only Indicators.** Red alone doesn't mean error. Add icon, text, or pattern.
- **Hover-Only Interactions.** Actions only visible on hover break mobile and keyboard navigation. All actions must be discoverable at rest.
- **Div Soup HTML.** Use semantic elements (`<button>`, `<label>`, `<nav>`). No wrapping everything in `<div>`.
- **Placeholder-Only Labels.** Forms must have `<label>` elements, not just placeholder text. Labels stay visible when user types.
- **Disabled Submit Buttons.** "Submit button will enable when form is valid" is frustrating. Show inline validation instead.
- **Pure Black (#000000).** Use `zinc-950` or `slate-950`. Pure black is harsh on eyes and not found in nature.
- **Neon Glows or Prismatic Effects.** No `filter: drop-shadow(0 0 10px #ff00ff)`. These scream "low-effort AI design."
- **Inter Font.** Generic, uninspiring, overused. Use Geist, Satoshi, Cabinet Grotesk, or Outfit.
- **3-Column Card Grids.** Avoid symmetric, repetitive layouts. Use varied column spans and aspect ratios.
- **AI Purple or Cyber Blue.** Never `purple-500` + white or `blue-600` + white as primary brand. Use calm colors.
- **Generic Names in UI.** No "Heading", "Lorem Ipsum", "Click here", "Learn more" as placeholders. Use real, specific copy.
- **Emoji in UI.** Decorative stickers are fine, but text emojis are not (e.g., no "😊 You're doing great!").
- **Unsplash Broken Links.** Use `picsum.photos` or real data. Never hardcode external image URLs that might 404.
- **Shadcn/ui Unmodified.** If using shadcn/ui, customize the defaults (colors, spacing, fonts) to match AlgorithmLens identity.
- **h-screen on Mobile.** Use `min-h-[100dvh]` instead. `100vh` causes scroll on mobile due to browser UI.
- **Custom Cursors.** Never replace default cursor. Accessibility tools rely on standard cursors.
- **Stacked Modals.** Never open modal on top of modal. Modal on modal is confusing and untested.

---

## 12. Evaluation Checklist

Use this checklist when reviewing AlgorithmLens UI/UX work.

### Accessibility (Required for All Platforms)
- [ ] Minimum 4.5:1 contrast for text, 3:1 for components.
- [ ] No information conveyed by color alone.
- [ ] All interactive elements have screen reader labels.
- [ ] Full keyboard navigation (Tab, Enter, Escape, arrow keys).
- [ ] Focus indicators visible and sufficient contrast.
- [ ] `prefers-reduced-motion` respected (no animations if enabled).
- [ ] Alt text on all images.
- [ ] Form labels paired with inputs (not placeholder-only).

### iOS App Specific
- [ ] Respects safe areas (notch, Dynamic Island, home indicator).
- [ ] Tab bar navigation (3–5 tabs, always labeled).
- [ ] Large titles collapse on scroll.
- [ ] Swipe-back gesture never disabled.
- [ ] Dynamic Type support (text scales 11pt–28pt, custom fonts scale proportionally).
- [ ] Semantic system colors used (light/dark variants for custom colors).
- [ ] VoiceOver labels on all interactive elements.
- [ ] Haptic feedback on significant actions.
- [ ] Skeleton loading (no spinners).
- [ ] Onboarding ≤ 3 pages, skippable.
- [ ] Permissions requested in context, not at launch.

### Chrome Extension
- [ ] Semantic HTML (no div soup).
- [ ] ARIA labels on all interactive elements.
- [ ] Full keyboard navigation (Tab order logical).
- [ ] Focus indicators visible (2 px, 3:1 contrast).
- [ ] No horizontal scrolling at 360 px width.
- [ ] Dark mode support via CSS custom properties.
- [ ] 4.5:1 text contrast, 3:1 component contrast (light & dark).
- [ ] Manifest V3 compatible (no inline scripts in content scripts).
- [ ] No third-party analytics or tracking scripts.

### Next.js Website
- [ ] Mobile-first responsive design (320 px baseline).
- [ ] No horizontal scrolling at any width.
- [ ] Fluid typography (clamp(), responsive font sizes).
- [ ] Server Components by default, Client Components isolated.
- [ ] Images lazy-loaded with explicit dimensions.
- [ ] Preconnect/preload critical resources.
- [ ] Code splitting for large features.
- [ ] URL reflects state (filters, search, pagination in query params).
- [ ] Browser back/forward supported.
- [ ] Active navigation marked with `aria-current="page"`.
- [ ] Skip navigation link present on every page.
- [ ] Tailwind CSS used (no inline styles).
- [ ] Dark mode support.

### Typography
- [ ] Only approved fonts used (Geist, Satoshi, Cabinet Grotesk, Outfit).
- [ ] No hardcoded pixel sizes (relative units: rem, pt, scaled).
- [ ] Responsive font sizes (clamp() on web, scaling on iOS).
- [ ] Minimum 11 pt (iOS, Dynamic Type default) or 14 px (web).
- [ ] Line height ≥ 1.5 for body, ≥ 1.2 for headlines.
- [ ] Max 65–75 characters per line.
- [ ] Font weights used for hierarchy (not size alone).

### Color & Theming
- [ ] One accent color max, saturation < 80%.
- [ ] Calm, muted palette (saturation < 70%).
- [ ] No pure black (#000000); use zinc-950 or slate-950.
- [ ] No AI purple or cyber blue.
- [ ] Neutral bases: zinc, slate, gray, or stone.
- [ ] Light and dark mode supported.
- [ ] CSS custom properties for color theming (no hardcoded colors).
- [ ] 4.5:1 contrast for text, 3:1 for components.

### Motion & Animation
- [ ] Only `transform` and `opacity` animated.
- [ ] Smooth easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
- [ ] 200–300 ms typical duration.
- [ ] Staggered load-in animations (not all at once).
- [ ] Tactile feedback on `:active` state.
- [ ] No flashing (> 3x/second).
- [ ] No infinite animations.
- [ ] `prefers-reduced-motion` respected.
- [ ] Skeleton loading (not spinners).

### Data Visualization
- [ ] Charts use simple types (bar, line, donut only).
- [ ] Axis and series labels always visible.
- [ ] No hover-only labels; critical info shown by default.
- [ ] Monospace font for numbers.
- [ ] Semantic colors (green=good, red=bad, etc.).
- [ ] No 3D charts or decorative effects.
- [ ] Empty states show clear message and optional CTA.

### Design Identity
- [ ] Not generic SaaS aesthetic (no 3-column card grids, no Inter font, no neon).
- [ ] Calm, trustworthy tone (no aggressive CTAs, no hype language).
- [ ] Headline metrics prominent and large.
- [ ] High-density data (VISUAL_DENSITY 7 where applicable).
- [ ] No emoji in UI.
- [ ] Consistent brand accent color across platforms.
- [ ] Dashboard feels like health report, not startup tool.

### Performance
- [ ] Images optimized (next/image with explicit dimensions).
- [ ] Lazy load below-fold content.
- [ ] Code splitting for large features.
- [ ] preconnect/preload for critical resources.
- [ ] Minimal dependencies (no unnecessary libraries).
- [ ] Extension payload < 500 KB (uncompressed).

### Content & Copy
- [ ] Real copy (no "Lorem Ipsum" placeholders).
- [ ] Specific, actionable labels (no "Click here", "Learn more").
- [ ] Error messages clear and actionable.
- [ ] Empty state messages encouraging (not negative).
- [ ] Consistent terminology across platforms.

---

## Summary: The AlgorithmLens Design Philosophy

AlgorithmLens combines **clinical rigor** with **calm confidence**. It is not a SaaS tool; it is a companion health device, delivering high-density insights in a trustworthy, progressive manner. Every interaction respects the user's attention and intelligence.

- **Three dials drive consistency:** DESIGN_VARIANCE 5 (offset, not rigid), MOTION_INTENSITY 4 (fluid, CSS-only), VISUAL_DENSITY 7 (packed data, not cards).
- **Accessibility is non-negotiable:** 4.5:1 contrast, screen readers, keyboard nav, reduce motion support.
- **Typography is distinctive:** Geist, Satoshi, Cabinet Grotesk—never Inter or Roboto.
- **Color is calm:** Muted saturation, one accent, semantic roles, no AI purple.
- **Motion feels natural:** CSS transitions only, staggered load-ins, tactile feedback on press.
- **Data breathes:** Border-t dividers instead of card boxes at density 7.
- **Consistency across platforms:** Shared accessibility rules, shared color philosophy, platform-specific navigation patterns.

Every pixel, every motion, every color choice reinforces that AlgorithmLens is a health companion, not hype.
