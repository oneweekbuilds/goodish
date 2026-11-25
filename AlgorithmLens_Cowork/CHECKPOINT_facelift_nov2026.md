# Checkpoint: site facelift and audit fixes
**Dates:** November 24, 2026 (facelift, two rounds) and November 24 to 25, 2026 (18 audit fixes). **Published November 25, 2026.**

## Where things stand

- **This is the live site.** On November 25, 2026 the new look, the 18 audit fixes and the privacy policy fix were published to algorithmlens.com together, at your say-so.
- The live site is built from the branch called `main`, which now holds all of it. The two work branches, `facelift-fable-5-2` and `site-audit-fixes`, are kept as they were.
- The exact version that was live before is bookmarked (a git tag) as `pre-facelift-2026-11-24`. That bookmark never moves, so the old site can always be brought back with the one line under "Undo" below. The bookmark is on this computer only.

## What changed: the facelift

### Round one: the home page
The page is laid out like a printed report, since that is what the app produces.

1. **Top of the page:** the headline "See your feed clearly." runs across the full width.
2. **Sections are numbered**, each with a small label and a much larger headline.
3. **The honest limit sentences** are set as large italic pull quotes instead of small grey text.
4. **The report section:** a larger stack of sheets, and the four counts as a ledger with big numerals.
5. **"Tap four posts":** the four example posts are laid out side by side, and each post's record appears directly underneath it when you press Read.
6. **"Can read / Cannot read":** two ruled lists side by side instead of two rows of sliding chips.

### Round two
1. A **contents line** under the top of the page lists the sections (on desktop).
2. Under each example post there is an **empty form** that fills in when you press Read.
3. You can **click a sheet** in the stack to bring it forward.
4. **"Three steps" no longer makes the page jump.**
5. **About** and **the "page not found" page** use the same headline style, rules and footer.
6. **Methodology, terms and privacy** use the same headline style and footer, and each has a **contents list** you can click.

## What changed: the 18 audit fixes

The full table is in `DESIGN_NOTES.md` (repo root), under "Audit fixes". In short:

- **Top of the home page:** a real screen from the app replaces the small film, three short lines under the button say what to expect, and on a computer a QR code beside the button opens the beta on your phone.
- **The report section** shows three more views: where posts came from, accounts that came back, and how each fact is marked.
- **A questions section** answers five questions, each with a link to where the answer comes from.
- **The launch form** has an optional "Tell me about Android" box.
- **Wording:** "printed ad label", "held on record" and similar phrases are replaced with plain words, and "fictional" and "example" are said far less often.
- **The TikTok page (/tt/)** is now a short page.
- **The explorer's** example posts have believable account names and captions.
- **Methodology** opens with a summary and ends with a dated list of changes. **Terms** state the public beta.
- **On phones** the header has a menu, and every button is big enough to tap.
- **The privacy policy** no longer says two things about the text of posts. It now says once, in three places, that the text is read and not saved; the leftover "streak" wording is gone; and its date is November 25, 2026. This was edited in the app repository with your approval. The app opens this same page from Settings, so no app update is needed.

## Files modified

- Home page: `AlgorithmLens_Cowork/public/index.html`, `public/landing.js`, `public/tt/index.html` (generated)
- About and not-found: `public/about/index.html`, `public/404.html`
- Documents: `public/methodology.html`, `public/terms.html`, `public/privacy/index.html` (all three generated), `public/chrome.js`, and their sources `src/pages/MethodologyPage.jsx` and `src/pages/TermsPage.jsx`
- Explorer: `public/explore/examples.js`, `explore.js`, `explore.css`, `index.html`, `specimen.html`, `specimen.js`, `specimen.css`, `experience-film.html`
- Images: `public/static/img/app-first-card-2026-10-27.png`, `public/static/img/og-home-2026-11.png`
- Scripts: `scripts/build-home-page.mjs`, `build-tt-page.mjs`, `build-paper-pages.mjs`, `build-legal-pages.mjs`, `build-share-image.mjs`, `paper-document.mjs`, `qr.mjs`, `scripts/web-audit/serve-local.mjs`, `scripts/web-audit/shoot-live.mjs`, and `package.json`
- Tests: `src/homePage.test.js`, `src/ttPage.test.js`, `src/explorerData.test.js`, `src/paperPages.test.js`, `src/exampleRecord.test.js`
- `DESIGN_NOTES.md` and this file
- In the app repository (separate): `mobile/legal/PRIVACY_POLICY.md`, the test that pins its date, and decision D-219

## How it was published

`main` was moved forward to the tip of `site-audit-fixes` (a fast-forward: nothing on `main` was rewritten) and sent to GitHub. Vercel rebuilt the site from it.

## Undo

The block below is one line. Paste it into PowerShell and press Enter.
(The `-c core.autocrlf=input` part keeps the files' line endings the way the site's build expects on Windows. It changes no setting; it only applies to that one command.)

### If you want the old site back
It puts the whole site folder back exactly as it was before any of this work, and publishes that. Its last part is the moment the old site is live again. This was rehearsed on a throwaway copy before publishing: the folder came back identical to the bookmark, file for file.

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input switch main; git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input restore --source pre-facelift-2026-11-24 --staged --worktree -- AlgorithmLens_Cowork; git -C "C:\Users\jwjwi\Desktop\goodish" commit -m "Undo the November 2026 site changes: the site folder back to the pre-facelift version"; git -C "C:\Users\jwjwi\Desktop\goodish" push origin main
```

This file is inside that folder, so it goes too; `DESIGN_NOTES.md` keeps the record. The work itself stays saved on its two branches. One thing the undo does not reverse: the privacy policy's wording fix lives in the app repository, and the old site's privacy page would show the policy as it read on October 13.

If you want to keep some of it and undo the rest (for example, keep the new look but drop one audit fix), ask Claude; each fix was saved separately so it can be undone on its own.

## Not yet checked

- A real iPhone in Safari (everything was checked in a desktop browser at phone size).
- Lighthouse scores.
