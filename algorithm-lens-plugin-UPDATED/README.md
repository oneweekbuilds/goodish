# AlgorithmLens Plugin

Project knowledge and audit toolkit for AlgorithmLens — a consumer AI transparency tool that documents social media feed composition with epistemic restraint.

## What This Plugin Does

This plugin gives Claude deep knowledge about the AlgorithmLens project and provides on-demand audit commands for maintaining quality, security, and design standards. When you work on AlgorithmLens with this plugin installed, Claude automatically understands your project's rules, architecture, and philosophy.

## Skills (Background Knowledge)

These load automatically when Claude detects relevant work:

| Skill | What It Knows |
|-------|---------------|
| **Epistemic Restraint** | Language rules — what words and framings are allowed in user-facing text |
| **Architecture Rules** | Separation of concerns across extension, backend, frontend, and database |
| **Code Quality** | Production-readiness standards — no placeholders, explicit errors, secrets in env vars |
| **QA Process** | How to conduct and document quality assurance passes |
| **Pricing & Billing** | Freemium model, Stripe integration, feature gating, trial logic |
| **Product Context** | What AlgorithmLens is, the Goodish initiative, market positioning |
| **UI/UX Philosophy** | Design principles — progressive disclosure, calm colors, visual hierarchy |
| **Scan Accuracy** | Classification pipeline accuracy — prompt quality, category definitions, parsing, determinism, data coverage |

## Commands (On-Demand Actions)

| Command | What It Does |
|---------|--------------|
| `/audit-copy` | Scans all user-facing text for epistemic restraint violations → saves `COPY_AUDIT.md` |
| `/audit-billing` | Reviews the full Stripe payment flow for gaps → saves `BILLING_AUDIT.md` |
| `/audit-security` | Checks for exposed secrets, missing auth, and vulnerabilities → saves `SECURITY_AUDIT.md` |
| `/qa-report` | Generates a comprehensive quality report by severity → saves `QA_REPORT.md` |
| `/audit-ux` | Reviews dashboard design against UX philosophy → saves `UX_AUDIT.md` |
| `/audit-accuracy` | Traces the entire scan classification pipeline and audits for accuracy issues → saves `ACCURACY_AUDIT.md` |
| `/improve-prompts` | Rewrites Google Flash prompts based on accuracy audit findings → saves `PROMPT_IMPROVEMENTS.md` |
| `/prep-beta` | Runs all five audits and produces a beta-readiness assessment → saves `BETA_READINESS.md` |
| `/fix-issues` | Reads the latest audit, presents issues, and fixes the ones you approve |

## Setup

No external configuration required. Install the plugin and the skills and commands are immediately available.

## Usage

Once installed, simply work on your AlgorithmLens project as normal. Claude will automatically draw on the relevant skills when the context calls for them. To run an audit, type any command (e.g., `/audit-accuracy`) in the chat.
