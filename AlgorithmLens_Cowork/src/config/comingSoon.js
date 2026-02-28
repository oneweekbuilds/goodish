/**
 * Coming Soon Mode Configuration
 *
 * Single source of truth for minimal Coming Soon overlay.
 * Set VITE_COMING_SOON_MODE=true in .env.local to enable Coming Soon mode.
 * Set VITE_COMING_SOON_MODE=false (or remove it) to restore full app functionality.
 */

// Read from Vite environment variable (defaults to false if not set)
const isComingSoonMode = import.meta.env.VITE_COMING_SOON_MODE === 'true';

export const comingSoonConfig = {
  // Main feature flag - forced to false for local development
  isEnabled: false,

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
