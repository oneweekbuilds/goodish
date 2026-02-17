/**
 * Centralized Platform Configuration (#11)
 *
 * Maps platform names to display properties (icon, color, label).
 * This is the single source of truth for platform branding across the app.
 *
 * All components should import getPlatformConfig from here instead of
 * duplicating platform config locally.
 */

const PLATFORM_CONFIG = {
  tiktok: {
    name: 'TikTok',
    icon: '📱',
    bgColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-900',
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    bgColor: 'bg-pink-600',
    textColor: 'text-white',
    borderColor: 'border-pink-600',
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    borderColor: 'border-red-600',
  },
  x: {
    name: 'X',
    icon: '𝕏',
    bgColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-900',
  },
  twitter: {
    name: 'X',
    icon: '𝕏',
    bgColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-900',
  },
  facebook: {
    name: 'Facebook',
    icon: '👤',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-600',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    bgColor: 'bg-blue-700',
    textColor: 'text-white',
    borderColor: 'border-blue-700',
  },
  reddit: {
    name: 'Reddit',
    icon: '🔗',
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
    icon: '📊',
    bgColor: 'bg-slate-600',
    textColor: 'text-white',
    borderColor: 'border-slate-600',
  };
}

export default PLATFORM_CONFIG;
