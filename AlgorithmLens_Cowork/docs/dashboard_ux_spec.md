# Dashboard UX Specification

**Created**: 2026-01-22  
**Status**: Specification Document  
**Purpose**: Exhaustive specification of the intended end-state for the AlgorithmLens Dashboard across all tabs. This document is explicit enough that future implementation prompts do not require interpretation or design decisions.

---

## 1. Purpose and Design Principles

### Core Philosophy
The Dashboard must be **evidence-first, calm, and non-judgmental**. Every section must adhere to these principles:

- **Evidence-first**: Every insight must either:
  - Provide concrete evidence (counts, percentages, examples), OR
  - Explicitly state uncertainty AND still give the user something useful
- **Non-judgmental**: No section should shame, label, or imply identity. The dashboard observes what appeared, not who the user is.
- **Calm**: Visual hierarchy must allow the primary insight of each section to be understood in under 1 second.
- **Transparent**: When confidence is low, state it clearly. When data is insufficient, provide calm guidance rather than empty states.

### Visual Aesthetic
- Dashboard must not appear monochrome
- Color is allowed for emphasis, not decoration
- Premium feel (Oura-level polish)
- Clear visual hierarchy with scannable structure

---

## 1.5 Non-Negotiable Interpretation Rules

These rules are hard constraints that apply to ALL implementation decisions. If a ticket conflicts with these rules, the rules take precedence.

### Rule 1: Observation > Inference
- **Never label the user**. The dashboard observes what appeared in scans, not who the user is.
- **Never imply identity**. Phrases like "your politics are X" or "you are interested in Y" are forbidden.
- **Always use exposure language**. Say "political keywords appeared" not "you are political."
- **Acceptable**: "Political keywords appeared in 12% of posts during this window."
- **Forbidden**: "You have a 12% political interest" or "Your feed is political."

### Rule 2: No Insight Without Supporting Detail
- **Percentages alone are insufficient**. Every percentage must be accompanied by:
  - Examples (accounts, topics, platforms), OR
  - Counts (e.g., "12% (24 of 200 posts)"), OR
  - Clear explanation of what the percentage represents
- **Acceptable**: "12% of posts contained political keywords. Top sources: @account1 (8 posts), @account2 (5 posts)."
- **Forbidden**: "12% political content" with no supporting detail.

### Rule 3: Percentages Must Be Grounded
- **Every percentage must have context**:
  - What is the denominator? (e.g., "12% of posts" not just "12%")
  - What does it represent? (e.g., "12% of this account's posts were political" not just "12%")
- **Examples are required when available**. If data includes account names, topic names, or platform names, show them.
- **If examples aren't available**, explain why: "Examples aren't available because posts were analyzed anonymously."

### Rule 4: No "Try This" Unless Explicitly Justified
- **Default decision: REMOVE all "Try this" sections**.
- **Only include "Try this" if**:
  - It's directly tied to a specific observed pattern, AND
  - It's not generic advice (no "follow/unfollow", "engage differently", "mute accounts")
- **Acceptable**: "We observed 80% of political content came from 2 accounts. If you want to see different perspectives, you could explore accounts that discuss different topics."
- **Forbidden**: "Try following accounts with different viewpoints" (generic, not tied to observation).

### Rule 5: No Generic Summaries That Repeat Hero
- **Every card must answer a distinct question**:
  - Hero: "What is the overall pattern?" (e.g., "12% political content")
  - Supporting cards: "Where did it come from?" / "Who drove it?" / "How stable was it?" / "Why does it matter?"
- **If a card repeats the hero insight**, remove it or reframe it to answer a different question.
- **Acceptable**: Hero says "12% political content", supporting card says "Political keywords came from 5 accounts, with @account1 contributing 40% of political posts."
- **Forbidden**: Hero says "12% political content", supporting card says "Your feed had 12% political content" (repetition).

### Rule 6: Every Card Must Answer a Distinct Question
- **Valid questions**: What / Where / Who / How often / How stable / Why it matters
- **If a card doesn't answer a distinct question**, remove it or reframe it.
- **Card structure must be**: Question → Evidence → Interpretation (if applicable)

---

## 2. Global Invariants (apply everywhere)

### 2.1 Scan Count (Single Source of Truth)

**Requirement**: There must be exactly ONE authoritative scan count derived from a shared selector or hook.

**Exact Implementation**:
1. Create a single hook or selector: `useScanCount(scans, filters)` that returns:
   - `scanCount: number` - the filtered scan count
   - `scopeLabel: string` - formatted label (e.g., "During this window (Dec 1–15)" or "Based on your recent scans")
2. Replace ALL instances of:
   - `scans.length`
   - `scanCount` from aggregations
   - `scansUsed` per view
   - Any hardcoded scan count calculations
3. Use this hook in:
   - Dashboard header subtitle
   - All tab hero sections (scopeLabel)
   - All "How we measure" boxes
   - All DataQualityFooter components
   - All view data functions (pass filtered scans, not raw scans)

**Exact Copy Rules**:
- **If date range available**: "During this window (Dec 1–15, 2025)"
- **If date range unavailable but scan count > 1**: "Based on your recent scans"
- **If single scan**: "Observed during this window"
- **Never show**: "Across your last 108 scans" (specific counts create contradictions)

**Acceptance Criteria**:
- ✅ No tab shows a different number under the same filter state
- ✅ All references to scan count derive from the same source
- ✅ Filtering updates all scan counts simultaneously
- ✅ All scope labels use consistent formatting

**Current State**: Multiple calculations exist (`scans.length`, `scanCount` from aggregations, `scansUsed` per view). These must be unified.

---

### 2.2 Sample Labels (Broader / Moderate / etc.)

**Requirement**: Remove ALL sample-size labels unless they can be computed honestly.

**Exact Implementation**:
1. **Remove ConfidenceBadge component entirely** OR refactor to show only computed metrics:
   - If post count < 20: Show "Limited sample: {postCount} posts analyzed"
   - If post count >= 20: Show nothing (no badge)
   - Never show: "Broader sample", "Moderate sample", "Limited data" without computation
2. **Remove all instances of ConfidenceBadge** from:
   - ViewCard components
   - DataQualityFooter components
   - Any other locations
3. **If sample size info is needed**, show it as plain text with explanation:
   - "Based on {postCount} posts from {scanCount} scans"
   - "Limited sample: {postCount} posts analyzed. More scans would increase confidence."

**Exact Copy Rules**:
- **Forbidden phrases**: "Broader sample", "Moderate sample", "Limited data" (unless computed)
- **Acceptable**: "Based on 45 posts from 3 scans" (computed from data)
- **Acceptable**: "Limited sample: 8 posts analyzed. More scans would provide clearer patterns." (computed + explanation)

**Acceptance Criteria**:
- ✅ No unexplained sample language appears in UI
- ✅ If sample size is shown, it's computed from real data and explained
- ✅ No "Broader sample" / "Moderate sample" / "Limited data" badges without clear computation
- ✅ ConfidenceBadge component is removed or refactored

**Current State**: `ConfidenceBadge` component uses "Broader sample", "Moderate sample", "Limited data" labels. These must be removed or replaced with honest computations.

---

### 2.3 Global Filters (Premium)

**Requirement**: Add two global filters that apply across all tabs:
1. **Platform** (multi-select)
2. **Date range** (calendar-based)

**Exact Implementation**:
1. **Create shared filter state**:
   - Location: Dashboard-level state (not per-tab)
   - Structure: `{ platforms: string[], dateRange: { start: Date, end: Date } | null }`
   - Persistence: Store in URL params or localStorage
2. **Filter UI placement**:
   - Location: Dashboard header, right side (next to "Refresh" and "New Scan" buttons)
   - Platform filter: Multi-select dropdown with checkboxes
   - Date range filter: Calendar picker (start and end dates)
   - Visual: Premium styling matching dashboard aesthetic
3. **Filter application**:
   - All data functions receive filtered scans: `getData(filteredScans, scanDetails)`
   - All charts, tables, summaries use filtered data
   - All scan counts update based on filtered scans
   - Filter state persists when switching tabs

**Exact Behavior When Filters Reduce Data**:
- **Do NOT show**: "Not enough data yet" hero
- **DO show**: Limited-confidence summary with explanation:
  - "Based on {filteredScanCount} scans from {platformList} during {dateRange}"
  - "Filtered data may have lower confidence. Clear filters to see full analysis."
- **Hero section**: Always shows what CAN be determined, even if limited

**Exact Copy for Filter UI**:
- Platform filter label: "Platforms"
- Date range filter label: "Date range"
- Clear filters button: "Clear filters"
- Active filter indicator: Show count badges (e.g., "2 platforms", "Dec 1–15")

**Acceptance Criteria**:
- ✅ Apply filters, switch tabs, data remains filtered
- ✅ All charts, tables, and summaries respect filters
- ✅ Filter state persists when switching tabs
- ✅ Low-data states show limited-confidence summary, not empty hero
- ✅ Filter UI is visible and accessible in dashboard header

**Current State**: No global filters exist. This is a new feature.

---

### 2.4 Visual Hierarchy and Color

**Requirement**: Define and use consistent visual hierarchy system.

**Exact Visual Specifications**:

1. **Primary insight text** (hero takeaway, card headlines):
   - Font weight: `font-bold` (700)
   - Font size: `text-lg` or `text-xl` (18px–20px)
   - Color: `text-slate-900` or `text-slate-800` (dark, high contrast)
   - Optional: Accent bar (left border, 4px solid, color: `#2563EB`)
   - Line height: `leading-relaxed` (1.625)

2. **Supporting explanation** (descriptions, context):
   - Font weight: `font-normal` (400)
   - Font size: `text-sm` or `text-base` (14px–16px)
   - Color: `text-slate-600` or `text-slate-700` (medium contrast)
   - Line height: `leading-relaxed` (1.625)

3. **Measurement detail** (percentages, counts, data):
   - Container: Subdued background `bg-slate-50` or `bg-slate-100`
   - Font weight: `font-medium` (500)
   - Font size: `text-sm` (14px)
   - Color: `text-slate-500` or `text-slate-600`
   - Padding: `p-3` or `p-4`

4. **Disclaimer** (limitations, uncertainty):
   - Font weight: `font-normal` (400)
   - Font size: `text-xs` (12px)
   - Color: `text-slate-400` or `text-slate-500` (low contrast)
   - Shown: Once per section, at bottom
   - Style: Italic optional

5. **Color usage rules**:
   - **Primary accent**: `#2563EB` (blue) - for emphasis, borders, highlights
   - **Secondary accent**: `#10B981` (green) - for positive indicators only
   - **Warning accent**: `#F59E0B` (amber) - for low-confidence indicators only
   - **Backgrounds**: Neutral grays (`slate-50` to `slate-100`)
   - **Forbidden**: Monochrome text (all same color), decorative colors without meaning

**Exact Implementation**:
- Apply these classes consistently across all cards, heroes, and sections
- Primary insights must "pop" visually (bold + dark color)
- Supporting text must be clearly secondary (normal weight + medium color)
- Dashboard must not appear monochrome (use accent colors for emphasis)

**Acceptance Criteria**:
- ✅ User can visually identify "the point" immediately
- ✅ Primary insight is visually dominant (bold + dark)
- ✅ Supporting text is clearly secondary (normal + medium)
- ✅ Disclaimers don't compete with insights (small + light)
- ✅ Dashboard uses accent colors for emphasis (not monochrome)

**Current State**: Visual hierarchy exists but may need refinement for consistency.

---

### 2.5 Navigation

**Requirement**: Rename tab "Talk" → "Talk to Your Algorithm (Coming Soon)".

**Exact Implementation**:
1. **File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js`
2. **Line**: ~66 (TABS array)
3. **Change**: 
   ```javascript
   // Before:
   { id: 'talk', label: 'Talk' },
   // After:
   { id: 'talk', label: 'Talk to Your Algorithm (Coming Soon)' },
   ```
4. **Internal tab ID**: Remains `'talk'` for code compatibility
5. **Navigation styling**: Ensure label is not truncated (may need responsive text or tooltip)

**Exact Copy**:
- Tab label: "Talk to Your Algorithm (Coming Soon)"
- Capitalization: Title case
- Parentheses: Include "(Coming Soon)" as part of label

**Acceptance Criteria**:
- ✅ Tab label shows full text: "Talk to Your Algorithm (Coming Soon)"
- ✅ Label is not truncated in navigation
- ✅ Internal tab ID remains `'talk'` for compatibility

**Current State**: Tab label is "Talk" (line 66 in dashboardCatalog.js).

---

## 3. Tab-by-Tab Specifications

### 3.1 Politics & Worldview

**Core Question**: "How much political content am I exposed to?"

#### What Must Be Removed

1. **Remove the entire "Optional: Show viewpoint distribution estimate…" banner**
   - **File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`
   - **Location**: Lines ~2030-2037 (PoliticalLeaningToggle component)
   - **Action**: Remove the entire `<PoliticalLeaningToggle>` component and its conditional rendering
   - **Note**: Opt-in functionality can remain in collapsed sections, but not via a banner

2. **Remove misleading summary text when clustering is not present**
   - **File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js`
   - **View ID**: `politics-creators`
   - **Action**: Update takeaway function to check if top accounts contribute >50% before using "clustered" language

3. **Remove decorative circles from line chart**
   - **File**: `apps/alg-gemini/src/components/dashboard/charts/LineChartSimple.jsx`
   - **Action**: Remove any decorative circle markers from data points
   - **Visual**: Chart should be clean line only, no markers

#### What Must Replace It

**Hero Section - Exact Copy Rules**:

**If political content detected (currentPercent > 0)**:
- **Headline**: Use existing takeaway function output (e.g., "Political exposure was light — scattered keywords surfaced but didn't form a sustained theme.")
- **Supporting text** (below headline, smaller):
  - "We detected {totalPolitical} posts with political keywords out of {totalPosts} total posts ({currentPercent}%)."
  - "This measures exposure to political content, not your beliefs or political identity."
  - "More scans would provide a clearer pattern of political content in your feed."

**If no political content detected (currentPercent === 0)**:
- **Headline**: "No political keywords detected during this window."
- **Supporting text**:
  - "We analyzed {totalPosts} posts and found no keywords related to elections, policy, or political figures."
  - "This measures exposure to political content, not your beliefs or political identity."
  - "More scans would help confirm whether political content appears in your feed."

**If insufficient data (totalPosts < 20 or quality === 'LOW_SAMPLE')**:
- **Headline**: "Political keyword analysis requires more data."
- **Supporting text**:
  - "We analyzed {totalPosts} posts, which is too few to reliably detect political content patterns."
  - "This measures exposure to political content, not your beliefs or political identity."
  - "More scans (at least 20 posts) would provide a clearer pattern."

**Line Chart - Exact Specifications**:

**If trend data available (byDate.length >= 2) AND quality === 'OK'**:
- **Title**: "Political keyword percentage over time"
- **X-axis label**: "Date"
- **Y-axis label**: "Percentage of posts"
- **Y-axis range**: 0–100% (or auto-scaled to data range)
- **Data points**: Clean line, no decorative circles
- **Tooltip**: Show date and percentage on hover

**If trend data unavailable OR quality !== 'OK'**:
- **Replace chart with summary card**:
  - Title: "Political content pattern"
  - Content: "Insufficient data to show trend over time. {totalPolitical} posts contained political keywords out of {totalPosts} total posts."

**"Where political exposure concentrated" Table - Exact Specifications**:

**Column header**: "Percent of this account's posts that were political (keyword match)"

**Data format**:
- All values must be 0–100% percentages
- Format: "{value}%" (integer, no decimals)
- If value is 0, show "0%"
- If value is 100, show "100%"

**Takeaway text logic**:
- **If top account contributes >50% of total political posts**:
  - "Political exposure was concentrated — {topAccount} contributed {topPercent}% of political posts."
- **If top 3 accounts contribute >50% of total political posts**:
  - "Political exposure was clustered — {top3Count} accounts contributed most political content."
- **Otherwise**:
  - "Political keywords appeared across {totalAccounts} accounts — distributed exposure."

**"Additional detail" Section - Exact Copy**:

**Replace technical jargon with**:
- "This table shows which accounts posted content with political keywords during this window."
- "The percentage represents how many of each account's posts contained political keywords."
- "This measures exposure patterns, not the accuracy of content or your beliefs."

#### Acceptance Criteria

- ✅ Hero never shows "Not enough data yet" as headline
- ✅ Hero always provides: what was detected, what couldn't be determined, what would help
- ✅ Line chart has clear title and axis labels, or is replaced with summary card if low confidence
- ✅ Table column clearly states it's "Percent of this account's posts that were political"
- ✅ All table values are 0–100% percentages
- ✅ "Clustered" language only appears when top accounts contribute majority
- ✅ Additional detail section is human-readable
- ✅ PoliticalLeaningToggle banner is completely removed

---

### 3.2 Patterns in Your Feed

**Core Question**: "Is my feed varied or repetitive?"

#### What Must Be Removed

1. **Generic "Try this" sections**
   - **File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js`
   - **Views to check**: All views with `action` field set to generic advice
   - **Action**: Set `action: null` for all generic advice
   - **If removed**: Ensure no dead space or broken layout (remove action rendering entirely)

#### What Must Replace It

**Attention Tactics - Exact Copy**:

**View ID**: `manipulative-patterns`

**If examples available (flaggedPosts with account names or topics)**:
- **Headline**: Use existing takeaway (e.g., "Attention tactics appeared lightly — present but not a dominant pattern.")
- **Supporting section** (below headline):
  - "{currentPercent}% of posts ({flaggedCount} of {totalPosts}) contained attention-grabbing patterns."
  - "Examples: {list top 3 accounts or topics that used these patterns}"
  - "Patterns detected: urgency language, engagement hooks, or other attention-grabbing tactics."

**If examples unavailable**:
- **Headline**: Use existing takeaway
- **Supporting section**:
  - "{currentPercent}% of posts ({flaggedCount} of {totalPosts}) contained attention-grabbing patterns."
  - "Examples aren't available because posts were analyzed anonymously."
  - "More detailed scans would show which accounts or topics used these patterns."

**Topic Concentration - Exact Copy**:

**View ID**: `patterns-echo-risk`

**Always show top 3 topics, even when concentration is low**:
- **If concentration is low**:
  - "Topic concentration was low — content spread across many themes."
  - "Top 3 topics: {topic1} ({pct1}%), {topic2} ({pct2}%), {topic3} ({pct3}%)."
  - "Low concentration means your feed covered many different topics without heavy focus on any single theme."

**Feed Evolution - Exact Copy**:

**View ID**: `patterns-stability`

**Must explicitly state "stable" or "shifting" with evidence**:
- **If stable**:
  - "Your feed was stable — the same {topicCount} topics appeared consistently across {scanCount} scans."
  - "Evidence: {topTopic} appeared in {appearanceCount} of {scanCount} scans ({percentage}%)."
- **If shifting**:
  - "Your feed was shifting — different topics appeared across {scanCount} scans."
  - "Evidence: Only {consistentTopicCount} topics appeared in more than {threshold}% of scans."
- **If insufficient data**:
  - "Insufficient scans to measure evolution. Need at least 2 scans to compare patterns over time."

**Tone Distribution - Exact Copy**:

**View ID**: `patterns-emotional-weight`

**Define tone categories clearly**:
- **Title**: "Tone Distribution (Rough Estimate)"
- **Categories** (if shown):
  - "Positive: Content with uplifting, encouraging, or optimistic language"
  - "Neutral: Content with factual, balanced, or informational tone"
  - "Negative: Content with critical, concerning, or pessimistic language"
- **Disclaimer** (required):
  - "Tone detection is approximate and cannot capture context, nuance, or irony. This is a rough estimate only."
- **If examples available**: Show sample posts for each category
- **If examples unavailable**: "Examples aren't available because posts were analyzed anonymously."

**"Try this" - Exact Rules**:
- **Default**: Remove all "Try this" sections (`action: null`)
- **Only include if**: Directly tied to specific observed pattern with evidence
- **Forbidden phrases**: "follow/unfollow", "engage differently", "mute accounts", "search for different topics"
- **Acceptable example**: "We observed 80% of attention tactics came from 2 accounts. If you want to see different patterns, you could explore content from accounts that use different engagement styles."

#### Acceptance Criteria

- ✅ Attention tactics shows examples (accounts or topics), not just percentages
- ✅ Topic concentration shows top 3 topics even when concentration is low
- ✅ Feed evolution explicitly states "stable" or "shifting" with evidence
- ✅ Tone distribution defines categories and provides examples
- ✅ "Try this" only appears when tied to specific observed patterns
- ✅ No generic behavioral advice appears

---

### 3.3 Creators & Voices

**Core Question**: "Who shapes what I see the most?"

#### What Must Be Removed

1. **"Not enough data yet" framing**
   - **File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx` and `dashboardCatalog.js`
   - **Action**: Search for "Not enough data yet" text in Creators tab
   - **Replace with**: What CAN be determined, even if limited

2. **Generic "Try this" advice**
   - **File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js`
   - **Action**: Set `action: null` for all generic advice in Creators tab views

#### What Must Replace It

**Tab Explanation - Exact Copy**:

**Location**: Top of Creators tab (before hero section)

**Exact copy**:
- "This shows which accounts appeared most often in your feed during this window."
- "This measures what appeared, not who you follow or your preferences."

**Hero Section - Exact Copy Rules**:

**View ID**: `creators-top`

**If data available**:
- **Headline**: Use existing takeaway (e.g., "{top} appeared very frequently — one voice with strong presence.")
- **Supporting text** (below headline):
  - "Top accounts: {list top 3 accounts with post counts}"
  - "Total accounts observed: {totalAccounts}"
  - "This shows which accounts appeared most, not who you follow."

**If insufficient data**:
- **Headline**: "We observed {accountCount} accounts appeared in your feed during this window."
- **Supporting text**:
  - "Top account: {topAccount} appeared {topCount} times."
  - "More scans would provide a clearer pattern of which accounts appear most often."

**"Influence patterns observed" Section - Exact Copy**:

**View ID**: `creators-influential`

**Rename title**: "How influence was distributed"

**Takeaway logic**:
- **If concentrated (count <= 3)**:
  - "Influence concentrated — a few familiar accounts appeared repeatedly."
  - "Evidence: Top {count} accounts contributed {percentage}% of posts."
- **If moderately distributed (count <= 8)**:
  - "Influence moderately distributed — several accounts appeared regularly."
  - "Evidence: Top {count} accounts contributed {percentage}% of posts."
- **If broadly distributed (count > 8)**:
  - "Influence broadly distributed — many different accounts contributed."
  - "Evidence: {totalAccounts} accounts appeared, with top account contributing {topPercent}%."

**Insights Placement - Exact Rules**:
- **Do NOT place insights under "Try this"** unless they are actions
- **Insights should be in their own sections** with clear headings
- **If action is needed**: Place in separate "Try this" section with evidence link

#### Acceptance Criteria

- ✅ No "Not enough data yet" language appears
- ✅ Tab clearly explains what it shows at the top
- ✅ "Influence patterns" section is renamed and focuses on patterns with evidence
- ✅ Insights are not placed under "Try this" unless they're actions
- ✅ All insights include evidence (counts, percentages, or examples)

---

### 3.4 Observed Patterns

**Core Question**: "What patterns appeared in my scans?"

#### What Must Be Removed

1. **Malformed and placeholder text in "Extrapolated future associations"**
   - **File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (algo-future view)
   - **Action**: Search for placeholder text, malformed sentences, remove all

2. **Repetitive content in "What the system is reinforcing"**
   - **File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (algo-confident view)
   - **Action**: Update takeaway to not repeat hero's topic list

3. **Generic "Try this" advice**
   - **File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js`
   - **Action**: Set `action: null` for all generic advice in Observed Patterns tab

#### What Must Replace It

**P0: Fix crash when clicking "How we know this"**
- **File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`
- **Action**: Fix null/undefined handling in evidence expansion logic
- **Test**: All "How we know this" buttons on all tabs

**"What the system is reinforcing" - Exact Copy**:

**View ID**: `algo-confident`

**Title**: "Recurring themes across scans"

**Takeaway logic** (must not repeat hero):
- **If themes persisted**:
  - "Certain themes persisted across multiple scans — stable patterns over time."
  - "Evidence: {topTheme} appeared in {appearanceCount} of {scanCount} scans ({percentage}%)."
- **If themes varied**:
  - "Themes varied across scans — different topics appeared in different time periods."
  - "Evidence: Only {consistentThemeCount} themes appeared in more than {threshold}% of scans."
- **Never repeat**: The hero's topic list (e.g., "Sports and Food appeared most often")

**"Extrapolated future associations" - Exact Copy**:

**View ID**: `algo-future`

**Title**: "If current trends continued (speculation)"

**Takeaway - Exact Copy**:
- "If patterns stayed constant: {topics} might appear more often."
- "(Pure speculation — not a forecast of what will happen.)"
- "This extrapolates from recent topic trends. We cannot predict what will actually surface."

**Remove all**:
- Placeholder text (e.g., "TODO", "PLACEHOLDER", "TBD")
- Malformed sentences (e.g., incomplete thoughts, broken grammar)
- Generic statements without mechanism explanation

**"Try this" - Exact Rules**:
- **Default**: Remove all (`action: null`)
- **Only include if**: Meaningful and evidence-linked
- **Forbidden**: Generic advice like "engage differently", "follow new accounts"
- **Acceptable example**: "We observed {pattern}. If you want to see different patterns, you could {specific action tied to pattern}."

#### Acceptance Criteria

- ✅ "How we know this" buttons work without crashes
- ✅ "What the system is reinforcing" includes evidence and doesn't repeat hero
- ✅ "Extrapolated future associations" explains mechanism and is clearly labeled as speculation
- ✅ No placeholder or malformed text appears
- ✅ "Try this" is either meaningful and evidence-linked, or removed

---

### 3.5 Talk to Your Algorithm

**Core Question**: "Can I ask my algorithm questions?" (Coming soon)

#### What Must Be Removed

1. **All escaped characters**
   - **File**: `apps/alg-gemini/src/components/dashboard/TalkToAlgorithmSection.jsx`
   - **Action**: Search for `We\'re`, `\"`, and other escaped characters, fix all

2. **Generic "coming soon" placeholder feel**
   - **File**: `apps/alg-gemini/src/components/dashboard/TalkToAlgorithmSection.jsx`
   - **Action**: Rewrite copy to make "coming soon" feel intentional and valuable

#### What Must Replace It

**Input + Button Alignment - Exact Implementation**:
- **File**: `apps/alg-gemini/src/components/dashboard/TalkToAlgorithmSection.jsx`
- **Fix**: Ensure input field and button are aligned horizontally
- **Spacing**: Proper gap between input and button (e.g., `gap-2` or `gap-3`)
- **Responsive**: Test on mobile (320px), tablet (768px), desktop (1024px+)
- **Visual**: Input and button should appear as single cohesive unit

**Copy Rewrite - Exact Copy**:

**Headline** (large, bold):
- "Ever wish you could ask your algorithm why it showed you what it showed you?"

**Subheadline** (medium, normal weight):
- "Ask about ad density, promotions, topics, creators, and other observed patterns."

**Description** (smaller, supporting):
- "Get calm, evidence-first answers grounded in what we observed in your scans."
- "We'll cite specific data, show uncertainty when it exists, and avoid speculation."

**Coming Soon Section** (intentional, not empty):
- "This feature is coming soon."
- "Join the waitlist to be notified when it's available."
- "You'll be able to ask questions like:"
  - "Why did I see so many ads for {product}?"
  - "Which accounts drove the political content in my feed?"
  - "How stable were the topics across my scans?"

**Visual Treatment - Exact Specifications**:
- **Consistent with dashboard**: Use same color scheme, typography, spacing
- **Premium feel**: Not placeholder styling
- **Background**: Match dashboard background (not stark white or empty)
- **Borders**: Subtle borders matching dashboard cards
- **Spacing**: Comfortable padding and margins

#### Acceptance Criteria

- ✅ No escaped characters appear (`We're` not `We\'re`)
- ✅ Input and button are properly aligned on all screen sizes
- ✅ Copy includes the specified messaging about asking questions
- ✅ "Coming soon" feels intentional and valuable (not empty placeholder)
- ✅ Visual treatment matches dashboard quality (premium, not placeholder)

---

## 4. Implementation Tickets (Atomic)

Each ticket addresses exactly ONE user-facing issue. Tickets are ordered by priority and dependencies.

---

### Ticket 1: Fix crash on "How we know this" button
**Priority**: P0 (Blocking)  
**Scope**: Observed Patterns tab  
**File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`  
**Exact Issue**: Clicking "How we know this" button causes application crash  
**Exact Fix**: 
- Identify the error in evidence expansion logic
- Fix null/undefined handling in `toggleHeroEvidence` or related functions
- Ensure all "How we know this" buttons work without errors
- Test on all tabs that have evidence expansion  
**Acceptance**: All "How we know this" buttons work without crashes on all tabs.

---

### Ticket 2: Create single scan count source hook
**Priority**: P0 (Trust breaker)  
**Scope**: Global  
**File**: Create `apps/alg-gemini/src/hooks/useScanCount.js`  
**Exact Implementation**:
- Create hook: `useScanCount(scans, filters)` that returns `{ scanCount, scopeLabel }`
- `scanCount`: filtered scan count (number)
- `scopeLabel`: formatted string ("During this window (Dec 1–15)" or "Based on your recent scans")
- Hook must handle filters (platform, date range)  
**Acceptance**: Hook exists and returns consistent values for same input.

---

### Ticket 3: Replace all scan count calculations with hook
**Priority**: P0 (Trust breaker)  
**Scope**: Global  
**Files**: 
- `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`
- All view data functions in `apps/alg-gemini/src/lib/dashboard/dataHelpers.js`
- All components that display scan counts  
**Exact Implementation**:
- Replace `scans.length` with `useScanCount(scans, filters).scanCount`
- Replace `scanCount` from aggregations with hook
- Replace `scansUsed` per view with hook
- Replace hardcoded scan count calculations  
**Acceptance**: All scan count references use the hook, all counts match under same filter state.

---

### Ticket 4: Remove ConfidenceBadge component
**Priority**: P1  
**Scope**: Global  
**File**: `apps/alg-gemini/src/components/dashboard/ConfidenceBadge.jsx`  
**Exact Implementation**:
- Remove all instances of `<ConfidenceBadge>` component
- Remove imports of ConfidenceBadge
- Remove the component file (or mark as deprecated)  
**Acceptance**: No ConfidenceBadge components appear in UI.

---

### Ticket 5: Remove sample label text from all views
**Priority**: P1  
**Scope**: Global  
**Files**: All view definitions in `dashboardCatalog.js`  
**Exact Implementation**:
- Search for "Broader sample", "Moderate sample", "Limited data" text
- Remove all instances
- If sample size info is needed, replace with computed text: "Based on {postCount} posts from {scanCount} scans"  
**Acceptance**: No unexplained sample language appears in UI.

---

### Ticket 6: Create global filter state management
**Priority**: P1  
**Scope**: Global  
**File**: Create `apps/alg-gemini/src/context/DashboardFilterContext.jsx`  
**Exact Implementation**:
- Create context with state: `{ platforms: string[], dateRange: { start: Date, end: Date } | null }`
- Provide filter update functions
- Persist in URL params or localStorage  
**Acceptance**: Filter state exists and can be read/updated from any component.

---

### Ticket 7: Add filter UI to dashboard header
**Priority**: P1  
**Scope**: Global  
**File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`  
**Exact Implementation**:
- Add Platform multi-select dropdown (right side of header)
- Add Date range calendar picker (right side of header)
- Add "Clear filters" button when filters are active
- Show active filter indicators (e.g., "2 platforms", "Dec 1–15")  
**Exact Copy**:
- Platform filter label: "Platforms"
- Date range filter label: "Date range"
- Clear filters button: "Clear filters"  
**Acceptance**: Filter UI is visible in dashboard header, filters can be set and cleared.

---

### Ticket 8: Apply filters to all data functions
**Priority**: P1  
**Scope**: Global  
**Files**: 
- `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`
- All data functions in `dataHelpers.js`  
**Exact Implementation**:
- Filter scans before passing to data functions: `getData(filteredScans, scanDetails)`
- Apply platform filter: `scans.filter(s => selectedPlatforms.includes(s.platform))`
- Apply date range filter: `scans.filter(s => s.created_at >= start && s.created_at <= end)`
- Update all data function calls to use filtered scans  
**Acceptance**: All charts, tables, summaries use filtered data.

---

### Ticket 9: Update low-data states to show summary not empty hero
**Priority**: P1  
**Scope**: Global  
**File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx` (TabHero component)  
**Exact Implementation**:
- When filters reduce data significantly, show limited-confidence summary
- Never show "Not enough data yet" as hero headline
- Always show what CAN be determined  
**Exact Copy** (when filters active):
- "Based on {filteredScanCount} scans from {platformList} during {dateRange}"
- "Filtered data may have lower confidence. Clear filters to see full analysis."  
**Acceptance**: Low-data states show summary with explanation, not empty hero.

---

### Ticket 10: Remove PoliticalLeaningToggle banner
**Priority**: P1  
**Scope**: Politics & Worldview tab  
**File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx` (lines ~2030-2037)  
**Exact Implementation**:
- Remove entire `<PoliticalLeaningToggle>` component and conditional rendering
- Remove `politicalLeaningEnabled` state if only used for banner
- Keep opt-in functionality in collapsed sections if it exists  
**Acceptance**: Banner is completely removed from Politics tab.

---

### Ticket 11: Fix Politics hero to never show "Not enough data yet"
**Priority**: P1  
**Scope**: Politics & Worldview tab  
**File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx` (TabHero component)  
**Exact Implementation**:
- Update hero headline logic for Politics tab
- If `currentPercent > 0`: Use existing takeaway
- If `currentPercent === 0`: "No political keywords detected during this window."
- If insufficient data: "Political keyword analysis requires more data."
- Always include supporting text with: what was detected, what couldn't be determined, what would help  
**Exact Copy**: See section 3.1 for exact copy rules.  
**Acceptance**: Hero never shows "Not enough data yet", always provides useful information.

---

### Ticket 12: Fix Politics line chart title and axes
**Priority**: P1  
**Scope**: Politics & Worldview tab  
**File**: `apps/alg-gemini/src/components/dashboard/charts/LineChartSimple.jsx`  
**Exact Implementation**:
- If trend data available AND quality === 'OK':
  - Title: "Political keyword percentage over time"
  - X-axis label: "Date"
  - Y-axis label: "Percentage of posts"
- If trend data unavailable OR quality !== 'OK':
  - Replace chart with summary card (see Ticket 13)  
**Acceptance**: Chart has clear title and axis labels, or is replaced with summary card.

---

### Ticket 13: Replace Politics line chart with summary card when low confidence
**Priority**: P1  
**Scope**: Politics & Worldview tab  
**File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`  
**Exact Implementation**:
- Check chart quality before rendering line chart
- If quality !== 'OK', render summary card instead:
  - Title: "Political content pattern"
  - Content: "Insufficient data to show trend over time. {totalPolitical} posts contained political keywords out of {totalPosts} total posts."  
**Acceptance**: Low-confidence charts are replaced with summary cards.

---

### Ticket 14: Remove decorative circles from Politics line chart
**Priority**: P1  
**Scope**: Politics & Worldview tab  
**File**: `apps/alg-gemini/src/components/dashboard/charts/LineChartSimple.jsx`  
**Exact Implementation**:
- Remove any circle markers from data points
- Chart should be clean line only, no decorative elements  
**Acceptance**: Chart shows clean line without decorative circles.

---

### Ticket 15: Rename Politics table column to exact specification
**Priority**: P1  
**Scope**: Politics & Worldview tab  
**File**: `apps/alg-gemini/src/components/dashboard/charts/SimpleTable.jsx`  
**Exact Implementation**:
- Column header: "Percent of this account's posts that were political (keyword match)"
- All values must be 0–100% percentages (integer, no decimals)  
**Acceptance**: Column header matches exact specification, all values are 0–100%.

---

### Ticket 16: Fix Politics table takeaway to use "clustered" only when appropriate
**Priority**: P1  
**Scope**: Politics & Worldview tab  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (politics-creators view)  
**Exact Implementation**:
- Update takeaway function to check if top accounts contribute >50% of total political posts
- If yes: "Political exposure was concentrated — {topAccount} contributed {topPercent}% of political posts."
- If top 3 accounts contribute >50%: "Political exposure was clustered — {top3Count} accounts contributed most political content."
- Otherwise: "Political keywords appeared across {totalAccounts} accounts — distributed exposure."  
**Acceptance**: "Clustered" language only appears when top accounts contribute majority.

---

### Ticket 17: Rewrite Politics "Additional detail" section to be human-readable
**Priority**: P1  
**Scope**: Politics & Worldview tab  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (politics-creators view)  
**Exact Copy**:
- "This table shows which accounts posted content with political keywords during this window."
- "The percentage represents how many of each account's posts contained political keywords."
- "This measures exposure patterns, not the accuracy of content or your beliefs."  
**Acceptance**: Additional detail section uses plain language, no technical jargon.

---

### Ticket 18: Add examples to Attention Tactics view
**Priority**: P1  
**Scope**: Patterns in Your Feed tab  
**File**: `apps/alg-gemini/src/lib/dashboard/dataHelpers.js` (getManipulativePatternsData)  
**Exact Implementation**:
- If examples available (flaggedPosts with account names or topics):
  - Add examples to response: `examples: [{ account: string, count: number }]` or `[{ topic: string, count: number }]`
- Update view to display examples below headline:
  - "{currentPercent}% of posts ({flaggedCount} of {totalPosts}) contained attention-grabbing patterns."
  - "Examples: {list top 3 accounts or topics}"
- If examples unavailable:
  - "Examples aren't available because posts were analyzed anonymously."  
**Acceptance**: Attention tactics shows examples (accounts or topics), not just percentages.

---

### Ticket 19: Always show top 3 topics in Topic Concentration view
**Priority**: P1  
**Scope**: Patterns in Your Feed tab  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (patterns-echo-risk view)  
**Exact Implementation**:
- Always display top 3 topics, even when concentration is low
- If concentration is low:
  - "Topic concentration was low — content spread across many themes."
  - "Top 3 topics: {topic1} ({pct1}%), {topic2} ({pct2}%), {topic3} ({pct3}%)."
  - "Low concentration means your feed covered many different topics without heavy focus on any single theme."  
**Acceptance**: Top 3 topics always shown, even when concentration is low.

---

### Ticket 20: Make Feed Evolution explicitly state "stable" or "shifting" with evidence
**Priority**: P1  
**Scope**: Patterns in Your Feed tab  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (patterns-stability view)  
**Exact Implementation**:
- Update takeaway function to explicitly state "stable" or "shifting"
- If stable: "Your feed was stable — the same {topicCount} topics appeared consistently across {scanCount} scans. Evidence: {topTopic} appeared in {appearanceCount} of {scanCount} scans ({percentage}%)."
- If shifting: "Your feed was shifting — different topics appeared across {scanCount} scans. Evidence: Only {consistentTopicCount} topics appeared in more than {threshold}% of scans."
- If insufficient data: "Insufficient scans to measure evolution. Need at least 2 scans to compare patterns over time."  
**Acceptance**: Feed evolution explicitly states "stable" or "shifting" with evidence.

---

### Ticket 21: Define tone categories clearly in Tone Distribution view
**Priority**: P1  
**Scope**: Patterns in Your Feed tab  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (patterns-emotional-weight view)  
**Exact Implementation**:
- Update title to: "Tone Distribution (Rough Estimate)"
- Add category definitions:
  - "Positive: Content with uplifting, encouraging, or optimistic language"
  - "Neutral: Content with factual, balanced, or informational tone"
  - "Negative: Content with critical, concerning, or pessimistic language"
- Add required disclaimer: "Tone detection is approximate and cannot capture context, nuance, or irony. This is a rough estimate only."  
**Acceptance**: Tone categories are clearly defined with examples and disclaimer.

---

### Ticket 22: Remove generic "Try this" from Patterns tab
**Priority**: P1  
**Scope**: Patterns in Your Feed tab  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js`  
**Exact Implementation**:
- Find all views in Patterns tab with `action` field containing generic advice
- Set `action: null` for all generic advice
- Only keep actions that are directly tied to specific observed patterns with evidence  
**Acceptance**: No generic behavioral advice appears in Patterns tab.

---

### Ticket 23: Remove "Not enough data yet" from Creators tab
**Priority**: P1  
**Scope**: Creators & Voices tab  
**Files**: 
- `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`
- `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js`  
**Exact Implementation**:
- Search for "Not enough data yet" text in Creators tab
- Replace with what CAN be determined, even if limited:
  - "We observed {accountCount} accounts appeared in your feed during this window."
  - "Top account: {topAccount} appeared {topCount} times."
- Never use "Not enough data yet" framing  
**Acceptance**: No "Not enough data yet" language appears in Creators tab.

---

### Ticket 24: Add clear tab explanation to Creators tab
**Priority**: P1  
**Scope**: Creators & Voices tab  
**File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`  
**Exact Implementation**:
- Add explanation text at top of Creators tab (before hero)
- Exact copy: "This shows which accounts appeared most often in your feed during this window. This measures what appeared, not who you follow or your preferences."  
**Acceptance**: Tab clearly explains what it shows at the top.

---

### Ticket 25: Rename and restructure "Influence patterns observed" section
**Priority**: P1  
**Scope**: Creators & Voices tab  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (creators-influential view)  
**Exact Implementation**:
- Rename title from "Influence Pattern" to "How influence was distributed"
- Focus on patterns (concentrated vs distributed), not labels
- Provide evidence (counts, percentages, examples) in takeaway
- Remove any creator labeling (e.g., "promotions", "general content")  
**Acceptance**: Section is renamed and focuses on patterns with evidence.

---

### Ticket 26: Fix "How we know this" crash in Observed Patterns tab
**Priority**: P0 (Blocking)  
**Scope**: Observed Patterns tab  
**File**: `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`  
**Exact Implementation**: Same as Ticket 1, but specifically test Observed Patterns tab  
**Acceptance**: "How we know this" buttons work without crashes in Observed Patterns tab.

---

### Ticket 27: Remove repetition from "What the system is reinforcing" view
**Priority**: P1  
**Scope**: Observed Patterns tab  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (algo-confident view)  
**Exact Implementation**:
- Update takeaway to focus on persistence/consistency, not re-listing topics
- Must include evidence (counts, persistence)
- Focus on what's different from hero (e.g., "Certain themes persisted across multiple scans — stable patterns over time.")
- Never repeat the hero's topic list  
**Acceptance**: Section includes evidence and doesn't repeat hero.

---

### Ticket 28: Replace "Extrapolated future associations" with mechanism explanation
**Priority**: P1  
**Scope**: Observed Patterns tab  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (algo-future view)  
**Exact Implementation**:
- Update title to: "If current trends continued (speculation)"
- Update takeaway to explain mechanism:
  - "If patterns stayed constant: {topics} might appear more often. (Pure speculation — not a forecast of what will happen.)"
- Remove all placeholder/malformed text
- Clearly label as speculation  
**Exact Copy**: See section 3.4 for exact copy.  
**Acceptance**: Section explains mechanism and is clearly labeled as speculation, no placeholder text.

---

### Ticket 29: Remove generic "Try this" from Observed Patterns tab
**Priority**: P1  
**Scope**: Observed Patterns tab  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js`  
**Exact Implementation**:
- Find all views in Observed Patterns tab with `action` field containing generic advice
- Set `action: null` for all generic advice
- Only keep actions that are meaningful and evidence-linked  
**Acceptance**: No generic behavioral advice appears in Observed Patterns tab.

---

### Ticket 30: Fix escaped characters in Talk tab
**Priority**: P2  
**Scope**: Talk to Your Algorithm tab  
**File**: `apps/alg-gemini/src/components/dashboard/TalkToAlgorithmSection.jsx`  
**Exact Implementation**:
- Search for escaped apostrophes: `We\'re` → `We're`
- Search for escaped quotes: `\"` → `"`
- Fix all escaped characters  
**Acceptance**: No escaped characters appear (`We're` not `We\'re`).

---

### Ticket 31: Fix input and button alignment in Talk tab
**Priority**: P2  
**Scope**: Talk to Your Algorithm tab  
**File**: `apps/alg-gemini/src/components/dashboard/TalkToAlgorithmSection.jsx`  
**Exact Implementation**:
- Fix visual alignment of input field and button
- Ensure proper spacing and alignment on multiple screen sizes
- Test on mobile, tablet, desktop  
**Acceptance**: Input and button are properly aligned on all screen sizes.

---

### Ticket 32: Rewrite Talk tab copy with specified messaging
**Priority**: P2  
**Scope**: Talk to Your Algorithm tab  
**File**: `apps/alg-gemini/src/components/dashboard/TalkToAlgorithmSection.jsx`  
**Exact Copy**:
- Headline: "Ever wish you could ask your algorithm why it showed you what it showed you?"
- Subheadline: "Ask about ad density, promotions, topics, creators, and other observed patterns."
- Description: "Get calm, evidence-first answers grounded in what we observed in your scans. We'll cite specific data, show uncertainty when it exists, and avoid speculation."
- Coming soon: "This feature is coming soon. Join the waitlist to be notified when it's available."  
**Acceptance**: Copy includes specified messaging about asking questions, "coming soon" feels intentional.

---

### Ticket 33: Apply global visual hierarchy rules
**Priority**: P1  
**Scope**: Global  
**Files**: All dashboard components  
**Exact Implementation**:
- Apply visual hierarchy rules from section 2.4 to all components:
  - Primary insight: `font-bold text-slate-900 text-lg`
  - Supporting explanation: `font-normal text-slate-600 text-sm`
  - Measurement detail: `bg-slate-50 p-3 font-medium text-slate-500 text-sm`
  - Disclaimer: `text-xs text-slate-400 italic`
- Ensure dashboard uses accent colors for emphasis (not monochrome)
- Test visual hierarchy on all tabs  
**Acceptance**: User can visually identify "the point" immediately in every section, dashboard is not monochrome.

---

### Ticket 34: Rename Talk tab label in navigation
**Priority**: P2  
**Scope**: Global  
**File**: `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js` (line ~66)  
**Exact Implementation**:
- Change: `{ id: 'talk', label: 'Talk' }` → `{ id: 'talk', label: 'Talk to Your Algorithm (Coming Soon)' }`
- Ensure label is not truncated in navigation  
**Acceptance**: Tab label shows "Talk to Your Algorithm (Coming Soon)" and is not truncated.

---

## 5. Implementation Notes

### Data Flow
- All data must flow through the single scan count source (Ticket 2)
- All filters must apply through shared state (Ticket 4)
- All views must respect filter state

### Testing Requirements
- Test all "How we know this" buttons (Ticket 1)
- Verify scan counts match across all views (Ticket 2)
- Test filters across all tabs (Ticket 4)
- Verify no escaped characters (Ticket 9)
- Visual regression testing for hierarchy (Ticket 10)

### Copy Guidelines
- Use plain language
- Avoid jargon
- State uncertainty clearly
- Never imply identity or judgment
- Provide evidence or explain why it's missing

---

**End of Specification**

---

## BASELINE VERIFIED

- **Date/time**: 2026-01-26
- **HEAD (short)**: d1da1013
- **Backend 200**: `Invoke-WebRequest http://127.0.0.1:8000/api/scans` → StatusCode 200
- **Dashboard 200**: `Invoke-WebRequest http://localhost:5173/dashboard` → StatusCode 200
- **Smoke test**: PASSED (1 passed, 6 tabs: Ads, Politics, Patterns, Creators, Algorithm, Talk; 0 errors)
