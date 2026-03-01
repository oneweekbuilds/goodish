# AlgorithmLens Mobile Parity — Consolidated Cowork Prompts

Reference audit: `MOBILE_PARITY_AUDIT.md`

---

## PROMPT A: Remove AI Consent Gate + Fix Politics & Tone Tabs

### Context
The mobile app currently gates the Politics and Tone dashboard tabs behind an AI consent toggle in Settings. When disabled (or by default for new users), both tabs show full-screen "Coming in a future update" placeholders with zero charts. The main website has NO such gate — it always runs AI analysis and renders charts immediately, showing graceful per-section empty states only when insufficient data exists.

**Product decision:** AI analysis is not optional. Users agree to it by using the product. The consent toggle and gate must be removed entirely. A subtle disclosure line replaces it for transparency.

### Files to Modify

**1. `/mobile/app/(tabs)/dashboard.tsx`**

In the TABS constant (~line 57), remove `needsAi: true` from the Politics and Tone entries (or remove the `needsAi` property entirely from all tabs since it's no longer used):
```
const TABS = [
  { id: 'overview', label: 'Overview', accent: 'tourOverview' },
  { id: 'sources', label: 'Who Shapes Your Feed', accent: 'tourSources' },
  { id: 'ads', label: 'Ads & Promotions', accent: 'tourAds' },
  { id: 'politics', label: 'Political Exposure', accent: 'tourPolitics' },
  { id: 'tone', label: 'Emotional Tone', accent: 'tourTone' },
  { id: 'suggested_vs_followed', label: 'Suggested vs. Followed', accent: 'tourSuggested' },
];
```

Remove the `aiConsent` variable (~line 2245):
```
// DELETE: const aiConsent = userProfile?.ai_analysis_consent === true;
```

In **PoliticsContent** (~line 1301–1567):
- Remove the `if (!aiConsent)` check and `AiConsentCard` rendering (~lines 1318–1322)
- Remove the `AiProcessingCard` "Coming in a future update" placeholder
- Instead, keep the full tab structure and use per-section empty states when data is missing. The website pattern for Politics is:
  - If `politicalPostsCount === 0`: Show `"Political exposure was light in this scan. Scan more content to see a full breakdown."` in a rounded card
  - If political posts < 10 for specific sections (top source, ideology): Show `"Not enough political posts yet to show this breakdown."` per-section
- Add a subtle "Analyzed by Google Gemini" disclosure line below the InsightHero. Style it as a small, muted text with an AI sparkle icon (use Sparkles from lucide-react-native, size 12, in slate-400). Example text: `"Political classification by Google Gemini AI · Your data is not used to train models"`

In **ToneContent** (~line 1569–1879):
- Same pattern: Remove `if (!aiConsent)` check and `AiConsentCard`
- Remove `AiProcessingCard` placeholder
- Keep full tab structure with per-section empty states:
  - If no tone data at all: `"Tone analysis needs more data. Try scanning again to see emotional patterns."`
  - If < 10 posts with known valence for specific comparisons: `"Not enough posts in both groups to compare tone yet."`
- Add same "Analyzed by Google Gemini" disclosure line below InsightHero

**2. `/mobile/app/(tabs)/settings.tsx`**

Remove the entire "AI Analysis" settings section (~lines 404-425):
- Remove the `aiConsent` state variable
- Remove the Switch component for "Enable AI analysis"
- Remove the descriptive text about Google Gemini under the toggle
- Replace with a static informational section (no toggle):
  ```
  AI ANALYSIS
  AlgorithmLens uses Google Gemini to analyze political content and
  emotional tone in your feed. Your data is not used to train AI models.
  ```
  This keeps users informed without giving them an opt-out that breaks the product.

**3. Remove unused components**

- The `AiConsentCard` inline component (~line 2003–2033 in dashboard.tsx) can be deleted
- The `AiProcessingCard` inline component (~line 2041+ in dashboard.tsx) can be deleted
- Remove any imports for these if they exist as separate files

**4. Backend / scan pipeline check**

Verify that the scan pipeline in `/mobile/src/` does NOT check `ai_analysis_consent` before sending data to Gemini. If there's a conditional like `if (aiConsent) { callGemini() }`, remove the condition so Gemini analysis always runs. Check files like:
- `src/lib/scanProcessor.ts` or similar
- `src/services/gemini.ts` or similar
- Any scan-related hooks

### Per-Section Empty State Design

Use this consistent pattern for empty states across both Politics and Tone tabs (matching the website's style):
```tsx
<View style={{
  backgroundColor: '#FAFBFE',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(37, 99, 235, 0.06)',
  padding: 24,
  alignItems: 'center',
}}>
  <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
    {contextual message}
  </Text>
</View>
```

### Quality Checks
- Both Politics and Tone tabs should render their full section structure immediately (no full-tab blockers)
- Sections with insufficient data show individual empty state messages
- "Analyzed by Google Gemini" text is visible but subtle on both tabs
- Settings no longer has an AI toggle
- Scanning still sends data to Gemini without any consent check
- Existing charts (tone distribution, ideology breakdown, etc.) still render correctly when data exists

---

## PROMPT B: Overview Tab — Full Free Feature Parity

### Context
The Overview tab is missing 4 free features that the website has. The mobile already has: InsightHero, BigNumber + supporting metrics, Content Types stacked bar, time estimate cards, and Ideas to Explore. The website additionally shows: Content Patterns Observed (6-card grid), Feed Summary (5 bullets), AI-made Content Analysis, and How the Feedback Loop Works.

Reference: Website implementation in `/src/pages/dashboard/tabs/OverviewTab.jsx`

### Files to Modify

**1. `/mobile/app/(tabs)/dashboard.tsx` — OverviewContent section (~lines 80–556)**

Add these 4 sections in this order, placed AFTER the existing "Explore Your Data" accordion and BEFORE "Ideas to Explore":

#### Section 1: Content Patterns Observed (6-card grid)

Add a new collapsible/accordion section titled **"Content Patterns"** with a 2-column grid of 6 small insight cards. Each card has a label and a computed value:

1. **Top interests** — Show top 2-3 topics from `dashData.contentTypes` (e.g., "Music, Comedy, Tech"). If no topic data, show "Varied content"
2. **Emotional signal** — Based on tone: if `dashData.toneAnalysis?.positivePct > 50` → "Mostly positive"; if `negativePct > 30` → "Notable negativity"; else → "Balanced"
3. **Political exposure** — Based on `dashData.politicalAnalysis?.politicalPct`: > 15% → "Moderate exposure"; > 30% → "High exposure"; else → "Light exposure"
4. **Content style** — Based on `dashData.suggestedPct`: > 60% → "Discovery-driven"; < 30% → "Following-driven"; else → "Balanced"
5. **Source diversity** — Based on `dashData.top5Pct`: > 60% → "Concentrated"; < 40% → "Diverse"; else → "Moderate"
6. **Commercial presence** — Based on `dashData.adPct`: > 15% → "Noticeable ads"; > 25% → "Ad-heavy"; else → "Light ads"

Design each card as a compact rounded rectangle (like the website's pattern cards):
```tsx
<View style={{
  backgroundColor: '#F8FAFC',
  borderRadius: 10,
  padding: 12,
  flex: 1,
  minWidth: '47%',
}}>
  <Text style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 2 }}>
    {label}
  </Text>
  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
    {value}
  </Text>
</View>
```

Wrap all 6 in a `flexWrap: 'wrap'` row with `gap: 8`.

#### Section 2: Feed Summary

Add a section titled **"Feed Summary"** below Content Patterns. Render 5 concise bullet-point lines summarizing the scan:

1. `"Your top 5 sources made up {top5Pct}% of posts"`
2. `"Ad content was {adPct}% of your feed"` (or `"No ad content was detected"` if 0)
3. `"Suggested content made up {suggestedPct}% of your feed"` (only if data available)
4. `"Political content was {politicalPct}% of posts"` (only if > 0%)
5. `"This scan included {totalPosts} posts from {platform}"`

Style as a simple list with small blue bullet dots (6px circles) and 14px text. This can go inside a collapsible accordion or always-visible, matching the existing section style.

#### Section 3: AI-Made Content Analysis

Add a section titled **"AI-Made Content"** that shows what percentage of visual content shows signs of being AI-generated.

**Data computation needed:** In `computeDashboardData.ts`, add a new computation that counts posts where `ai_disclosure === 'LABELED_AI'` vs total posts with visual content. If the `ai_disclosure` field exists on FeedItem, compute:
- `aiLabeledCount` — posts flagged as AI-made
- `aiLabeledPct` — percentage
- `noSignalsCount` — posts with no AI signals

If the field doesn't exist yet in the scan pipeline, show a simplified version: an informational card explaining "AI content detection will be available in a future scan update" — but check the FeedItem interface first, because `ai_disclosure` IS defined in `types/index.ts` line ~127.

Render as an ALStackedBar with 2-3 segments:
- "AI-labeled" (amber/orange color)
- "No strong AI signals" (slate/gray color)

Below the bar, add a text line: `"About {pct}% of visual content shows signs of being AI-made"` or `"Very little content shows strong signs of being AI-made"` if < 5%.

#### Section 4: How the Feedback Loop Works

Add an educational section titled **"How the Feedback Loop Works"** as a collapsible accordion (collapsed by default). Contains 4 numbered step cards:

1. **Your behavior** — "What you pause on, like, share, and skip sends signals to the platform"
2. **Patterns accumulate** — "Over time, recurring topics and content types form observable patterns in your feed"
3. **Content is tailored** — "Your feed composition reflects what has appeared — we cannot know why specific content was selected"
4. **Your media diet evolves** — "Each interaction reinforces or shifts the cycle. Small changes can move the needle"

Design each step as a horizontal row: blue circle with number (1-4) on the left, title bold + description regular below, separated by 12px gap. Light background card wrapping all 4.

**2. `/mobile/src/lib/computeDashboardData.ts`**

Add the following new computed fields to the return object:

```typescript
// AI content analysis
aiContentAnalysis: {
  labeledCount: number;
  noSignalsCount: number;
  labeledPct: number;
  totalVisualPosts: number;
} | null;
```

Compute by filtering feedItems where `content_type` includes visual types (video, image, photo, reel, short) and checking `ai_disclosure` field.

### Quality Checks
- All 4 new sections render with real data from a scan
- Content Patterns grid is 2 columns on all screen sizes
- Feed Summary bullets use actual computed data
- AI-Made Content section handles missing `ai_disclosure` gracefully
- Feedback Loop section is collapsed by default and expandable
- Existing Overview sections (BigNumber, metrics, Content Types bar, time estimates) are unchanged
- Scroll performance is smooth — no jank from added sections

---

## PROMPT C: Ads Tab + Suggested Tab — Free Feature Parity

### Context
These two tabs have the largest feature gaps. The Ads tab is missing 3 analysis sections and needs its composition bar updated. The Suggested tab is missing 4 entire analysis sections. Both tabs need similar comparison-style visualizations.

Reference: Website implementations in `/src/pages/dashboard/tabs/AdsTab.jsx` and `/src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`

### Files to Modify

**1. `/mobile/src/lib/computeDashboardData.ts`** — Add new computed fields

Add these new fields to the DashboardData interface and compute them:

```typescript
// For Ads tab
unlabeledPromos: {
  count: number;
  percentage: number;
  topTriggers: { name: string; count: number }[];
  exampleAccounts: string[];
} | null;

topAdvertisedProductTypes: {
  theme: string;
  percentage: number;
  count: number;
  exampleAdvertisers: string[];
}[];

toneBySelling: {
  selling: { positivePct: number; neutralPct: number; negativePct: number; total: number };
  notSelling: { positivePct: number; neutralPct: number; negativePct: number; total: number };
  biggestDifference: string | null;
} | null;

// For Suggested tab
byPlatform: {
  platform: string;
  followedCount: number;
  followedPct: number;
  suggestedCount: number;
  suggestedPct: number;
}[] | null;  // null if single-platform

commercialComparison: {
  suggested: { adPct: number; total: number };
  followed: { adPct: number; total: number };
  biggestDifference: string | null;
} | null;

topTopicsBySuggested: { topic: string; count: number; percentage: number }[];
topTopicsByFollowed: { topic: string; count: number; percentage: number }[];

contentFormatComparison: {
  format: string;
  suggestedPct: number;
  followedPct: number;
  delta: number;
}[];
```

**Computing these fields:**

- **unlabeledPromos**: Check FeedItem for `influenceSignals` array. If the field exists, posts with influence signals but `is_ad === false` are unlabeled promos. Count them, extract top trigger names, and list example account handles. If `influenceSignals` doesn't exist in the scan data, set to `null`.

- **topAdvertisedProductTypes**: Group ad posts by `topics?.primary_category` or `ad_metadata?.product_or_service`. If neither field has data, set to empty array.

- **toneBySelling**: Split posts into "selling" (`is_ad === true` OR has influence signals) and "not selling". For each group, compute positive/neutral/negative percentages from `emotions.valence`. Require >= 10 posts per group. Compute delta: find the biggest percentage point difference between the two groups.

- **byPlatform**: This matters if there are multiple scans across different platforms. Group scans by `platform` field, compute suggested/followed counts per platform. Return `null` if only one platform.

- **commercialComparison**: Split posts by `source_origin` (suggested vs followed), compute ad percentage for each group.

- **topTopicsBySuggested / topTopicsByFollowed**: Split posts by source_origin, extract topics from `topics.primary_category` or `hashtags`, count frequencies, return top 5 each. If no topic data, return empty arrays.

- **contentFormatComparison**: Split posts by source_origin, group by `content_type`, compute percentage for each format in each group, calculate delta (suggested % - followed %).

**2. `/mobile/app/(tabs)/dashboard.tsx` — AdsContent section (~lines 782–1006)**

#### Fix: Update Ad Composition bar to 3 segments
Currently shows 2 segments (Sponsored/Non-sponsored). Update to 3 segments matching the website:
- "Not ads" (blue) — posts that are neither labeled ads nor unlabeled promos
- "Labeled ads" (lighter blue) — `is_ad === true`
- "Unlabeled promos" (amber) — posts with influence signals but not labeled as ads

Only show 3 segments if `unlabeledPromos` data is available; otherwise keep the current 2-segment version.

#### Add: Top Advertised Product Types
Below the existing "Top Advertised Companies" collapsible section, add a new collapsible section **"Top Product Types"**. Render as a list or simple table:
```
Theme            % of ads    Count
Electronics      35%         7
Fashion          20%         4
...
```

Use the same styling as the Top Advertised Companies list. Show top 5 product types. Only render if `topAdvertisedProductTypes` array is non-empty.

#### Add: Unlabeled Promotional Content
Add a new section **"Unlabeled Promotions"** after Top Product Types. Design:
- BigNumber card showing the unlabeled promo percentage
- Below: "Top triggers" — small pill/tag list of influence signal names with counts
- Below: "Example accounts" — list of handles

Only render if `unlabeledPromos` is not null and count > 0. If the data isn't available (influence signals not in scan pipeline yet), show nothing — don't show an empty state for this one.

#### Add: Tone Split — Selling vs Not Selling
Add a section **"Tone: Selling vs Not Selling"** at the bottom (before any locked/Plus sections). Create a reusable `ToneComparisonCard` component that shows:
- Two side-by-side ALStackedBar charts (one for each group)
- Labels: "Selling posts" and "Non-selling posts"
- Below each bar: denominator line (e.g., "42 selling posts with known tone")
- Below both: delta insight text (e.g., "Biggest difference: Selling posts are +12 points more negative")

Only render if `toneBySelling` is not null (both groups have >= 10 posts).

**3. `/mobile/app/(tabs)/dashboard.tsx` — SuggestedContent section (~lines 1008–1295)**

#### Add: By Platform Breakdown
After the Content Origin bar section, add **"By Platform"** section (only renders if `byPlatform` is not null, meaning multi-platform data exists). For each platform, show:
- Platform name (bold)
- ALStackedBar with Following/Suggested segments
- Text below: "Followed: X (X%) · Suggested: X (X%)"

#### Add: Commercial Content Comparison
After "Are These New Voices?" section, add **"Commercial Content: Suggested vs Followed"**. Use the same `ToneComparisonCard` pattern (created for Ads tab) but with ad percentage data:
- Two side-by-side ALStackedBars: Suggested posts ad % vs Followed posts ad %
- Delta insight text

Only render if `commercialComparison` is not null.

#### Add: Top Topics in Suggested Content
Add **"Top Topics"** section with a two-column layout:
- Left column: "In Suggested" — top 5 topics with horizontal bars
- Right column: "In Followed" — top 5 topics with horizontal bars

Each topic row: topic name, horizontal bar (proportional width), percentage text. Only render if either topics array is non-empty.

#### Add: Content Format Preferences
Add **"Content Formats"** section showing a comparison table:
```
Format        Suggested    Followed    Difference
Video         45%          30%         +15
Photo         20%          40%         -20
...
```

Render as a scrollable list of rows. Color the delta: amber/orange for positive (suggested-heavy), blue for negative (followed-heavy). Only render if `contentFormatComparison` array is non-empty.

### Create: Reusable ToneComparisonCard Component

**New file: `/mobile/src/components/dashboard/ToneComparisonCard.tsx`**

This component is used in Ads tab (Tone Split) and Suggested tab (Commercial Comparison), and will also be used in Prompt D for the Tone tab comparisons. Props:
```typescript
interface ToneComparisonCardProps {
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftSegments: ALStackedBarSegment[];
  rightSegments: ALStackedBarSegment[];
  leftDenominator: string;
  rightDenominator: string;
  deltaInsight: string | null;
}
```

### Quality Checks
- Ad Composition bar correctly shows 3 segments when unlabeled promo data exists
- All new Ads tab sections only render when data is available (no empty sections)
- All new Suggested tab sections only render when data is available
- ToneComparisonCard renders cleanly at mobile widths (stacks vertically if needed)
- Scroll performance remains smooth with added sections
- Existing sections in both tabs remain unchanged
- Delta insight text uses hedging language per epistemic restraint rules (e.g., "This pattern may suggest..." not "The algorithm does...")

---

## PROMPT D: Tone Tab Comparisons + Plus Features + Polish

### Context
This is the final prompt. It adds the 2 missing tone cross-comparisons, all Plus-tier features (Brands & Influencers, teasers), and minor polish items (footers, denominator lines).

Reference: Website implementations in `/src/pages/dashboard/tabs/ToneTab.jsx` and `/src/pages/dashboard/tabs/OverviewTab.jsx`

### Files to Modify

**1. `/mobile/src/lib/computeDashboardData.ts`** — Add tone comparison fields

```typescript
toneByPolitical: {
  political: { positivePct: number; neutralPct: number; negativePct: number; total: number };
  nonPolitical: { positivePct: number; neutralPct: number; negativePct: number; total: number };
  biggestDifference: string | null;
} | null;
```

Compute by splitting posts into political (`political.is_political === true`) and non-political groups, then computing tone distribution for each. Require >= 10 posts per group. `toneBySelling` should already exist from Prompt C.

Also add for the Brands & Influencers Plus feature:
```typescript
brandsAndInfluencers: {
  topBrands: { handle: string; postCount: number; adCount: number }[];
  topInfluencers: { handle: string; postCount: number; adCount: number }[];
} | null;
```

Compute: Brand accounts = creators where `adCount / postCount >= 0.5` AND `adCount >= 2`. Influencers = creators where `postCount >= 3` AND `adCount / postCount < 0.5`. Return top 3 each.

**2. `/mobile/app/(tabs)/dashboard.tsx` — ToneContent section**

#### Add: Tone — Political vs Non-Political
After the existing "Deeper Analysis" collapsible (which contains Top Sources by Tone + Suggested vs Followed comparison), add a new section **"Tone: Political vs Non-Political"**.

Use the `ToneComparisonCard` component (created in Prompt C):
- Left: "Political posts" — tone bar for political content
- Right: "Non-political posts" — tone bar for non-political content
- Delta insight: e.g., "Political posts appear +8 points more negative"
- Only render if `toneByPolitical` is not null

#### Add: Tone — Selling vs Not Selling
Same pattern, section **"Tone: Selling vs Not Selling"**:
- Left: "Selling posts"
- Right: "Non-selling posts"
- Uses `toneBySelling` from computeDashboardData
- Only render if data available

Both new sections go inside the "Deeper Analysis" collapsible, after the existing Suggested vs Followed comparison.

**3. `/mobile/app/(tabs)/dashboard.tsx` — OverviewContent section — Brands & Influencers (PLUS)**

Add a new section **"Brands & Influencers"** after the Feed Summary section (added in Prompt B). This section is **Plus-only**.

Use the `LockedOverlayCard` component (already exists at `/src/components/plan/LockedOverlayCard.tsx`) to gate it:

```tsx
<LockedOverlayCard
  locked={!isPlus}
  title="Brands & Influencers"
  description="See which accounts are brand-driven vs. organic influencers"
>
  {/* Plus content: two lists */}
  <View>
    <Text style={styles.subheading}>Top Brands</Text>
    {brandsAndInfluencers.topBrands.map(brand => (
      <BrandRow handle={brand.handle} posts={brand.postCount} ads={brand.adCount} />
    ))}
    <Text style={styles.subheading}>Top Influencers</Text>
    {brandsAndInfluencers.topInfluencers.map(inf => (
      <BrandRow handle={inf.handle} posts={inf.postCount} ads={inf.adCount} />
    ))}
  </View>
</LockedOverlayCard>
```

Only render if `brandsAndInfluencers` has data. The website shows top 3 each.

**4. All Tabs — Add Plus Teasers**

At the bottom of each tab's content (Sources, Ads, Politics, Tone, Suggested), add two teaser cards for free users. These match the website's `EvidenceBundleTeaser` and `FreeAskTeaser` pattern.

Create two small reusable components:

**`/mobile/src/components/plan/EvidenceBundleTeaser.tsx`**
```typescript
interface EvidenceBundleTeaserProps {
  text: string;  // Tab-specific description
  onUpgrade: () => void;
}
```
Design: A card with blurred/frosted background, Sparkles icon, the description text, and a "Learn about Plus →" link. Shown only if `!isPlus`.

Tab-specific text:
- Sources: "Plus provides detailed creator analysis and source diversity tracking"
- Ads: "Plus analyzes which advertisers appeared most and how ad patterns change"
- Politics: "Plus breaks down political content patterns across your scans"
- Tone: "Plus explains emotional patterns and how they shift over time"
- Suggested: "Plus analyzes the balance between content you chose and platform suggestions"

**`/mobile/src/components/plan/FreeAskTeaser.tsx`**
```typescript
interface FreeAskTeaserProps {
  exampleQuestion: string;
  onUpgrade: () => void;
}
```
Design: A card with MessageCircleQuestion icon, showing an example question. Only if `!isPlus`.

Tab-specific example questions:
- Sources: "Which creators dominate my feed the most?"
- Ads: "Why am I seeing so many ads from the same companies?"
- Politics: "How much of my feed contains political content compared to other categories?"
- Tone: "What is the overall emotional tone of my feed and how does it break down?"
- Suggested: "How much of my feed was content I chose to follow versus suggestions?"

**5. All Tabs — Add Footer Context**

At the very bottom of each tab, add a small footer line showing scan context (matching the website's `MasterNumbersLine`):

```tsx
<View style={{ paddingVertical: 16, alignItems: 'center' }}>
  <Text style={{ fontSize: 12, color: colors.textTertiary }}>
    Based on {totalPosts} posts · {platform} · Scanned {formatDate(scan.created_at)}
  </Text>
</View>
```

This is a simple addition — just a single `<Text>` line at the bottom of each tab's ScrollView content.

**6. Sources Tab — Top 5 vs Top 10 distinction**

In the SourcesContent Top Creators ALBarChart, currently shows top 8. Update:
- Free users: Show top 5 creators
- Plus users: Show top 10 creators
- Add a subtle "See all 10 with Plus" note below the chart for free users

### Quality Checks
- Tone cross-comparisons render correctly with real data
- ToneComparisonCard is being reused across Ads, Tone, and Suggested tabs consistently
- Brands & Influencers section properly gated with LockedOverlayCard
- EvidenceBundleTeaser and FreeAskTeaser appear only for free users
- Footer context line shows correct data on all 6 tabs
- Plus teasers navigate to the upgrade/paywall flow when tapped
- All new sections follow existing app styling (colors, spacing, typography from theme)
- No regressions in existing functionality
- Scroll depth has increased — verify performance is still smooth on older devices
- All text follows epistemic restraint guidelines: describe patterns, use hedging language, never anthropomorphize the algorithm

---

## Execution Notes

**Order:** A → B → C → D (each builds on the previous)

**Prompt A** unblocks the AI tabs — must go first.
**Prompt B** is self-contained (Overview only).
**Prompt C** creates `ToneComparisonCard` and adds data computation fields needed by both Ads/Suggested tabs AND Prompt D's Tone comparisons.
**Prompt D** depends on `ToneComparisonCard` from Prompt C and adds remaining Plus features.

**Data pipeline note:** Some website features depend on data fields that may not exist in the mobile scan pipeline yet (like `influenceSignals` for unlabeled promos, `product_or_service` for product types, or robust `topics.primary_category`). Each prompt instructs the implementer to check whether the raw data field exists and gracefully skip the section if it doesn't. The UI should never show empty sections — only render when data is available.
