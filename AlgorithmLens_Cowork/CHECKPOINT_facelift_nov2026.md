# Checkpoint: site facelift and audit fixes
**Dates:** November 24, 2026 (facelift, two rounds) and November 24 to 25, 2026 (18 audit fixes)

## Where things stand

- **The live site has not changed.** algorithmlens.com is still the version from before this work.
- There are two saved lines of work (git branches). The live site is built from the branch called `main`, and nothing was added to `main`.
  - `facelift-fable-5-2`: the new look only.
  - `site-audit-fixes`: the new look plus the 18 audit fixes. This is the one to review and publish. It contains everything in the first.
- The exact version that is live today is bookmarked (a git tag) as `pre-facelift-2026-11-24`. That bookmark never moves, so the old site can always be brought back. The bookmark is on this computer only.
- `site-audit-fixes` was sent to GitHub so that Vercel builds a preview of it. A preview is a private-looking copy at its own address; it is not the live site.

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

## How to look at it

Ask Claude to "show me the site preview". It opens in the app's Browser pane, and every link works there as it would on the real site. The Viewport menu in that pane switches between desktop and phone. The Vercel preview address shows the same thing on any device, including your iPhone.

## Publish and undo

Each block below is one line. Paste it into PowerShell and press Enter.
(The `-c core.autocrlf=input` part keeps the files' line endings the way the site's build expects on Windows. It changes no setting; it only applies to that one command.)

### To publish it (make it the live site)
One line. Its last part is the moment it goes live; Vercel rebuilds the site by itself a few minutes later. If the first part fails for any reason, the rest does nothing.

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input switch main; git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input merge --ff-only site-audit-fixes; git -C "C:\Users\jwjwi\Desktop\goodish" push origin main
```

To publish the new look without the audit fixes, use the same line with `facelift-fable-5-2` in place of `site-audit-fixes`.

### If you do not like it and it has NOT been published
There is nothing to undo on the live site. To put this computer's copy of the site back to the live version:

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input switch main
```

The work stays saved on its branches in case you want it later.

### If you published it and want the old site back
One line. It puts the whole site folder back exactly as it was before any of this work, and publishes that. Its last part is the moment the old site is live again. This was rehearsed on a throwaway copy: the folder came back identical to the bookmark, file for file.

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input switch main; git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input restore --source pre-facelift-2026-11-24 --staged --worktree -- AlgorithmLens_Cowork; git -C "C:\Users\jwjwi\Desktop\goodish" commit -m "Undo the November 2026 site changes: the site folder back to the pre-facelift version"; git -C "C:\Users\jwjwi\Desktop\goodish" push origin main
```

This file is inside that folder, so it goes too; `DESIGN_NOTES.md` keeps the record. The work itself stays saved on its two branches.

If you want to keep some of it and undo the rest (for example, keep the new look but drop one audit fix), ask Claude; each fix was saved separately so it can be undone on its own.

## Not yet checked

- A real iPhone in Safari (everything was checked in a desktop browser at phone size).
- The live site itself, since nothing has been published.
- Lighthouse scores.
