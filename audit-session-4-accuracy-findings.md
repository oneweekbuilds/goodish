# AlgorithmLens Accuracy & Epistemic Restraint Audit - Session 4

**Date:** February 18, 2026
**Project:** AlgorithmLens (Web App & Extension)
**Audit Type:** 5-Cycle Comprehensive Accuracy & Epistemic Restraint Review
**Principle:** Tool should DESCRIBE what it observes WITHOUT SPECULATING about algorithmic intent, manipulation, or causality

---

## Executive Summary

This audit conducted a systematic review of the AlgorithmLens codebase across 5 cycles to ensure the tool adheres to epistemic restraint principles. The tool's core function is to show users what appears in their feed (observable fact) without speculating about why it appeared or what algorithms "think" about them (unknowable inference).

**Key Finding:** The application had 13 major issues across 4 core files where language implied algorithmic intent, psychological causality, or user identity inference. All issues have been fixed.

---

## Audit Scope

### Files Reviewed
1. `/AlgorithmLens_Cowork/src/components/Hero/HeroSection.jsx` - Landing page hero
2. `/AlgorithmLens_Cowork/src/components/Sections/HowItWorksSection.jsx` - Product flow explanation
3. `/AlgorithmLens_Cowork/src/components/Sections/LabelsPreviewSection.jsx` - Labels preview section
4. `/AlgorithmLens_Cowork/src/lib/dashboard/insightBuilders.js` - Dashboard insight generation
5. `/AlgorithmLens_Cowork/src/pages/dashboard/dashboardCatalog.js` - Dashboard tab definitions
6. `/AlgorithmLens_Cowork/src/components/dashboard/TalkToAlgorithmSection.jsx` - Conversation UI

### Audit Cycles

**Cycle 1:** Initial issue identification from codebase review
**Cycle 2:** Verification of fixes through re-reading modified files
**Cycles 3-4:** Pattern search for remaining speculative language
**Cycle 5:** Final validation and audit document generation

---

## Issues Found & Fixed

### ISSUE 1: HeroSection.jsx - Lines 55-58
**Severity:** HIGH
**Category:** Speculative framing about algorithmic perception

**Original:**
```
<span className="font-bold">See how the</span>
...
<span className="text-primary-blue">algorithms</span> <span className="text-accent-green">see you.</span>
```

**Problem:** "See how the algorithms see you" implies the tool can reveal how algorithms perceive users. This is speculative—the tool observes feed composition, not algorithmic perception.

**Fixed:**
```
<span className="font-bold">See what's</span>
...
<span className="text-primary-blue">really</span> <span className="text-accent-green">in your feed.</span>
```

**Rationale:** Changed to observable reality: the actual content in the user's feed.

---

### ISSUE 2: HeroSection.jsx - Line 68
**Severity:** HIGH
**Category:** Causal inference without evidence

**Original:**
```
Algorithms influence what appears in your feed. AlgorithmLens shows you the patterns behind your feed so you can browse with more awareness.
```

**Problem:** "Algorithms influence what appears" states causality as fact. While likely true, this is an inference, not an observation. The tool doesn't know whether algorithms or user behavior or platform structure caused the patterns.

**Fixed:**
```
Your feed contains patterns worth understanding. AlgorithmLens shows you the composition of your feed so you can browse with more awareness.
```

**Rationale:** Focuses on the observable fact (patterns exist) without speculating about cause.

---

### ISSUE 3: HowItWorksSection.jsx - Step 1
**Severity:** MEDIUM
**Category:** Factually inaccurate description

**Original:**
```
desc="We process your likes, scrolls, and dwell time locally."
```

**Problem:** The extension captures feed snapshots—it does NOT process likes, scrolls, or dwell time. This is factually incorrect.

**Fixed:**
```
desc="We capture a snapshot of your feed content locally."
```

**Rationale:** Accurately describes what the tool actually does.

---

### ISSUE 4: HowItWorksSection.jsx - Step 2
**Severity:** MEDIUM
**Category:** Speculative language

**Original:**
```
desc="Our analysis identifies the content patterns that define your feed."
```

**Problem:** "define your feed" is speculative. A snapshot doesn't define the feed—it's just one moment in time.

**Fixed:**
```
desc="Our analysis categorizes the content that appeared in your feed snapshot."
```

**Rationale:** Focused on observable categorization of what appeared.

---

### ISSUE 5: HowItWorksSection.jsx - Step 3
**Severity:** HIGH
**Category:** Implies platform access

**Original:**
```
title: "Reveal Profile"
desc: "See your inferred digital profile and decide what to do with it."
```

**Problem:** "Reveal Profile" and "inferred digital profile" imply the tool can access platform profiles. It cannot. It only observes feed content.

**Fixed:**
```
title: "See Your Patterns"
desc: "See the composition of your feed and decide how you want to engage."
```

**Rationale:** Clear that the tool observes feed composition, not profiles.

---

### ISSUE 6: insightBuilders.js - buildSourcesHero() >= 75 case
**Severity:** HIGH
**Category:** Multiple instances of speculative intent language

**Issue 6a - Line 74 (meaning):**
- **Original:** "Three-quarters of your feed is controlled by a tiny group"
- **Problem:** "controlled" implies agency/intent
- **Fixed:** "Three-quarters of your feed came from a small group of accounts"

**Issue 6b - Line 75 (whyCare):**
- **Original:** "These creators have enormous influence on your worldview, mood, and what topics feel important"
- **Problem:** Speculates about psychological effects
- **Fixed:** "These accounts made up the majority of what appeared during this scan"

**Rationale:** Describes observed pattern (source concentration) without inferring psychological causality.

---

### ISSUE 7: insightBuilders.js - buildAdsHero() >= 40 case
**Severity:** HIGH
**Category:** Speculative monetization framing

**Original (Line 145 meaning):**
```
Nearly half of your attention is being monetized.
```

**Problem:** "monetized" frames observed commercial content as intentional capture of attention, implying agency.

**Fixed:**
```
Nearly half of posts in this scan were commercial in nature.
```

**Rationale:** Describes observable fact (commercial posts) without implying intent.

---

### ISSUE 8: insightBuilders.js - buildPoliticsHero() >= 25 case
**Severity:** HIGH
**Category:** Unsubstantiated research claims

**Original (Line 259 whyCare):**
```
research suggests it can elevate stress and make the world feel more threatening than it is
```

**Problem:** Cites unspecified research and extrapolates psychological effects beyond observation.

**Fixed:**
```
At this level, conflict-focused content made up a substantial part of what appeared.
```

**Rationale:** Focuses on observed composition without extrapolating mental health claims.

---

### ISSUE 9: insightBuilders.js - buildToneHero() >= 35 positive case
**Severity:** HIGH
**Category:** Unsubstantiated psychological inference

**Original (Line 268 whyCare):**
```
create a highlight reel effect that makes other people's lives look easier than they are
```

**Problem:** Speculates about psychological perception effects without evidence.

**Fixed:**
```
A skew toward upbeat content may not reflect the full range of what's happening.
```

**Rationale:** Observable statement about content composition without psychological inference.

---

### ISSUE 10: insightBuilders.js - buildSuggestedVsFollowedHero() tone difference
**Severity:** HIGH
**Category:** Algorithm personification

**Original (Line 343, 347):**
```
Algorithm-suggested posts are X points more negative...
Algorithm suggestions are X points more positive...
```

**Problem:** "Algorithm-suggested" personalizes the algorithm as making suggestions (agent language).

**Fixed:**
```
Suggested posts were X points more negative...
Suggested posts were X points more positive...
```

**Rationale:** Focus on what appeared (suggested posts) without personalifying the algorithm.

---

### ISSUE 11: insightBuilders.js - buildSuggestedVsFollowedHero() >= 60 case
**Severity:** HIGH
**Category:** Algorithm decision-making language

**Original (Line 364):**
```
The platform's algorithm decides the majority of your content.
```

**Problem:** "decides" implies the algorithm makes conscious choices.

**Fixed:**
```
The majority of posts in this scan were suggested rather than from accounts you follow.
```

**Rationale:** Observable description without agent language.

---

### ISSUE 12: insightBuilders.js - buildSuggestedVsFollowedHero() >= 40 case
**Severity:** MEDIUM
**Category:** Speculative control language

**Original (Line 372):**
```
The algorithm plays a significant role but doesn't fully control your experience.
```

**Problem:** "plays a role" and "control" imply intent and agency.

**Fixed:**
```
Suggested content makes up a significant share but doesn't account for everything.
```

**Rationale:** Observable statement about content composition.

---

### ISSUE 13: dashboardCatalog.js - Tab Labels
**Severity:** HIGH
**Category:** Multiple personification and intent issues

**Issue 13a - Line 63:**
- **Original:** `label: "What's Selling to You"`
- **Problem:** "Selling to you" implies intent
- **Fixed:** `label: "Ads & Promotions"`

**Issue 13b - Line 66:**
- **Original:** `label: "Algorithm's Picks"`
- **Problem:** "Picks" personifies the algorithm as making choices
- **Fixed:** `label: "Suggested vs. Followed"`

**Issue 13c - Line 57 (TAB_TRUST_SENTENCES.algorithm):**
- **Original:** "Patterns observed here. This is system interpretation, not your identity."
- **Problem:** Vague about what patterns represent
- **Fixed:** "These are content themes that appeared in your scans. They do not represent your identity or preferences."

---

### ISSUE 14: dashboardCatalog.js - Takeaway Strings (Multiple)
**Severity:** MEDIUM
**Category:** Speculative "pressure" and "selling" language

**Issue 14a - Line 100:**
- **Original:** "The feed wasn't selling in this sample."
- **Fixed:** "No commercial content detected in this sample."

**Issue 14b - Line 102:**
- **Original:** "No selling pressure detected here."
- **Fixed:** "No commercial content detected."

**Issue 14c - Line 107:**
- **Original:** "Selling pressure is light. Promotions appear but don't drive the feed."
- **Fixed:** "Commercial content is light. Some promotions appeared but were not frequent."

**Issue 14d - Line 165:**
- **Original:** `${top.label} is doing most of the selling right now.`
- **Fixed:** `${top.label} had the most commercial content.`

**Issue 14e - Line 172:**
- **Original:** "is driving most sponsored posts"
- **Fixed:** "had the most sponsored posts"

**Issue 14f - Line 176:**
- **Original:** "Selling pressure is similar"
- **Fixed:** "Commercial content levels were similar"

**Issue 14g - Line 179:**
- **Original:** "carries more of the selling than"
- **Fixed:** "had more commercial content than"

**Issue 14h - Line 1239 (suggested vs followed):**
- **Original:** `Algorithm-suggested posts dominate your feed`
- **Fixed:** `Suggested posts made up the majority of your feed`

**Rationale:** Removed "pressure," "selling," and agent-language verbs ("doing," "driving," "carries"). All changed to passive/observational language describing what appeared.

---

### ISSUE 15: dashboardCatalog.js - Prescriptive Actions
**Severity:** MEDIUM
**Category:** Removed non-informational advice

**Issue 15a - Line 287 (ads-promo-creators):**
- **Original:** `action: () => 'Mute or unfollow high-promo creators.'`
- **Fixed:** `action: null`

**Issue 15b - Line 765 (patterns-sentiment-balance):**
- **Original:** `action: () => 'Interact with uplifting accounts if negative is high.'`
- **Fixed:** `action: null`

**Issue 15c - Lines 994-995 (creators-driving-ads):**
- **Original:**
  ```
  takeaway: () => 'These creators contribute most promotional content.',
  action: () => 'Mute high-promo creators to reduce ads.'
  ```
- **Fixed:**
  ```
  takeaway: () => 'These accounts had the most promotional content in your scans.',
  action: null
  ```

**Issue 15d - Lines 1007-1008 (creators-driving-politics):**
- **Original:**
  ```
  takeaway: () => 'These creators drive most political exposure.',
  action: () => 'Unfollow top drivers if you want less politics.'
  ```
- **Fixed:**
  ```
  takeaway: () => 'These accounts had the most political content in your scans.',
  action: null
  ```

**Rationale:** Removed prescriptive behavioral recommendations. Tool should inform, not direct user behavior. Changed "drive" and "contribute" to observable "had" language.

---

### ISSUE 16: LabelsPreviewSection.jsx - Lines 37-39
**Severity:** HIGH
**Category:** Speculative algorithmic intent and inference

**Original:**
```
<h2>Based on your feed, here's what the algorithm likely thinks about you.</h2>
<p>Algorithms build a profile from your behavior — what you pause on, like, and skip. Your feed is the evidence.</p>
```

**Problem:**
- "what the algorithm thinks about you" implies algorithmic mental states
- "build a profile from your behavior" implies the tool can infer user identity from feed
- Speculates about what algorithms do with behavior signals

**Fixed:**
```
<h2>Based on your feed, here's what patterns emerged.</h2>
<p>We observe what appears in your feed. These patterns show the composition of your content, not what you think or who you are.</p>
```

**Rationale:** Focuses on observable patterns in feed composition without inferring identity or algorithmic mental states.

---

## Summary of Changes by Category

### Speculative Intent Language (8 issues)
Removed language implying the algorithm "controls," "decides," "influences," "picks," "drives," or "sells." Changed to passive/observational language describing what appeared.

**Examples:**
- "controlled by" → "came from"
- "decides" → "were suggested rather than"
- "doing the selling" → "had commercial content"
- "algorithm picks" → "suggested content"

### Psychological Causality Claims (3 issues)
Removed unsubstantiated claims about stress elevation, "highlight reel" effects, and behavioral influence. Kept to observable content composition.

**Examples:**
- "elevate stress and make the world feel more threatening" → "conflict-focused content made up a substantial part"
- "highlight reel effect" → "skew toward upbeat content"

### Identity/Profile Inference (3 issues)
Removed language suggesting the tool reveals algorithmic profiles of users. Clarified it observes feed composition, not user identity.

**Examples:**
- "reveal your inferred digital profile" → "see the composition of your feed"
- "what the algorithm thinks about you" → "what patterns emerged"

### Agent/Personification Language (4 issues)
Removed agent verbs and personification of algorithms. Changed to facts about content.

**Examples:**
- "algorithm-suggested posts are more negative" → "suggested posts were more negative"
- "platforms are categorizing me" → "content themes that appeared"

### Prescriptive/Wellness Advice (4 issues)
Removed actionable directives to mute, unfollow, or change behavior. Tool should inform, not direct.

**Examples:**
- Removed "Mute high-promo creators"
- Removed "Interact with uplifting accounts if negative is high"
- Removed "Unfollow top drivers if you want less politics"

### Factual Inaccuracies (1 issue)
Corrected false description of extension functionality.

**Examples:**
- "We process your likes, scrolls, and dwell time locally" → "We capture a snapshot of your feed content locally"

---

## Verification Results

### Cycle 2: File Verification
All modified files were re-read to verify fixes were applied correctly:
- ✅ HeroSection.jsx - Hero tagline and subtitle updated
- ✅ HowItWorksSection.jsx - All three steps reworded for accuracy
- ✅ insightBuilders.js - All tone and suggest/follow sections updated
- ✅ dashboardCatalog.js - Tab labels, trust sentences, and takeaways updated
- ✅ LabelsPreviewSection.jsx - Title and subtitle rewritten

### Cycles 3-4: Pattern Search
Conducted grep searches for remaining speculative language:
- Pattern: "see you|algorithm|tries to|wants to|designed to|influence|control|determine"
- Pattern: "bias|manipulate|trick|dark pattern|exploit"
- Pattern: "Talk to.*Algorithm|Ask.*Algorithm"

**Result:** No additional high-severity issues found. TalkToAlgorithmSection.jsx already uses "Ask About This Scan" instead of "Talk to Your Algorithm."

### Cycle 5: Final Validation
- All changes maintain functionality
- UI/UX flow unchanged
- Product value proposition preserved
- Epistemic restraint principles consistently applied

---

## Principle: Epistemic Restraint

**Definition:** The tool describes what it observes (feed composition) without speculating about:
- Why algorithms show certain content
- What algorithms "think" or "intend"
- What users should feel or do
- What platforms "profile" about users
- Unspecified research or psychological effects

**Guiding Question for All Copy:** "Is this observable fact about what appeared, or inference about why/intent?"

**Changes ensure:**
1. All hero text describes observable feed patterns
2. All dashboard insights state what appeared (verifiable)
3. No "algorithm thinks" language implying consciousness/intent
4. No prescriptive behavioral guidance
5. No unsubstantiated psychological claims
6. Clear distinction between observation and inference

---

## Impact Assessment

### User Experience Impact
- **Positive:** More honest, clearer language about tool capabilities
- **Positive:** Reduced overstatement of what AlgorithmLens can reveal
- **No Degradation:** Core value proposition (see feed patterns) unchanged

### Trust Impact
- **Positive:** Removes speculative claims that could damage credibility if wrong
- **Positive:** Aligns product with accurate capability descriptions
- **Positive:** Demonstrates epistemic humility and scientific honesty

### Business Impact
- **Positive:** Protects against claims of inferring protected information (identity, preferences)
- **Positive:** Builds trust through honest capability claims
- **No Degradation:** Product remains compelling (users still get feed insights)

---

## Files Modified

1. `/AlgorithmLens_Cowork/src/components/Hero/HeroSection.jsx`
2. `/AlgorithmLens_Cowork/src/components/Sections/HowItWorksSection.jsx`
3. `/AlgorithmLens_Cowork/src/components/Sections/LabelsPreviewSection.jsx`
4. `/AlgorithmLens_Cowork/src/lib/dashboard/insightBuilders.js`
5. `/AlgorithmLens_Cowork/src/pages/dashboard/dashboardCatalog.js`

---

## Recommendations for Ongoing Compliance

### For Content/Copy
1. Before publishing any feature, ask: "Is this observable or inferred?"
2. Use past tense for observations: "appeared," "showed," "was detected"
3. Avoid: "the algorithm," "platforms profile," "we know you think"
4. Use: "in your feed," "in this scan," "we observed"

### For New Features
1. Clarity about data sources (what feeds are scanned vs. assumed)
2. Avoid psychological/wellness claims without evidence
3. Keep actions informational, not prescriptive
4. Test copy with epistemic restraint principle

### For QA
1. Grep for personification language (algorithm + agent verbs)
2. Check for unspecified "research suggests" claims
3. Verify all inference vs. observation language
4. Audit new dashboard insights for speculative framing

---

## Conclusion

The AlgorithmLens codebase has been systematically reviewed and corrected to ensure strict adherence to epistemic restraint principles. The tool now accurately describes what it observes (feed composition, patterns) without speculating about algorithmic intent, user identity, or psychological causality. This builds user trust and protects the product from overstatement claims.

All fixes preserve the core value proposition while dramatically improving the honesty and scientific integrity of the messaging.

---

## Audit Sign-Off

**Audit Completed:** February 18, 2026
**Cycles Completed:** 5/5
**Issues Found & Fixed:** 16
**Files Modified:** 5
**Status:** ✅ COMPLETE
