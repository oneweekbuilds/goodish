const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber, PageBreak
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "EFF6FF", type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: "Arial", size: 20 })] })]
  });
}

function cell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20, bold: opts.bold, color: opts.color })] })]
  });
}

function severityCell(severity, width) {
  const colors = { "Critical": { fill: "FEE2E2", color: "991B1B" }, "High": { fill: "FEF3C7", color: "92400E" }, "Medium": { fill: "DBEAFE", color: "1E40AF" }, "Low": { fill: "F3F4F6", color: "374151" } };
  const c = colors[severity] || colors["Low"];
  return cell(severity, width, { fill: c.fill, color: c.color, bold: true });
}

function bullet(text, ref) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 22 })]
  });
}

function bodyText(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22 })]
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: "1E293B" })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: "2563EB" })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 23, bold: true, color: "374151" })]
  });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial" }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial" }, paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 23, bold: true, font: "Arial" }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "AlgorithmLens UI/UX Audit \u2014 Confidential", font: "Arial", size: 16, color: "9CA3AF", italics: true })] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", font: "Arial", size: 16, color: "9CA3AF" }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "9CA3AF" })] })] })
    },
    children: [
      // ========== TITLE PAGE ==========
      new Paragraph({ spacing: { before: 2400 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "AlgorithmLens", font: "Arial", size: 52, bold: true, color: "2563EB" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 80 }, children: [new TextRun({ text: "UI/UX Comprehensive Audit", font: "Arial", size: 40, bold: true, color: "1E293B" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "February 2026", font: "Arial", size: 24, color: "64748B" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [new TextRun({ text: "React + Tailwind CSS \u2022 Vite \u2022 Supabase \u2022 Framer Motion", font: "Arial", size: 20, color: "94A3B8" })] }),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== EXECUTIVE SUMMARY ==========
      heading1("Executive Summary"),
      bodyText("AlgorithmLens is a web application built with React 19, Tailwind CSS, Framer Motion, and Supabase that helps users understand how social media algorithms profile them. The app allows users to scan their feeds (via browser extension or video upload) and presents analytics dashboards showing ad targeting, content patterns, political lean, and tone analysis."),
      bodyText("This audit reviews every component and page in the codebase across seven dimensions: visual design consistency, navigation and information architecture, accessibility (WCAG 2.1), responsive design, interaction patterns, code architecture, and conversion flow optimization. The findings are organized as actionable suggestions you can pick and choose from."),

      new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: "Overall Scores", font: "Arial", size: 24, bold: true })] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [headerCell("Dimension", 4680), headerCell("Rating", 4680)] }),
          new TableRow({ children: [cell("Design System Consistency", 4680), cell("6/10 \u2014 Good tokens defined, inconsistently applied", 4680)] }),
          new TableRow({ children: [cell("Accessibility (WCAG 2.1 AA)", 4680), cell("4/10 \u2014 Multiple A and AA violations", 4680)] }),
          new TableRow({ children: [cell("Responsive Design", 4680), cell("7/10 \u2014 Tailwind approach solid, edge cases remain", 4680)] }),
          new TableRow({ children: [cell("Navigation & IA", 4680), cell("5/10 \u2014 No mobile menu, no 404, limited wayfinding", 4680)] }),
          new TableRow({ children: [cell("Interaction & Feedback", 4680), cell("6/10 \u2014 Good animations, missing loading/error states", 4680)] }),
          new TableRow({ children: [cell("Conversion Optimization", 4680), cell("6/10 \u2014 Clear CTAs but some dead-end flows", 4680)] }),
          new TableRow({ children: [cell("Code Organization", 4680), cell("7/10 \u2014 Good component separation, some large files", 4680)] }),
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 1. NAVIGATION & INFORMATION ARCHITECTURE ==========
      heading1("1. Navigation & Information Architecture"),

      heading2("1.1 Mobile Navigation Missing"),
      bodyText("The Navbar hides all navigation links on mobile (hidden md:flex) but provides no hamburger menu or mobile drawer. On screens narrower than 768px, the only navigation available is the logo (links to home) and the Sign In button. Users cannot reach Dashboard, Scan, History, or Plus from mobile."),
      heading3("Suggestion"),
      bullet("Add a hamburger/drawer menu for mobile with slide-in panel containing all nav links", "bullets"),
      bullet("Include user greeting and sign-in button inside the mobile drawer", "bullets"),

      heading2("1.2 Sign In Button Non-Functional"),
      bodyText("The Sign In button in the Navbar renders as a <button> with no onClick handler. Clicking it does nothing. This is confusing for users who expect it to open a login modal or navigate to an auth page."),
      heading3("Suggestion"),
      bullet("Wire the Sign In button to open a SignInPrompt modal or navigate to an auth flow", "bullets"),
      bullet("Consider using the existing SignInPrompt component as a modal overlay when clicked", "bullets"),

      heading2("1.3 No Active Route Highlighting"),
      bodyText("All navigation links share the same text-text-main style. There is no visual indicator showing which page the user is currently on. This makes it harder for users to orient themselves."),
      heading3("Suggestion"),
      bullet("Add active route styling (e.g., text-primary-blue font-semibold with an underline or dot indicator) using useLocation() to match current path", "bullets"),

      heading2("1.4 No 404/Catch-All Route"),
      bodyText("The App.jsx routes do not include a catch-all (*) route. Navigating to any undefined URL shows a blank page with just the navbar and footer."),
      heading3("Suggestion"),
      bullet("Add a <Route path=\"*\" element={<NotFoundPage />} /> with a friendly 404 page that links back to home", "bullets"),

      heading2("1.5 No Breadcrumbs or Back Navigation"),
      bodyText("Most inner pages (scan flow, results, dashboard tabs) lack breadcrumbs or back buttons. Users who land on /scan/results/abc123 have no obvious way to navigate back except the browser button."),
      heading3("Suggestion"),
      bullet("Add a consistent back-arrow link at the top of ScanPlatformPage, ProcessingPage, and ResultsPage", "bullets"),
      bullet("Consider breadcrumbs for the scan flow: Home > Scan > TikTok > Processing", "bullets"),

      heading2("1.6 Footer is Minimal"),
      bodyText("The footer only contains the logo and copyright text. There are no links to Privacy Policy, Terms, About, Contact, or social media. For a product handling user data (especially one built at MIT), users expect these."),
      heading3("Suggestion"),
      bullet("Add footer links for: Privacy Policy, Terms of Service, About, Contact, and social links", "bullets"),
      bullet("Consider a multi-column footer layout for better organization", "bullets"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 2. LANDING PAGE ==========
      heading1("2. Landing Page & Marketing Sections"),

      heading2("2.1 Hero Section Tagline Accessibility"),
      bodyText("The hero uses animate-bounce on the scroll indicator (ChevronDown) which runs indefinitely. This can trigger vestibular/motion sensitivity issues. The animation does not check prefers-reduced-motion."),
      heading3("Suggestion"),
      bullet("Wrap animate-bounce in a motion-safe: prefix (Tailwind\u2019s built-in utility) or add a @media (prefers-reduced-motion: reduce) override", "bullets"),

      heading2("2.2 Manual Letter-Spacing Override"),
      bodyText("HeroSection uses style={{ letterSpacing: '-0.01em' }} inline instead of Tailwind\u2019s tracking utilities. This breaks the design-token pattern."),
      heading3("Suggestion"),
      bullet("Add a custom tracking value in tailwind.config.js (e.g., tracking-tighter-custom: '-0.01em') and use the class instead", "bullets"),

      heading2("2.3 HeroDashboardPreview Carousel Issues"),
      bodyText("The persona carousel auto-advances but on mobile, the left/right arrows are hidden. Users have no way to manually control the carousel on small screens. The carousel also uses hardcoded accent colors per persona rather than design tokens."),
      heading3("Suggestion"),
      bullet("Show swipe dots or small arrows on mobile as carousel controls", "bullets"),
      bullet("Add touch/swipe gesture support for mobile carousel navigation", "bullets"),
      bullet("Standardize persona accent colors using the design token system", "bullets"),

      heading2("2.4 LabelsPreviewSection Infinite Scroll"),
      bodyText("The scrolling label carousel has no pause button and no way to stop the animation. This is a WCAG 2.2.2 violation (Pause, Stop, Hide) for auto-updating content."),
      heading3("Suggestion"),
      bullet("Add a pause/play toggle button visible when hovering or focusing the carousel", "bullets"),
      bullet("Alternatively, stop the animation on prefers-reduced-motion", "bullets"),

      heading2("2.5 SectionLoop Complex Grid"),
      bodyText("The 4-step feedback loop section uses CSS grid template areas with inline styles instead of Tailwind, making it inconsistent with the rest of the codebase and harder to maintain."),
      heading3("Suggestion"),
      bullet("Refactor to use Tailwind grid utilities for consistency, or extract to a dedicated CSS module", "bullets"),

      heading2("2.6 Landing Page Length"),
      bodyText("The homepage stacks 6+ sections (Hero, Waitlist, SectionTracking, LabelsPreview, SectionLoop, HeroDashboardPreview, HowItWorks, Final CTA) with no section navigation. The page is very long with no way to jump between sections."),
      heading3("Suggestion"),
      bullet("Consider adding a sticky section nav or anchor links allowing users to jump to sections of interest", "bullets"),
      bullet("Alternatively, add a floating \"Back to top\" button after the first few sections", "bullets"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 3. SCAN FLOW ==========
      heading1("3. Scan Flow (Start > Platform > Processing > Results)"),

      heading2("3.1 Onboarding Modal Shows Every Time"),
      bodyText("OnboardingModal renders whenever hasCompletedOnboarding is false, but there\u2019s no clear path for this flag to be set. Returning users who haven\u2019t completed onboarding will see the modal every time they visit /start."),
      heading3("Suggestion"),
      bullet("Persist onboarding completion to localStorage (or Supabase profile) and only show the modal once", "bullets"),
      bullet("Add a \"Don\u2019t show this again\" checkbox", "bullets"),

      heading2("3.2 Platform Card Hover Colors Hardcoded"),
      bodyText("StartPage defines platform-specific hover borders inline (e.g., hover:border-pink-600 for Instagram, hover:border-red-600 for YouTube). These aren\u2019t from the design system and will be hard to maintain if branding changes."),
      heading3("Suggestion"),
      bullet("Move platform brand colors into a centralized PLATFORM_CONFIG constant shared across PlatformBadge and StartPage", "bullets"),
      bullet("Consider using CSS custom properties for platform colors so they\u2019re easily themeable", "bullets"),

      heading2("3.3 ScanPlatformPage Two-Column Layout on Mobile"),
      bodyText("The extension-vs-upload two-column layout stays as two columns at smaller breakpoints, making cards very narrow and cramped. Text and buttons become difficult to tap."),
      heading3("Suggestion"),
      bullet("Stack the two option cards vertically on screens below md breakpoint", "bullets"),
      bullet("Consider making one method (e.g., extension) the default/primary with the other as a secondary option", "bullets"),

      heading2("3.4 Processing Page Has No Cancel Option"),
      bodyText("Once a scan starts processing, users are stuck watching the spinner with no way to cancel or go back. If they navigate away and return, there\u2019s no way to resume/check status."),
      heading3("Suggestion"),
      bullet("Add a \"Cancel\" or \"Back to Platforms\" link below the processing card", "bullets"),
      bullet("Store active scan ID so users can return to check progress", "bullets"),

      heading2("3.5 Processing Step Indicators Not Accessible"),
      bodyText("The processing steps use custom CSS spinners with no role=\"progressbar\" or aria-valuenow attributes. Screen readers cannot convey progress to users."),
      heading3("Suggestion"),
      bullet("Add role=\"progressbar\", aria-valuenow, aria-valuemin, and aria-valuemax to the progress bar", "bullets"),
      bullet("Add aria-live=\"polite\" to the current step label so screen readers announce step changes", "bullets"),

      heading2("3.6 Generic Error Messages"),
      bodyText("ProcessingPage shows \"Scan is taking longer than expected. Please try again.\" after 120 seconds. The error message doesn\u2019t help users diagnose the issue (bad upload, server error, network)."),
      heading3("Suggestion"),
      bullet("Differentiate error types: network errors vs. server errors vs. timeout", "bullets"),
      bullet("Provide specific next steps for each (check connection, try a shorter video, contact support)", "bullets"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 4. RESULTS PAGE ==========
      heading1("4. Results Page"),

      heading2("4.1 File Size / Complexity"),
      bodyText("ResultsPage.jsx is 900+ lines long, handling data fetching, parsing, display logic, and multiple sub-sections. This makes it hard to maintain, test, and debug."),
      heading3("Suggestion"),
      bullet("Split into smaller components: ResultsHeader, ResultsMetrics, ResultsTopics, ResultsPosts, ResultsDebug", "bullets"),
      bullet("Extract data fetching and transformation into a custom hook (e.g., useScanResults)", "bullets"),

      heading2("4.2 Progress Bars Use Divs Instead of Semantic Elements"),
      bodyText("Topic and metric progress bars are styled divs rather than <progress> or role=\"progressbar\" elements. Screen readers cannot interpret these."),
      heading3("Suggestion"),
      bullet("Replace div-based progress bars with <progress> elements or add role=\"progressbar\" with aria-valuenow/min/max", "bullets"),

      heading2("4.3 Metric Grid Responsive Collapse"),
      bodyText("The 4-column metric grid (MetricCard components) collapses directly to 1 column on mobile. There\u2019s no 2-column intermediate for tablet sizes."),
      heading3("Suggestion"),
      bullet("Use grid-cols-2 sm:grid-cols-2 md:grid-cols-4 for a smoother responsive transition", "bullets"),

      heading2("4.4 Hardcoded Colors Throughout"),
      bodyText("ResultsPage uses dozens of hardcoded Tailwind colors: bg-green-50, text-red-600, bg-blue-50, text-amber-700, etc. These don\u2019t match the design tokens defined in tailwind.config.js."),
      heading3("Suggestion"),
      bullet("Audit and replace all hardcoded colors with design token equivalents (e.g., bg-green-50 \u2192 bg-accent-green/10)", "bullets"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 5. DASHBOARD ==========
      heading1("5. Dashboard"),

      heading2("5.1 Inline Theme Constants"),
      bodyText("DashboardPage.jsx defines THEME and SURFACES objects with hardcoded hex colors and styles at the top of the file. These duplicate values already defined in tailwind.config.js."),
      heading3("Suggestion"),
      bullet("Move theme constants into a shared module or extend tailwind.config.js with these values so they\u2019re available as Tailwind classes", "bullets"),

      heading2("5.2 Tab Navigation Accessibility"),
      bodyText("Dashboard tabs are implemented as clickable elements but may not follow the WAI-ARIA Tabs pattern (role=\"tablist\", role=\"tab\", role=\"tabpanel\", aria-selected)."),
      heading3("Suggestion"),
      bullet("Implement proper ARIA tab pattern with keyboard navigation (arrow keys to switch tabs, Tab to enter panel)", "bullets"),
      bullet("Ensure each tab panel has a corresponding aria-labelledby", "bullets"),

      heading2("5.3 Empty State Cards Inconsistent"),
      bodyText("The CollapsedEmptyStateCard component uses hardcoded Tailwind slate colors (text-slate-400, bg-slate-100, text-slate-500) instead of design tokens. Different tabs may show different empty state styles."),
      heading3("Suggestion"),
      bullet("Standardize empty state styling across all dashboard tabs using a shared EmptyState component with design tokens", "bullets"),

      heading2("5.4 Chart Components Lack Interactivity"),
      bodyText("BarChartSimple, LineChartSimple, and other chart components are static visualizations with no tooltips, hover states, or click interactions. Users can\u2019t dig into the data."),
      heading3("Suggestion"),
      bullet("Add tooltips showing values on hover for all chart types", "bullets"),
      bullet("Consider using a lightweight charting library (e.g., recharts, which is already in many React projects) for richer interactions", "bullets"),

      heading2("5.5 No Loading Skeletons"),
      bodyText("When dashboard data is loading, there are no skeleton screens or shimmer placeholders. The page either shows nothing or jumps when content loads."),
      heading3("Suggestion"),
      bullet("Add skeleton/shimmer components that match the card layout for a smoother perceived loading experience", "bullets"),

      heading2("5.6 Dashboard Page Length"),
      bodyText("DashboardPage.jsx is extremely long (1000+ lines). The file contains theme constants, helper components, tab rendering logic, and data transformation all in one file."),
      heading3("Suggestion"),
      bullet("Extract: theme constants \u2192 dashboardTheme.js, helper components \u2192 separate files, data logic \u2192 custom hooks", "bullets"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 6. DESIGN SYSTEM CONSISTENCY ==========
      heading1("6. Design System Consistency"),

      heading2("6.1 Hardcoded Colors Across 30+ Components"),
      bodyText("Despite having a well-defined color system in tailwind.config.js (primary-blue, accent-green, text-main, text-muted, bg-page, border-light), many components use raw Tailwind colors like bg-blue-50, text-slate-600, border-slate-200, bg-red-100, text-amber-800, etc."),
      heading3("Suggestion"),
      bullet("Do a project-wide search-and-replace for common offenders: bg-blue-50 \u2192 bg-primary-blue/5, text-slate-600 \u2192 text-text-muted, border-slate-200 \u2192 border-border-light", "bullets"),
      bullet("Add an ESLint rule or code review checklist to catch non-token color usage", "bullets"),

      heading2("6.2 Button Styles Inconsistent"),
      bodyText("Primary buttons vary between components: some use px-6 py-3, others px-8 py-4. Hover states differ (hover:bg-blue-700 vs hover:bg-primary-blue/90). Disabled states use different approaches (opacity-50 vs bg-slate-200). Border radii vary (rounded-xl vs rounded-full)."),
      heading3("Suggestion"),
      bullet("Create shared button components: ButtonPrimary, ButtonSecondary, ButtonGhost with standardized sizing, hover, disabled, and focus states", "bullets"),

      heading2("6.3 Card Styles Inconsistent"),
      bodyText("Some cards use rounded-xl shadow-md border-slate-100, others use rounded-2xl shadow-soft border-border-light. Padding varies between p-5, p-6, and p-8. This creates a subtly inconsistent feel."),
      heading3("Suggestion"),
      bullet("Create a Card wrapper component with variants (default, elevated, flat) that enforce consistent styling", "bullets"),

      heading2("6.4 Form Input Styles Vary"),
      bodyText("Input borders vary: border-slate-200, border-primary-blue/30, border-border-light. Focus states differ: some use focus:ring-2, others just focus:outline-none. Placeholder text color is sometimes specified, sometimes not."),
      heading3("Suggestion"),
      bullet("Create an Input component with standardized border, focus ring, placeholder, and error state styling", "bullets"),

      heading2("6.5 Duplicate Platform Config"),
      bodyText("Platform configuration (names, icons, colors) is defined separately in PlatformBadge.jsx and StartPage.jsx. If a new platform is added, both need updating."),
      heading3("Suggestion"),
      bullet("Extract platform config into a shared constants file (e.g., src/config/platforms.js) imported by both components", "bullets"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 7. ACCESSIBILITY ==========
      heading1("7. Accessibility (WCAG 2.1)"),

      heading2("7.1 Color Contrast Issues"),
      bodyText("The text-muted color (#64748B) on bg-page (#F8F9FA) has approximately 3.5:1 contrast ratio, which is below the WCAG AA requirement of 4.5:1 for normal text. Several components use even lighter grays."),
      heading3("Suggestion"),
      bullet("Darken text-muted to at least #556275 to achieve 4.5:1 contrast on light backgrounds", "bullets"),
      bullet("Audit all color combinations with a contrast checker tool", "bullets"),

      heading2("7.2 Missing Form Labels"),
      bodyText("Several form inputs lack proper associated labels. The file upload input in ScanPlatformPage has no visible or sr-only label. Some email inputs rely on placeholder text alone."),
      heading3("Suggestion"),
      bullet("Add <label> elements (visible or sr-only) with htmlFor matching every input\u2019s id", "bullets"),

      heading2("7.3 Focus Management in Modals"),
      bodyText("PaywallModal properly traps focus, but OnboardingModal and other modal-like components do not. When modals open, focus doesn\u2019t move to the modal, and Tab can escape to background content."),
      heading3("Suggestion"),
      bullet("Implement focus trapping in all modal components (move focus to modal on open, trap Tab within, return focus on close)", "bullets"),
      bullet("Consider using a shared Modal wrapper that handles focus management consistently", "bullets"),

      heading2("7.4 Missing ARIA on Interactive Elements"),
      bodyText("Several interactive elements lack proper ARIA attributes: the billing toggle in PricingPage has no role=\"switch\" or aria-checked; dashboard tab-like elements may lack role=\"tab\" and aria-selected; expandable sections sometimes miss aria-expanded."),
      heading3("Suggestion"),
      bullet("Audit all interactive components and add appropriate ARIA roles and states", "bullets"),

      heading2("7.5 Animations Don\u2019t Respect prefers-reduced-motion"),
      bodyText("BackgroundGradient uses continuous blur animations, infinite carousel scrolling runs regardless of user preference, and the bounce animation on the scroll indicator ignores motion preferences."),
      heading3("Suggestion"),
      bullet("Add motion-reduce: variants to all Tailwind animations", "bullets"),
      bullet("For Framer Motion, check useReducedMotion() hook and simplify/disable animations accordingly", "bullets"),

      heading2("7.6 Heading Hierarchy Broken"),
      bodyText("Several pages skip heading levels (e.g., h1 then h3 without h2), or have multiple h1s. This confuses screen reader users navigating by headings."),
      heading3("Suggestion"),
      bullet("Audit all pages to ensure a single h1 and proper h2 > h3 > h4 nesting", "bullets"),

      heading2("7.7 Icon Buttons Without Labels"),
      bodyText("Some icon-only buttons (dismiss buttons, carousel arrows) lack aria-label attributes, making them invisible or confusing to screen reader users."),
      heading3("Suggestion"),
      bullet("Add aria-label to every icon-only button (e.g., aria-label=\"Close\", aria-label=\"Next slide\")", "bullets"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 8. RESPONSIVE DESIGN ==========
      heading1("8. Responsive Design"),

      heading2("8.1 Comparison Table Hard to Read on Mobile"),
      bodyText("PricingPage\u2019s comparison table (ComparisonRow) stacks vertically on mobile with prefix labels (\"Starter:\", \"Premium:\"), but the layout is cramped and the prefix/value alignment is awkward."),
      heading3("Suggestion"),
      bullet("Consider a card-based comparison layout on mobile instead of table rows (each feature gets its own card with Starter vs Premium side by side)", "bullets"),

      heading2("8.2 Dashboard Grid Needs Tablet Breakpoint"),
      bodyText("Dashboard view cards likely jump between single-column and multi-column without a smooth intermediate layout at tablet sizes (768\u2013024px)."),
      heading3("Suggestion"),
      bullet("Add explicit md: grid column rules for tablet-width dashboard layouts", "bullets"),

      heading2("8.3 Large Font Sizes May Overflow"),
      bodyText("Hero section uses text-8xl on large screens. On narrow browser windows (not necessarily mobile), this can cause text overflow or awkward line breaks."),
      heading3("Suggestion"),
      bullet("Add max-w constraints on heading containers or use clamp() for fluid typography", "bullets"),

      heading2("8.4 Touch Targets Too Small"),
      bodyText("Some interactive elements (carousel dots, dismiss buttons, small icon buttons) may be smaller than the 44x44px minimum recommended touch target size."),
      heading3("Suggestion"),
      bullet("Ensure all clickable elements have at least 44x44px hit area (use padding if the visual element is smaller)", "bullets"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 9. INTERACTION PATTERNS ==========
      heading1("9. Interaction Patterns & Feedback"),

      heading2("9.1 No Scan Deletion Confirmation"),
      bodyText("If scan deletion exists, there appears to be only a native browser confirm() dialog. This is jarring and doesn\u2019t match the polished UI."),
      heading3("Suggestion"),
      bullet("Replace browser confirm() with a styled confirmation modal matching the app\u2019s design system", "bullets"),

      heading2("9.2 Email Validation is Minimal"),
      bodyText("WaitlistSignup and ResultsGate only check for the presence of @ in email addresses. This allows clearly invalid emails like \"a@b\" through."),
      heading3("Suggestion"),
      bullet("Add more robust email validation (check for domain with TLD, no spaces, proper format) while keeping it user-friendly (don\u2019t over-restrict valid but unusual addresses)", "bullets"),

      heading2("9.3 No Toast/Notification System"),
      bodyText("Success and error messages appear inline within each component. There\u2019s no global notification system for cross-cutting feedback (e.g., \"Scan started\", \"Email sent\", \"Upgrade successful\")."),
      heading3("Suggestion"),
      bullet("Add a lightweight toast notification system (context-based) that components can trigger for consistent feedback", "bullets"),

      heading2("9.4 Coming Soon Redirect is Abrupt"),
      bodyText("When Coming Soon mode is active and a user navigates to a gated route, they\u2019re silently redirected to / with a small notification that auto-dismisses after 5 seconds. This can be confusing."),
      heading3("Suggestion"),
      bullet("Make the redirect message more prominent and longer-lasting, or show a dedicated Coming Soon landing page for gated routes instead of redirecting", "bullets"),

      heading2("9.5 Pricing Buttons Are Not Wired"),
      bodyText("The \"Get Started Free\" and \"Upgrade to Premium\" buttons in PricingPage are plain <button> elements with no onClick handlers. They do nothing when clicked."),
      heading3("Suggestion"),
      bullet("Wire these to the actual auth/payment flow, or make them Link components navigating to /start and /plus respectively", "bullets"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 10. CONVERSION & MONETIZATION ==========
      heading1("10. Conversion & Monetization Flow"),

      heading2("10.1 Pricing Page vs Plus Page Confusion"),
      bodyText("PricingPage.jsx exists as a component but /pricing redirects to /plus. The Plus page and Pricing page appear to serve the same purpose with different implementations. This is confusing in the codebase."),
      heading3("Suggestion"),
      bullet("Remove PricingPage.jsx entirely if /plus is the canonical pricing page, or consolidate them into one component", "bullets"),

      heading2("10.2 No Social Proof on Pricing"),
      bodyText("Neither the pricing section nor the Plus page includes testimonials, user counts, trust badges, or other social proof elements that would help drive conversions."),
      heading3("Suggestion"),
      bullet("Add a testimonials section, user count (\"Join 10,000+ users\"), or trust indicators (MIT affiliation badge, security badges) to the Plus/pricing page", "bullets"),

      heading2("10.3 Waitlist Duplicate Blocks"),
      bodyText("In Coming Soon mode, two identical \"Join the Waitlist\" sections appear on the homepage. The duplication may cause confusion about whether they\u2019re different forms."),
      heading3("Suggestion"),
      bullet("Differentiate the two waitlist blocks (e.g., the second could emphasize urgency or show waitlist count), or remove the duplication and keep only one", "bullets"),

      heading2("10.4 No Post-Scan Upsell"),
      bodyText("After a user views their scan results, there\u2019s no clear prompt to upgrade, try another platform, or share their results. This is a missed conversion opportunity."),
      heading3("Suggestion"),
      bullet("Add a contextual CTA at the bottom of results: \"Want deeper insights? Try Plus\" or \"Scan another platform to see cross-platform patterns\"", "bullets"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== 11. CODE ARCHITECTURE ==========
      heading1("11. Code Architecture Suggestions"),

      heading2("11.1 Create a Component Library"),
      bodyText("The project would benefit from a shared UI component library for: Button (Primary, Secondary, Ghost, Icon variants), Card (Default, Elevated, Flat), Input (Text, Email, File), Modal (with focus trapping), Badge (Status, Platform), and Toast notifications."),

      heading2("11.2 Extract Shared Constants"),
      bodyText("Platform configurations, color tokens, and scan-related constants are duplicated across files. These should live in src/config/ and be imported everywhere."),

      heading2("11.3 Split Large Files"),
      bodyText("ResultsPage.jsx (900+ lines) and DashboardPage.jsx (1000+ lines) should be decomposed into smaller, focused components and custom hooks."),

      heading2("11.4 Add Error Boundaries"),
      bodyText("There are no React Error Boundaries in the app. A crash in any component takes down the entire page. Adding error boundaries around major sections (dashboard, results, scan flow) would improve resilience."),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== PRIORITY MATRIX ==========
      heading1("12. Priority Matrix"),

      bodyText("All findings ranked by impact and effort:"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [800, 4060, 1500, 1500, 1500],
        rows: [
          new TableRow({ children: [
            headerCell("#", 800), headerCell("Finding", 4060), headerCell("Severity", 1500), headerCell("Effort", 1500), headerCell("Section", 1500)
          ]}),
          new TableRow({ children: [cell("1", 800), cell("Add mobile hamburger menu", 4060), severityCell("Critical", 1500), cell("Medium", 1500), cell("1.1", 1500)] }),
          new TableRow({ children: [cell("2", 800), cell("Wire Sign In button to auth flow", 4060), severityCell("Critical", 1500), cell("Low", 1500), cell("1.2", 1500)] }),
          new TableRow({ children: [cell("3", 800), cell("Fix color contrast for WCAG AA", 4060), severityCell("Critical", 1500), cell("Low", 1500), cell("7.1", 1500)] }),
          new TableRow({ children: [cell("4", 800), cell("Add 404 catch-all route", 4060), severityCell("High", 1500), cell("Low", 1500), cell("1.4", 1500)] }),
          new TableRow({ children: [cell("5", 800), cell("Add form labels for accessibility", 4060), severityCell("High", 1500), cell("Low", 1500), cell("7.2", 1500)] }),
          new TableRow({ children: [cell("6", 800), cell("Wire pricing page buttons", 4060), severityCell("High", 1500), cell("Low", 1500), cell("9.5", 1500)] }),
          new TableRow({ children: [cell("7", 800), cell("Add active route highlighting", 4060), severityCell("High", 1500), cell("Low", 1500), cell("1.3", 1500)] }),
          new TableRow({ children: [cell("8", 800), cell("Replace hardcoded colors with tokens", 4060), severityCell("High", 1500), cell("High", 1500), cell("6.1", 1500)] }),
          new TableRow({ children: [cell("9", 800), cell("Add focus management to modals", 4060), severityCell("High", 1500), cell("Medium", 1500), cell("7.3", 1500)] }),
          new TableRow({ children: [cell("10", 800), cell("Add ARIA to interactive elements", 4060), severityCell("High", 1500), cell("Medium", 1500), cell("7.4", 1500)] }),
          new TableRow({ children: [cell("11", 800), cell("Add cancel option on ProcessingPage", 4060), severityCell("Medium", 1500), cell("Low", 1500), cell("3.4", 1500)] }),
          new TableRow({ children: [cell("12", 800), cell("Standardize button components", 4060), severityCell("Medium", 1500), cell("Medium", 1500), cell("6.2", 1500)] }),
          new TableRow({ children: [cell("13", 800), cell("Add loading skeletons to dashboard", 4060), severityCell("Medium", 1500), cell("Medium", 1500), cell("5.5", 1500)] }),
          new TableRow({ children: [cell("14", 800), cell("Split ResultsPage into sub-components", 4060), severityCell("Medium", 1500), cell("Medium", 1500), cell("4.1", 1500)] }),
          new TableRow({ children: [cell("15", 800), cell("Add toast notification system", 4060), severityCell("Medium", 1500), cell("Medium", 1500), cell("9.3", 1500)] }),
          new TableRow({ children: [cell("16", 800), cell("Respect prefers-reduced-motion", 4060), severityCell("Medium", 1500), cell("Low", 1500), cell("7.5", 1500)] }),
          new TableRow({ children: [cell("17", 800), cell("Add footer links (Privacy, Terms, etc.)", 4060), severityCell("Medium", 1500), cell("Low", 1500), cell("1.6", 1500)] }),
          new TableRow({ children: [cell("18", 800), cell("Fix heading hierarchy across pages", 4060), severityCell("Medium", 1500), cell("Low", 1500), cell("7.6", 1500)] }),
          new TableRow({ children: [cell("19", 800), cell("Add back navigation to inner pages", 4060), severityCell("Medium", 1500), cell("Low", 1500), cell("1.5", 1500)] }),
          new TableRow({ children: [cell("20", 800), cell("Improve error messages with specifics", 4060), severityCell("Medium", 1500), cell("Low", 1500), cell("3.6", 1500)] }),
          new TableRow({ children: [cell("21", 800), cell("Add chart tooltips/interactivity", 4060), severityCell("Low", 1500), cell("Medium", 1500), cell("5.4", 1500)] }),
          new TableRow({ children: [cell("22", 800), cell("Add social proof to pricing", 4060), severityCell("Low", 1500), cell("Low", 1500), cell("10.2", 1500)] }),
          new TableRow({ children: [cell("23", 800), cell("Add post-scan upsell CTA", 4060), severityCell("Low", 1500), cell("Low", 1500), cell("10.4", 1500)] }),
          new TableRow({ children: [cell("24", 800), cell("Add error boundaries", 4060), severityCell("Low", 1500), cell("Low", 1500), cell("11.4", 1500)] }),
          new TableRow({ children: [cell("25", 800), cell("Consolidate PricingPage and PlusPage", 4060), severityCell("Low", 1500), cell("Low", 1500), cell("10.1", 1500)] }),
        ]
      }),

      new Paragraph({ spacing: { before: 400 } }),
      bodyText("This audit identified 25 actionable findings across navigation, accessibility, design consistency, responsive design, interaction patterns, conversion optimization, and code architecture. Review the priority matrix above and let me know which items you\u2019d like me to implement."),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/sessions/pensive-gallant-bohr/mnt/AlgorithmLens_Cowork/AlgorithmLens_UI_UX_Audit.docx", buffer);
  console.log("DOCX written successfully");
});
