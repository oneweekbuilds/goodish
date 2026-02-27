# shadcn/ui Migration Plan

## Existing Hand-Built UI Components

### `src/components/ui/` Directory

| Component | File | shadcn Replacement | Importers | Risk | Migration Order |
|---|---|---|---|---|---|
| Button (ButtonPrimary, ButtonSecondary, ButtonGhost, ButtonSuccess) | `Button.jsx` | `button-shadcn.jsx` (Button with variants) | **0 files** — not imported anywhere | **Low** | 1 |
| Skeleton | `Skeleton.jsx` | `skeleton-shadcn.jsx` (SkeletonShadcn) | **2 files** — HistoryPage.jsx, ResultsPage.jsx | **Low** | 2 |
| SkeletonCard / SkeletonGrid | `SkeletonCard.jsx` | `card.jsx` (Card) + `skeleton-shadcn.jsx` | **0 files** — not imported (DashboardSkeleton defines its own inline) | **Low** | 3 |
| Toast (ToastProvider, useToast) | `Toast.jsx` | Keep as-is (custom context-based system, no direct shadcn equivalent) | **1 file** — App.jsx | **High — skip** | Deferred |
| ErrorBoundary | `ErrorBoundary.jsx` | Keep as-is (class component with Sentry integration, no shadcn equivalent) | **2 files** — App.jsx, TabRenderer.jsx | **High — skip** | Deferred |
| BackLink | `BackLink.jsx` | Keep as-is (simple component with react-router-dom Link, no shadcn equivalent) | **4 files** — PrivacyPage, ResultsPage, StartPage, TermsPage | **Medium — skip** | Deferred |

### Other Primitive Components (in `src/components/`)

| Component | File | shadcn Replacement | Notes |
|---|---|---|---|
| BackgroundGradient | `BackgroundGradient.jsx` | None — decorative/visual, not a UI primitive | Keep as-is |
| Logo | `Logo.jsx` | None — brand-specific component | Keep as-is |
| PlatformIcon | `PlatformIcon.jsx` | None — domain-specific SVG icon set | Keep as-is |
| PlatformBadge | `PlatformBadge.jsx` | Could use `badge.jsx` for the container | Low risk, but custom styling is important; defer |
| MetricCard | `MetricCard.jsx` | Could compose with `card.jsx` | Medium risk, depends on dashboard layout; defer |

## Migration Order (Lowest Risk First)

### Phase 3A: Safe Replacements
1. **Button.jsx** → No files import it. Can be left in place or updated to re-export shadcn Button. Zero risk.
2. **Skeleton.jsx** → 2 importers. Update to re-export SkeletonShadcn with same default interface. Low risk.
3. **SkeletonCard.jsx** → 0 importers. Can be left in place. Zero risk.

### Phase 3B: Deferred (Do Not Touch)
- **Toast.jsx** — Custom context-based notification system with Sentry integration. No direct shadcn replacement. Would require significant refactoring.
- **ErrorBoundary.jsx** — Class component with Sentry error reporting. Not replaceable with shadcn.
- **BackLink.jsx** — Simple but tightly coupled to react-router-dom. No shadcn equivalent.
- **PlatformBadge.jsx** — Domain-specific. Could use shadcn Badge internally but not worth the risk.
- **MetricCard.jsx** — Dashboard-specific card with custom layout. Could compose with shadcn Card but touches analysis UI.

## Summary

The existing codebase has very few generic UI primitives — most components are domain-specific or integrate with external services (Sentry, react-router-dom). The main value of adding shadcn/ui is **making the component library available for future development**, not replacing existing working components.

Only 2 components (Button, Skeleton) are candidates for safe migration. The rest should be deferred or kept as-is.

## Phase 4: Chrome Extension Assessment

**Result: SKIPPED — shadcn/ui is not compatible with the extension.**

The Chrome extension (`alg-gemini-extension/`) is a vanilla JavaScript project with no framework:
- No React or JSX — uses plain DOM manipulation (`document.createElement`, `textContent`, etc.)
- No Tailwind CSS — uses inline styles and plain CSS in `popup/index.html`
- No build framework that supports JSX — Vite is configured purely for JS bundling
- The popup UI (`popup.js`) constructs all HTML via imperative DOM APIs

shadcn/ui requires React as a runtime dependency and uses JSX component syntax. Adding it would require converting the extension to React, which is a major rewrite outside the scope of this task.

## Phase 5: Consistency Check

Since the extension does not use shadcn/ui, there are no shared shadcn components to compare. Visual consistency between the website and extension is maintained through shared design tokens (colors, spacing) in DESIGN_TOKENS.json, not through shared component code.
