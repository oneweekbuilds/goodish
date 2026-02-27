# Scan Accuracy Pipeline — Detailed Reference

This reference provides evaluation criteria and common failure modes for each layer of the classification pipeline.

## Layer 1 — Prompt Quality Evaluation Criteria

When reviewing or writing prompts sent to Google Flash, check for:

### Clarity
- Would a human reading this prompt know exactly what to do?
- Are instructions ordered logically (general rules first, then specifics)?
- Are there any contradictions between different parts of the prompt?

### Completeness
- Are all six dashboard categories addressed (Overview, Sources, Ads, Politics, Tone, Suggested vs Followed)?
- Does the prompt specify what fields to return for each post?
- Does the prompt define the expected response format?

### Edge Case Coverage
- Sponsored political content — how should this be classified?
- Content in other languages — should it be categorized or flagged?
- Memes with ambiguous tone — how is tone determined for visual content?
- Content that fits multiple categories — is there a priority order or multi-label support?
- Empty or malformed posts — how should these be handled?
- Reposts or shared content — does the classification apply to the original or the share context?

### Consistency
- Do the prompt instructions match the category definitions displayed on the dashboard?
- Does the prompt use the same terminology as the rest of the product?
- Are the category boundaries in the prompt identical to those in the parsing code?

### Common Prompt Failure Modes
- Relying on implied knowledge ("classify this appropriately" without defining what appropriate means)
- Missing output format specification (Google Flash guesses the format)
- Category definitions that overlap without a tiebreaker rule
- No instruction for handling posts that don't fit any category
- Prompt too long causing key instructions to be lost in the middle

## Layer 2 — Category Definition Standards

Each category definition should pass this test: if two reasonable people read the definition and independently classify the same 100 posts, they should agree on at least 90% of them.

### Per-Category Checklist

For each of the six dashboard tabs, the definition should specify:

1. **Inclusion criteria** — what content belongs here
2. **Exclusion criteria** — what content does NOT belong here, even if it seems like it might
3. **Boundary cases** — specific examples of content that sits on the line, with a ruling for each
4. **Multi-category handling** — what happens when a post qualifies for this category AND another

### Common Definition Failure Modes
- Definitions that use subjective language ("clearly political" — clear to whom?)
- Missing rules for multi-label content
- No definition for the "none of the above" case
- Definitions that depend on context not available in a feed snapshot (e.g., "content from political accounts" requires knowing account classification)

## Layer 3 — Response Parsing Checklist

When reviewing parsing code, verify:

### Field Handling
- Every expected response field is explicitly read
- Missing fields produce a clear error, not a silent default
- Extra unexpected fields are logged but do not crash the parser
- Field types are validated (string where string expected, array where array expected)

### Error Handling
- Malformed JSON produces a clear error message
- Partial responses (some posts classified, others not) are handled gracefully
- API timeout or network error produces a retry or clear failure
- Rate limiting responses are detected and handled

### Schema Matching
- The parsing code expects exactly the fields and structure that the prompt asks Google Flash to produce
- If the prompt changes, the parsing code is updated to match
- There is no drift between what the prompt requests and what the parser expects

### Common Parsing Failure Modes
- Silently defaulting null fields to a category (miscounts in dashboard)
- Assuming array order matches input order without verification
- Not handling the case where Google Flash returns fewer results than posts sent
- String matching on category names that doesn't account for capitalization or whitespace variations

## Layer 4 — Determinism Checklist

### API Configuration
- Temperature setting: should be 0 or as low as possible for classification tasks
- Structured output / JSON mode: should be enabled if available
- Seed parameter: should be set if the API supports it
- Model version: should be pinned, not "latest"

### Consistency Strategies
- If determinism cannot be guaranteed, consider: running the same input twice and comparing, using majority-vote across multiple calls, or flagging low-confidence classifications for review
- Log any cases where re-processing the same input produces different results

### Common Determinism Failure Modes
- Temperature set to default (usually > 0) instead of 0
- Using "latest" model version that changes without notice
- No mechanism to detect or handle inconsistent classifications
- Relying on free-text responses instead of structured output

## Layer 5 — Data Coverage Tracing

### Pipeline Checkpoints
Trace a hypothetical post through every stage and verify counts match:

1. **Extension capture** — how many posts were captured in the snapshot?
2. **Data sent to API** — how many posts were included in the API request? (Do they match step 1?)
3. **API response** — how many posts were classified in the response? (Does it match step 2?)
4. **Parsing output** — how many posts survived parsing into structured data? (Does it match step 3?)
5. **Dashboard display** — how many posts are represented in the final dashboard? (Does it match step 4?)

At each transition, check: is there a count or reconciliation mechanism? If counts don't match, is there a log or error?

### Common Data Loss Points
- Posts too large for API request size limits get silently dropped
- Batch processing splits posts across requests and loses some in transit
- Parsing skips posts with unexpected formats instead of flagging them
- Dashboard aggregation rounds or truncates in ways that lose individual posts
- Posts captured during API errors are never retried
