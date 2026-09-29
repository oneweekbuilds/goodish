# Design pass notes

Date: 28 September 2026. Scope: the landing page, the explorer, the specimen, the film page and the hosted privacy policy under `AlgorithmLens_Cowork/public/`. Before screenshots: `docs/web-audit/before/`. After screenshots: `docs/web-audit/design/` (every landing section and every explorer view at 390 and 1440). References are the app's design documents in `mobile/design/`, the brand sheet `mobile/design/brand/Ink and Wordmark.dc.html`, the native port contract `mobile/design/experiences/NATIVE-PORT-SPEC.md`, and the v12 landing hierarchy in `AlgorithmLens Landing v12-canon.dc.html`.

Each change names what moved, and which reference it follows.

## Landing page

1. **Hero above the fold at 390** reads wordmark, headline, the film in a paper card, one italic limit line, one dark button. Nothing else. The section nav is hidden on phones (the sections follow in reading order and the footer repeats the links) and the lede sentence moves below the button. Reference: the app's Home surface, "one headline, one visual, one caption, one dark control" (`mobile/design/home/Home.dc.html`, section 1), and the v12 order brand, promise, demonstration. Before: `docs/web-audit/before/landing-390-fold.jpg` (eyebrow, headline, lede, limit, button, caption, film below the fold). After: `docs/web-audit/design/landing-390-fold.jpg`.
2. **The film sits in a white card on cream, not floating.** Ring label "Example film · four fictional posts" at the top, the film centered at 176 px (phones) or 236 px (wide), an italic caption and the play control in the card's footer. Reference: the field card grammar (white card, hollow ring label, one visual, one italic caption) in `Home.dc.html` and the first-run tour card in `mobile/design/firstrun/FirstRunMoments.dc.html`. The film already contains its own drawn phone, so a second phone frame was not drawn around it.
3. **Typography scale.** Headline clamp(40, 4.6vw, 64) px at 1.05 line height and -1.5 px tracking, 13 ch measure; section titles clamp(30, 3.4vw, 44) px, 20 ch; body 17/1.55 at 60 ch; italic serif captions 17 px; small print 14 px. Source Serif 4 for every headline and every italic caption, the system sans for body. Reference: Source Serif headlines and italic serif captions throughout `Home.dc.html` and `Dashboard.dc.html`; the 70-character measure from the brief.
4. **Vertical rhythm on an 8 pt grid.** Section padding 64 (40 on phones), card padding 24 (12 to 16 inside the film card), gaps 16, 24, 32, 48. Header 72 px. Nothing is on a 5 or 10 px step any more.
5. **Buttons.** One dark control on the page: the launch-list button in #1A1712 at 56 px, 14 px radius, full width on phones. Every other control is a white pill with a 1 px line (play the film, open the explorer). Reference: `Ink and Wordmark.dc.html` (the dark scan button as the only dark object) and the Home surface's "ink primary button is the screen's only dark object".
6. **Ring labels replace boxed chips**: "Example film", "Example record", "The honest limit", "Launch list". Charcoal ring by default; a colored ring only where the fact is the platform's (blue) or the reader's (green), and no such fact is labeled on the landing, so all rings are charcoal here. Reference: the hollow ring eyebrow in `Home.dc.html` ("Your feeds", "Routine") and the tour cards.
7. **The record section** is a white card holding the explorer's record view, whose stack follows the native port contract (rest pose rotateX 38, rotateZ -23, 9 by -18 translations, dated chips at 44 pt with the dark selected state). The embed's body is white so the card reads as one sheet of paper. Reference: `NATIVE-PORT-SPEC.md` section A and the share card's dot grid as the hero mark (`mobile/design/sharecard/Share Card.dc.html`).
8. **Three steps** use the app's numbered-circle list (36 px ring numbers, title, muted description) instead of oversized italic numerals over rules. Reference: "What happens next" on the pre-recording surface (`mobile/design/surfaces/AlgorithmLens Surfaces.dc.html`, surface 1).
9. **Launch list** is a white card with the form on the right at 1440 and stacked on phones; the field is 56 px with a 12 px radius, the consent row is 44 px, the status line sits under the button. Reference: the form fields in the first-run surfaces.
10. **Paper token** unified to #F5F4F0 across the landing, explorer, specimen, film page and privacy page (the brand sheet's cream). Text ink stays #3A3730 (the web system's ink, 9.6:1 on the paper); the dark control uses the brand's #1A1712.
11. **Focus states**: a 2 px brand-blue outline with 3 px offset on every link, button, field and summary, on cream and on white. Unchanged in color, made consistent in offset.

## Explorer

12. **Color is meaning.** Followed posts are green (the reader's own choice), suggested posts a hollow blue ring (the platform's hand), unknown a grey ring; the legend says so. Account appearance marks and the appearance timeline are charcoal (an observation, not a side); the political legend is charcoal. Ads stay blue everywhere. Reference: tour moment 1 in `FirstRunMoments.dc.html` (green "from channels you follow", hollow blue "suggested to you", blue "advertising") and the brief's rule that politics and tone stay charcoal.
13. **Mobile chrome.** Nav chips are 44 px tall with the dark selected state; the "next view" button is 44 by 44; the toolbar wraps; the record stage is 380 px tall with the dated chips below it rather than under it; the reading panel's title drops to 30 px with a 17 px italic limit so the visual leads. Before: `docs/web-audit/before/explore-record-390.jpg` (chips under the stack). After: `docs/web-audit/design/explore-record-390.jpg`.
14. **Basis label** ("Observed ad label", "Content inference") is a ring label, not a boxed chip, matching the landing. The primary control ("Bring ad labels forward", "Group by source", "Play four posts") is the dark 48 px control with a 14 px radius; the rest are white pills.
15. **Inactive feed cards** dim only their image, not their text, so the account name keeps its contrast at every position.

## Specimen and film page

16. The specimen's sample chip becomes a ring label; the date chips use the dark selected state; the headline says "A feed", not "Your feed". The film page uses Source Serif 4, the wordmark, a ring-style label, an italic limit line and the shared footer links; its video box uses the film's real 1440 by 1000 frame.

## Not changed, on purpose

- The specimen's turned sheet and the explorer's 3D stack keep their rest poses from the native port contract.
- No new decorative elements, no gradients, no shadows beyond the two the port contract specifies for sheets.
- The app's uppercase eyebrows in the older design comps were not carried over: the site's labels are sentence case, as the canon requires.
