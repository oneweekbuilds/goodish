# Epistemic Restraint Language Guide — Complete Reference

## Philosophy

AlgorithmLens occupies a deliberate position between two extremes. Some narratives exaggerate algorithmic manipulation. Others deny structural influence entirely. AlgorithmLens avoids both. It measures and describes observable feed composition. It never speculates about platform intent.

This is not a limitation — it is the product's core value proposition. Credibility depends on restraint.

## Complete Banned Word/Phrase List

### Accusatory Language
- manipulate, manipulation, manipulative, manipulated
- trick, tricked, tricking, trickery
- brainwash, brainwashed, brainwashing
- exploit, exploitation, exploitative, exploited
- propaganda, propagandistic
- deceive, deception, deceptive
- coerce, coercion
- indoctrinate, indoctrination
- radicalize, radicalization
- gaslight, gaslighting

### Intent-Implying Language
- "pushed on you" / "pushed at you"
- "forced on you" / "forced into your feed"
- "targeting you" / "targeted at you"
- "designed to make you"
- "the algorithm wants" / "the algorithm is trying to"
- "the platform wants you to"
- "meant to keep you"
- "engineered to"
- "optimized to make you"
- "secretly" / "hidden agenda" / "behind the scenes"

### Sensational Framing
- "alarming" / "shocking" / "disturbing"
- "exposed" / "revealed" / "uncovered"
- "the truth about your feed"
- "what they don't want you to know"
- "wake up call"
- "eye-opening"

## Replacement Patterns

| Instead of... | Use... |
|--------------|--------|
| "The algorithm is pushing X on you" | "X appeared in N% of your feed" |
| "You're being targeted with ads" | "Sponsored content made up N% of posts" |
| "The platform is hiding content" | "Content from accounts you follow made up N% of your feed" |
| "Your feed is manipulated" | "Your feed snapshot contained N categories of content" |
| "Alarming amount of political content" | "Political content appeared in N% of posts" |
| "The algorithm exposed you to" | "Your feed contained" |
| "You were shown" (implies passive victimhood) | "Your feed included" or "N posts were categorized as" |
| "They are flooding your feed" | "This category represented the largest share at N%" |

## Edge Cases

### When users ask "why" questions
Users may ask "Why is my feed showing me so much political content?" Claude should redirect to observable data: "Your snapshot shows political content in 12% of posts. AlgorithmLens documents what appeared but doesn't claim to know why specific content was shown. The Sources tab can show you which accounts contributed that content."

### When data seems surprising
Even if 90% of a feed is suggested content, describe it neutrally: "Suggested content — posts from accounts you don't follow — made up 90% of this snapshot." Do not editorialize with "a staggering 90%" or "an overwhelming majority."

### Comparative language
Comparisons between snapshots are acceptable if factual: "Suggested content increased from 62% to 74% between your two most recent snapshots." Do not add interpretation like "your feed is getting worse."

### Category disclaimers
Every category should acknowledge its limits. Example tooltip: "Posts are categorized as political based on observable signals such as mentions of elected officials, government institutions, legislation, or civic events. This categorization is approximate and may not capture all political content or may include content that some users would not consider political."

## Testing Checklist for Copy Review

For every piece of user-facing text, verify:

1. Does it describe what appeared (observable) or why it appeared (speculative)?
2. Does it contain any banned words or phrases?
3. Does it imply the platform had a specific intent?
4. Does it tell the user how to feel about their data?
5. Would a reasonable person read it as an accusation against the platform?
6. Is the tone calm and informational, or is it alarming or sensational?

If any answer suggests a violation, flag it and propose a replacement.
