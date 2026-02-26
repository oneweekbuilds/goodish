# Refactor Log — February 24, 2026

## TrendsPanel.jsx (756 lines → 5 focused modules)

**Location:** `src/components/dashboard/`

| File | Lines | Responsibility |
|------|-------|----------------|
| TrendsPanel.jsx | ~374 | Main container, state management, orchestration |
| TrendsDataHelpers.js | ~44 | Pure utility functions (formatScanLabel, getNewerScanId) |
| TrendsScanSelector.jsx | ~114 | Scan selector dropdowns + swap button |
| TrendsComparisonTable.jsx | ~95 | Reusable comparison results table |
| TrendsChangeSummary.jsx | ~51 | "What Changed" summary + collapsible Possible Factors |

**Why split:** The original file mixed state management, data processing, and multiple rendering concerns in a single 756-line component. Both the embedded and non-embedded modes duplicated table rendering code.

**What changed:**
- Extracted pure data helpers (no React dependency) into TrendsDataHelpers.js
- Consolidated duplicate table rendering from both modes into a single TrendsComparisonTable component
- Extracted scan selector UI (used in both modes) into TrendsScanSelector
- Extracted change summary section into TrendsChangeSummary
- Main TrendsPanel.jsx now orchestrates sub-components

**Preserved:**
- `export default TrendsPanel` (unchanged API)
- All props, state, effects, and memos
- All CSS classes, DOM structure, and accessibility attributes
- Identical rendered output in both embedded and non-embedded modes

---

## desktop_mapper.js (1553 lines → 3 focused modules)

**Location:** `alg-gemini-extension/src/`

| File | Lines | Responsibility |
|------|-------|----------------|
| desktop_mapper.js | ~346 | Main mapper function (public API entry point) |
| desktop_mapper_topics.js | ~1136 | Topic classification engine + keyword patterns |
| desktop_mapper_utils.js | ~76 | Utility functions (STOP_WORDS, extractKeywords, extractDomain, detectOS) |

**Why split:** The original file was 97KB with the topic classification engine (~1100 lines of keyword patterns) mixed in with the mapping logic and utilities. The keyword patterns dominate the file and change independently from the mapping logic.

**What changed:**
- Extracted `classifyTopic()` and its massive `topicPatterns` object into desktop_mapper_topics.js
- Extracted utility functions (STOP_WORDS, extractKeywords, extractDomain, detectOS) into desktop_mapper_utils.js
- Main desktop_mapper.js now imports from both sub-modules

**Preserved:**
- `export function mapDesktopPostsToUnifiedResult(...)` (named export)
- `export default mapDesktopPostsToUnifiedResult` (default export)
- Function signature, behavior, and return type are identical
- All internal logic and comments preserved
