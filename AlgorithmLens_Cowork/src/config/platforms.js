/**
 * Centralized Platform Configuration (#11)
 *
 * Maps platform names to display properties (icon key, color, label).
 * This is the single source of truth for platform branding across the app.
 *
 * The `icon` field is a platform key string that maps to an SVG in PlatformIcon.jsx.
 * All components should import getPlatformConfig from here instead of
 * duplicating platform config locally.
 */

const PLATFORM_CONFIG = {
  tiktok: {
    name: 'TikTok',
    icon: 'tiktok',
    bgColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-900',
  },
  instagram: {
    name: 'Instagram',
    icon: 'instagram',
    bgColor: 'bg-pink-600',
    textColor: 'text-white',
    borderColor: 'border-pink-600',
  },
  youtube: {
    name: 'YouTube',
    icon: 'youtube',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    borderColor: 'border-red-600',
  },
  x: {
    name: 'X',
    icon: 'x',
    bgColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-900',
  },
  twitter: {
    name: 'X',
    icon: 'twitter',
    bgColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-900',
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-600',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'linkedin',
    bgColor: 'bg-blue-700',
    textColor: 'text-white',
    borderColor: 'border-blue-700',
  },
  reddit: {
    name: 'Reddit',
    icon: 'reddit',
    bgColor: 'bg-orange-600',
    textColor: 'text-white',
    borderColor: 'border-orange-600',
  },
};

/**
 * Get platform configuration by platform name.
 * Returns a sensible default if platform is not found.
 *
 * @param {string} platform - Platform name (lowercase)
 * @returns {Object} Platform config object with name, icon, bgColor, textColor, borderColor
 */
export function getPlatformConfig(platform) {
  return PLATFORM_CONFIG[platform?.toLowerCase()] || {
    name: platform || 'Unknown',
    icon: 'unknown',
    bgColor: 'bg-slate-600',
    textColor: 'text-white',
    borderColor: 'border-slate-600',
  };
}

export default PLATFORM_CONFIG;
