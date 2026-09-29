# AlgorithmLens web audit

Date: 28 September 2026. Auditor: Claude Fable 5.1, unattended session.
Scope: the live pages at https://www.algorithmlens.com/ (root), /algorithmlens/ (landing), /algorithmlens/explore/ (explorer), /algorithmlens/explore/specimen.html and /algorithmlens/explore/experience-film.html, as deployed from commit b9a1e192 of this repository. Source paths below are relative to `AlgorithmLens_Cowork/`, the Vite app that Vercel builds; the static pages live in its `public/` folder.

Method: Playwright 1.57 with bundled Chromium 143 at 375, 390, 430, 768 and 1440 px wide, plus an iPhone Safari user-agent emulation at 390 px (Chromium engine; a WebKit build was not available, so anything marked "iOS Safari" below is an emulation and is labeled unverified where it matters). Lighthouse 12 mobile with simulated throttling. A throttled 4G profile through the Chrome DevTools Protocol (1.6 Mbps down, 750 Kbps up, 150 ms round trip). Response headers by curl. The launch-list form was exercised against the live Supabase endpoint from the live origin, then with intercepted responses for the states the live server does not currently produce. Every sentence on the four static pages was read against the app canon in `mobile/CLAUDE.md`, `mobile/ARCHITECTURE.md`, `mobile/src/lib/claimsRegister.ts` and `mobile/src/lib/inferenceGuard.ts`.

Labels: **observed** means measured or seen directly in this session; **inferred** means a conclusion drawn from what was observed; **unverified** means it could not be checked from here (for example real iOS hardware).

Screenshots from the run are in `docs/web-audit/before/`. Full-page captures do not paint the sandboxed specimen iframe on the landing page (a Chromium out-of-process frame limitation); a viewport capture of the same region confirmed that the iframe does render, so the blank block in `landing-390.jpg` and `landing-1440.jpg` is a capture artifact, not a page defect.

## Summary

| Priority | Count | What it means |
| --- | --- | --- |
| P0 | 4 | Breaks the promise the pages make (no security headers, a 5 MB landing document, a live root page that talks to Stripe and Google, and a launch-list form that cannot succeed today and says so vaguely) |
| P1 | 12 | Honesty, legal or structural gaps a visitor or a journalist would notice |
| P2 | 21 | Layout, accessibility, SEO and performance defects worth fixing before launch |
| P3 | 16 | Polish and leftovers |

Lighthouse mobile, before (observed, one run each, simulated throttling):

| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Root `/` | 69 | 100 | 79 | 100 | 3.4 s | 5.9 s | 170 ms | 0 |
| Landing `/algorithmlens/` | 29 | 100 | 100 | 100 | 16.7 s | 16.7 s | 1,490 ms | 0.015 |
| Explorer `/algorithmlens/explore/` | 44 | 90 | 100 | 100 | 5.2 s | 5.3 s | 120 ms | 0.628 |

Throttled 4G load (observed, Chromium, 390 px):

| Page | Document bytes on the wire | Document bytes decoded | Load event | First paint |
| --- | --- | --- | --- | --- |
| Landing | 3,219,711 | 5,346,917 | 16.2 s | 0.9 s (the header only; the film and record arrive with the load event) |
| Explorer | 874,580 | 1,663,474 | 4.7 s | 1.5 s |
| Root | 1,567 (plus 519 KB of scripts, fonts and Stripe) | 3,826 | 3.3 s | 1.7 s |
| Specimen | 235,602 | 789,321 | 1.6 s | 1.5 s |

## Findings

IDs are grouped by the audit areas in the brief. Each carries a priority, a label and the file and line where the fix belongs.

### (a) Honesty of copy against the app canon

- **H-1 · P1 · observed** "A scan shows what appeared. It cannot reveal why a platform chose it for you." `public/algorithmlens/index.html:6`. The sentence denies knowledge of the reason but still asserts that the platform chose the post for the reader. The app's canon scanner bans "chosen for you" as an agency claim; this is the same claim in a different tense. Rewrite to describe what the scan can and cannot read without a platform subject.
- **H-2 · P1 · observed** "Scan a feed. Get a clear report: what's filling it, who it's from, and what's an ad." `public/algorithmlens/index.html:6`. "What's an ad" promises a fact the app does not have; the app reads printed ad labels and says so ("carried an ad label", claims register `ads.count.sentence`). "Who it's from" is fine (account names are observed). Rewrite the third clause to the label basis.
- **H-3 · P2 · observed** The root page's meta description reads "See what showed up in your feed. Understand ads, themes, and influence patterns across platforms." `index.html:23,27,35` and `src/components/SEO.jsx:4` ("See what's really in your feed"). "Influence patterns" and "themes" are inferences the app does not make, and "across platforms" implies a cross-platform read the app never does (one feed per scan). The phrase named in the brief, "See what your algorithms see in you", is no longer live: it was replaced in an earlier fix (see `AUDIT-COMPLETE-SUMMARY.md:63`). The live phrase still overclaims and is replaced in this batch.
- **H-4 · P1 · observed** "Built at MIT" appears three times on the root page (`src/App.jsx:221,251` and the waitlist section) and in the v12 landing component. Nothing on the site documents the claim, and the landing handoff notes (`mobile/design/experiences/LANDING-README.md`, "Unverified institutional claims ... were not carried forward") already treated it as unverified. Removed with the Coming Soon page.
- **H-5 · P2 · observed** "Your email is used only for launch news. It is stored by AlgorithmLens, deleted on request, and never sold." `public/algorithmlens/index.html:10`. "Deleted on request" is a promise with no request route on the page (no address, no link). Give the address (`privacy@algorithmlens.com`, the address the privacy policy already names) so the sentence is actionable, and keep "never sold" only alongside the policy link.
- **H-6 · P2 · observed** Specimen headline "Your feed, held up to the light." and explorer toolbar line "Your feed, with room to look." (`public/algorithmlens/explore/specimen.html:8`, `public/algorithmlens/explore/index.html:5`). Both render over example data and say "your". The limit line under the specimen ("Only the posts in this scan, not your whole feed") is right; the headline is not. Change both to "A feed".
- **H-7 · P3 · observed** The example film's on-screen card says "The label is visible. The targeting reason is not." (hero film, embedded in `public/algorithmlens/index.html:11`). "Targeting" presumes a targeting decision. The film is a rendered asset and cannot be re-cut here; the written "Read the film" transcript beside it does not repeat the word. Logged for the next film cut.
- **H-8 · P3 · observed** Explorer provenance line prints the platform in lower case from the data ("Example · instagram · Sep 20 · 45 posts", `public/algorithmlens/explore/index.html:104`). A proper noun in lower case reads as a bug rather than restraint.
- **H-9 · P3 · observed, positive** Every dataset on every page is labeled "Example" or "fictional" where it is shown: the record label, the film caption and in-film card, the explorer provenance and feed mast, the specimen's "Example scan · 45 posts" chip. Counts come before rates everywhere (no percentage appears on the static pages). Every finding in the explorer carries a limit line. No forbidden inference verb ("because", "proves", "shows that", "is designed to", "always", "definitely") appears on any of the four static pages. No sentence implies live monitoring; the landing states "This page is an example, not a live scan".
- **H-10 · P1 · observed** The root page's waitlist copy ("Get early access when AlgorithmLens launches", "Join the Waitlist") and its footer links to "Start a Scan", "Dashboard" and "Plus" (`src/App.jsx:215-230`) describe the retired web product with a paid tier. The app is free by decision (`mobile/CLAUDE.md`, "no paywall, no subscriptions"). Retire with the gate.

### (b) Design canon

- **D-1 · P1 · observed** The root page is a different product visually: Geist from Google Fonts, Title Case ("Join the Waitlist", "Sign In", "Privacy Policy"), a blue pill button, a gradient divider (`src/App.jsx:200`), and the old raster wordmark. The landing pages use the field system (cream paper, Source Serif 4 headlines, ink button). Resolved by making the landing the root (task 4).
- **D-2 · P2 · observed** Explorer origins view colors followed posts blue and suggested posts green (`public/algorithmlens/explore/index.html:135`, "Blue: followed. Green: suggested."). The app's color law is the reverse: blue marks the platform's hand (ads, suggested), green marks the reader's own choices (`mobile/design/firstrun/FirstRunMoments.dc.html`, tour moment 1: green "from channels you follow", hollow blue "suggested to you", filled blue "advertising"). Swap and update the legend.
- **D-3 · P3 · observed** The film page (`public/algorithmlens/explore/experience-film.html:1`) sets Georgia for its headline and does not load Source Serif 4; it also uses an arrow glyph in a link ("← Explore the experience").
- **D-4 · P3 · observed** Sentence case, no uppercase transforms, no em dashes and no gradients on all four static pages (measured: 0 em dashes, 0 uppercase-transformed elements, 0 gradient backgrounds). The ink token on the web pages is #3A3730 while the app's dark object is #1A1712 (`mobile/design/brand/Ink and Wordmark.dc.html`); the difference is visible side by side on the primary button. Aligned in the design pass.
- **D-5 · P3 · observed** Landing header navigation wraps to two lines at 375 to 430 px and the hero shows five text elements before the visual (eyebrow, headline, intro, limit, button, caption), against the app's one-headline, one-visual, one-limit, one-action card grammar. Addressed in the design pass.

### (c) Layout at every width

- **L-1 · P2 · observed** Explorer at 200 percent zoom (375 to 430 px) overflows the page horizontally: document width 563 px in a 390 px viewport, driven by the fixed 310 px feed frame plus its 40 px right padding and the mobile nav chips (`public/algorithmlens/explore/index.html:16,25`). Specimen at 200 percent: 533 px in 390 (`specimen.html:6`, fixed 225 px scene). Landing at 200 percent: 421 px in 390 (the 190 px brand plus the wrapped nav). Root: no overflow.
- **L-2 · P2 · observed** Explorer record view at 390 px: the date chips sit under the sheet stack and the first chip ("Aug 30") is partly hidden behind the lowest sheet (`docs/web-audit/before/explore-record-390.jpg`; `explore/index.html:26`, `.record-stage{height:340px}` with chips laid out inside the same scene).
- **L-3 · P2 · observed** Root page at 375 to 430 px: the fixed bottom tab bar covers the footer's "Plus" link and the Legal column (`docs/web-audit/before/root-390.jpg`). Goes away with the gate.
- **L-4 · P2 · observed** Explorer mobile nav chips overflow their strip by design (horizontal scroll) but the last chip is clipped at the right edge with no fade or scroll hint at 375 to 768 px, and two chips sit outside the strip at 768 px (`explore/index.html:25`).
- **L-5 · P3 · observed** Tap targets under 44 px: landing nav links 22 px tall, the "Open the full example explorer" link 17 px, the consent checkbox 18 px (row is 44 px via its label); explorer "Next experience" button 40 by 40 px, mobile nav chips 42 px tall, the 45 feed index marks 20 by 9 px each (Lighthouse target-size fail); specimen marks 16 px (an accessible list exists as the alternative); film page links 21 px. (`index.html:6-10`, `explore/index.html:16,25`, `specimen.html:6`.)
- **L-6 · P3 · observed** Measure: at 768 and 1440 px the landing's section paragraphs run about 90 to 93 characters per line at 16 px (max-width 740 px, `index.html:5`), and explorer transcript lines run 98 to 103 characters. The brief asks for under 70.
- **L-7 · P3 · observed, positive** No horizontal overflow at 100 percent zoom on any page at any of the five widths. No clipped controls at 100 percent except L-2 and L-4.

### (d) Performance

- **P-1 · P0 · observed** The landing document is 5,348,156 bytes: a 330 KB TTF font (443 KB as base64, line 5), a 444 KB PNG poster (line 6), the 1.53 MB film as base64 (2.04 MB, line 11), and the 1.66 MB specimen document as base64 (2.22 MB, line 11). On throttled 4G the load event fires at 16.2 s and Lighthouse's first contentful paint is 16.7 s because the whole document must arrive before the body script decodes the film into a blob. Total blocking time is 1.49 s from the base64 decode on the main thread (`index.html:1239`). The film cannot stream: a blob URL has no byte ranges.
- **P-2 · P1 · observed** Every static asset is served with `cache-control: public, max-age=0, must-revalidate`, including the MP4s and the specimen page. The `headers` block in `vercel.json` is ignored because the file also uses the legacy `routes` key (Vercel applies one or the other; see S-1). Fonts and films should be immutable for a year.
- **P-3 · P1 · observed** Explorer: 855 KB of the 1.66 MB document is two base64 JPEGs (194 KB and 430 KB originals for 310 px wide cards) and two fonts (330 KB and 208 KB TTF). Cumulative layout shift 0.628 (Lighthouse) as the workspace renders after the script runs (`explore/index.html:69,150`).
- **P-4 · P2 · observed** Root page loads 519 KB including Stripe's script and iframe and Google Fonts on a page that sells nothing (`index.html:9-13`, `src/lib/plan/PaywallProvider.jsx`).
- **P-5 · P3 · observed** Specimen: 789 KB decoded, 718 KB of it the same two fonts again.

### (e) Video behavior on iOS Safari

- **V-1 · P2 · observed (Chromium) / unverified (iOS hardware)** The hero film has `muted`, `playsinline`, `loop`, `controls`, `preload="metadata"` and a poster. Autoplay is requested once by script when reduced motion is off (one `play()` call counted, no retry loop) and never when reduced motion is on (zero calls, `autoplay` attribute removed, poster shown, toggle reads "Play example film"). Under the iPhone user agent the same held. Real Safari's low-power-mode refusal path is handled by the `.catch(sync)` branch (`index.html:1239`) which only updates the button label. What could not be verified here: Safari's behavior when the blob source is 1.5 MB and the decode happens before `load`; on hardware the poster may show for several seconds with no progress indication.
- **V-2 · P1 · inferred** Because the source is a blob built from base64, iOS cannot start playback until the entire document has downloaded and decoded (P-1). A file source with a poster streams from the first bytes. This is the fix for V-1's unverified part as well.
- **V-3 · P3 · observed** The film page's video (`experience-film.html:1`) is user-initiated with controls, `playsinline` and a poster, no autoplay; correct. It is not muted, and has no captions or transcript.

### (f) Accessibility

- **A-1 · P2 · observed** Explorer: heading order jumps from h1 to h3 (the news card headline inside the feed is an h3, `explore/index.html:99`); each feed card is an `article` with `role="button"` and `tabindex` (invalid role for the element, and its visible text is not in the accessible name; Lighthouse aria-allowed-role and label-content-name-mismatch); the inactive card's account name is #93908A on #FFFDF9 at 13 px, contrast 3.13 (from `opacity:.55` on `.stream-card`, `explore/index.html:16`).
- **A-2 · P2 · observed** Landing form: the status paragraph is `role="status" aria-live="polite"` (`index.html:10`), which is right for success, but failures are also polite and the email input never receives `aria-describedby` or `aria-invalid`, so a screen reader that missed the polite announcement has nothing on the field. Native validation bubbles handle the empty and malformed cases.
- **A-3 · P2 · observed** Landing: the sandboxed specimen iframe takes eight Tab stops before focus leaves it (keyboard users cannot see focus inside a sandboxed frame from the parent's styles, but the frame's own focus ring is present); there is no skip link and no way to bypass the frame. Focus order on the landing is otherwise the reading order and every focused control shows the 2 px blue ring (`index.html:5`).
- **A-4 · P2 · observed** Root: no h1 on the page; the skip link is 1 by 1 px until focused (fine) but the "Join Waitlist" banner button's visible text is not in its aria-label (Lighthouse label-content-name-mismatch); the disabled "Sign In / Coming soon" spans are in the tab order.
- **A-5 · P3 · observed** Reduced motion: the landing and explorer honor `prefers-reduced-motion` (smooth scroll off, animations off, film paused). The specimen keeps its 3D rest pose but disables transitions. The explorer's record stack and ad lift animate only on user action.
- **A-6 · P3 · observed** Alt text: the explorer's three feed photos carry alt "Fictional example post image"; the wordmark SVGs carry `role="img"` and a label. The landing's hero poster is a video poster (no alt needed) and the record label chip is text.
- **A-7 · P3 · observed** Form labels: every input on the four pages has a label or aria-label (measured). The specimen's "Explore" select label wraps awkwardly at 390 px.

### (g) The launch-list form, end to end from the live origin

- **F-1 · P0 · observed** A valid submission from the live page reaches the endpoint (CORS preflight 204 with `access-control-allow-origin: *`, then POST) and the server answers **500** because the `launch_list` table does not exist yet (`mobile/supabase/RUN_MANUALLY.md`). The page shows "We could not confirm your request. Please try again later." The email stays in the field. Nothing was saved, but the sentence does not say so, and it is the same sentence for a network failure, a 429 and a 400. Rewrite per the brief: "The launch list could not record your address. Nothing was saved. Try again later." for the 5xx case, with distinct copy for offline, rate-limited and rejected.
- **F-2 · P2 · observed** Invalid email: blocked by native validation, no request sent. Unchecked consent: blocked, no request sent. Double submit: the button disables on the first click and one POST was sent for two clicks. Network failure (request aborted): the generic sentence again. Simulated 204: "Your launch-list request was received." and the form resets (email cleared, consent unchecked). Simulated 500: generic sentence. All correct except the copy.
- **F-3 · P2 · observed** The request carries `Content-Type: application/json` and no credentials, matches the endpoint contract, and the response never echoes the address (confirmed by header inspection). The endpoint's rate limit (5 per 10 minutes per instance) was not tripped in this run.
- **F-4 · P2 · observed** The root page has a second, unrelated signup (`/api/subscribe`, Beehiiv, `src/components/WaitlistSignup.jsx:49`). Two lists with two consent texts for one product. Retired with the gate.

### (h) SEO and sharing

- **S-1 · P2 · observed** Landing: no canonical, no Open Graph or Twitter tags, no favicon link (the browser falls back to the SPA's `/favicon.ico`), no `theme-color`. Explorer and specimen: inline SVG favicons, no canonical or social tags. Film page: none of these. Root: full set, but the description overclaims (H-3) and `og:image` is the old product's card (`public/og.png`, not example-labeled).
- **S-2 · P2 · observed** `public/sitemap.xml` lists only the root, with a January 2026 date. `robots.txt` allows everything and points at the sitemap.
- **S-3 · P2 · observed** Any unknown path returns the SPA shell with HTTP 200 (`/explore/` returned 200 during this run although it did not exist; `vercel.json:20`, catch-all route). Search engines see soft 404s.
- **S-4 · P3 · observed** `https://algorithmlens.com/` redirects to `www` with 307 instead of 301 or 308 (Vercel domain setting, not in the repo).
- **S-5 · P3 · observed** Titles: "See your feed clearly | AlgorithmLens", "A closer look | AlgorithmLens", "Specimen lens | AlgorithmLens", "The experience in motion | AlgorithmLens", root "Algorithm Lens" (with a space, unlike the wordmark).

### (i) Security headers and outbound requests

- **X-1 · P0 · observed** No page serves `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` or `X-Frame-Options`. `vercel.json` declares them, but the file also has a legacy `routes` array, and Vercel ignores `headers`, `rewrites` and `redirects` when `routes` is present (`vercel.json:1-27`). Only `strict-transport-security` (from the platform) is present.
- **X-2 · P0 · observed** Root page outbound requests: `fonts.googleapis.com`, `fonts.gstatic.com`, `js.stripe.com` (script and an iframe), `m.stripe.network`, `m.stripe.com`, and Stripe sets a third-party cookie (`m`, Lighthouse third-party-cookies) on a page that has no checkout. Landing, explorer, specimen and film pages: zero non-origin requests (measured: 2, 1, 1 and 3 requests total, all same-origin).
- **X-3 · P3 · observed** The explorer and specimen register a browser "model context" tool when the experimental `document.modelContext` API exists (`explore/index.html:148`, `specimen.html:57`). Harmless today, but it is an undocumented code path on pages that promise to make no requests and do nothing unasked. Removed.
- **X-4 · P3 · observed** The landing's `LAUNCH_LIST_ENDPOINT` is a Supabase edge function on a third-party origin; it is the one outbound request the page makes and only on submit. Kept as instructed. A CSP `connect-src` must name it.

### (j) The root page

- **R-1 · P1 · observed** The root serves the Coming Soon gate: a banner, a Beehiiv waitlist, disabled nav items reading "Coming soon", a footer for the retired product, and the gated routes `/start`, `/dashboard`, `/plus` all answering 200 with the same shell. The landing that the product now stands behind is at `/algorithmlens/`, which nothing links to. Task 4 moves the landing to the root.
- **R-2 · P2 · observed** The root meta description is covered by H-3; the requested replacement ("AlgorithmLens: see what a short scan of your feed could read") is applied in task 4.

### (k) Links and orphans

- **K-1 · P1 · observed** No page links to the landing except itself: the explorer's wordmark links to `#feed`, the film page links only to the explorer, and the specimen has no link out at all. The root page does not link to `/algorithmlens/` anywhere. The landing is an orphan from the site's own root.
- **K-2 · P2 · observed** Every internal link on the four static pages resolves (25 URLs checked, all 200): landing to `explore/`, explorer to `specimen.html` and `experience-film.html`, film page to the explorer and the MP4. Root links to `/start`, `/dashboard`, `/plus`, `/methodology`, `/privacy`, `/terms` all return 200 (the first three are the gated product).
- **K-3 · P3 · observed** `/algorithmlens` without the trailing slash and `/algorithmlens/index.html` both serve the landing as separate URLs with no canonical (S-1).

### (l) Legal

- **G-1 · P1 · observed** No privacy policy or terms link on the landing, explorer, specimen or film page. The SPA has `/privacy` and `/terms` pages, but they mirror a July 2026 draft ("Last updated: July 2026", `src/pages/PrivacyPage.jsx:46`) while the app's texts were revised on 1 September (privacy, research participation section) and 27 September (terms) in `mobile/legal/`. Host the current texts and link them from every page's footer and from the consent line.
- **G-2 · P2 · observed** Consent wording "I agree to receive AlgorithmLens launch updates by email." is specific and unbundled (good). It does not say how to withdraw. Add one sentence naming the address and the policy.
- **G-3 · P3 · observed** The app's privacy policy uses 32 em dashes as list separators; the site's rule is none. The hosted copy replaces them with colons and commas without changing the wording.

## Ranked list

P0: X-1 headers not served · P-1 landing weight and blob film · X-2 root's Stripe and Google requests · F-1 form failure copy and the 500 path.

P1: H-1 platform-chose sentence · H-2 "what's an ad" · H-4 "Built at MIT" · H-10 retired product copy · D-1 root design · P-2 no caching · P-3 explorer weight and CLS · V-2 blob source on iOS · R-1 gate · K-1 orphan landing · G-1 legal links · S-3 soft 404s (moved up because every link on the old root leads to one).

P2: H-3 H-5 H-6 D-2 L-1 L-2 L-3 L-4 P-4 V-1 A-1 A-2 A-3 A-4 F-2 F-3 F-4 S-1 S-2 R-2 K-2 G-2.

P3: H-7 H-8 D-3 D-4 D-5 L-5 L-6 P-5 V-3 A-5 A-6 A-7 S-4 S-5 X-3 X-4 K-3 G-3.

What was checked and found clean is listed inline as "positive" (H-9, L-7) so the next auditor does not repeat it.

## After the fixes: live re-check on 28 September 2026

Deployed as commit 5d725be0 (production deployment 6725451254, reported success through the GitHub deployments API). The same Playwright audit and Lighthouse runs were repeated against the live root. After screenshots are in `docs/web-audit/after/`; Lighthouse reports (HTML) for the root and the explorer, before and after, sit beside them.

Live root URL: https://www.algorithmlens.com/

### Lighthouse mobile, before and after (observed)

| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Weight |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Root, before (Coming Soon gate) | 69 | 100 | 79 | 100 | 3.4 s | 5.9 s | 170 ms | 0 | 532 KiB |
| Landing, before (at /algorithmlens/) | 29 | 100 | 100 | 100 | 16.7 s | 16.7 s | 1,490 ms | 0.015 | 3,147 KiB |
| Root, after (the landing at /) | 99 | 100 | 100 | 92 | 1.1 s | 1.8 s | 0 ms | 0.005 | 645 KiB |
| Explorer, before | 44 | 90 | 100 | 100 | 5.2 s | 5.3 s | 120 ms | 0.628 | 855 KiB |
| Explorer, after | 72 | 100 | 100 | 92 | 1.4 s | 1.7 s | 250 ms | 0.629 | 240 KiB |
| Privacy, after (new page) | 99 | 100 | 100 | 92 | 1.0 s | 1.0 s | 140 ms | 0.001 | 54 KiB |

The SEO 92 on every page is one audit, `robots-txt`, which Lighthouse runs by fetching `/robots.txt` from inside the page; the page's own Content-Security-Policy (`connect-src` limited to the launch-list endpoint) blocked that fetch. The policy now allows `'self'` in `connect-src`, which is the follow-up commit below; the file itself is valid and unchanged. The explorer's layout shift is addressed in the same follow-up (the app stays invisible until its first render, so nothing the visitor sees moves), as is the last accessible-name mismatch on the feed cards. The scores after that follow-up are recorded at the end of this section.

Throttled 4G, root document (observed): 5,362 bytes on the wire (14,622 decoded), first paint 0.6 s, load event 1.9 s, 192 KB for every request including the poster and fonts; the film streams on demand with byte ranges (`206 Partial Content`, `Accept-Ranges: bytes`). Before: 3.2 MB on the wire and a 16.2 s load.

### What the live run confirmed

- **Headers (X-1, P-2):** every response now carries `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` and `X-Frame-Options`; `/static/*` is `immutable` for a year; HTML is `max-age=600`. The explorer's policy uses host sources rather than `'self'` because it runs in a sandboxed frame with an opaque origin, and the frame rendered its record view live with no policy violations in the console.
- **Outbound (X-2):** the root, explorer, specimen, film and privacy pages make zero non-origin requests. The only outbound request on the site is the launch-list POST, on submit.
- **Redirects and 404s (R-1, S-3, K-3):** `/algorithmlens`, `/algorithmlens/`, `/algorithmlens/index.html`, `/algorithmlens/explore/...` and `/index.html` answer 301 to their new homes; `/privacy` 301s to `/privacy/`; the retired app routes (`/dashboard`, `/start`, `/plus`, `/pricing` and the rest) answer 307 to `/`; an unknown path answers a real 404. `/terms` and `/methodology` still serve the app.
- **Form (F-1, F-2):** from the live root, a valid submission reaches the endpoint (preflight 204, POST, 500 because the table still does not exist) and the page now says "The launch list could not record your address. Nothing was saved. Try again later." Offline: "The launch list could not be reached. Nothing was sent. Check your connection and try again." Simulated 204: "Your launch-list request was received." and the form resets. Invalid email and unchecked consent never send. One POST for a double click.
- **Video (V-1, V-2):** the film is a file source with a poster; muted, inline, looping, native controls plus an explicit toggle; one autoplay attempt when motion is allowed, none under reduced motion, no retry loop. Real iOS hardware remains unverified.
- **Links (K-1, K-2):** every internal link on the five pages resolves; the explorer, specimen and film page link back to the front page; the privacy policy and terms are linked from every page.
- **Layout (L-1 to L-7):** no horizontal overflow at 100 percent at any of the five widths on any page. At 200 percent zoom the root, explorer, specimen and film pages no longer overflow (the earlier 421, 563, 533 and 404 px documents are now 390 px wide at 390). The privacy page's retention table scrolls inside its own box at 200 percent.
- **Copy (H-1, H-2, H-5, H-6):** rewritten as described; zero em dashes, zero uppercase transforms, zero gradients on the static pages; "Example" or "fictional" stays visible on every dataset.

### Findings still open

- **P3 · observed** Explorer feed at 768 px: the transcript lines under "Read the same evidence in words" run about 100 characters; the reading column is otherwise under 70.
- **P3 · observed** `Access-Control-Allow-Origin: *` is present on every 200 response from the site, not only on `/static/*`; the source of the header on HTML responses was not identified from the repository (it does not appear on 404s). It exposes nothing that is not public, but it is untidy.
- **P3 · observed** The privacy page's retention table still widens the document at 200 percent zoom in Chromium's measurement even though it scrolls inside its wrapper; visually nothing is clipped.
- **P3 · observed** Explorer render-blocking stylesheet, about 370 ms of estimated savings on simulated 4G; inlining the critical rules was not done.
- **P3 · observed** The photos in the explorer's example feed are JPEG; Lighthouse suggests WebP for about 26 KB.
- **P3 · observed** `/terms` and `/methodology` (the surviving app pages) keep the old product's typography and spacing; they are linked from the footer only.
- **P3 · observed** The app's terms text in `mobile/legal/TERMS_OF_SERVICE.md` carries an unresolved counsel note (D-166) and was not published; the July version stays live at `/terms` until counsel resolves it.
- **P3 · unverified** iOS Safari on hardware: autoplay, low-power refusal and the sandboxed frame's fonts (which load cross-origin from an opaque origin and rely on the `Access-Control-Allow-Origin` header on `/static/*`).
- **P3 · observed** The example film's on-screen card still says "The targeting reason is not" (H-7); a re-cut of the film is the fix.
- **P3 · observed** The old `/api/subscribe` Beehiiv function remains deployed with no page calling it.
- **Not done, by decision:** the launch-list table (`mobile/supabase/RUN_MANUALLY.md`) still has to be created before the form can succeed; until then every real submission returns the honest "nothing was saved" sentence.

### Final scores after the follow-up (commit 523c4b5f, observed)

| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Root | 99 | 100 | 100 | 100 | 1.1 s | 1.8 s | 0 ms | 0.005 |
| Explorer | 99 | 100 | 100 | 100 | 1.6 s | 1.7 s | 100 ms | 0 |

The explorer rendered live with its render guard released (body class ready, app visible, four record sheets), the feed cards carry the hidden lead-in and no aria-label, and the console showed no errors. The Lighthouse HTML reports beside this file are from this final run.
