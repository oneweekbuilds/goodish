# Vercel Deployment Guide

This guide explains how algorithmlens.com is deployed to Vercel. The website lives in the `AlgorithmLens_Cowork` folder of the goodish repository, not at the repository root. Vercel deploys every push to `main`.

## Project Settings in Vercel

| Setting | Value |
|---------|-------|
| **Root Directory** | `AlgorithmLens_Cowork` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

`npm run build` first regenerates `public/tt/index.html` from `public/index.html` (the `prebuild` script, `scripts/build-tt-page.mjs`) and then runs `vite build`. Vite copies everything in `public/` into `dist/` unchanged and builds the React app from `app.html`.

### Environment Variables

All Vite environment variables must be prefixed with `VITE_` to be available in the browser.

| Name | Description |
|------|-------------|
| `SENTRY_AUTH_TOKEN` | Optional. When set, `vite.config.js` builds hidden source maps and the Sentry plugin uploads them, then deletes them from `dist/`. When unset (the normal case), no `.js.map` files are built at all. |
| `VITE_COMING_SOON_MODE` | Retired in September 2026. The static landing page in `public/` is the root and the app routes redirect to it (`vercel.json`). The variable is ignored. |

## What Is Deployed

The site is static pages in `public/`, served from the root:

- `/` is `public/index.html`, the landing page, with `public/landing.js`. `/tt/` is the same page for the TikTok beta group (see README.md, "Publishing the TestFlight beta links").
- `/about/`, `/privacy/` and `/explore/` are folders in `public/`.
- `/terms` and `/methodology` are rewritten by `vercel.json` to `public/terms.html` and `public/methodology.html`, which `scripts/build-paper-pages.mjs` renders from the React pages' text. `/privacy/` is rendered by `scripts/build-legal-pages.mjs` from the mobile repository's `legal/PRIVACY_POLICY.md` (a separate checkout; pass its path).
- `public/404.html` is the not-found page.

The React app in `src/` still builds (to `dist/app.html` and `dist/assets/`), but nothing serves it: every one of its routes, and `/app.html` itself, redirects to `/` in `vercel.json`.

## How Routing Works

`vercel.json` in `AlgorithmLens_Cowork` holds three lists:

- `headers`: security headers for every path (nosniff, DENY, Referrer-Policy, Permissions-Policy, a Content-Security-Policy), with tighter per-route policies for `/`, `/tt/`, `/explore/` and `/privacy/`, and cache lifetimes for `/static/` and `/assets/`.
- `redirects`: the old `/algorithmlens/` paths and every React app route (`/dashboard`, `/scan`, `/plus`, `/settings`, `/auth/*`, `/app.html` and the rest) to `/`; `/privacy`, `/about` and `/tt` to their trailing-slash form.
- `rewrites`: `/terms` and `/methodology` to their static files.

There is no catch-all rewrite to an `index.html`. A new page is a new file or folder under `public/`; if it needs a clean URL without `.html`, add a rewrite.

## Common Deployment Issues

### Build Fails with "Command not found"

Verify the Root Directory is `AlgorithmLens_Cowork`, the Install Command is `npm install` and the Build Command is `npm run build`.

### A Page Is Missing or Wrong After Deployment

1. Check that the file exists under `public/` with the right name (`index.html` inside a folder for a trailing-slash URL).
2. For `/terms` and `/methodology`, re-run `node scripts/build-paper-pages.mjs` and commit the output.
3. For `/tt/`, run `npm run build:tt` and commit `public/tt/index.html`; `src/ttPage.test.js` fails while it is out of date.
4. Check the Vercel deployment logs for the build output.

### Build Succeeds Locally But Fails on Vercel

1. Check the Node.js version (the CI workflow uses Node 20).
2. Ensure all dependencies are in `dependencies`, not just `devDependencies`.
3. Check for hardcoded absolute paths that might not exist on Vercel's build servers.
4. Review Vercel's build logs for specific error messages.

## Verifying the Deployment

After deploying, check:

1. `/` loads and its "Join the beta on iPhone" button points at the public TestFlight link; `/tt/` loads, carries a robots noindex and points at the TikTok TestFlight link.
2. `/privacy/`, `/terms`, `/methodology`, `/about/` and `/explore/` load.
3. `/app.html` and `/dashboard` redirect to `/`.
4. No `.js.map` file is served from `/assets/`.
5. The pages set no cookies and request nothing from third parties (only the launch-list form posts to the Supabase function).

## Rollback Plan

1. **Instant rollback:** In Vercel's Deployments tab, open the menu next to a previous working deployment and select "Promote to Production".
2. **Git rollback:** revert the commit on `main` and push; Vercel redeploys.

## Additional Resources

- [Vercel Vite Documentation](https://vercel.com/docs/frameworks/vite)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Configuration (vercel.json)](https://vercel.com/docs/projects/project-configuration)
