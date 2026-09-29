# Old, before and after, section by section

Date: 29 September 2026. Three capture sets, all made with Playwright and Chromium at the same widths:

- **Old**: the Vite/React app at commit b9a1e192, run locally from a worktree, in `old/`. Its brand page (LandingV12) is `landing-*`; the Coming Soon gate that the public actually saw is `gate-*`. Captured at 390 and 1440 only, headed Chromium.
- **Before**: the live site at commit 3da31857 (the audit's final state), in `before/`. Captured at 375, 390, 430, 768, 1440 and an iPhone 14 emulation.
- **After**: the live site at commit d70c9358 (the brand batch plus its hero-gutter follow-up), in `after/`, same widths. The last commit of the batch adds one CSS rule that hides the record readout's footer while it is empty; the after captures of the untapped state (`after/root-*-s-try.jpg`) predate that rule and still show the footer line "0 of 4 posts read".

The audit's own before and after sets from 28 September are kept in `before-2026-09-28/` and `after-2026-09-28/`.

Live URL: https://www.algorithmlens.com/

## The landing, section by section

| Section | Old | Before | After | What changed |
| --- | --- | --- | --- | --- |
| Header | `old/landing-1440-s00-nav.jpg`, `old/landing-390-s00-nav.jpg`, hover `old/landing-1440-state-nav-hover.jpg` | `before/root-1440-s-nav.jpg`, `before/root-390-s-nav.jpg` | `after/root-1440-s-nav.jpg`, `after/root-390-s-nav.jpg`, hover `after/root-1440-state-nav-hover.jpg` | The old shape is back: wordmark at 38 px, links in the old order, a divider, one dark pill. Sticky over blurred paper. The blue underline sweeps on hover at 240 ms. Phones show the wordmark and the pill. |
| Hero | `old/landing-1440-s01-hero.jpg`, `old/landing-390-s01-hero.jpg` | `before/root-1440-s-hero.jpg`, `before/root-390-s-hero.jpg`, `before/root-768-fold.jpg` | `after/root-1440-s-hero.jpg`, `after/root-390-s-hero.jpg`, `after/root-768-fold.jpg`, film playing `after/root-1440-state-film-toggled.jpg` | Two columns from 720 px with the film in the old panel chrome (pulse dot and scan line while it plays, an honest four-post tally with one blue segment), the dot-grid paper texture, a ring eyebrow, the green hand-drawn underline under "clearly", the clock line and the platform line. Reading order is headline, lede, button, limit. "Read the film in words" lives in the card. |
| The report | `old/landing-1440-s02-report.jpg`, `old/landing-390-s02-report.jpg` | `before/root-1440-s-record.jpg`, `before/root-390-s-record.jpg` | `after/root-1440-s-record.jpg`, `after/root-390-s-record.jpg` | The old metric tiles return with honest counts (45 posts, 42 accounts, 6 printed ad labels in blue, 4 scans) over the record card, which now has a sheet header, a loading line and a shorter frame. The duplicated limit sentence is gone. Full-page captures still leave the sandboxed frame blank; the section captures show it. |
| Feedback loop, now the record forming | `old/landing-1440-s03-loop.jpg`, tapped `old/landing-1440-state-loop-4taps.jpg`, `old/landing-390-state-loop-4taps.jpg` | none (the section did not exist) | `after/root-1440-s-try.jpg`, `after/root-1440-state-try-1tap.jpg`, `after/root-1440-state-try-4taps.jpg`, `after/root-390-state-try-4taps.jpg` | The drawn phone, the tap ring, the pop-in rows and "Start over" are the old interaction; the answers are now the record's observable facts (printed ad label, account, origin label, position) and what stays unknown. No inferred audiences. |
| Labels marquee, now can and cannot | `old/landing-1440-s04-labels.jpg`, `old/landing-1440-state-labels-later.jpg` | `before/root-1440-s-limits.jpg` (a paragraph) | `after/root-1440-s-limits.jpg`, `after/root-390-s-limits.jpg` | The two counter-moving rows with edge fades are back, in sentence case: what a scan can read (charcoal chips) and what it cannot (hollow dashed chips). The two honesty sentences follow. Under reduced motion the rows wrap and stand still. |
| Three steps | `old/landing-1440-state-how-step1.jpg`, `-step2`, `-step3`, `old/landing-390-state-how-step3.jpg` | `before/root-1440-s-how.jpg`, `before/root-390-s-how.jpg` | `after/root-1440-s-how.jpg`, `after/root-1440-state-how-step2.jpg`, `-step3`, `after/root-390-state-how-step3.jpg` | Selectable steps with the numbered circle, the green bar and a keyed preview panel; auto-advance every five seconds, paused on hover or focus, off under reduced motion. Previews are the six platforms, the review checklist and the count tiles. No percentages. |
| Privacy | `old/landing-1440-s06-privacy.jpg`, `old/landing-390-s06-privacy.jpg` | none (a footer link only) | `after/root-1440-s-privacy.jpg`, `after/root-390-s-privacy.jpg` | "Your data stays yours." with the 2 by 2 icon cards, copy checked against the privacy policy, titles in ink, icon squares in the green tint. |
| Ways to use | `old/landing-1440-s07-ways.jpg`, hover `old/landing-1440-state-way-hover.jpg` | none | `after/root-1440-s-ways.jpg`, `after/root-390-s-ways.jpg`, hover `after/root-1440-state-way-hover.jpg` | Four tinted cards; blue where the fact is the platform's (news diet, ad labels), green where it is the reader's (re-tune, teach). Lift and icon tilt on hover at 240 ms. Copy no longer promises ad categories or trends. |
| Trust | `old/landing-1440-s08-trust.jpg`, `old/landing-390-s08-trust.jpg` | none | `after/root-1440-s-trust.jpg`, `after/root-390-s-trust.jpg` | The worked example returns as a count: 6 of 45 with a count bar, legend and the arithmetic line. Trust points are methodology, limits and no analytics; the MIT claim stays out. |
| Final call and launch list | `old/landing-1440-s09-final-cta.jpg` | `before/root-1440-s-launch.jpg`, `before/root-390-s-launch.jpg` | `after/root-1440-s-launch.jpg`, `after/root-390-s-launch.jpg`, outcomes `after/root-1440-state-form-empty.jpg`, `-invalid`, `-500`, `-offline`, `-received` | The old centered close on a dotted panel, with the form card beneath it. The form, its consent copy and its five outcomes are byte for byte the audit's. |
| Footer | `old/landing-1440-s10-footer.jpg`, `old/gate-1440-s03-footer.jpg` | `before/root-1440-s-footer.jpg` | `after/root-1440-s-footer.jpg`, `after/root-390-s-footer.jpg` | Four columns with the wordmark, the tagline and the fictional-data line; every previous link kept (read the limits, explore the example, privacy policy, terms, the privacy address). |
| Full page | `old/landing-1440.jpg`, `old/landing-390.jpg`, `old/gate-1440.jpg`, `old/gate-390.jpg` | `before/root-1440.jpg`, `before/root-390.jpg`, `before/root-375.jpg`, `-430`, `-768`, `-iphone` | `after/root-1440.jpg`, `after/root-390.jpg`, `after/root-375.jpg`, `-430`, `-768`, `-iphone` | Cream and white bands alternate; hero and close sit on the dot texture. |
| Reduced motion | `old/landing-1440-state-reduced-motion-fold.jpg` | `before/root-1440-state-reduced-motion.jpg`, `before/root-390-state-reduced-motion.jpg` | `after/root-1440-state-reduced-motion.jpg`, `after/root-390-state-reduced-motion.jpg` | No reveal, no pulse, no scan line, no marquee motion, no auto-advance, no tap ring; the underline is drawn, not animated. |

## The other pages

| Page | Old | Before | After | What changed |
| --- | --- | --- | --- | --- |
| Explorer | none (the old site had no explorer) | `before/explore-1440-fold.jpg`, `before/explore-390-fold.jpg`, `before/explore-768-fold.jpg`, views `before/explore-1440-view-*.jpg` | `after/explore-1440-fold.jpg`, `after/explore-390-fold.jpg`, `after/explore-768-fold.jpg`, views `after/explore-1440-view-*.jpg`, `after/explore-390-view-*.jpg`, datasets `after/explore-*-dataset-*.jpg` | The top bar carries the landing's "Front page" link and the dark pill; the provenance dot is a ring; the next-view control has a visible label; the chip row fades at its right edge on phones; hover states on the rail and controls; the transcript measure is 62 ch; the theme color matches the landing; the empty dataset shows a small sheet reading "0 posts". |
| Specimen | none | `before/specimen-1440-fold.jpg`, `before/specimen-390-fold.jpg` | `after/specimen-1440-fold.jpg`, `after/specimen-390-fold.jpg` | Header links to the front page and the explorer, with the underline sweep; theme color matched. |
| Film page | none | `before/film-1440-fold.jpg`, `before/film-390-fold.jpg` | `after/film-1440-fold.jpg`, `after/film-390-fold.jpg` | The landing header, a ring label, the film in the paper card with the same footer grammar as the hero, a two-column layout at 900 px and up. |
| Privacy policy | `old/privacy-1440-fold.jpg` (the app page) | `before/privacy-1440-fold.jpg`, `before/privacy-390-fold.jpg` | `after/privacy-1440-fold.jpg`, `after/privacy-390-fold.jpg` | Header at the landing's wordmark size with two links; the site note card at 18 px radius with the sheet shadow. The policy text is unchanged. |
| Terms and methodology | `old/terms-1440-fold.jpg`, `old/methodology-1440-fold.jpg` | `before/terms-*.jpg`, `before/methodology-*.jpg` | `after/terms-*.jpg`, `after/methodology-*.jpg` | Unchanged: still the old app pages, pending Justin's decision (`SITE_DIAGNOSIS.md` 3.8). |
| 404 | `old/404-1440-fold.jpg` (the app's) | none (Vercel's default) | live at any unknown path, source `AlgorithmLens_Cowork/public/404.html` | A static page in the paper system with the wordmark, a limit line and links home. `curl -I /nothing-here` answers 404. |

## Lighthouse mobile, simulated throttling

The audit's final scores (Lighthouse 12.8, `lighthouse-root-after.html`, `lighthouse-explore-after.html`) and this batch's (Lighthouse 13.5, `lighthouse-root-brand.report.html`, `lighthouse-explore-brand.report.html`), one run each unless noted.

| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Root, before (audit final, 28 Sep) | 99 | 100 | 100 | 100 | 1.1 s | 1.8 s | 0 ms | 0.005 |
| Root, after, run 1 | 95 | 100 | 100 | 100 | 1.1 s | 1.8 s | 10 ms | 0.128 |
| Root, after, run 2 | 99 | 100 | 100 | 100 | 1.1 s | 1.9 s | 10 ms | 0 |
| Root, after, run 3 (the saved report) | 100 | 100 | 100 | 100 | 1.1 s | 1.9 s | 10 ms | 0 |
| Explorer, before (audit final) | 99 | 100 | 100 | 100 | 1.6 s | 1.7 s | 100 ms | 0 |
| Explorer, after | 99 | 100 | 100 | 100 | 1.5 s | 1.7 s | 0 ms | 0 |

The root's first run recorded a layout shift of 0.128 that two further runs did not reproduce (the serif font's swap landing before or after first paint); every run is at or above 95. A run with Lighthouse's `perf` preset, which uses real devtools throttling with a 4 times CPU slowdown instead of simulation, scores both the root (85) and the unchanged explorer (84) far lower; those numbers are a method difference, not a regression, and are not the ones the audit used. The follow-up commit moved the scan line and the marquee onto transform so they do not force layout every frame.

Document weight: the root is 51,456 bytes on the wire (under the 300 KB ceiling), the explorer 27,376, the film page 7,059. Total mobile page weight 699 KiB for the root, of which the film is 398 KiB and streams with byte ranges.

## Copy checks on the live pages

`node scripts/web-audit/copy-check.mjs https://www.algorithmlens.com`, run against the final deployment:

| Page | Uppercase transforms | Em dashes (text, HTML) | Linear gradients | Inference verbs | Completeness claims |
| --- | --- | --- | --- | --- | --- |
| / | 0 | 0, 0 | 0 | none | none |
| /explore/ | 0 | 0, 0 | 0 | none | none |
| /explore/specimen.html | 0 | 0, 0 | 0 | none | none |
| /explore/experience-film.html | 0 | 0, 0 | 0 | none | none |
| /privacy/ | 0 | 0, 0 | 0 | not checked (locked legal text) | none |
| /404.html | 0 | 0, 0 | 0 | none | none |

The inference-verb list is because, proves, shows that, is designed to, always, definitely, chosen for you, wants you, targets you. The completeness list is your whole, entire or full feed, every post, all your posts, everything you see, complete picture or history, counted only in sentences that do not negate them. The dot-grid texture is a `radial-gradient` pattern; no `linear-gradient` is painted anywhere.

## What else the live run confirmed

- **Headers**: every page still serves the Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and X-Frame-Options from `vercel.json`, unchanged; the 404 path answers 404 with the same set.
- **Outbound requests**: zero non-origin requests on the root, explorer, specimen, film and privacy pages (measured through Playwright); the launch-list POST remains the only outbound request, on submit.
- **Overflow**: no horizontal overflow on any of the six pages at 375, 390, 430, 768 or 1440 px.
- **Redirects, privacy and terms links, the form**: untouched by this batch.
- **Reduced motion**: every new animation is off under `prefers-reduced-motion`, verified in `after/*-state-reduced-motion.jpg`.

## Left for Justin

The canon conflicts are tabulated at the end of `BRAND_INVENTORY.md` (C1 to C23). The diagnosis items that need a decision are listed at the end of `SITE_DIAGNOSIS.md`. In one place:

1. A two-color headline, or "See your feed clearly." in ink with the green underline as shipped (C1, diagnosis 2.12).
2. Re-host `/methodology` and `/terms` as static paper pages, or leave the app pages (C20, diagnosis 3.8).
3. "Built at MIT": return it with a citation, or leave it out (C3).
4. The effort promise: "One short recording. Review after, not during." stands in for "Two minutes a week" until the number is measured (C5).
5. Whether the tappable feed's readout may show an inference row, marked as inference (C11).
6. Whether the old label vocabulary may appear anywhere as an illustration of platform categories (C12).
7. An About page (C21).
8. The loop diagram, "record, review, return" (C23).
9. Confirm the dot-grid paper texture is acceptable under "no decorative gradients" (C6).
10. Whether a slow "record forming" animation should one day replace the film in the hero (C2).
