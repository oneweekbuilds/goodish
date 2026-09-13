/**
 * Coming Soon Mode Configuration
 *
 * Single source of truth for the minimal Coming Soon overlay and route gating.
 *
 * The flag reads VITE_COMING_SOON_MODE and FAILS CLOSED: when the variable is
 * absent or anything other than the string "false", Coming Soon mode is ON and
 * the unlaunched app stays behind the waitlist page. A production deploy with
 * no variable set therefore serves the waitlist, never the full app.
 *
 * Local development: put VITE_COMING_SOON_MODE=false in .env.local to get the
 * full app (LandingV12 at "/" plus every gated route). .env.local is
 * git-ignored, so that setting never reaches Vercel.
 */

// Read from Vite environment variable. Only an explicit "false" opens the app.
const isComingSoonMode = import.meta.env.VITE_COMING_SOON_MODE !== 'false';

export const comingSoonConfig = {
  // Main feature flag. Defaults to true (waitlist) unless the env var is "false".
  isEnabled: isComingSoonMode,

  // Message shown when users try to access gated routes
  redirectMessage: 'AlgorithmLens is coming soon. Join the waitlist.',

  // Routes that should be blocked when Coming Soon mode is enabled
  // Homepage (/) is always accessible
  gatedRoutes: [
    '/dashboard',
    '/start',
    '/scan',
    '/scan/platform',
    '/scan/processing',
    '/scan/results',
    '/history',
    '/scan-history',
    '/pricing',
    '/scan-test',
  ],
};

// Helper function to check if Coming Soon mode is enabled
export const isComingSoon = () => comingSoonConfig.isEnabled;

// Helper function to check if a route is gated
export const isRouteGated = (pathname) => {
  if (!isComingSoon()) return false;

  return comingSoonConfig.gatedRoutes.some(route => {
    return pathname.startsWith(route);
  });
};
