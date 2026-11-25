# Design pass notes

Date: 28 September 2026. Scope: the landing page, the explorer, the specimen, the film page and the hosted privacy policy under `AlgorithmLens_Cowork/public/`. Before screenshots: `docs/web-audit/before-2026-09-28/`. After screenshots: `docs/web-audit/design/` (every landing section and every explorer view at 390 and 1440). References are the app's design documents in `mobile/design/`, the brand sheet `mobile/design/brand/Ink and Wordmark.dc.html`, the native port contract `mobile/design/experiences/NATIVE-PORT-SPEC.md`, and the v12 landing hierarchy in `AlgorithmLens Landing v12-canon.dc.html`.

Each change names what moved, and which reference it follows.

## Landing page

1. **Hero above the fold at 390** reads wordmark, headline, the film in a paper card, one italic limit line, one dark button. Nothing else. The section nav is hidden on phones (the sections follow in reading order and the footer repeats the links) and the lede sentence moves below the button. Reference: the app's Home surface, "one headline, one visual, one caption, one dark control" (`mobile/design/home/Home.dc.html`, section 1), and the v12 order brand, promise, demonstration. Before: `docs/web-audit/before-2026-09-28/landing-390-fold.jpg` (eyebrow, headline, lede, limit, button, caption, film below the fold). After: `docs/web-audit/design/landing-390-fold.jpg`.
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
13. **Mobile chrome.** Nav chips are 44 px tall with the dark selected state; the "next view" button is 44 by 44; the toolbar wraps; the record stage is 380 px tall with the dated chips below it rather than under it; the reading panel's title drops to 30 px with a 17 px italic limit so the visual leads. Before: `docs/web-audit/before-2026-09-28/explore-record-390.jpg` (chips under the stack). After: `docs/web-audit/design/explore-record-390.jpg`.
14. **Basis label** ("Observed ad label", "Content inference") is a ring label, not a boxed chip, matching the landing. The primary control ("Bring ad labels forward", "Group by source", "Play four posts") is the dark 48 px control with a 14 px radius; the rest are white pills.
15. **Inactive feed cards** dim only their image, not their text, so the account name keeps its contrast at every position.

## Specimen and film page

16. The specimen's sample chip becomes a ring label; the date chips use the dark selected state; the headline says "A feed", not "Your feed". The film page uses Source Serif 4, the wordmark, a ring-style label, an italic limit line and the shared footer links; its video box uses the film's real 1440 by 1000 frame.

## Not changed, on purpose

- The specimen's turned sheet and the explorer's 3D stack keep their rest poses from the native port contract.
- No new decorative elements, no gradients, no shadows beyond the two the port contract specifies for sheets.
- The app's uppercase eyebrows in the older design comps were not carried over: the site's labels are sentence case, as the canon requires.

# Polish pass notes

Date: 29 September 2026. Source: the polish design in `AlgorithmLens_Astra_Bundle/design-polish/design/` (`DESIGN-POLISH-README.md` and the six artboards), applied as a polish, not a redesign. Same sections, same copy, same honesty fixes from `WEB_AUDIT.md`; the type scale, spacing, radii, shadows, states and compositions are the design's. After screenshots: `docs/web-audit/polish/`. Pages touched: `public/index.html`, `public/landing.js`, `public/404.html`, the new `public/about/index.html`, and `public/terms.html` and `public/methodology.html` (rendered from the React pages by `scripts/build-paper-pages.mjs`). The explorer, specimen, film and privacy pages are unchanged.

## What was applied

1. **Tokens.** The names in `Tokens.dc.html` are the CSS variables: paper #F5F4F0, panel #FFFFFF, field #FFFDF9, line #DDD8CD, mark #E6E1D6, muted #6D685F, ink #3A3730, ink-press #141311, the two brand colors and their tints. The dark control is now ink (#3A3730) at rest and ink-press (#141311) on hover, as the tokens sheet specifies; the earlier pass used the app's #1A1712 (design pass note 10). Text on the dark control is #F7F5EF.
2. **Rhythm.** 8 pt grid: section padding 96 on desktop and 56 on phones, card padding 24 and 16, gaps 8, 12, 16, 24. Page gutter 120 at 1440 (fluid, 8.33 vw, down to 48 at 900), 48 on tablets, 24 on phones. A 12 column grid with a 24 px gap from 900 px up; one column below, so 768 gets the phone layout with the wider gutters.
3. **Type scale.** Seven steps: hero 72/76 with -1.5 px tracking (46/50 on phones), section 48/54 (34/40), card title 26/32 (24/30), small card 20/26, lede 19/30 (17/26), body 16/25 (15/23), limit line 16/24 serif italic, caption 13/18. Between 900 and 1440 the two headline sizes are clamped to the viewport so the hero stays on three lines.
4. **Radii and shadows.** 10 sheet, 12 field, 14 small card, 16 card, 20 panel, 24 hero panel, 22 pill, 44 drawn phone. Card 0 8 24 at 6 percent, panel 0 16 40 at 8 percent, sheet contact 9 16 0 at 8 percent plus ambient 0 24 22 at 12 percent, pill hover 0 6 16 at 18 percent.
5. **Header.** 72 px on the paper ground at rest (64 on phones), 64 px on translucent paper with a 12 px blur once the page has scrolled (`chrome.js` and the `scrolled` class); wordmark 188 by 38, 158 by 32 when scrolled, 139 by 28 on phones; links 15 px with a 2 px blue underline that scales in over 240 ms; the pill lifts 1 px to ink-press with the pill shadow over 160 ms. Reduced motion: no sweep, no lift, no blur.
6. **Hero and film panel.** Copy on columns 1 to 6, the film panel on 8 to 12. The film sits inside a drawn phone (280 wide on desktop, 250 on phones, ink frame, 44 px radius) inside the panel, on the panel's dot texture; the pulse dot turns green and the 2 px green scan line runs only while the film plays; the four-post tally sits under the phone; the caption and the play control are the panel's footer, with the transcript beneath. Phone order: eyebrow, headline, lede, button, limit, effort card, platforms, then the panel.
7. **The record.** Count tiles in a 2 by 2 grid beside the copy. The sheet stack is drawn natively in the page (`landing.js`, `SCANS`) from the same four fictional Instagram scans the explorer's record view uses (33, 39, 8 and 45 posts; 5, 5, 2 and 6 printed ad labels; 125 posts across 4 scans), with the port contract's rest pose and depth offsets, one mark per post, blue for a printed ad label, hollow for an unreadable one. Nothing is clipped by an inner scrollbar because there is no inner frame any more; the sandboxed explorer embed and its loading line are gone from the landing, and the explorer is reached by "Turn over the whole example in the explorer" and the desktop "Inspect this scan" chip. The four date chips sit on one row at 44 px; the selected chip is ink. The caption carries the count, the limit and the three-item legend.
8. **Try it.** The readout card and the phone are side by side on desktop; the readout comes first on phones. The phone is the drawn phone (ink frame, 48 px radius on desktop). The arrow hint and the pulsing ring on the first Read button were removed; the "Try it" ring eyebrow does that work.
9. **Can and cannot.** Two rows with equal weight, a 96 px row label each on desktop. "Can read" chips carry a filled blue dot on the blue tint; "cannot read" chips a hollow dot on white in muted text. The rows move at one speed (56 s) and pause on hover; on phones and under reduced motion they wrap and stand still.
10. **Three steps.** The selected step is a white card with a 4 px green rail and an ink numeral in a 40 px ring (36 on phones); the others are quiet rows with hairline numerals. The preview card is persistent on columns 8 to 12 (below the list on phones) with the panel shadow. The preview labels use a period ("Step 2. Review what appeared") instead of a middle dot.
11. **Privacy and ways.** Privacy cards are paper-tinted on the white band, 2 by 2, icons in 40 px green wells at 12 px radius, serif titles at 20. Ways cards are 2 by 2 on phones and tablets, four across from 1100 px, tinted blue for the platform's facts and green for the reader's actions, titles at 22; hover lifts 2 px, deepens the shadow and tilts the icon.
12. **Worked count.** 6 of 45 at 72 px on desktop and 56 on phones; the bar is a 15 column grid of 45 cells (26 px tall, 4 px radius on desktop; 22 and 3 on phones) so the one unknown cell is visibly hollow; legend and sum line under it.
13. **Form.** One 560 px card: label, 56 px field on the field color at 12 px radius, the status line directly under the field, the 22 px consent checkbox, one dark button, the privacy note under the button. Focus is a blue ring; an invalid address draws a 1.5 px ink border; error and success are one sentence under the field in the same weight, success with a green dot. The button reads "Sending" and goes to the line color while a request is in flight. The five outcome sentences, the consent sentence, the note and the endpoint are byte for byte the audit's.
14. **Footer.** White panel, four columns on the grid (wordmark and tagline on columns 1 to 4, Product 6 to 7, Company 8 to 10, Legal 11 to 12), a hairline rule and the closing line "A scan reads what appeared. It cannot say why." Every previous link is kept and About is added under Company. On phones the columns are two wide so the privacy address does not break mid-word.
15. **About page** at `/about/` from `About.dc.html`: the hero with the "What it will never do" card, the loop diagram (record, review, keep both, with the dashed return labeled "another week" and no algorithm depicted), "Open to check" and "Write to us". The diagram is HTML boxes and CSS arrows so it reflows: a row on desktop, a column with a dashed left rail on phones. `/about` redirects to `/about/` (one added redirect; every existing redirect and header is unchanged).
16. **404** from `NotFound.dc.html`: the shared header, the ring eyebrow, "Nothing was read at this address.", the dark button back to the front page, the explorer link, and the empty sheet ("An empty sheet stays empty.", "No date", "0 posts") in the rest pose. The footer row keeps the legal links and the privacy address.
17. **Methodology and terms** are paper pages with the shared header and footer. `scripts/build-paper-pages.mjs` renders the React pages with react-dom/server, so the text, including the verbatim prompt strings, is not retyped; the Tailwind classes are mapped onto the paper system (callout, note, table, bullets, monospace fields). `/terms` and `/methodology` now rewrite to the static files instead of the app shell, so no page on the site loads the app or a third-party font. The terms are the July 2026 text that was live; the app's newer draft still carries the counsel note (D-166) and stays unpublished until counsel resolves it, which the build script says in its header.
18. **Motion.** Every transition is 160 (press, color), 240 (hover lift, underline, card lift, sheet chips) or 400 ms (reveal, sheet turn, progress bar) with cubic-bezier(0.22, 1, 0.36, 1). The loops the design itself draws (pulse 2.4 s, scan line 4 s, marquee 56 s, step auto-advance every 5 s) are unchanged in kind. Under reduced motion nothing moves: no reveal, no pulse, no scan line, no marquee, no auto-advance, no lift, no blur, no sheet transition.

## Where the design conflicted with canon, canon kept

- **"Suggested for you" in green** (Main.dc.html and Landing-Desktop.dc.html, the fictional feed): the color law gives green to the reader's own choices and blue to the platform's hand, and the audit's D-2 fix put suggested posts in blue. The chip keeps its blue outline; "Following" keeps the green outline with charcoal text.
- **"Local news" as a printed label on post 2** (the fictional feed): the readout says that post's origin is "Following, as labeled", and "Local news" is a content classification, not a label the platform printed. The post keeps its "Following" tag so the readout stays true.
- **Copy that differs from the live page** in the artboards ("Watch the record form." without "Tap four posts."; "Join the launch list. One email when the app is public, nothing else." with the address repeated; "Delete anytime: removes your scan history and your report"; "Never sold: no advertising, no data brokers, no analytics on this page"; "Audit the ads: count the printed labels and name the advertisers behind them"; the tile labels "Posts read", "Accounts named", "Dated scans"; the trust point "Limits stated beside every number"; the success sentence "Added to the launch list. One email when the app is public."): the live copy stays, because the brief is a polish with the same copy and several of these sentences are audit fixes ("name the advertisers behind them" would promise more than a printed label supports; the success sentence must match what the server confirmed). The three new sentences the design introduces as elements are adopted: the footer's closing line, the "Inspect this scan" chip, and "Watch the example film" beside the hero button.
- **The trust point wells** are green in the design; the earlier pass had the limits point in blue. Green is kept for all three, as drawn, since none of the three states a platform fact.
- **The hero effort card** in the design is a white card; kept as drawn. The design's eyebrow and platforms line use periods where the live page used middle dots; adopted.
- **The 404 footer** in the design has no links; the legal links and the privacy address are kept on it (audit G-1).
- **The record embed**: the README says the stack "is no longer clipped by an inner scrollbar", which reads as a fix to the iframe; the artboards draw the stack natively, and the native stack is what shipped (item 7). The explorer's own record view is untouched.
- **Copy checks**: `/terms` and `/methodology` join `/privacy/` as locked mirror texts in `scripts/web-audit/copy-check.mjs` (no inference-verb or completeness check on them), and em dashes inside `<pre>` are not counted, because the methodology's two em dashes sit inside the verbatim prompt strings that must stay byte for byte. Outside those blocks every page has zero em dashes, zero uppercase transforms and no gradient other than the dot texture.
- **"because" on the About page** (About.dc.html, "Nothing in the loop looks at the platform's model, because nothing can."): "because" is on the site's inference-verb list, and the live copy check flagged it. Rewritten as two sentences: "Nothing in the loop looks at the platform's model. Nothing can."
- **hello@algorithmlens.com** on the About page is the address the design gives for questions; whether that mailbox exists is for Justin to confirm. The privacy address is unchanged.

## Verification, 29 September 2026

Deployed as commit 2b6cebb3 (production deployment 6738761160, success) and the About sentence fix cd54df33 (deployment success), both confirmed through the GitHub deployments API before the live checks ran. Live URL: https://www.algorithmlens.com/.

- **Screenshots.** `scripts/web-audit/shoot-live.mjs` run against the live site into `docs/web-audit/polish/` (245 files): every landing section, every interactive state (film toggled, transcript open, button focus, one and four taps in the fictional feed, steps 2 and 3, a way card hovered, the record turned back to Aug 30, the header scrolled, the five form outcomes), every explorer view and dataset, the specimen, film, privacy, terms, methodology, About and 404 pages, at 375, 390, 430, 768 and 1440 and the iPhone 14 emulation, plus reduced motion at 390 and 1440. The six artboards are rendered full-page beside them as `artboard-*.jpg` by `scripts/web-audit/shoot-artboards.mjs`. Every after capture was compared with its artboard: the hero, film panel, record, try-it, can-and-cannot rows, steps, privacy grid, ways grid, worked count, form, footer, header states, About and 404 match the compositions and values in the artboards; the differences are the logged canon deviations above and the live copy kept in place of the artboards' wording.
- **Copy checks.** `scripts/web-audit/copy-check.mjs` on the live pages: zero uppercase transforms, zero em dashes outside the methodology's verbatim prompt blocks, zero linear gradients, zero inference verbs and zero completeness claims on `/`, `/explore/`, the specimen, the film page, `/about/` and the 404; `/privacy/`, `/terms` and `/methodology` are locked mirror texts (no verb or completeness check). The first live run flagged "because" on `/about/`; fixed in cd54df33.
- **Horizontal overflow.** `scripts/web-audit/overflow-check.mjs`: on all nine pages at 375, 390, 430, 768 and 1440 the document is exactly the viewport width.
- **Lighthouse mobile, simulated throttling** (Lighthouse 13.5, reports beside this file's screenshots in `docs/web-audit/`):

| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Root, run 1 (`lighthouse-root-polish-run1.report.html`) | 99 | 100 | 100 | 100 | 1.2 s | 2.2 s | 40 ms | 0 |
| Root, run 2 (`lighthouse-root-polish-run2.report.html`) | 99 | 100 | 100 | 100 | 1.2 s | 2.0 s | 0 ms | 0 |
| Explorer (`lighthouse-explore-polish.report.html`) | 99 | 100 | 100 | 100 | 1.2 s | 1.7 s | 70 ms | 0 |

  A first root run aborted with Lighthouse's own NO_NAVSTART trace error ("run Lighthouse again") and is not counted.
- **Weight and requests.** HTML on the wire: root 60,072 bytes, About 17,423, terms 27,949, methodology 40,994, 404 6,350; all under 300 KB. Film and fonts are files under `/static/`. Every request from the root, About, terms, methodology and 404 pages goes to www.algorithmlens.com; the launch-list POST on submit is the site's only outbound request. No analytics.
- **Headers, redirects, form.** Every response still carries the audit's Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy and Permissions-Policy; `/about` answers 301 to `/about/`; `/terms` and `/methodology` answer 200 as static pages; an unknown path answers 404 with the new page. The form's five outcomes were exercised from the live root: empty and invalid addresses never send (native validation), a 500 says nothing was saved, an aborted request says nothing was sent, a simulated 204 says the request was received and resets the form.
- **What could not be verified here.** Real iOS Safari hardware (autoplay in the drawn phone, backdrop blur on the scrolled header) remains an emulation; the About page's hello@ mailbox is unconfirmed.

# Facelift notes

Date: 24 November 2026, in two rounds. Round one: the home page only (`public/index.html`, `public/landing.js`, and `public/tt/index.html`, which is generated from the home page). Round two (below, "Round two"): a second pass over the home page, and the same look carried to About, the 404 page, methodology, terms and privacy. The explorer, the specimen and the film page are untouched. Branch `facelift-fable-5-2`; the site as it was live before this work is the tag `pre-facelift-2026-11-24`. Nothing here is on `main` until Justin says so; the plain-language checkpoint and the undo steps are in `AlgorithmLens_Cowork/CHECKPOINT_facelift_nov2026.md`.

The idea: the product turns a feed into a plain report, so the page is set like one. A front page with a dateline, a rule and a banner headline; numbered sections; ledgers and hairline rules where the polish pass used rounded tiles; the honest limit lines set as pull quotes instead of small grey captions. Paper lies flat and only physical things (the sheets, the phone, the cards that stand for an artifact) cast a shadow.

## What changed

1. **Tokens: none.** Every colour, the three durations, the curve and the headline family are `canon/canon.json` as before (`scripts/web-audit/copy-check.mjs` reports no drift). The only new values are sizes and one shadow for the drawn phone.
2. **Front page.** The eyebrow becomes a dateline over a thick and thin rule. The headline runs across the whole measure on one line from 900 px (clamp 64 to 126 px, 8.8 vw) and on two lines below that, sized so "See your feed" fits the column at every width. "clearly." is italic and keeps the green drawn underline. Under a hairline, three ruled columns from 1200 px: the copy (lede, button, platforms, effort line, and the limit pinned to the foot of the column), the drawn phone with the film, and the film's notes (label, tally, caption, play control, transcript). Between 900 and 1199 px the figure is one column beside the copy; below 900 everything stacks in reading order.
3. **Section heads.** Each section opens with a two-digit number, a short rule and the ring label, then the headline on columns 1 to 8 and the lede on 9 to 12 (7 and 5 below 1200). Headlines are clamp 40 to 62 px at 1.06. Ledes are Source Serif at 21/31 (19/28 on phones); they were the system sans.
4. **The limit lines** are Source Serif italic at 19 to 22 px in ink under a 28 px ink tick. Same sentences, more weight.
5. **The report.** The sheet stack sits on a dotted tabletop (columns 1 to 8) at 330 by 340 px on desktop, in the same rest pose and depth offsets as before; the marks are laid out by CSS grid instead of inline positions, so the sheet can change size without touching the script. The four counts are a ledger beside it: one count per row, the figure at up to 72 px, ink rules above and below. The stack is fully inside its stage at every width (it was clipped at the bottom corner on phones), and the four date chips are equal cells on phones.
6. **One real scan.** The card's head strip is the green ground with the filled green dot; the two counts are 76 to 120 px.
7. **Try it.** The drawn phone is gone. The four fictional posts lie on a tabletop in feed order (four across from 1200 px, two by two from 600, stacked on phones), each with its position numeral, and each post's entry appears in a slot directly beneath it when Read is pressed. An unread slot is a dashed outline with the hollow ring. This also repairs a defect on the live page: the posts sat in a fixed-height flex column and were squashed to about 90 px, which clipped all four Read buttons out of view, so the demonstration could not be used with a pointer or a finger. The Read buttons are now 44 px tall.
8. **The limits.** Two ruled lists side by side, "Can read" in roman with the filled blue dot, "Cannot read" in italic muted with the hollow ring, rows aligned across the two lists (CSS subgrid, with independent lists as the fallback). The marquee, its mask and the duplicated list items are gone, so nothing in this section moves.
9. **Three steps.** Large italic numerals, hairlines between steps, the selected step marked by the green rail in the margin. The step titles are spans inside the buttons now (a heading inside a button was invalid HTML).
10. **Privacy** is four ruled columns from 1100 px (two from 600, a list on phones). **In use** keeps the blue and green tinted cards, taller, with the title at the foot. **Methodology** sets "6 of 45" at up to 136 px over the count bar. **Launch list** puts the question on the left and the form on the right.
11. **Footer.** The closing line "A scan reads what appeared. It cannot say why." is set large in italic above the footer columns; it was the small line at the right of the bottom row. Same sentence, once.
12. **Motion.** One entrance for the front page (dateline, rule, the two halves of the headline, then the columns, 80 ms apart, 400 ms each on the canon curve), the existing 12 px reveal on scroll, count bars whose cells tick in from the left when revealed, and the step preview's 240 ms pop. The marquee loop is removed; the pulse, the scan line and the step auto-advance are unchanged. Reduced motion: nothing moves.

## Copy

Compared word for word with the page on `main`. Changed: the limits eyebrow "What a scan can read" is now "The limits"; the empty-state line is "Nothing yet. Tap Read on any post." (it ended "in the phone", and the phone is gone). Added: the section numbers 01 to 09, the ring labels "How it works", "Privacy", "In use", "Methodology" and "Launch list" on the five sections that had none, and the numerals 1 to 4 over the posts. Removed: the "nothing yet" chip (the "Record so far" row now appears with the first entry), the drawn phone's "9:41", and the marquee's hidden duplicates. Every other sentence, the form's outcome sentences, the consent sentence and the three strings `src/exampleRecord.test.js` pins are byte for byte the same.

## Kept from canon

Sentence case, no em dashes, no gradients other than the dot texture, green as a mark and never as text, blue for the platform's labels, one mark for one post, count bars as sorted tallies (cells) and sheets as positions (round marks). The header is unchanged so that it matches the sibling pages.

## Also in this branch

`scripts/build-tt-page.mjs` and `src/ttPage.test.js` now compare with LF line endings. On this Windows clone git is set to `core.autocrlf=true`, so a branch switch or a pull rewrites `index.html` with CRLF, and the generator's anchors (written with LF) then failed. It is its own commit, so the facelift can be undone without it.

## Verification, 24 November 2026 (local only, nothing deployed)

Served from a local stand-in for the Vercel deployment that applies `vercel.json`'s redirects, rewrites and headers, including the root's Content-Security-Policy.

- `scripts/web-audit/copy-check.mjs`: all nine pages ok. `scripts/web-audit/overflow-check.mjs`: every page at 375, 390, 430, 768 and 1440 is exactly the viewport width; the home page was also checked at 320, 360, 600, 899, 900, 1024, 1100, 1199, 1200, 1280, 1366 and 1920.
- `src/ttPage.test.js` and `src/exampleRecord.test.js` pass; `/tt/` is regenerated and points at the TikTok TestFlight group.
- Interactions in Chromium at 1440 and at 390 on `/tt/`: the four date chips and their counts, the four Read buttons, start over, the three steps, the film toggle, and the form (an empty submit sends nothing, a simulated 500 says nothing was saved, a simulated 204 says the request was received and resets the form). No console errors and no policy violations.
- Layout shift on load: 0 at 1440, 1280 and 390.
- Not done here: Lighthouse, real iOS Safari, and any check against the live host.

## Round two, 24 November 2026

Asked for after round one was reviewed: another pass at the same level of detail, shown before anything is published.

### Home page

1. **Contents row.** Between the front page and section 01, the nine sections as one ruled line of links, each with its number ("01 The report" to "09 Launch list"). Shown from 1100 px, where it fits on one line; the numbers are hidden from screen readers because the list is already ordered.
2. **Ordinals are italic, counts are roman.** Section numbers, the contents row, the post positions and the step numerals are Source Serif italic; every count (45, 6 of 45, 36) stays roman. The "of" in "6 of 45" is italic at 0.62 em.
3. **Film notes.** The tally is four cells, one per post, the first one blue, over "Four posts" and "1 carried an ad label"; it was a bar filled to a quarter. From 1200 px the notes column is three ruled groups (label, tally and control, transcript).
4. **Blank record forms.** An unread slot under a post is now the empty form: a hollow ring, "Post 1", and the four field names (Ad label, Origin, Account, Position) with nothing beside them. Pressing Read fills it in. On phones the blank is one line. The field names are the ones the filled entry uses; the blank is hidden from screen readers and the filled entry is announced.
5. **The sheet stack** answers a click: a sheet behind the chosen one comes forward when clicked (the dated chips remain the keyboard and screen reader control). The caption under the stack is a live region, written only when its words change.
6. **Three steps no longer move the page.** All three descriptions are always visible (the chosen step is ink with the green rail, the others muted) and the three previews share one grid cell, so the list and the panel keep one height. Before, the panel changed height with each step, and on a browser without scroll anchoring (Safari on iPhone) everything below it jumped every five seconds. The steps also advance only while they are on screen.
7. **Header.** The link for the section across the middle of the window keeps its underline and is marked `aria-current="location"`.
8. **The can and cannot lists** come in row by row, side by side, 36 ms apart, instead of fading as one block.
9. **Footer.** "Back to top" at the right of the bottom row.

### The other pages

10. **About** and **404** use the front page's head: the ring label as a dateline, the thick and thin rule, a banner headline (clamp 60 to 100 px on About, 52 to 78 on 404). About's "What it will never do" is a ruled list with hollow rings beside the copy; "Open to check" and "Write to us" are two ruled columns; the loop diagram's boxes now share the width they are given (at 900 px they overflowed the page by 53 px) and the section stacks until 1100 px. Both carry the closing line large in the footer. Every word is unchanged.
11. **Methodology, terms and privacy** are set by one template, `scripts/paper-document.mjs`, used by `build-paper-pages.mjs` and `build-legal-pages.mjs`: the same page head, a contents list built from each document's own section headings (a sticky column from 1100 px, a ruled list above the text below that), sections under an ink rule, and the shared header and footer. The privacy page had its own older header and footer; it now has the site's, which adds the "Join the beta" pill to that page. On methodology and terms the contents link for the section being read is marked (`chrome.js`); `/privacy/` is served under a policy that allows no script, so its list is unmarked and the page loads none.
12. **The documents' words are untouched.** After regeneration the document column of each page was compared with the committed one as a single normalized string: methodology 40,040 characters, terms 13,560, privacy 29,736, all identical. The only added text is the contents lists (each heading once more, as a link) and the word "Contents". Before the templates were touched, all three pages were regenerated with the old templates and came out byte for byte the same as the committed pages, so the sources had not drifted.

### Under the surface

13. **A fallback cut to the serif's width.** Source Serif 4 is 7.4 percent wider than Georgia in roman and 4.8 percent narrower in italic (measured in Chromium on nine roman and three italic strings from these pages). Every restyled page now names a "Source Fallback" face: Georgia with `size-adjust` 107.4 and 95.2 percent. With the font files held back 1.5 s, layout shift fell from 0.392 to 0.001 on the 404 page at 899 px, from 0.022 to 0 on About at 390 px, and is 0.005 or less everywhere else measured (the 404 page at 390 px is 0.036).
14. **Long tokens wrap.** A file name in the methodology (GOLDSET_SCORING_AND_HEADROOM.md) widened the page by 29 px at 320 px; bulleted rows now let such a token break.
15. **A preview that behaves like the live site:** `scripts/web-audit/serve-local.mjs` serves `public/` with `vercel.json`'s redirects, rewrites and headers, so `/terms` and `/methodology` resolve and every page runs under its real Content-Security-Policy. The audit scripts can be pointed at it.

### Copy, round two

Home page: added "Back to top", and "Post 1" to "Post 4" with the four field names in the blank forms (hidden from screen readers). Document pages: added "Contents" and the contents links. Privacy page: gained the shared header and footer text and lost its own "Front page" links. Nothing else changed on any page.

### Verification, round two (local only, nothing deployed)

- All 267 tests pass; `/tt/` is regenerated and current; eslint is clean on every touched script.
- `copy-check.mjs`: all nine pages ok. `overflow-check.mjs`: ok.
- Home, `/tt/`, About, methodology, terms, privacy, an unknown path and the explorer, each at 320, 360, 390, 430, 600, 768, 899, 900, 1024, 1099, 1100, 1200, 1366, 1440 and 1920 px, under the real headers: no horizontal overflow, no console errors or policy violations, no layout shift on load.
- Home page interactions at 1440 and 390: the date chips, a pointer click on a back sheet, the four Read buttons and start over (the blank forms come back), the three steps (list 466 px and panel 399 px at every step on desktop, 427 and 377 on a phone, page height unchanged), the header's current-section mark, the film toggle and the form's outcomes.
- Contents links on the three documents: no missing targets (8, 16 and 14 links); a click lands the heading 88 px from the top and, where scripts run, marks that link.
- Not done here: Lighthouse, real iOS Safari, and any check against the live host.

## Audit fixes, 24 to 25 November 2026

Eighteen fixes from an audit of the live site, on the branch `site-audit-fixes`. The branch starts from the facelift (`facelift-fable-5-2`), not from `main`: twelve of the eighteen items touch pages the facelift rewrote, so starting from `main` would have meant fixing pages that were about to be replaced. One commit per item, the item number first in its message.

### What each item did

| Item | Outcome |
| --- | --- |
| 1 | Already fixed by the facelift (the four posts are laid out side by side; nothing is clipped). No commit of its own. |
| 2 | The privacy card names Google. Wording differs from the audit by one phrase: "Once you approve the analysis", since the app never shows the frames to approve one by one. |
| 3 | Not changed. The policy text lives in the app repository, which this work was told not to touch, and the site page is generated from it. See "Left for a decision". |
| 4 | "Accuracy checked on YouTube so far" beside the platform list; the methodology says "never been accuracy-tested against human labels". |
| 5 | Terms: public beta stated, "(when available)" removed from account deletion, date updated. Liability, arbitration and indemnity untouched. |
| 6 | Two ad-label mark grids instead of five. Three views added to the report section: where posts came from, accounts that came back, and the observed, inferred, unknown key. |
| 7 | A real screen from the app in the hero (a render from the app's own gallery run of 27 October). The film moved under the four posts. |
| 8 | Three lines under the beta button. The third says "You approve the analysis before anything is sent": the app shows a summary, not the recording. |
| 9 | A QR code for the beta beside the button from 1024 px, on devices with a mouse or trackpad. The launch heading renamed. An optional Android box that needs no change to the database. |
| 10 | A questions section, five answers, each linked to the passage it comes from. "Why is it free?" is asked as "Is it really free?": the documents say that it is free, not why. |
| 11 | One Example label per example; the page-level statement kept only in the limits section; each limit stated once. |
| 12 | Plain words for the archive vocabulary, on the home page, the about page and the explorer. |
| 13 | `/tt/` is a short page: headline, one example visual, three findings, the button. No script. |
| 14 | Methodology: a 151-word summary, the author, an id on every heading, a dated list of changes. |
| 15 | The explorer's posts have names and captions; build words and the file picker are gone; the page that draws one scan up close reads the same data as the explorer. |
| 16 | New title, the beta links in the markup, structured data, a new share image used by every page. |
| 17 | The launch form names its page in a hidden field and says so. The source was already being sent and stored; nothing to migrate. |
| 18 | A menu for the header links on phones, a pause control for the steps, 44 px tap targets, no phone text under 13 px. |

### Parts of the pages that are generated

Each sits between a pair of comment markers or is a whole generated file. Edit the source, then run the generator; the tests fail if a committed page is out of date.

| What | Source | Run |
| --- | --- | --- |
| Home page: the QR code, the beta links, the three report views, the structured data | `BETA_LINK` in `public/landing.js`; `public/explore/examples.js`; the questions section of `public/index.html` | `npm run build:home` |
| `/tt/` | the home page, `TIKTOK_BETA_LINK`, `examples.js` | `npm run build:tt` (after `build:home`) |
| Methodology and Terms | `src/pages/MethodologyPage.jsx`, `src/pages/TermsPage.jsx` | `npm run build:methodology` |
| Privacy policy | `mobile/legal/PRIVACY_POLICY.md` in the app repository, plus the website note in `scripts/build-legal-pages.mjs` | `node scripts/build-legal-pages.mjs` |
| The share image | `scripts/build-share-image.mjs` | `npm run build:share` |

`npm run build` runs the first two before every build. `scripts/qr.mjs` is the QR encoder (no dependencies).

### Decisions worth knowing

- **The Android box and the page name ride in the existing `source` column.** The launch-list function stores a free-text source of up to 120 characters. The home page sends `algorithmlens-launch-list`, and `algorithmlens-launch-list+android` when the box is ticked. To list those addresses: `select email, created_at from public.launch_list where source like '%+android' order by created_at;`
- **No field of the launch form has a `name`.** With the script unavailable, a press of the button used to put the address into this site's own URL. Now it sends nothing, and a line says the form needs JavaScript.
- **The film loads nothing until asked.** Its poster is fetched when its disclosure is opened and the film when it is played.
- **The hero screen's numbers (27 posts, 16 of 27) belong to the app's own sample data**, not to the site's example scan (45 posts). Each carries its own Example label. The share image shows the same screen.
- **One example dataset.** The explorer, the home page's views, `/tt/` and the page that draws one scan up close all count from `public/explore/examples.js`. The up-close page used to carry a second copy with the ad labels at other positions.
- **The old share image, `og-example.png`, is no longer named by any page** (its marks did not match the explorer). The file is left in place for old link previews.
- **Dates.** The methodology's "Last updated" and the two November entries in its list of changes are the dates of the edits (24 and 25 November 2026), not the date of publication.

### Left for a decision

- **Item 3, the privacy policy.** The save path stores no post text (the app's own tests pin this), so the true statement is "not stored". Three passages need to agree on it, and the "Streak" row and the "(streaks, preferences)" line describe a feature that does not exist. Two things kept this from being done here: the text is in the app repository, and whether scans saved before 26 July 2026 were purged of their text is recorded in that repository as not run.
- **Other places where the policy and Terms are behind the app:** both describe Android capture and Google or Apple sign-in; the app is iPhone only and signs in by email.
- **The in-app Terms** still say "(when available)" and do not mention the beta.
- **Methodology, reported and not changed:** ads agreement reads 78 of 78 in the gold set section and 77 of 78 in the control runs; the Instagram hint marks unlabeled home-feed posts as followed while rule 5 says the absence of a label is never evidence of followed.

### Verification, 25 November 2026 (on the built site, served locally under the real headers; nothing deployed)

- `npm run build` succeeds, and the built pages are byte for byte the committed ones.
- 319 tests pass; eslint is clean on every touched script and test.
- Ten pages at 375, 1024 and 1440: no console message, no Content-Security-Policy violation, no request leaving the site, no failed request, no sideways scroll, no cookie.
- 208 internal links and anchors resolve.
- The demo, the record, the steps, the form (simulated answers) and the film, clicked through at 375, 1024 and 1440.
- Every number on the home page, `/tt/`, the explorer's views and the up-close page agrees with the example data.
- Nothing unfinished in what a visitor can read: no brackets, "TBD", "TODO", "example_" or empty blanks, in any page or explorer view; none of those strings anywhere in the built folder.
- The QR codes read back as the right links, by a decoder written for the tests and by OpenCV from screenshots.
- Not done here: Lighthouse, a real iPhone in Safari, and any check against the live host.
