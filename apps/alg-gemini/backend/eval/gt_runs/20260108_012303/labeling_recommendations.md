# Ground Truth Labeling Recommendations

**Run:** 20260108_012303
**Generated:** 25 recommendations

## Summary Table

| Scan ID | Tab | Claim Status | Evidence Count | Recommended Correct | Recommended Abstain |
|---------|-----|-------------|----------------|---------------------|---------------------|
| desktop-176721609337... | ads | FINAL | 3 | yes | no |
| desktop-176721609337... | politics | FINAL | 2 | unsure | maybe |
| desktop-176721609337... | patterns | FINAL | 2 | unsure | no |
| desktop-176721609337... | creators | FINAL | 82 | yes | no |
| desktop-176721609337... | inferences | FINAL | 6 | unsure | no |
| desktop-176721342120... | ads | FINAL | 32 | yes | no |
| desktop-176721342120... | politics | PRELIMINARY | 1 | unsure | unsure |
| desktop-176721342120... | patterns | ABSTAIN | 0 | unsure | yes |
| desktop-176721342120... | creators | FINAL | 62 | yes | no |
| desktop-176721342120... | inferences | FINAL | 4 | unsure | no |
| desktop-176721379589... | ads | FINAL | 30 | yes | no |
| desktop-176721379589... | politics | PRELIMINARY | 1 | unsure | unsure |
| desktop-176721379589... | patterns | ABSTAIN | 0 | unsure | yes |
| desktop-176721379589... | creators | FINAL | 58 | yes | no |
| desktop-176721379589... | inferences | FINAL | 4 | unsure | no |
| desktop-176728214372... | ads | FINAL | 1 | yes | no |
| desktop-176728214372... | politics | ABSTAIN | 0 | unsure | yes |
| desktop-176728214372... | patterns | ABSTAIN | 0 | unsure | yes |
| desktop-176728214372... | creators | FINAL | 56 | yes | no |
| desktop-176728214372... | inferences | PRELIMINARY | 1 | unsure | unsure |
| desktop-176721473227... | ads | FINAL | 1 | yes | no |
| desktop-176721473227... | politics | ABSTAIN | 0 | unsure | yes |
| desktop-176721473227... | patterns | ABSTAIN | 0 | unsure | yes |
| desktop-176721473227... | creators | FINAL | 50 | yes | no |
| desktop-176721473227... | inferences | FINAL | 2 | unsure | maybe |

## Detailed Recommendations

### desktop-1767216093373-0dykcpc - ads

**Claim:** Ad rate: 4.9% (2 ads in 41 posts)
**Status:** FINAL
**Evidence IDs:** 3

**Evidence Details:**
- ev-ads-aggregate-adrate: aggregate_computation/None (BAYESIAN_BETA, reliability: 0.9)
- ev-ads-platform-000: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-001: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)

**Limitations:** Sample of 41 posts from a single scan session. 1 items had ambiguous commercial signals and were excluded from metrics.

**Recommendation:**
- `is_main_claim_correct`: **yes**
- `should_have_abstained`: **no**
- **Justification:** Ads tab with 3 evidence items. Platform labels are highly reliable. Claim likely correct unless evidence chain is broken.

---

### desktop-1767216093373-0dykcpc - politics

**Claim:** Political or news keywords detected in this scan.
**Status:** FINAL
**Evidence IDs:** 2

**Evidence Details:**
- pol-kw-006: news_keyword/news (KEYWORD_MATCH, reliability: 0.7)
- pol-kw-034: news_keyword/news (KEYWORD_MATCH, reliability: 0.7)

**Limitations:** Important: This analysis cannot determine political bias, your beliefs, or why content was shown to you. Only keyword presence is measured.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **maybe**
- **Justification:** Claim mentions 'political' but only news keywords found (2 items). May be technically correct but wording could be misleading.

---

### desktop-1767216093373-0dykcpc - patterns

**Claim:** Creators repeated across the scan.
**Status:** FINAL
**Evidence IDs:** 2

**Evidence Details:**
- pat-repetition-Steven: creator_repetition/Steven (HEURISTIC_RULE, reliability: 0.65)
- pat-repetition-Marshall: creator_repetition/Marshall (HEURISTIC_RULE, reliability: 0.65)

**Limitations:** Patterns in a single scan may not reflect long-term feed behavior.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **no**
- **Justification:** Patterns tab with 2 evidence items. Claim may be correct but human review needed to verify pattern strength.

---

### desktop-1767216093373-0dykcpc - creators

**Claim:** Creators identified in this scan.
**Status:** FINAL
**Evidence IDs:** 82

**Evidence Details:**
- creator-corbin: creator_handle/corbin (account_metadata, reliability: 0.75)
- creator-corbin-observed: observed_content/corbin (HEURISTIC_RULE, reliability: 0.65)
- creator-NFL: creator_handle/NFL (account_metadata, reliability: 0.75)
- creator-NFL-observed: observed_content/NFL (HEURISTIC_RULE, reliability: 0.65)
- creator-Paul Mit: creator_handle/Paul Mit (account_metadata, reliability: 0.75)
- creator-Paul Mit-observed: observed_content/Paul Mit (HEURISTIC_RULE, reliability: 0.65)
- creator-Vadim: creator_handle/Vadim (account_metadata, reliability: 0.75)
- creator-Vadim-observed: observed_content/Vadim (HEURISTIC_RULE, reliability: 0.65)
- creator-Aryan: creator_handle/Aryan (account_metadata, reliability: 0.75)
- creator-Aryan-observed: observed_content/Aryan (HEURISTIC_RULE, reliability: 0.65)
- creator-Lovable: creator_handle/Lovable (account_metadata, reliability: 0.75)
- creator-Lovable-observed: observed_content/Lovable (HEURISTIC_RULE, reliability: 0.65)
- creator-FOX One: creator_handle/FOX One (account_metadata, reliability: 0.75)
- creator-FOX One-observed: observed_content/FOX One (HEURISTIC_RULE, reliability: 0.65)
- creator-Peter Yang: creator_handle/Peter Yang (account_metadata, reliability: 0.75)
- creator-Peter Yang-observed: observed_content/Peter Yang (HEURISTIC_RULE, reliability: 0.65)
- creator-Ｓａｇｅ: creator_handle/Ｓａｇｅ (account_metadata, reliability: 0.75)
- creator-Ｓａｇｅ-observed: observed_content/Ｓａｇｅ (HEURISTIC_RULE, reliability: 0.65)
- creator-Alex Finn: creator_handle/Alex Finn (account_metadata, reliability: 0.75)
- creator-Alex Finn-observed: observed_content/Alex Finn (HEURISTIC_RULE, reliability: 0.65)
- creator-Ado: creator_handle/Ado (account_metadata, reliability: 0.75)
- creator-Ado-observed: observed_content/Ado (HEURISTIC_RULE, reliability: 0.65)
- creator-Stijn Noorman: creator_handle/Stijn Noorman (account_metadata, reliability: 0.75)
- creator-Stijn Noorman-observed: observed_content/Stijn Noorman (HEURISTIC_RULE, reliability: 0.65)
- creator-Steven: creator_handle/Steven (account_metadata, reliability: 0.75)
- creator-Steven-observed: observed_content/Steven (HEURISTIC_RULE, reliability: 0.65)
- creator-Elon Musk: creator_handle/Elon Musk (account_metadata, reliability: 0.75)
- creator-Elon Musk-observed: observed_content/Elon Musk (HEURISTIC_RULE, reliability: 0.65)
- creator-Paulius: creator_handle/Paulius (account_metadata, reliability: 0.75)
- creator-Paulius-observed: observed_content/Paulius (HEURISTIC_RULE, reliability: 0.65)
- creator-Meta Alchemist: creator_handle/Meta Alchemist (account_metadata, reliability: 0.75)
- creator-Meta Alchemist-observed: observed_content/Meta Alchemist (HEURISTIC_RULE, reliability: 0.65)
- creator-Marshall: creator_handle/Marshall (account_metadata, reliability: 0.75)
- creator-Marshall-observed: observed_content/Marshall (HEURISTIC_RULE, reliability: 0.65)
- creator-Annu meena: creator_handle/Annu meena (account_metadata, reliability: 0.75)
- creator-Annu meena-observed: observed_content/Annu meena (HEURISTIC_RULE, reliability: 0.65)
- creator-Rubab Mentor: creator_handle/Rubab Mentor (account_metadata, reliability: 0.75)
- creator-Rubab Mentor-observed: observed_content/Rubab Mentor (HEURISTIC_RULE, reliability: 0.65)
- creator-Mike Scully: creator_handle/Mike Scully (account_metadata, reliability: 0.75)
- creator-Mike Scully-observed: observed_content/Mike Scully (HEURISTIC_RULE, reliability: 0.65)
- creator-rico: creator_handle/rico (account_metadata, reliability: 0.75)
- creator-rico-observed: observed_content/rico (HEURISTIC_RULE, reliability: 0.65)
- creator-shirish: creator_handle/shirish (account_metadata, reliability: 0.75)
- creator-shirish-observed: observed_content/shirish (HEURISTIC_RULE, reliability: 0.65)
- creator-Karthik: creator_handle/Karthik (account_metadata, reliability: 0.75)
- creator-Karthik-observed: observed_content/Karthik (HEURISTIC_RULE, reliability: 0.65)
- creator-Augustas: creator_handle/Augustas (account_metadata, reliability: 0.75)
- creator-Augustas-observed: observed_content/Augustas (HEURISTIC_RULE, reliability: 0.65)
- creator-Bindu Reddy: creator_handle/Bindu Reddy (account_metadata, reliability: 0.75)
- creator-Bindu Reddy-observed: observed_content/Bindu Reddy (HEURISTIC_RULE, reliability: 0.65)
- creator-Niklas: creator_handle/Niklas (account_metadata, reliability: 0.75)
- creator-Niklas-observed: observed_content/Niklas (HEURISTIC_RULE, reliability: 0.65)
- creator-GREG ISENBERG: creator_handle/GREG ISENBERG (account_metadata, reliability: 0.75)
- creator-GREG ISENBERG-observed: observed_content/GREG ISENBERG (HEURISTIC_RULE, reliability: 0.65)
- creator-Damian Player: creator_handle/Damian Player (account_metadata, reliability: 0.75)
- creator-Damian Player-observed: observed_content/Damian Player (HEURISTIC_RULE, reliability: 0.65)
- creator-Hayes: creator_handle/Hayes (account_metadata, reliability: 0.75)
- creator-Hayes-observed: observed_content/Hayes (HEURISTIC_RULE, reliability: 0.65)
- creator-Cloud AI: creator_handle/Cloud AI (account_metadata, reliability: 0.75)
- creator-Cloud AI-observed: observed_content/Cloud AI (HEURISTIC_RULE, reliability: 0.65)
- creator-Om Patel: creator_handle/Om Patel (account_metadata, reliability: 0.75)
- creator-Om Patel-observed: observed_content/Om Patel (HEURISTIC_RULE, reliability: 0.65)
- creator-Matteo Spada: creator_handle/Matteo Spada (account_metadata, reliability: 0.75)
- creator-Matteo Spada-observed: observed_content/Matteo Spada (HEURISTIC_RULE, reliability: 0.65)
- creator-Vitto Rivabella: creator_handle/Vitto Rivabella (account_metadata, reliability: 0.75)
- creator-Vitto Rivabella-observed: observed_content/Vitto Rivabella (HEURISTIC_RULE, reliability: 0.65)
- creator-Jacky Chou (buying online businesses up to $1m): creator_handle/Jacky Chou (buying online businesses up to $1m) (account_metadata, reliability: 0.75)
- creator-Jacky Chou (buying online businesses up to $1m)-observed: observed_content/Jacky Chou (buying online businesses up to $1m) (HEURISTIC_RULE, reliability: 0.65)
- creator-sui dev: creator_handle/sui dev (account_metadata, reliability: 0.75)
- creator-sui dev-observed: observed_content/sui dev (HEURISTIC_RULE, reliability: 0.65)
- creator-Marshall: creator_handle/Marshall (account_metadata, reliability: 0.75)
- creator-Marshall-observed: observed_content/Marshall (HEURISTIC_RULE, reliability: 0.65)
- creator-Steven: creator_handle/Steven (account_metadata, reliability: 0.75)
- creator-Steven-observed: observed_content/Steven (HEURISTIC_RULE, reliability: 0.65)
- creator-Ben Spak: creator_handle/Ben Spak (account_metadata, reliability: 0.75)
- creator-Ben Spak-observed: observed_content/Ben Spak (HEURISTIC_RULE, reliability: 0.65)
- creator-Maddie D. Reese: creator_handle/Maddie D. Reese (account_metadata, reliability: 0.75)
- creator-Maddie D. Reese-observed: observed_content/Maddie D. Reese (HEURISTIC_RULE, reliability: 0.65)
- creator-Chong-U: creator_handle/Chong-U (account_metadata, reliability: 0.75)
- creator-Chong-U-observed: observed_content/Chong-U (HEURISTIC_RULE, reliability: 0.65)
- creator-Min Choi: creator_handle/Min Choi (account_metadata, reliability: 0.75)
- creator-Min Choi-observed: observed_content/Min Choi (HEURISTIC_RULE, reliability: 0.65)

**Limitations:** Creator presence does not indicate your preferences, trust, or agreement with their content.

**Recommendation:**
- `is_main_claim_correct`: **yes**
- `should_have_abstained`: **no**
- **Justification:** Creators tab with 82 evidence items. High coverage suggests claim is correct.

---

### desktop-1767216093373-0dykcpc - inferences

**Claim:** High-confidence signals surfaced across tabs.
**Status:** FINAL
**Evidence IDs:** 6

**Evidence Details:**
- alg-inf-000: intent_signal/Dominant content type (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-001: intent_signal/Commercial content present (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-002: intent_signal/Brand presence in promotional content (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-003: intent_signal/News content present (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-004: intent_signal/Creator repetition pattern (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-005: intent_signal/Creators in ad content (CLASSIFIER_OUTPUT, reliability: 0.8)

**Limitations:** Important: These are signals present in the content, NOT inferences about you. We cannot determine why this content was shown or what targeting was used.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **no**
- **Justification:** Inferences tab with 6 evidence items. Claim may be correct but inference claims need careful human review.

---

### desktop-1767213421203-es5qrua - ads

**Claim:** Ad rate: 100.0% (31 ads in 31 posts)
**Status:** FINAL
**Evidence IDs:** 32

**Evidence Details:**
- ev-ads-aggregate-adrate: aggregate_computation/None (BAYESIAN_BETA, reliability: 0.9)
- ev-ads-platform-000: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-001: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-002: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-003: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-004: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-005: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-006: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-007: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-008: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-009: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-010: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-011: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-012: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-013: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-014: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-015: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-016: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-017: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-018: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-019: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-020: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-021: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-022: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-023: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-024: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-025: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-026: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-027: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-028: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-029: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-030: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)

**Limitations:** Sample of 31 posts from a single scan session.

**Recommendation:**
- `is_main_claim_correct`: **yes**
- `should_have_abstained`: **no**
- **Justification:** Ads tab with 32 evidence items. Platform labels are highly reliable. Claim likely correct unless evidence chain is broken.

---

### desktop-1767213421203-es5qrua - politics

**Claim:** Political or news keywords detected in this scan.
**Status:** PRELIMINARY
**Evidence IDs:** 1

**Evidence Details:**
- pol-kw-029: news_keyword/news (KEYWORD_MATCH, reliability: 0.7)

**Limitations:** Important: This analysis cannot determine political bias, your beliefs, or why content was shown to you. Only keyword presence is measured.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **unsure**
- **Justification:** PRELIMINARY status suggests thin evidence (1 items). Human review needed to verify if claim is correct and if PRELIMINARY was appropriate.

---

### desktop-1767213421203-es5qrua - patterns

**Claim:** Creators repeated across the scan.
**Status:** ABSTAIN
**Evidence IDs:** 0

**Limitations:** Patterns in a single scan may not reflect long-term feed behavior.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **yes**
- **Justification:** System correctly abstained (no evidence or insufficient signal).

---

### desktop-1767213421203-es5qrua - creators

**Claim:** Creators identified in this scan.
**Status:** FINAL
**Evidence IDs:** 62

**Evidence Details:**
- creator-Gusti Ayu: creator_handle/Gusti Ayu (account_metadata, reliability: 0.75)
- creator-Gusti Ayu-observed: observed_content/Gusti Ayu (HEURISTIC_RULE, reliability: 0.65)
- creator-NAD: creator_handle/NAD (account_metadata, reliability: 0.75)
- creator-NAD-observed: observed_content/NAD (HEURISTIC_RULE, reliability: 0.65)
- creator-Eric Djavid: creator_handle/Eric Djavid (account_metadata, reliability: 0.75)
- creator-Eric Djavid-observed: observed_content/Eric Djavid (HEURISTIC_RULE, reliability: 0.65)
- creator-Cole Jaczko: creator_handle/Cole Jaczko (account_metadata, reliability: 0.75)
- creator-Cole Jaczko-observed: observed_content/Cole Jaczko (HEURISTIC_RULE, reliability: 0.65)
- creator-cole: creator_handle/cole (account_metadata, reliability: 0.75)
- creator-cole-observed: observed_content/cole (HEURISTIC_RULE, reliability: 0.65)
- creator-Amjad Masad: creator_handle/Amjad Masad (account_metadata, reliability: 0.75)
- creator-Amjad Masad-observed: observed_content/Amjad Masad (HEURISTIC_RULE, reliability: 0.65)
- creator-Queen Primis: creator_handle/Queen Primis (account_metadata, reliability: 0.75)
- creator-Queen Primis-observed: observed_content/Queen Primis (HEURISTIC_RULE, reliability: 0.65)
- creator-𝐌𝐨𝐢𝐬é𝐬 𝐂𝐚𝐢𝐜𝐞𝐝𝐨: creator_handle/𝐌𝐨𝐢𝐬é𝐬 𝐂𝐚𝐢𝐜𝐞𝐝𝐨 (account_metadata, reliability: 0.75)
- creator-𝐌𝐨𝐢𝐬é𝐬 𝐂𝐚𝐢𝐜𝐞𝐝𝐨-observed: observed_content/𝐌𝐨𝐢𝐬é𝐬 𝐂𝐚𝐢𝐜𝐞𝐝𝐨 (HEURISTIC_RULE, reliability: 0.65)
- creator-Simone Canc: creator_handle/Simone Canc (account_metadata, reliability: 0.75)
- creator-Simone Canc-observed: observed_content/Simone Canc (HEURISTIC_RULE, reliability: 0.65)
- creator-Melvyn • Builder: creator_handle/Melvyn • Builder (account_metadata, reliability: 0.75)
- creator-Melvyn • Builder-observed: observed_content/Melvyn • Builder (HEURISTIC_RULE, reliability: 0.65)
- creator-Spencer Hakimian: creator_handle/Spencer Hakimian (account_metadata, reliability: 0.75)
- creator-Spencer Hakimian-observed: observed_content/Spencer Hakimian (HEURISTIC_RULE, reliability: 0.65)
- creator-Min Choi: creator_handle/Min Choi (account_metadata, reliability: 0.75)
- creator-Min Choi-observed: observed_content/Min Choi (HEURISTIC_RULE, reliability: 0.65)
- creator-Marvel Perfect Gifs & Clips: creator_handle/Marvel Perfect Gifs & Clips (account_metadata, reliability: 0.75)
- creator-Marvel Perfect Gifs & Clips-observed: observed_content/Marvel Perfect Gifs & Clips (HEURISTIC_RULE, reliability: 0.65)
- creator-Ernesto Lopez: creator_handle/Ernesto Lopez (account_metadata, reliability: 0.75)
- creator-Ernesto Lopez-observed: observed_content/Ernesto Lopez (HEURISTIC_RULE, reliability: 0.65)
- creator-Yu Lin: creator_handle/Yu Lin (account_metadata, reliability: 0.75)
- creator-Yu Lin-observed: observed_content/Yu Lin (HEURISTIC_RULE, reliability: 0.65)
- creator-Brian Roemmele: creator_handle/Brian Roemmele (account_metadata, reliability: 0.75)
- creator-Brian Roemmele-observed: observed_content/Brian Roemmele (HEURISTIC_RULE, reliability: 0.65)
- creator-Holly - I like tech: creator_handle/Holly - I like tech (account_metadata, reliability: 0.75)
- creator-Holly - I like tech-observed: observed_content/Holly - I like tech (HEURISTIC_RULE, reliability: 0.65)
- creator-Urvish: creator_handle/Urvish (account_metadata, reliability: 0.75)
- creator-Urvish-observed: observed_content/Urvish (HEURISTIC_RULE, reliability: 0.65)
- creator-corbin: creator_handle/corbin (account_metadata, reliability: 0.75)
- creator-corbin-observed: observed_content/corbin (HEURISTIC_RULE, reliability: 0.65)
- creator-The Startup Ideas Podcast (SIP): creator_handle/The Startup Ideas Podcast (SIP) (account_metadata, reliability: 0.75)
- creator-The Startup Ideas Podcast (SIP)-observed: observed_content/The Startup Ideas Podcast (SIP) (HEURISTIC_RULE, reliability: 0.65)
- creator-Financial Dystopia: creator_handle/Financial Dystopia (account_metadata, reliability: 0.75)
- creator-Financial Dystopia-observed: observed_content/Financial Dystopia (HEURISTIC_RULE, reliability: 0.65)
- creator-Aurelien: creator_handle/Aurelien (account_metadata, reliability: 0.75)
- creator-Aurelien-observed: observed_content/Aurelien (HEURISTIC_RULE, reliability: 0.65)
- creator-Mati Staniszewski: creator_handle/Mati Staniszewski (account_metadata, reliability: 0.75)
- creator-Mati Staniszewski-observed: observed_content/Mati Staniszewski (HEURISTIC_RULE, reliability: 0.65)
- creator-Massimo: creator_handle/Massimo (account_metadata, reliability: 0.75)
- creator-Massimo-observed: observed_content/Massimo (HEURISTIC_RULE, reliability: 0.65)
- creator-Kevin W.: creator_handle/Kevin W. (account_metadata, reliability: 0.75)
- creator-Kevin W.-observed: observed_content/Kevin W. (HEURISTIC_RULE, reliability: 0.65)
- creator-fabian: creator_handle/fabian (account_metadata, reliability: 0.75)
- creator-fabian-observed: observed_content/fabian (HEURISTIC_RULE, reliability: 0.65)
- creator-Paulius: creator_handle/Paulius (account_metadata, reliability: 0.75)
- creator-Paulius-observed: observed_content/Paulius (HEURISTIC_RULE, reliability: 0.65)
- creator-mitsuri: creator_handle/mitsuri (account_metadata, reliability: 0.75)
- creator-mitsuri-observed: observed_content/mitsuri (HEURISTIC_RULE, reliability: 0.65)
- creator-Earn Knowledge: creator_handle/Earn Knowledge (account_metadata, reliability: 0.75)
- creator-Earn Knowledge-observed: observed_content/Earn Knowledge (HEURISTIC_RULE, reliability: 0.65)
- creator-sui dev: creator_handle/sui dev (account_metadata, reliability: 0.75)
- creator-sui dev-observed: observed_content/sui dev (HEURISTIC_RULE, reliability: 0.65)
- creator-Nick Co: creator_handle/Nick Co (account_metadata, reliability: 0.75)
- creator-Nick Co-observed: observed_content/Nick Co (HEURISTIC_RULE, reliability: 0.65)

**Limitations:** Creator presence does not indicate your preferences, trust, or agreement with their content.

**Recommendation:**
- `is_main_claim_correct`: **yes**
- `should_have_abstained`: **no**
- **Justification:** Creators tab with 62 evidence items. High coverage suggests claim is correct.

---

### desktop-1767213421203-es5qrua - inferences

**Claim:** High-confidence signals surfaced across tabs.
**Status:** FINAL
**Evidence IDs:** 4

**Evidence Details:**
- alg-inf-000: intent_signal/Commercial content present (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-001: intent_signal/Dominant content type (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-002: intent_signal/Creators in ad content (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-003: intent_signal/Brand presence in promotional content (CLASSIFIER_OUTPUT, reliability: 0.8)

**Limitations:** Important: These are signals present in the content, NOT inferences about you. We cannot determine why this content was shown or what targeting was used.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **no**
- **Justification:** Inferences tab with 4 evidence items. Claim may be correct but inference claims need careful human review.

---

### desktop-1767213795895-7cvybej - ads

**Claim:** Ad rate: 100.0% (29 ads in 29 posts)
**Status:** FINAL
**Evidence IDs:** 30

**Evidence Details:**
- ev-ads-aggregate-adrate: aggregate_computation/None (BAYESIAN_BETA, reliability: 0.9)
- ev-ads-platform-000: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-001: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-002: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-003: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-004: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-005: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-006: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-007: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-008: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-009: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-010: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-011: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-012: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-013: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-014: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-015: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-016: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-017: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-018: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-019: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-020: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-021: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-022: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-023: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-024: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-025: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-026: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-027: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)
- ev-ads-platform-028: platform_labeled_ad/None (PLATFORM_LABEL, reliability: 0.999)

**Limitations:** Sample size of 29 posts. Single-item changes significantly affect percentages.

**Recommendation:**
- `is_main_claim_correct`: **yes**
- `should_have_abstained`: **no**
- **Justification:** Ads tab with 30 evidence items. Platform labels are highly reliable. Claim likely correct unless evidence chain is broken.

---

### desktop-1767213795895-7cvybej - politics

**Claim:** Political or news keywords detected in this scan.
**Status:** PRELIMINARY
**Evidence IDs:** 1

**Evidence Details:**
- pol-kw-026: news_keyword/news (KEYWORD_MATCH, reliability: 0.7)

**Limitations:** Important: This analysis cannot determine political bias, your beliefs, or why content was shown to you. Only keyword presence is measured.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **unsure**
- **Justification:** PRELIMINARY status suggests thin evidence (1 items). Human review needed to verify if claim is correct and if PRELIMINARY was appropriate.

---

### desktop-1767213795895-7cvybej - patterns

**Claim:** Creators repeated across the scan.
**Status:** ABSTAIN
**Evidence IDs:** 0

**Limitations:** Patterns in a single scan may not reflect long-term feed behavior.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **yes**
- **Justification:** System correctly abstained (no evidence or insufficient signal).

---

### desktop-1767213795895-7cvybej - creators

**Claim:** Creators identified in this scan.
**Status:** FINAL
**Evidence IDs:** 58

**Evidence Details:**
- creator-kelvin: creator_handle/kelvin (account_metadata, reliability: 0.75)
- creator-kelvin-observed: observed_content/kelvin (HEURISTIC_RULE, reliability: 0.65)
- creator-NFL: creator_handle/NFL (account_metadata, reliability: 0.75)
- creator-NFL-observed: observed_content/NFL (HEURISTIC_RULE, reliability: 0.65)
- creator-yoxic: creator_handle/yoxic (account_metadata, reliability: 0.75)
- creator-yoxic-observed: observed_content/yoxic (HEURISTIC_RULE, reliability: 0.65)
- creator-Massimo: creator_handle/Massimo (account_metadata, reliability: 0.75)
- creator-Massimo-observed: observed_content/Massimo (HEURISTIC_RULE, reliability: 0.65)
- creator-v!: creator_handle/v! (account_metadata, reliability: 0.75)
- creator-v!-observed: observed_content/v! (HEURISTIC_RULE, reliability: 0.65)
- creator-The Facts Dude: creator_handle/The Facts Dude (account_metadata, reliability: 0.75)
- creator-The Facts Dude-observed: observed_content/The Facts Dude (HEURISTIC_RULE, reliability: 0.65)
- creator-Jaytel: creator_handle/Jaytel (account_metadata, reliability: 0.75)
- creator-Jaytel-observed: observed_content/Jaytel (HEURISTIC_RULE, reliability: 0.65)
- creator-Làzaro: creator_handle/Làzaro (account_metadata, reliability: 0.75)
- creator-Làzaro-observed: observed_content/Làzaro (HEURISTIC_RULE, reliability: 0.65)
- creator-Alex Nguyen: creator_handle/Alex Nguyen (account_metadata, reliability: 0.75)
- creator-Alex Nguyen-observed: observed_content/Alex Nguyen (HEURISTIC_RULE, reliability: 0.65)
- creator-gemchanger: creator_handle/gemchanger (account_metadata, reliability: 0.75)
- creator-gemchanger-observed: observed_content/gemchanger (HEURISTIC_RULE, reliability: 0.65)
- creator-hungrybox: creator_handle/hungrybox (account_metadata, reliability: 0.75)
- creator-hungrybox-observed: observed_content/hungrybox (HEURISTIC_RULE, reliability: 0.65)
- creator-Hater Report: creator_handle/Hater Report (account_metadata, reliability: 0.75)
- creator-Hater Report-observed: observed_content/Hater Report (HEURISTIC_RULE, reliability: 0.65)
- creator-Gary Vaynerchuk: creator_handle/Gary Vaynerchuk (account_metadata, reliability: 0.75)
- creator-Gary Vaynerchuk-observed: observed_content/Gary Vaynerchuk (HEURISTIC_RULE, reliability: 0.65)
- creator-corbin: creator_handle/corbin (account_metadata, reliability: 0.75)
- creator-corbin-observed: observed_content/corbin (HEURISTIC_RULE, reliability: 0.65)
- creator-Dian Arifiyati Atmojo: creator_handle/Dian Arifiyati Atmojo (account_metadata, reliability: 0.75)
- creator-Dian Arifiyati Atmojo-observed: observed_content/Dian Arifiyati Atmojo (HEURISTIC_RULE, reliability: 0.65)
- creator-Justine Moore: creator_handle/Justine Moore (account_metadata, reliability: 0.75)
- creator-Justine Moore-observed: observed_content/Justine Moore (HEURISTIC_RULE, reliability: 0.65)
- creator-Simone Canc: creator_handle/Simone Canc (account_metadata, reliability: 0.75)
- creator-Simone Canc-observed: observed_content/Simone Canc (HEURISTIC_RULE, reliability: 0.65)
- creator-𝕐o̴g̴: creator_handle/𝕐o̴g̴ (account_metadata, reliability: 0.75)
- creator-𝕐o̴g̴-observed: observed_content/𝕐o̴g̴ (HEURISTIC_RULE, reliability: 0.65)
- creator-nikshep: creator_handle/nikshep (account_metadata, reliability: 0.75)
- creator-nikshep-observed: observed_content/nikshep (HEURISTIC_RULE, reliability: 0.65)
- creator-Joshua Park: creator_handle/Joshua Park (account_metadata, reliability: 0.75)
- creator-Joshua Park-observed: observed_content/Joshua Park (HEURISTIC_RULE, reliability: 0.65)
- creator-Pop Crave: creator_handle/Pop Crave (account_metadata, reliability: 0.75)
- creator-Pop Crave-observed: observed_content/Pop Crave (HEURISTIC_RULE, reliability: 0.65)
- creator-Junie Lau: creator_handle/Junie Lau (account_metadata, reliability: 0.75)
- creator-Junie Lau-observed: observed_content/Junie Lau (HEURISTIC_RULE, reliability: 0.65)
- creator-Max Woolf: creator_handle/Max Woolf (account_metadata, reliability: 0.75)
- creator-Max Woolf-observed: observed_content/Max Woolf (HEURISTIC_RULE, reliability: 0.65)
- creator-Alex Utopia: creator_handle/Alex Utopia (account_metadata, reliability: 0.75)
- creator-Alex Utopia-observed: observed_content/Alex Utopia (HEURISTIC_RULE, reliability: 0.65)
- creator-alifya rasya: creator_handle/alifya rasya (account_metadata, reliability: 0.75)
- creator-alifya rasya-observed: observed_content/alifya rasya (HEURISTIC_RULE, reliability: 0.65)
- creator-Jah Jiren: creator_handle/Jah Jiren (account_metadata, reliability: 0.75)
- creator-Jah Jiren-observed: observed_content/Jah Jiren (HEURISTIC_RULE, reliability: 0.65)
- creator-fthr: creator_handle/fthr (account_metadata, reliability: 0.75)
- creator-fthr-observed: observed_content/fthr (HEURISTIC_RULE, reliability: 0.65)
- creator-LovartAI: creator_handle/LovartAI (account_metadata, reliability: 0.75)
- creator-LovartAI-observed: observed_content/LovartAI (HEURISTIC_RULE, reliability: 0.65)
- creator-The Startup Ideas Podcast (SIP): creator_handle/The Startup Ideas Podcast (SIP) (account_metadata, reliability: 0.75)
- creator-The Startup Ideas Podcast (SIP)-observed: observed_content/The Startup Ideas Podcast (SIP) (HEURISTIC_RULE, reliability: 0.65)

**Limitations:** Creator presence does not indicate your preferences, trust, or agreement with their content.

**Recommendation:**
- `is_main_claim_correct`: **yes**
- `should_have_abstained`: **no**
- **Justification:** Creators tab with 58 evidence items. High coverage suggests claim is correct.

---

### desktop-1767213795895-7cvybej - inferences

**Claim:** High-confidence signals surfaced across tabs.
**Status:** FINAL
**Evidence IDs:** 4

**Evidence Details:**
- alg-inf-000: intent_signal/Commercial content present (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-001: intent_signal/Dominant content type (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-002: intent_signal/Creators in ad content (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-003: intent_signal/Brand presence in promotional content (CLASSIFIER_OUTPUT, reliability: 0.8)

**Limitations:** Important: These are signals present in the content, NOT inferences about you. We cannot determine why this content was shown or what targeting was used.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **no**
- **Justification:** Inferences tab with 4 evidence items. Claim may be correct but inference claims need careful human review.

---

### desktop-1767282143724-w7lwh78 - ads

**Claim:** Ad rate: 0.0% (0 ads in 28 posts)
**Status:** FINAL
**Evidence IDs:** 1

**Evidence Details:**
- ev-ads-aggregate-adrate: aggregate_computation/None (BAYESIAN_BETA, reliability: 0.9)

**Limitations:** Sample size of 28 posts. Single-item changes significantly affect percentages. 1 items had ambiguous commercial signals and were excluded from metrics.

**Recommendation:**
- `is_main_claim_correct`: **yes**
- `should_have_abstained`: **no**
- **Justification:** Ads tab with 1 evidence items. Platform labels are highly reliable. Claim likely correct unless evidence chain is broken.

---

### desktop-1767282143724-w7lwh78 - politics

**Claim:** Political or news keywords detected in this scan.
**Status:** ABSTAIN
**Evidence IDs:** 0

**Limitations:** Important: This analysis cannot determine political bias, your beliefs, or why content was shown to you. Only keyword presence is measured.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **yes**
- **Justification:** System correctly abstained (no evidence or insufficient signal).

---

### desktop-1767282143724-w7lwh78 - patterns

**Claim:** Creators repeated across the scan.
**Status:** ABSTAIN
**Evidence IDs:** 0

**Limitations:** Patterns in a single scan may not reflect long-term feed behavior.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **yes**
- **Justification:** System correctly abstained (no evidence or insufficient signal).

---

### desktop-1767282143724-w7lwh78 - creators

**Claim:** Creators identified in this scan.
**Status:** FINAL
**Evidence IDs:** 56

**Evidence Details:**
- creator-nader dabit: creator_handle/nader dabit (account_metadata, reliability: 0.75)
- creator-nader dabit-observed: observed_content/nader dabit (HEURISTIC_RULE, reliability: 0.65)
- creator-Rob Hallam: creator_handle/Rob Hallam (account_metadata, reliability: 0.75)
- creator-Rob Hallam-observed: observed_content/Rob Hallam (HEURISTIC_RULE, reliability: 0.65)
- creator-munch: creator_handle/munch (account_metadata, reliability: 0.75)
- creator-munch-observed: observed_content/munch (HEURISTIC_RULE, reliability: 0.65)
- creator-Pascal Bornet: creator_handle/Pascal Bornet (account_metadata, reliability: 0.75)
- creator-Pascal Bornet-observed: observed_content/Pascal Bornet (HEURISTIC_RULE, reliability: 0.65)
- creator-Viktor Oddy: creator_handle/Viktor Oddy (account_metadata, reliability: 0.75)
- creator-Viktor Oddy-observed: observed_content/Viktor Oddy (HEURISTIC_RULE, reliability: 0.65)
- creator-xp: creator_handle/xp (account_metadata, reliability: 0.75)
- creator-xp-observed: observed_content/xp (HEURISTIC_RULE, reliability: 0.65)
- creator-enigmatic_e: creator_handle/enigmatic_e (account_metadata, reliability: 0.75)
- creator-enigmatic_e-observed: observed_content/enigmatic_e (HEURISTIC_RULE, reliability: 0.65)
- creator-Celton Henderson: creator_handle/Celton Henderson (account_metadata, reliability: 0.75)
- creator-Celton Henderson-observed: observed_content/Celton Henderson (HEURISTIC_RULE, reliability: 0.65)
- creator-Arcfunmi: creator_handle/Arcfunmi (account_metadata, reliability: 0.75)
- creator-Arcfunmi-observed: observed_content/Arcfunmi (HEURISTIC_RULE, reliability: 0.65)
- creator-Kyle Walker: creator_handle/Kyle Walker (account_metadata, reliability: 0.75)
- creator-Kyle Walker-observed: observed_content/Kyle Walker (HEURISTIC_RULE, reliability: 0.65)
- creator-non aesthetic things: creator_handle/non aesthetic things (account_metadata, reliability: 0.75)
- creator-non aesthetic things-observed: observed_content/non aesthetic things (HEURISTIC_RULE, reliability: 0.65)
- creator-Ian Curtis: creator_handle/Ian Curtis (account_metadata, reliability: 0.75)
- creator-Ian Curtis-observed: observed_content/Ian Curtis (HEURISTIC_RULE, reliability: 0.65)
- creator-Eric Wang: creator_handle/Eric Wang (account_metadata, reliability: 0.75)
- creator-Eric Wang-observed: observed_content/Eric Wang (HEURISTIC_RULE, reliability: 0.65)
- creator-Renaud: creator_handle/Renaud (account_metadata, reliability: 0.75)
- creator-Renaud-observed: observed_content/Renaud (HEURISTIC_RULE, reliability: 0.65)
- creator-Rob Perez: creator_handle/Rob Perez (account_metadata, reliability: 0.75)
- creator-Rob Perez-observed: observed_content/Rob Perez (HEURISTIC_RULE, reliability: 0.65)
- creator-Miguel | AP: creator_handle/Miguel | AP (account_metadata, reliability: 0.75)
- creator-Miguel | AP-observed: observed_content/Miguel | AP (HEURISTIC_RULE, reliability: 0.65)
- creator-Justin Ryan ᯅ: creator_handle/Justin Ryan ᯅ (account_metadata, reliability: 0.75)
- creator-Justin Ryan ᯅ-observed: observed_content/Justin Ryan ᯅ (HEURISTIC_RULE, reliability: 0.65)
- creator-Lukita: creator_handle/Lukita (account_metadata, reliability: 0.75)
- creator-Lukita-observed: observed_content/Lukita (HEURISTIC_RULE, reliability: 0.65)
- creator-Elliot Arledge: creator_handle/Elliot Arledge (account_metadata, reliability: 0.75)
- creator-Elliot Arledge-observed: observed_content/Elliot Arledge (HEURISTIC_RULE, reliability: 0.65)
- creator-ꜱᴋᴏᴏᴍᴀ.ᴇxᴇ☭⃠: creator_handle/ꜱᴋᴏᴏᴍᴀ.ᴇxᴇ☭⃠ (account_metadata, reliability: 0.75)
- creator-ꜱᴋᴏᴏᴍᴀ.ᴇxᴇ☭⃠-observed: observed_content/ꜱᴋᴏᴏᴍᴀ.ᴇxᴇ☭⃠ (HEURISTIC_RULE, reliability: 0.65)
- creator-Elon Musk: creator_handle/Elon Musk (account_metadata, reliability: 0.75)
- creator-Elon Musk-observed: observed_content/Elon Musk (HEURISTIC_RULE, reliability: 0.65)
- creator-Creepy.org: creator_handle/Creepy.org (account_metadata, reliability: 0.75)
- creator-Creepy.org-observed: observed_content/Creepy.org (HEURISTIC_RULE, reliability: 0.65)
- creator-CALL TO ACTIVISM: creator_handle/CALL TO ACTIVISM (account_metadata, reliability: 0.75)
- creator-CALL TO ACTIVISM-observed: observed_content/CALL TO ACTIVISM (HEURISTIC_RULE, reliability: 0.65)
- creator-Jah Jiren: creator_handle/Jah Jiren (account_metadata, reliability: 0.75)
- creator-Jah Jiren-observed: observed_content/Jah Jiren (HEURISTIC_RULE, reliability: 0.65)
- creator-Julian Goldie SEO: creator_handle/Julian Goldie SEO (account_metadata, reliability: 0.75)
- creator-Julian Goldie SEO-observed: observed_content/Julian Goldie SEO (HEURISTIC_RULE, reliability: 0.65)
- creator-Ali Grids: creator_handle/Ali Grids (account_metadata, reliability: 0.75)
- creator-Ali Grids-observed: observed_content/Ali Grids (HEURISTIC_RULE, reliability: 0.65)
- creator-Edwin: creator_handle/Edwin (account_metadata, reliability: 0.75)
- creator-Edwin-observed: observed_content/Edwin (HEURISTIC_RULE, reliability: 0.65)
- creator-Matteo Spada: creator_handle/Matteo Spada (account_metadata, reliability: 0.75)
- creator-Matteo Spada-observed: observed_content/Matteo Spada (HEURISTIC_RULE, reliability: 0.65)

**Limitations:** Creator presence does not indicate your preferences, trust, or agreement with their content.

**Recommendation:**
- `is_main_claim_correct`: **yes**
- `should_have_abstained`: **no**
- **Justification:** Creators tab with 56 evidence items. High coverage suggests claim is correct.

---

### desktop-1767282143724-w7lwh78 - inferences

**Claim:** High-confidence signals surfaced across tabs.
**Status:** PRELIMINARY
**Evidence IDs:** 1

**Evidence Details:**
- alg-inf-000: intent_signal/Dominant content type (CLASSIFIER_OUTPUT, reliability: 0.8)

**Limitations:** Important: These are signals present in the content, NOT inferences about you. We cannot determine why this content was shown or what targeting was used.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **unsure**
- **Justification:** PRELIMINARY status suggests thin evidence (1 items). Human review needed to verify if claim is correct and if PRELIMINARY was appropriate.

---

### desktop-1767214732271-5fvxxhi - ads

**Claim:** Ad rate: 0.0% (0 ads in 25 posts)
**Status:** FINAL
**Evidence IDs:** 1

**Evidence Details:**
- ev-ads-aggregate-adrate: aggregate_computation/None (BAYESIAN_BETA, reliability: 0.9)

**Limitations:** Sample size of 25 posts. Single-item changes significantly affect percentages.

**Recommendation:**
- `is_main_claim_correct`: **yes**
- `should_have_abstained`: **no**
- **Justification:** Ads tab with 1 evidence items. Platform labels are highly reliable. Claim likely correct unless evidence chain is broken.

---

### desktop-1767214732271-5fvxxhi - politics

**Claim:** Political or news keywords detected in this scan.
**Status:** ABSTAIN
**Evidence IDs:** 0

**Limitations:** Important: This analysis cannot determine political bias, your beliefs, or why content was shown to you. Only keyword presence is measured.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **yes**
- **Justification:** System correctly abstained (no evidence or insufficient signal).

---

### desktop-1767214732271-5fvxxhi - patterns

**Claim:** Creators repeated across the scan.
**Status:** ABSTAIN
**Evidence IDs:** 0

**Limitations:** Patterns in a single scan may not reflect long-term feed behavior.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **yes**
- **Justification:** System correctly abstained (no evidence or insufficient signal).

---

### desktop-1767214732271-5fvxxhi - creators

**Claim:** Creators identified in this scan.
**Status:** FINAL
**Evidence IDs:** 50

**Evidence Details:**
- creator-Diego | AI  - e/acc: creator_handle/Diego | AI  - e/acc (account_metadata, reliability: 0.75)
- creator-Diego | AI  - e/acc-observed: observed_content/Diego | AI  - e/acc (HEURISTIC_RULE, reliability: 0.65)
- creator-joshpuckett: creator_handle/joshpuckett (account_metadata, reliability: 0.75)
- creator-joshpuckett-observed: observed_content/joshpuckett (HEURISTIC_RULE, reliability: 0.65)
- creator-Science girl: creator_handle/Science girl (account_metadata, reliability: 0.75)
- creator-Science girl-observed: observed_content/Science girl (HEURISTIC_RULE, reliability: 0.65)
- creator-StarPlatinum: creator_handle/StarPlatinum (account_metadata, reliability: 0.75)
- creator-StarPlatinum-observed: observed_content/StarPlatinum (HEURISTIC_RULE, reliability: 0.65)
- creator-Ado: creator_handle/Ado (account_metadata, reliability: 0.75)
- creator-Ado-observed: observed_content/Ado (HEURISTIC_RULE, reliability: 0.65)
- creator-Connor: creator_handle/Connor (account_metadata, reliability: 0.75)
- creator-Connor-observed: observed_content/Connor (HEURISTIC_RULE, reliability: 0.65)
- creator-ℏεsam: creator_handle/ℏεsam (account_metadata, reliability: 0.75)
- creator-ℏεsam-observed: observed_content/ℏεsam (HEURISTIC_RULE, reliability: 0.65)
- creator-Mark Vassilevskiy: creator_handle/Mark Vassilevskiy (account_metadata, reliability: 0.75)
- creator-Mark Vassilevskiy-observed: observed_content/Mark Vassilevskiy (HEURISTIC_RULE, reliability: 0.65)
- creator-Linus ✦ Ekenstam: creator_handle/Linus ✦ Ekenstam (account_metadata, reliability: 0.75)
- creator-Linus ✦ Ekenstam-observed: observed_content/Linus ✦ Ekenstam (HEURISTIC_RULE, reliability: 0.65)
- creator-Oleg Frolov: creator_handle/Oleg Frolov (account_metadata, reliability: 0.75)
- creator-Oleg Frolov-observed: observed_content/Oleg Frolov (HEURISTIC_RULE, reliability: 0.65)
- creator-Robin Ebers | AI Coding Mentor: creator_handle/Robin Ebers | AI Coding Mentor (account_metadata, reliability: 0.75)
- creator-Robin Ebers | AI Coding Mentor-observed: observed_content/Robin Ebers | AI Coding Mentor (HEURISTIC_RULE, reliability: 0.65)
- creator-Aristide Benoist: creator_handle/Aristide Benoist (account_metadata, reliability: 0.75)
- creator-Aristide Benoist-observed: observed_content/Aristide Benoist (HEURISTIC_RULE, reliability: 0.65)
- creator-Hayes: creator_handle/Hayes (account_metadata, reliability: 0.75)
- creator-Hayes-observed: observed_content/Hayes (HEURISTIC_RULE, reliability: 0.65)
- creator-Justine Moore: creator_handle/Justine Moore (account_metadata, reliability: 0.75)
- creator-Justine Moore-observed: observed_content/Justine Moore (HEURISTIC_RULE, reliability: 0.65)
- creator-Jonah Katz: creator_handle/Jonah Katz (account_metadata, reliability: 0.75)
- creator-Jonah Katz-observed: observed_content/Jonah Katz (HEURISTIC_RULE, reliability: 0.65)
- creator-Manus: creator_handle/Manus (account_metadata, reliability: 0.75)
- creator-Manus-observed: observed_content/Manus (HEURISTIC_RULE, reliability: 0.65)
- creator-Jay Owen: creator_handle/Jay Owen (account_metadata, reliability: 0.75)
- creator-Jay Owen-observed: observed_content/Jay Owen (HEURISTIC_RULE, reliability: 0.65)
- creator-Dillon Mulroy: creator_handle/Dillon Mulroy (account_metadata, reliability: 0.75)
- creator-Dillon Mulroy-observed: observed_content/Dillon Mulroy (HEURISTIC_RULE, reliability: 0.65)
- creator-Jonny Burger: creator_handle/Jonny Burger (account_metadata, reliability: 0.75)
- creator-Jonny Burger-observed: observed_content/Jonny Burger (HEURISTIC_RULE, reliability: 0.65)
- creator-Nick Co: creator_handle/Nick Co (account_metadata, reliability: 0.75)
- creator-Nick Co-observed: observed_content/Nick Co (HEURISTIC_RULE, reliability: 0.65)
- creator-Ray Fernando: creator_handle/Ray Fernando (account_metadata, reliability: 0.75)
- creator-Ray Fernando-observed: observed_content/Ray Fernando (HEURISTIC_RULE, reliability: 0.65)
- creator-Rob Hoffman: creator_handle/Rob Hoffman (account_metadata, reliability: 0.75)
- creator-Rob Hoffman-observed: observed_content/Rob Hoffman (HEURISTIC_RULE, reliability: 0.65)
- creator-kitze: creator_handle/kitze (account_metadata, reliability: 0.75)
- creator-kitze-observed: observed_content/kitze (HEURISTIC_RULE, reliability: 0.65)
- creator-fabian: creator_handle/fabian (account_metadata, reliability: 0.75)
- creator-fabian-observed: observed_content/fabian (HEURISTIC_RULE, reliability: 0.65)
- creator-Codetard: creator_handle/Codetard (account_metadata, reliability: 0.75)
- creator-Codetard-observed: observed_content/Codetard (HEURISTIC_RULE, reliability: 0.65)

**Limitations:** Creator presence does not indicate your preferences, trust, or agreement with their content.

**Recommendation:**
- `is_main_claim_correct`: **yes**
- `should_have_abstained`: **no**
- **Justification:** Creators tab with 50 evidence items. High coverage suggests claim is correct.

---

### desktop-1767214732271-5fvxxhi - inferences

**Claim:** High-confidence signals surfaced across tabs.
**Status:** FINAL
**Evidence IDs:** 2

**Evidence Details:**
- alg-inf-000: intent_signal/Dominant content type (CLASSIFIER_OUTPUT, reliability: 0.8)
- alg-inf-001: intent_signal/Commercial content present (CLASSIFIER_OUTPUT, reliability: 0.8)

**Limitations:** Important: These are signals present in the content, NOT inferences about you. We cannot determine why this content was shown or what targeting was used.

**Recommendation:**
- `is_main_claim_correct`: **unsure**
- `should_have_abstained`: **maybe**
- **Justification:** Inferences tab FINAL with 2 evidence items. Inference claims are speculative - may need PRELIMINARY or more evidence.

---
