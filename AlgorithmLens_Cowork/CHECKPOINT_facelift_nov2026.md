# Checkpoint: home page facelift
**Date:** November 24, 2026

## Where things stand

- **The live site has not changed.** algorithmlens.com is still the version from before this work.
- The new home page lives on a separate line of work (a git branch) called `facelift-fable-5-2`. The live site is built from the branch called `main`, and nothing was added to `main`.
- The exact version that is live today is bookmarked (a git tag) as `pre-facelift-2026-11-24`. That bookmark never moves, so the old page can always be brought back.
- Nothing was sent to GitHub. Everything here is on this computer only.

## What changed (home page and its TikTok copy at /tt/ only)

The page is laid out like a printed report, since that is what the app produces.

1. **Top of the page:** the headline "See your feed clearly." now runs across the full width, with the film in a phone in the middle column and its notes beside it.
2. **Sections are numbered** 01 to 09, each with a small label and a much larger headline.
3. **The honest limit sentences** ("A scan reads what appeared on screen. It cannot say why any post was there." and the others) are set as large italic pull quotes instead of small grey text.
4. **The report section:** a larger stack of sheets, and the four counts as a ledger with big numerals.
5. **"Tap four posts":** the four example posts are laid out side by side, and each post's record appears directly underneath it when you press Read.
6. **"Can read / Cannot read":** two ruled lists side by side instead of two rows of sliding chips.
7. **Footer:** the closing sentence "A scan reads what appeared. It cannot say why." is set large above the footer links.

### A defect this fixes
On the live page today, the "Tap four posts" demonstration cannot be used with a mouse or a finger: the four posts are squashed to a sliver and their Read buttons are cut off. The new layout shows all four Read buttons.

## What did not change

- The brand: same wordmark, same colours, same typeface, same header.
- The wording. Two labels changed ("What a scan can read" above the limits section is now "The limits"; "Nothing yet. Tap Read on any post in the phone." lost "in the phone" because the phone picture is gone). Section numbers and five short section labels were added. Every other sentence is word for word the same, including the form, the consent sentence and the privacy wording.
- The other pages: About, methodology, terms, privacy, the explorer and the "page not found" page are untouched.
- The beta links, the launch-list form and where it sends addresses.

The full list of design decisions is in `DESIGN_NOTES.md` (repo root), under "Facelift notes".

## Files modified

- `AlgorithmLens_Cowork/public/index.html` (the home page)
- `AlgorithmLens_Cowork/public/landing.js` (the home page's behaviour)
- `AlgorithmLens_Cowork/public/tt/index.html` (generated from the home page)
- `AlgorithmLens_Cowork/scripts/build-tt-page.mjs` and `AlgorithmLens_Cowork/src/ttPage.test.js` (a small safety fix, in its own commit, so that switching between the old and new versions on this Windows computer cannot break the site's build)
- `DESIGN_NOTES.md` and this file

## How to look at it

Ask Claude to "show me the facelift preview". It opens in the app's Browser pane. The Viewport menu in that pane switches between desktop and phone.

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

### If you published it and want the old page back
Three commands, in this order. They put the three home-page files back exactly as they were before the facelift and publish that. The third one is the moment the old page is live again.

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" -c core.autocrlf=input checkout pre-facelift-2026-11-24 -- AlgorithmLens_Cowork/public/index.html AlgorithmLens_Cowork/public/landing.js AlgorithmLens_Cowork/public/tt/index.html
```

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" commit -m "Undo the November 2026 facelift: home page back to the pre-facelift version"
```

```powershell
git -C "C:\Users\jwjwi\Desktop\goodish" push origin main
```

(The `-c core.autocrlf=input` part keeps the files' line endings the way the site's build expects on Windows. It changes no setting; it only applies to that one command.)

## Not yet checked

- A real iPhone in Safari (everything was checked in a desktop browser at phone size).
- The live site itself, since nothing has been published.
- Lighthouse scores.
