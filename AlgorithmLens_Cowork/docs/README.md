# AlgorithmLens Documentation

This directory contains governing documents for AlgorithmLens analysis accuracy and compliance.

---

## Documents

| Document | Purpose |
|----------|---------|
| [accuracy_contract.md](./accuracy_contract.md) | Defines rules for all analysis text, charts, and Talk feature |

---

## Compliance Requirements

**All analysis and "Talk to Your Algorithm" responses MUST comply with the Accuracy Contract.**

This includes:
- Dashboard plain-English analysis text
- All chart labels, tooltips, and captions
- KPI tile descriptions and explanations
- Insight cards and pattern descriptions
- "Talk to Your Algorithm" responses
- Any other user-facing text derived from scan data

### Non-Compliance

Text that violates the Accuracy Contract:
1. Must not be shown to users
2. Must be logged for review
3. Must be corrected before deployment

---

## Developer Note: Evidence Bundle Requirement

> **CRITICAL REQUIREMENT**
>
> All analysis text and "Talk to Your Algorithm" responses **MUST be generated only from the backend evidence bundle**.
>
> **Never generate analysis directly from raw feed text.**

### Why This Matters

1. **Accuracy:** The evidence bundle contains pre-processed, validated data with confidence scores and quality flags.

2. **Consistency:** All analysis references the same structured data, ensuring consistent claims across features.

3. **Auditability:** Evidence bundle fields can be cited and traced, making claims verifiable.

4. **Safety:** Raw feed text may contain content that shouldn't influence analysis (spam, harmful content, etc.). The evidence bundle provides a sanitized view.

### Implementation Pattern

```typescript
// WRONG - Never do this
function generateAnalysis(rawPosts: RawPost[]) {
  // Directly analyzing raw text - FORBIDDEN
  const politicalPosts = rawPosts.filter(p => p.text.includes('politics'));
  return `You seem interested in politics...`;
}

// CORRECT - Always do this
function generateAnalysis(evidenceBundle: EvidenceBundle) {
  // Using pre-processed evidence bundle fields
  const politicalCount = evidenceBundle.topicCounts.political;
  const total = evidenceBundle.totalPosts;

  if (total < 10) {
    return "Insufficient data for analysis.";
  }

  return `In this scan, political content appeared ${politicalCount} times ` +
         `out of ${total} posts (based on topicCounts.political: ${politicalCount}).`;
}
```

### Evidence Bundle Fields

The backend evidence bundle provides these fields for analysis:

- `scanId` - Unique scan identifier
- `timestamp` - Scan capture time
- `duration` - Scan duration in seconds
- `totalPosts` - Total posts captured
- `topicCounts` - Pre-classified topic frequencies
- `sentimentDistribution` - Sentiment analysis results
- `uniqueSources` - Source diversity count
- `engagementMetrics` - Aggregated engagement data
- `classificationConfidence` - Per-classification confidence scores
- `qualityFlags` - Data quality indicators

### Quality Flag Handling

Before generating any analysis, check quality flags:

```typescript
function canGenerateAnalysis(bundle: EvidenceBundle): boolean {
  if (bundle.totalPosts < 10) return false;
  if (bundle.qualityFlags.includes('CLASSIFICATION_FAILURE')) return false;
  if (bundle.qualityFlags.includes('INSUFFICIENT_SAMPLE')) return false;
  return true;
}
```

---

## Review Process

1. All new analysis text must be reviewed against the Accuracy Contract before merge
2. Automated tests should verify language compliance where possible
3. User-reported accuracy issues should reference specific contract sections

---

## Questions?

If you're unsure whether text complies with the Accuracy Contract:
1. Check the specific section in [accuracy_contract.md](./accuracy_contract.md)
2. When in doubt, use more cautious language
3. Ask for review before shipping

**Core principle: "These insights show patterns in what you're shown, not who you are."**
