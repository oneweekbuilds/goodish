# Vercel Deployment Guide

This guide explains how to deploy the alg-gemini app to Vercel.

## Initial Setup in Vercel

When you create a new Vercel project or configure an existing one, use these settings:

### Project Settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/alg-gemini` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Environment Variables

Add this environment variable in Vercel's project settings:

| Name | Value | Description |
|------|-------|-------------|
| `VITE_COMING_SOON_MODE` | `true` | Enables the Coming Soon overlay |

**Important:** All Vite environment variables must be prefixed with `VITE_` to be available in the browser.

## Launch Day: Disabling Coming Soon Mode

When you're ready to launch the full app:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Find `VITE_COMING_SOON_MODE`
4. Change the value from `true` to `false`
5. Trigger a new deployment (Vercel will automatically redeploy when you change env vars)

Alternatively, remove the environment variable entirely - the app defaults to showing the full experience when the variable is not set.

## How SPA Routing Works

The `vercel.json` file in this directory configures Vercel to:
- Rewrite all routes to `/index.html`
- This allows React Router to handle client-side navigation
- Static assets (CSS, JS, images) are served directly from the `/assets` folder

## Common Deployment Issues

### Build Fails with "Command not found"

**Problem:** Vercel can't find npm or the build command.

**Solution:** Verify these settings:
- Root Directory is set to `apps/alg-gemini`
- Install Command is `npm install`
- Build Command is `npm run build`

### Blank Page After Deployment

**Problem:** The app loads but shows a blank page.

**Solutions:**
1. Check browser console for errors (F12 in most browsers)
2. Verify the Output Directory is set to `dist`
3. Ensure `vercel.json` exists and has the correct rewrite rule
4. Check that all environment variables use the `VITE_` prefix

### 404 Errors on Page Refresh

**Problem:** Direct navigation or page refresh shows Vercel's 404 page.

**Solution:** Verify that `vercel.json` exists in `apps/alg-gemini` with this content:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Coming Soon Mode Not Working

**Problem:** The overlay doesn't appear even though the env var is set.

**Solutions:**
1. Verify the environment variable is named exactly `VITE_COMING_SOON_MODE` (case-sensitive)
2. Ensure the value is the string `"true"`, not a boolean
3. Trigger a new deployment after adding/changing the env var
4. Check the Vercel deployment logs to confirm the variable is being set

### Build Succeeds Locally But Fails on Vercel

**Problem:** `npm run build` works on your machine but fails in Vercel.

**Solutions:**
1. Check Node.js version compatibility (Vercel uses Node 18.x by default)
2. Ensure all dependencies are in `dependencies`, not just `devDependencies`
3. Check for hardcoded absolute paths that might not exist on Vercel's build servers
4. Review Vercel's build logs for specific error messages

## Verifying the Deployment

After deploying, test these scenarios:

1. **Homepage loads:** Visit the root URL
2. **Coming Soon overlay appears:** If `VITE_COMING_SOON_MODE=true`, you should see the overlay
3. **Direct route navigation works:** Try visiting `/dashboard` directly (should not 404)
4. **Page refresh works:** Navigate to a route, then refresh (should stay on the same page)
5. **Static assets load:** Check that images, fonts, and styles load correctly

## Rollback Plan

If something goes wrong:

1. **Instant rollback:** In Vercel's Deployments tab, click the three dots next to a previous working deployment and select "Promote to Production"
2. **Git rollback:** If needed, revert to the `pre-vercel-deploy` tag:
   ```bash
   git checkout pre-vercel-deploy
   git push origin HEAD:coming-soon-minimal-overlay --force
   ```

## Additional Resources

- [Vercel Vite Documentation](https://vercel.com/docs/frameworks/vite)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Configuration (vercel.json)](https://vercel.com/docs/projects/project-configuration)
