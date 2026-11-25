# Checkpoint: site facelift
**Date:** November 24, 2026 (two rounds, same day)

## Where things stand

- **The live site has not changed.** algorithmlens.com is still the version from before this work.
- The new look lives on a separate line of work (a git branch) called `facelift-fable-5-2`. The live site is built from the branch called `main`, and nothing was added to `main`.
- The exact version that is live today is bookmarked (a git tag) as `pre-facelift-2026-11-24`. That bookmark never moves, so the old site can always be brought back.
- Nothing was sent to GitHub. Everything here is on this computer only.

## What changed

### Round one: the home page (and its TikTok copy at /tt/)
The page is laid out like a printed report, since that is what the app produces.

1. **Top of the page:** the headline "See your feed clearly." runs across the full width, with the film in a phone in the middle column and its notes beside it.
2. **Sections are numbered** 01 to 09, each with a small label and a much larger headline.
3. **The honest limit sentences** are set as large italic pull quotes instead of small grey text.
4. **The report section:** a larger stack of sheets, and the four counts as a ledger with big numerals.
5. **"Tap four posts":** the four example posts are laid out side by side, and each post's record appears directly underneath it when you press Read.
6. **"Can read / Cannot read":** two ruled lists side by side instead of two rows of sliding chips.
7. **Footer:** the closing sentence "A scan reads what appeared. It cannot say why." is set large above the footer links.

### Round two: more polish on the home page
1. A **contents line** under the top of the page lists the nine sections (on desktop).
2. Under each example post there is now an **empty form** (Ad label, Origin, Account, Position) that fills in when you press Read, so you can see the record form.
3. You can **click a sheet** in the stack to bring it forward.
4. **"Three steps" no longer makes the page jump.** Before, the panel beside the steps changed height every five seconds, which on an iPhone pushed everything below it up and down.
5. The film's count is drawn as four squares, one per post.
6. Small touches: the header marks which section you are in, "Back to top" in the footer, italic numerals for section numbers.

### Round two: the other pages now match
- **About** and **the "page not found" page** use the same headline style, rules and footer.
- **Methodology, terms and privacy** use the same headline style and footer, and each has a **contents list** you can click (it stays beside the text on desktop).
- **Not one word of methodology, terms or privacy changed.** This was checked by comparing the full text before and after, character by character. The About and "page not found" pages also read word for word the same.

### Defects this fixes
- On the live page today, the "Tap four posts" demonstration cannot be used with a mouse or a finger: the posts are squashed and their Read buttons are cut off.
- On the live About page, the loop diagram spills off the side of the screen at one tablet width.
- On the live methodology page, a long file name makes the page scroll sideways on very small phones.

## What did not change

- The brand: same wordmark, same colours, same typeface, same header.
- The wording. On the home page two labels changed in round one ("What a scan can read" above the limits section is now "The limits"; "Nothing yet. Tap Read on any post in the phone." lost "in the phone"), and section numbers, five short section labels, "Back to top" and the empty-form labels were added. Everything else on every page is word for word the same, including the form, the consent sentence and all legal text.
- The explorer and its two side pages.
- The beta links, the launch-list form and where it sends addresses.
- The site's security settings.

One thing to know: the privacy page now carries the same header as the rest of the site, so it shows the "Join the beta" button like the other pages do.

The full list of design decisions is in `DESIGN_NOTES.md` (repo root), under "Facelift notes".

## Files modified

- Home page: `AlgorithmLens_Cowork/public/index.html`, `public/landing.js`, `public/tt/index.html` (generated)
- About and not-found: `public/about/index.html`, `public/404.html`
- Documents: `public/methodology.html`, `public/terms.html`, `public/privacy/index.html` (all three generated), `public/chrome.js`
- The scripts that generate those documents: `scripts/build-paper-pages.mjs`, `scripts/build-legal-pages.mjs`, and a new shared template `scripts/paper-document.mjs`
- A preview helper: `scripts/web-audit/serve-local.mjs`
- A small safety fix: `scripts/build-tt-page.mjs` and `src/ttPage.test.js`
- `DESIGN_NOTES.md` and this file

## How to look at it

Ask Claude to "show me the facelift preview". It opens in the app's Browser pane, and every link works there as it would on the real site. The Viewport menu in that pane switches between desktop and phone.

## Rollback

Each command below is one line. Paste it into PowerShell and press Enter.

### If you do not like it and it has NOT been published
There is nothing to undo on the live site. To put this computer's copy of the site back to the live version:

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input switch main
```

The facelift stays saved on its branch in case you want it later. To delete it for good (optional, cannot be undone):

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" branch -D facelift-fable-5-2
```

### To publish it (make it the live site)
Three commands, in this order. The third one is the moment it goes live; Vercel rebuilds the site by itself a few minutes later.

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input switch main
```

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input merge --ff-only facelift-fable-5-2
```

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" push origin main
```

### If you published it and want the old site back
Three commands, in this order. They put every page, and the two scripts that generate the documents, back exactly as they were before the facelift, and publish that. The third one is the moment the old site is live again.

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input checkout pre-facelift-2026-11-24 -- AlgorithmLens_Cowork/public AlgorithmLens_Cowork/scripts/build-paper-pages.mjs AlgorithmLens_Cowork/scripts/build-legal-pages.mjs
```

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" commit -m "Undo the November 2026 facelift: every page back to the pre-facelift version"
```

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" push origin main
```

(The `-c core.autocrlf=input` part keeps the files' line endings the way the site's build expects on Windows. It changes no setting; it only applies to that one command.)

If you want to keep some of it and undo the rest (for example, keep the new home page but put the documents back), ask Claude; each part was saved separately so it can be undone on its own.

## Not yet checked

- A real iPhone in Safari (everything was checked in a desktop browser at phone size).
- The live site itself, since nothing has been published.
- Lighthouse scores.
