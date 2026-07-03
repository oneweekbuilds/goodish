# AlgorithmLens - Folder Instructions

## About This Project
AlgorithmLens is a free consumer AI transparency tool: it analyzes social
media feeds with epistemic restraint. The active codebase in this folder is
the mobile app (`mobile/`, a nested git repo, React Native / Expo). There is
also a Python backend (`backend/`), currently not deployed.

## Working With Me (Justin)
- I do not know how to read or write code. Explain everything in plain language.
- Never make changes to any files without explicitly asking me first and
  getting my approval, UNLESS the session prompt explicitly authorizes
  unattended work (I sometimes run large unattended batches; in those, make
  the call, log it in mobile/PRODUCT_DECISIONS.md, and never stop to ask).
- When describing issues or recommendations, explain what the problem is and
  why it matters in non-technical terms before describing the technical fix.
- Always create checkpoint documentation in markdown before proposing any changes.

## Architecture
- **Mobile app:** React Native + Expo (`mobile/`), its own git repo. Scan
  modes: Screen recording (iOS ReplayKit, recommended where available),
  Easy scan (in-app WebView browser, fallback), and Import screenshots
  (photo library). Analysis via Google Gemini with an enforced AI-consent
  gate. Data in Supabase.
- **Backend:** Python (`backend/`), code-complete Gemini proxy, NOT deployed
  yet. Read-only unless a session says otherwise.
- **Dashboard tabs:** Overview, Sources, Ads, Politics, Tone, Suggested vs. Followed.

## Pricing Model
The app is completely free. There is no paywall, no subscription, and no
Stripe integration: the former freemium/Plus tier was deleted during the
June 2026 remediation. Do not reintroduce payment mechanics; they conflict
with the product's trust position.

## Non-negotiables (epistemic and design canon)
- The canonical privacy sentence and all consent copy and behavior are locked.
- Epistemic restraint in every user-facing string: observable patterns,
  hedged interpretations, never anthropomorphize the algorithm, never present
  derived or defaulted numbers as observed. A canon scanner test in
  `mobile/src/__tests__/canonScanner.test.ts` enforces this; its allowlist
  must stay empty (rewrite copy instead of allowlisting).
- Sentence case; no em dashes; no gamification; token-only colors; brand blue
  #1868D8, brand green #20A888 (green never as text).
- Gates for any mobile change: `npx tsc --noEmit` clean and `npm test` fully
  green before a commit counts as done.

## Key documents
- `mobile/PRODUCT_DECISIONS.md`: judgment-call log from unattended batches.
- `mobile/PRODUCT_UPGRADE_REPORT.md`: July 2026 product batch report, incl.
  the device-verification checklist that gates submission decisions.
- `AlgorithmLens_10x_Report.md` (parent folder): strategy source.
