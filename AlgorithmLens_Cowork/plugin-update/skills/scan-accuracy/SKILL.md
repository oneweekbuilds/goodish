---
name: scan-accuracy
description: >
  This skill should be used when working on "scan accuracy", "classification",
  "Google Flash", "Gemini", "API prompts", "feed analysis", "category definitions",
  "response parsing", "pipeline accuracy", "misclassification", "scan quality",
  or any work involving the accuracy of the AI classification pipeline that
  populates the six dashboard tabs in AlgorithmLens.
version: 0.1.0
---

# Scan Accuracy Standards for AlgorithmLens

AlgorithmLens sends captured feed data to the Google Gemini Flash API for classification. The AI processes raw feed snapshots and returns structured categorizations that populate the six dashboard tabs (Overview, Sources, Ads, Politics, Tone, Suggested vs Followed).

Accuracy of this classification pipeline is critical to the product's credibility. If the scan misclassifies content, the entire dashboard becomes misleading, which directly undermines the epistemic integrity the product is built on.

## The Five Layers of Accuracy

The accuracy pipeline has multiple layers where errors can occur. Claude should understand all of them when working on any part of the scan pipeline.

### Layer 1 — Prompt Quality

The instructions sent to Google Flash telling it how to categorize content.

- Ambiguous prompts produce inconsistent classifications
- Prompts that lack edge case handling will misclassify borderline content
- Prompts that don't define categories precisely will produce overlap (e.g., a sponsored political post could be classified as an ad, as political content, or as both — the prompt needs to specify how to handle this)
- Claude should evaluate prompts for clarity, completeness, edge case coverage, and consistency with the category definitions used in the dashboard

### Layer 2 — Category Definitions

The rules that determine what counts as "political," what counts as an "ad," what counts as "suggested vs. followed," and how tone is categorized.

- Definitions must be precise enough that two reasonable people reading them would classify the same post the same way
- Gray areas must be explicitly addressed rather than left to the AI's interpretation
- Claude should stress-test category definitions by generating hypothetical edge cases and checking whether the definitions handle them unambiguously

### Layer 3 — Response Parsing

The code that receives Google Flash's response and converts it into structured data for the dashboard.

- Parsing bugs can misread valid responses, drop data, mismap categories, or fail silently on unexpected response formats
- Claude should check that every expected response field is handled
- Unexpected formats should produce clear errors rather than silent failures
- The parsing logic must match the exact response schema Google Flash is expected to return

### Layer 4 — Determinism and Reproducibility

The same feed content processed twice should produce the same classification.

- If Google Flash returns different results for identical inputs, the system should have strategies to handle this (such as temperature settings, structured output schemas, or consensus mechanisms)
- Claude should check whether the API calls are configured to maximize consistency

### Layer 5 — Data Loss and Coverage

Content from the feed snapshot might be lost or skipped during processing.

- Posts might be captured by the extension but not sent to the API
- The API might process some posts but not others
- The parsing might drop valid results
- Claude should trace the full pipeline to ensure that every captured post is accounted for in the final dashboard output
- Flag any points where data could silently disappear

## Privacy Constraint

Claude should never process, view, or store actual user feed data. All accuracy improvements must happen at the system level — improving prompts, tightening definitions, fixing parsing logic, and hardening the pipeline. Testing should use synthetic or hypothetical examples, never real user data.

## Detailed Reference

For the complete pipeline layer breakdown with evaluation criteria and common failure modes, read `references/pipeline-layers.md`.
