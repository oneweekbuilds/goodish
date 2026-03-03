# react-native-reusables Migration Plan

## Status: PIVOTED — Existing Component Upgrade

### Finding
react-native-reusables (@rn-primitives) is NOT installed in the project. `package.json` has zero RNR entries. `node_modules/@rn-primitives/` does not exist.

### Decision
Rather than installing a new UI library mid-audit (risky — could break existing builds), we will **upgrade the existing hand-built components** to match the quality bar. The existing components already have:
- Theme integration via `useTheme()` hook
- Light/dark mode support
- Proper variant systems (Card: default/elevated/interactive, Button: primary/secondary/ghost/danger)
- Entrance animations (Card fade+slide, Button scale)
- Haptic feedback (Button)
- Accessibility labels and roles

What they LACK (and what we'll fix):
- Sufficient shadow depth for card separation
- Proper typography hierarchy (InsightHero too small vs BigNumber)
- Consistent spacing rhythm across screens
- Loading skeleton usage (existing Skeleton.tsx component is orphaned)
- Empty/error state components (EmptyState.tsx, ErrorState.tsx are built but unused)
- Badge visual refinement (all variants are solid-color pills)

## Existing UI Components Inventory

| Component | File | Quality | Issues | Priority |
|-----------|------|---------|--------|----------|
| Card.tsx | src/components/ui/ | 7/10 | Shadow too subtle, RADIUS.xl (20px) too round vs website (12px) | HIGH |
| Button.tsx | src/components/ui/ | 7.5/10 | RADIUS.md (10px) - good. Padding a bit tight on sm size | MEDIUM |
| Badge.tsx | src/components/ui/ | 6/10 | All variants are solid filled pills - no outline/subtle variants | MEDIUM |
| Chip.tsx | src/components/ui/ | 6/10 | Orphaned - not used in screens | LOW |
| Divider.tsx | src/components/ui/ | 8/10 | Clean, simple, well-themed | NONE |
| Skeleton.tsx | src/components/ui/ | 7/10 | Good animation, orphaned - screens don't use it | HIGH (to integrate) |
| EmptyState.tsx | src/components/ui/ | 6/10 | Built but unused by screens | HIGH (to integrate) |
| ErrorState.tsx | src/components/ui/ | 6/10 | Built but unused by screens | MEDIUM (to integrate) |
| Toast.tsx | src/components/ui/ | 7/10 | Functional, well-animated | LOW |
| ContentFadeIn.tsx | src/components/ui/ | 7/10 | Good entrance animation | NONE |
| StaggeredList.tsx | src/components/ui/ | 7/10 | Good stagger animation | NONE |
| ProgressBar.tsx | src/components/ui/ | 7/10 | Uses reanimated, smooth | NONE |

## Issue-to-Fix Mapping (All Phase 1 Issues)

### Token Fixes (Theme-level, broadest impact)
1. **Card shadow depth** — Increase `SHADOWS.card` opacity from 0.08 to 0.12, radius from 20 to 16
2. **Card border radius** — Change Card.tsx from RADIUS.xl (20) to RADIUS.lg (16) to match website
3. **InsightHero title size** — Increase from h2 (18px) to heroTitle (26px) or h1 (24px)
4. **BigNumber scale** — Reduce from display (32px) to scoreLarge (32px) but with smaller lineHeight, or keep but ensure InsightHero is always larger
5. **Section gap standardization** — Use SPACING['2xl'] (24) between sections, SPACING.lg (16) within sections
6. **Tab chip inactive style** — Add subtle background to inactive dashboard tabs

### Component-Level Fixes
7. **Integrate Skeleton.tsx** into Dashboard loading states (replace ghost/transparent loading)
8. **Integrate EmptyState.tsx** into Politics/Tone empty states
9. **Add Badge outline variant** — for filter chips and status indicators that are too heavy as solid fills
10. **MetricCard icon sizing** — Increase from 18px to 22px
11. **InsightHero "Tap for more context" button** — Style as proper disclosure button (pill, background)
12. **BarChart bar colors** — Simplify to monochromatic (same blue, differentiated by length)
13. **StackedBar100 small segment labels** — Add external labels for segments <10%

### Layout Fixes
14. **Dashboard Overview content reduction** — Collapse "Ideas to Explore" and "Your Feed in Minutes" behind expandable sections
15. **Three-column stat cards** — Allow text wrapping on truncated values (e.g., "@TheOff...")
16. **Scan overlay simplification** — Reduce information density in bottom panel
17. **Settings Plus banner** — Move below core settings, reduce prominence

### Screen-Specific Fixes
18. **Home Feed Score emphasis** — Add light blue background behind score number
19. **History card polish** — Already good (7/10), minor spacing refinements
20. **Scan Complete** — Add subtle animation to checkmark (pulse)
21. **Upgrade Modal** — Change green checkmarks to blue dots (reduce judgment)
22. **Dashboard loading** — Replace transparent ghost with Skeleton shimmer

## Priority Order (by visual impact × screens affected ÷ risk)

### Pass 1 — Token fixes (fastest, broadest impact) — affects ALL screens
1. Card shadow depth increase
2. Card border radius alignment (20→16)
3. Section spacing standardization

### Pass 2 — Typography hierarchy — affects Dashboard (6 tabs)
4. InsightHero title size increase
5. BigNumber/InsightHero hierarchy fix

### Pass 3 — Component integration — affects Dashboard loading, empty states
6. Skeleton.tsx integration into loading states
7. EmptyState.tsx integration

### Pass 4 — Screen-specific fixes — targeted improvements
8. Dashboard Overview content collapse
9. Scan overlay simplification
10. Home screen Feed Score emphasis
11. Badge outline variant
12. All remaining issues

## Expected Score Improvements

| Screen | Phase 1 Score | After Tokens | After Typography | After Components | After Polish |
|--------|--------------|-------------|-----------------|-----------------|-------------|
| Home | 6.0 | 6.5 | 6.5 | 7.0 | 7.5 |
| Dashboard Overview | 5.5 | 6.0 | 6.5 | 7.0 | 7.5 |
| Dashboard Sources | 6.0 | 6.5 | 7.0 | 7.0 | 7.5 |
| Dashboard Ads | 6.0 | 6.5 | 7.0 | 7.0 | 7.0 |
| Dashboard Politics | 6.5 | 7.0 | 7.0 | 7.5 | 7.5 |
| Dashboard Tone | 6.5 | 7.0 | 7.0 | 7.5 | 7.5 |
| Dashboard Sugg | 6.0 | 6.5 | 7.0 | 7.0 | 7.5 |
| History | 7.0 | 7.5 | 7.5 | 7.5 | 8.0 |
| Settings | 7.0 | 7.0 | 7.0 | 7.0 | 7.5 |
| Scan Picker | 6.5 | 7.0 | 7.0 | 7.0 | 7.0 |
| Scan In Progress | 5.5 | 5.5 | 5.5 | 6.0 | 6.5 |
| Scan Complete | 7.0 | 7.0 | 7.0 | 7.0 | 7.5 |
| Loading | 5.0 | 5.0 | 5.0 | 7.0 | 7.5 |
| Upgrade Modal | 7.5 | 7.5 | 7.5 | 8.0 | 8.0 |
| **OVERALL** | **6.0** | **6.5** | **6.8** | **7.1** | **7.4** |
