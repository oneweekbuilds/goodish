# AlgorithmLens Quality Rubric
## For Autonomous Agent Loop

This document encodes the quality standards for AlgorithmLens. All agents in the loop reference this rubric when auditing, prioritizing, fixing, and verifying.

---

## Platform Scope

Three surfaces, all must meet these standards:
- **Mobile App** (Expo/React Native): `AlgorithmLens_Cowork/mobile/`
- **Web App** (Vite/React): `AlgorithmLens_Cowork/src/`
- **Chrome Extension**: `alg-gemini-extension/`

---

## Design Philosophy

Think "Oura Ring for your digital wellbeing." Complex feed data made immediately understandable. Every design decision should embody:

- **Progressive disclosure** — Headline insight first (absorb in <3 seconds), detail available on tap but never forced
- **Visual hierarchy** — Most important number is largest and most prominent; supporting data is visually secondary
- **Calm, purposeful color** — No alarming reds/yellows; color communicates structure and category, not urgency or danger; muted, sophisticated palette
- **Clean typography** — Large bold numbers for headline metrics, medium weight for labels, light for explanatory text, generous spacing, white space is a feature
- **Simple charts** — Clean bar charts, donut charts, simple line graphs; every chart has a plain-language label
- **Trustworthy and empowering, not alarmist** — The interface should make users feel informed and in control, never scared or manipulated

---

## Existing Project Context

Before auditing or fixing, agents MUST read these existing files:
- `CLAUDE.md` — Project-level instructions and context
- `AlgorithmLens_Cowork/CLAUDE.md` — Cowork-specific project context
- `AlgorithmLens_Cowork/DESIGN_TOKENS.json` — Authoritative design tokens (colors, spacing, typography)
- `AlgorithmLens_Cowork/mobile/audits/` — 18+ existing audit changelogs with known issues and fixes
- `EQUALIZATION_TRACKER.md` — Cross-platform parity status

Do NOT re-discover issues already documented in these files. Check them first.

### P0 — Must fix immediately (blocks launch)
- Epistemic restraint violations: Any text that speculates about algorithmic intent rather than describing observable patterns
- Crashes or unhandled exceptions in any user-facing flow
- Security issues: exposed API keys, auth bypasses, data leaks
- Broken core functionality: scanning, analysis, dashboard rendering
- Data loss or corruption

### P1 — Must fix before launch
- Cross-platform inconsistencies in the six analysis dimensions
- UI elements that are non-functional or misleading
- Copy that is confusing, contradictory, or factually wrong
- Accessibility failures (missing labels, no keyboard nav, contrast issues)
- Error states that show raw errors or blank screens instead of helpful messages
- TypeScript/ESLint errors in the codebase

### P2 — Should fix before launch
- Visual polish: spacing, alignment, color consistency
- Inconsistent naming or labeling across platforms
- Missing loading states or skeleton screens
- Performance issues (slow renders, unnecessary re-renders)
- Copy that could be clearer or more concise

### P3 — Nice to have
- Minor copy improvements
- Animation polish
- Edge case handling for rare scenarios

---

## The Six Dashboard Tabs

AlgorithmLens analyzes feeds across six tabs. These must be:
1. Consistently named across all three platforms (use EXACTLY these names)
2. Rendered with the same visual treatment (charts, colors, labels)
3. Using epistemic restraint in all descriptions

The six tabs:
1. **Overview** — High-level summary (post count, session duration, platform, content type breakdown)
2. **Sources** — Who created the content (creator diversity, most frequent accounts, followed vs. unfollowed)
3. **Ads** — Sponsored/promoted content detection (ad percentage, sponsor names, ad formats)
4. **Politics** — Political leaning/framing analysis of content
5. **Tone** — Emotional tone/sentiment analysis
6. **Suggested vs. Followed** — Ratio of algorithmically suggested content vs. content from followed accounts

---

## Epistemic Restraint Rules

This is the single most important quality standard. AlgorithmLens describes patterns — it does NOT claim to know why algorithms do what they do. Violations are always P0.

### NEVER use language like:
- "The algorithm is trying to..."
- "You are being targeted..."
- "The platform wants you to..."
- "This is designed to manipulate..."
- "The algorithm thinks you are..."
- "Why you see this" (inherently speculative)
- "The algorithm knows..."
- "You're being shown this because..."
- Leading questions that imply algorithmic intent (e.g., "Is your feed being manipulated?")
- Suggestive framing that implies malice (e.g., "Hidden patterns in your feed")
- Any implication that we can read the algorithm's "mind" or intentions

### ALWAYS use language like:
- "Your feed contains X% of..."
- "We observed a pattern of..."
- "Based on the content analyzed..."
- "Your feed shows a concentration of..."
- "The data suggests a pattern consistent with..."
- "X out of Y posts were from sources you follow"
- "We detected N posts with promotional indicators"

### How to check:
- Search all user-facing strings for words: "trying", "wants", "manipulate", "target", "designed to", "algorithm thinks", "knows", "because", "why you see"
- Check insight builders: `insightBuilders.js` (web + mobile), `headlineSafety.js`
- Check dashboard copy in all tab components
- Check onboarding and walkthrough text
- Check error states — even error copy should maintain restraint
- Any match is a P0 violation

---

## Cross-Platform Parity Checks

For each of the six dimensions, verify:
- [ ] Same dimension name used on mobile, web, and extension
- [ ] Same color palette for charts/visualizations
- [ ] Same data format expected from the backend
- [ ] Same confidence badge rendering
- [ ] Same empty state messaging
- [ ] Same error state messaging

---

## Code Quality Standards

### Mobile-Specific (React Native / Expo)
- Touch targets: All interactive elements must be at least 44x44pt
- SafeAreaView or equivalent must wrap all screens (handle notches, status bars, home indicators)
- All color combinations must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Theme tokens from `theme.ts` must be used — no hardcoded color hex values in components
- KeyboardAvoidingView for any screen with text inputs
- Font sizes must be at least 12pt for any user-visible text
- Dark mode must be system-aware via useColorScheme()
- Error boundaries must wrap all major screen sections

### TypeScript/JavaScript
- No `any` types in new code (existing `any` can be tracked as P2)
- No unused imports or variables
- No console.log in production code (use proper error logging)
- Consistent use of the project's error handling patterns
- All async operations have error handling

### React/React Native
- No inline styles where theme tokens exist
- Components use the design system's UI primitives (Button, Card, Badge, etc.)
- No hardcoded strings — use constants or config
- Loading and error states for all data-fetching components
- Proper cleanup in useEffect hooks

### Backend (Python)
- All endpoints have error handling
- Input validation on all user-facing routes
- No hardcoded secrets or config values
- Tests exist for critical paths

---

## What Agents Should NOT Touch

These require human judgment and should be flagged for Justin's review:
- Core analysis logic (how feeds are analyzed)
- Gemini/AI analysis prompts (`analysisPrompts.ts`, `geminiFlashService.ts`, `gemini_analyzer.py`)
- Pricing/billing configuration (`pricingConfig.js`, Stripe routes)
- Authentication flows (`AuthContext.tsx`, `AuthProvider.tsx`, `auth.py`, Supabase config)
- Privacy policy or legal text (`legal/` folders)
- Database schema changes (`database.py`, `models.py`)
- Deployment configuration (`vercel.json`, `eas.json`, `.env` files)
- Adding new dependencies to any `package.json`
- The `evidence_bundle.py` and related accuracy/eval code
- Any file in `backend/accuracy/` (calibration and statistical logic)

---

## What Agents CAN Freely Fix

- Copy/text improvements (within epistemic restraint rules)
- CSS/styling fixes
- Adding missing error boundaries
- Adding missing loading states
- Fixing TypeScript errors
- Removing dead code or unused imports
- Fixing accessibility issues (aria labels, contrast, etc.)
- Consistency fixes across platforms
- Adding missing null checks
- Fixing broken imports or references

---

## Verification Checklist

After any fix, verify:
1. The specific issue is resolved
2. No new TypeScript/ESLint errors introduced
3. No imports broken
4. Related components still render correctly
5. The fix doesn't contradict epistemic restraint rules
6. Cross-platform parity maintained (if applicable)
