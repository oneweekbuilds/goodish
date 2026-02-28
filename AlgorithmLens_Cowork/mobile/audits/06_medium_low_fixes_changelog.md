# Medium & Low Severity Fixes — Changelog
**Date:** 2026-02-20
**Scope:** All MEDIUM and LOW issues from Round 1 audits (01–04)
**TypeScript:** `npx tsc --noEmit` — 0 errors after changes

---

## Audit 01 — Architecture & Code Quality

### MEDIUM

**M-1: Duplicate `generateUUID()` with Math.random** — `broadcastSessionManager.ts`, `broadcastAnalysisPipeline.ts`
- Before: Two identical `generateUUID()` functions using `Math.random()` (non-cryptographic)
- After: Shared `src/lib/utils.ts` with `generateUUID()` using `crypto.randomUUID()` → `crypto.getRandomValues()` → `Math.random()` fallback chain. Both files import from `./utils`

**M-3: `NativeModulesProxy` deprecated** — `broadcastSessionManager.ts`
- Before: `const { NativeModulesProxy } = require('expo-modules-core')` → `NativeModulesProxy.ExpoBroadcast`
- After: `const { requireNativeModule } = require('expo-modules-core')` → `requireNativeModule('ExpoBroadcast')` (forward-compatible with Expo SDK 54+)

**M-4: Unchecked generic return types** — `api.ts`
- Before: `api.get<T = any>`, `api.post<T = any>`, `api.delete<T = any>` — `any` default hides type errors
- After: Default changed to `unknown`; `body` param changed from `any` to `unknown`; explicit `as Promise<T>` cast on `response.json()`

**M-7: `PLATFORM_HINTS` not exported** — `analysisPrompts.ts`
- Before: `const PLATFORM_HINTS: Record<...>`
- After: `export const PLATFORM_HINTS: Record<...>`

**M-9: `destroy()` doesn't stop capture on Android** — `broadcastSessionManager.ts`
- Before: `destroy()` stops polling and unsubscribes events but doesn't call `stopCapture()`
- After: Added `if (Platform.OS === 'android' && this.nativeModule?.stopCapture) this.nativeModule.stopCapture()` before `stopStatusPolling()`

### LOW

**L-2: Hardcoded pricing** — `checkout.ts`
- Before: Plan labels `'Monthly — $10/month'` and `'Annual — $96/year (save 20%)'` inline in Alert
- After: Extracted to `PLAN_LABELS` constant record; Alert references `PLAN_LABELS.monthly` / `PLAN_LABELS.annual`

**L-3: Missing env vars in .env.example** — `.env.example`
- Before: Only Supabase and API URL listed
- After: Added `EXPO_PUBLIC_GEMINI_API_KEY` and `EXPO_PUBLIC_SENTRY_DSN`

**L-5: `PLATFORM_DISPLAY_NAMES` not exported** — `analysisPrompts.ts`
- Before: `const PLATFORM_DISPLAY_NAMES: Record<...>`
- After: `export const PLATFORM_DISPLAY_NAMES: Record<...>`

---

## Audit 02 — Security & Privacy

### MEDIUM

**M-2: JSON.parse without size limit** — `geminiFlashService.ts`
- Before: `JSON.parse(rawText)` directly on Gemini responses (potential DoS via memory exhaustion)
- After: `safeJsonParse(rawText)` from `src/lib/utils.ts` with 5 MB default limit; throws if exceeded

**M-4: Cookie persistence JSON.parse unvalidated** — `cookieManager.ts`
- Before: `JSON.parse(data)` on AsyncStorage value without size or type checking
- After: Size guard (>100KB resets storage), type validation (`typeof parsed !== 'object'` → return `{}`), explicit cast to `Record<string, PlatformLoginState>`

### LOW

**L-1: Math.random UUID** — covered by 01-M-1 (shared `utils.ts`)

**L-4: Sentry DSN placeholder in production** — `sentry.ts`
- Before: `'https://placeholder@sentry.io/0'` fallback used silently
- After: Added `IS_PLACEHOLDER_DSN` check; `initSentry()` logs `console.warn` when placeholder DSN detected in production build

---

## Audit 03 — UX, Accessibility & Copy

### MEDIUM

**F-47: "RECOMMENDED" badge too small** — `ModeToggle.tsx`
- Before: `fontSize: 9` (below readable minimum)
- After: `fontSize: 10`

**F-48: ScanOverlay reduced opacity text** — `ScanOverlay.tsx`
- Before: `rgba(255, 255, 255, 0.7)` — fails WCAG AA on blue background
- After: `rgba(255, 255, 255, 0.85)` — passes WCAG AA

**F-85: "Keep scrolling" directive copy** — `ScanOverlay.tsx`
- Before: `'Keep scrolling'` quality label
- After: `'Getting there'` — less directive, more encouraging

**F-87/F-88: Mode labels not intuitive** — `broadcast.ts` (SCAN_MODES)
- Before: `label: 'Broadcast'` / `label: 'Precision'`
- After: `label: 'Live Scan'` / `label: 'Quick Scan'`

**Hardcoded #FFFFFF colors** — `dashboard.tsx`, `ModeToggle.tsx`
- Before: `color: '#FFFFFF'` scattered through button labels
- After: All instances replaced with `colors.white` from theme context

**ModeToggle low-contrast text** — `ModeToggle.tsx`
- Before: `rgba(255,255,255,0.8)` description text
- After: `rgba(255,255,255,0.85)` for WCAG AA compliance

---

## Audit 04 — Accuracy & Edge Cases

### MEDIUM

**PQ-4: Dedup overlap imprecise** — `analysisPrompts.ts`
- Before: ">80% overlap" without clear definition
- After: Defined as "shorter text is substring of longer, OR ≥80% of words overlap"; added rule 5: "deduplicated_items MUST NOT contain more items than the input"

**PQ-5: Temperature 0.1 → 0** — `geminiFlashService.ts`
- Before: `temperature: 0.1` on both vision and text calls
- After: `temperature: 0` for maximum determinism in structured extraction

**PQ-8: MIXED valence underspecified** — `analysisPrompts.ts`
- Before: No guidance on when to use POSITIVE/NEGATIVE/NEUTRAL/MIXED
- After: Added `VALENCE CLASSIFICATION` section defining all four categories with examples; explicit instruction: "do not default to MIXED when uncertain — use NEUTRAL instead"

**DD-3: Percentage rounding can exceed 100%** — `broadcastAnalysisPipeline.ts`, `computeDashboardData.ts`
- Before: `Math.round()` percentages summed > 100%
- After: `correctPercentageRounding()` helper in pipeline; largest-item correction in `countContentTypes()`

**DD-5: `getTopCreators()` return type mismatch** — `broadcastAnalysisPipeline.ts`
- Before: Returns `string[]` but `ScanRecord.raw_data.top_creators` expects `{name, count}[]`
- After: Returns `Array<{ name: string; count: number }>` matching dashboard's `CreatorStat` shape

**BC-9: `maxFramesToAnalyze` default 0** — `broadcastAnalysisPipeline.ts`
- Before: `maxFramesToAnalyze: 0` (no limit — unbounded Gemini cost)
- After: `maxFramesToAnalyze: 200` with safety cap comment

**RP-6: Falsy-value bug in sanitizeExtractedItem** — `geminiFlashService.ts`
- Before: `raw.political?.policy_area || null` — `||` coerces empty string `""` to null
- After: `raw.political?.policy_area ?? null` — `??` only coerces `null`/`undefined`

**C3-5: Missing carousel instruction** — `analysisPrompts.ts`
- Before: No guidance on multi-image carousel posts
- After: Added `CAROUSEL / MULTI-IMAGE POSTS` section instructing model to treat as single feed item

---

## Test Updates

**`analysisPrompts.test.ts`** — Added tests for:
- MIXED valence definition presence
- Carousel handling instruction presence
- Dedup item count hallucination guard

---

## Verification

- `npx tsc --noEmit`: **0 errors**
- Self-review: 5 cycles completed; no regressions detected
- All changes preserve backward compatibility with existing data flow
- New `src/lib/utils.ts` shared utility consolidates UUID generation and safe JSON parsing
