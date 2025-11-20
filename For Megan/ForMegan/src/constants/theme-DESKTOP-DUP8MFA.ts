export const COLORS = {
  'sunrise-vibes': {
    primary: '#FFB07A',
    secondary: '#FF8C69',
    accent: '#FFA07A',
    background: '#FFF8DC',
    surface: '#FFFFFF',
    text: '#2F4F4F',
    textSecondary: '#696969',
    success: '#32CD32',
    warning: '#FFD700',
    error: '#FF6B6B',
    gradient: ['#FFB07A', '#FF8C69', '#FFA07A'],
  },
  'ocean-calm': {
    primary: '#4682B4',
    secondary: '#5F9EA0',
    accent: '#87CEEB',
    background: '#F0F8FF',
    surface: '#FFFFFF',
    text: '#2F4F4F',
    textSecondary: '#708090',
    success: '#20B2AA',
    warning: '#F0E68C',
    error: '#DC143C',
    gradient: ['#87CEEB', '#4682B4', '#5F9EA0'],
  },
  'forest-energy': {
    primary: '#9CAF88',
    secondary: '#8FBC8F',
    accent: '#98FB98',
    background: '#F5FFFA',
    surface: '#FFFFFF',
    text: '#2F4F4F',
    textSecondary: '#556B2F',
    success: '#32CD32',
    warning: '#DAA520',
    error: '#CD5C5C',
    gradient: ['#9CAF88', '#8FBC8F', '#98FB98'],
  },
  'midnight-mode': {
    primary: '#8A2BE2',
    secondary: '#9370DB',
    accent: '#DA70D6',
    background: '#0D1B2A',
    surface: '#1B2631',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    success: '#00FF7F',
    warning: '#FFD700',
    error: '#FF69B4',
    gradient: ['#8A2BE2', '#9370DB', '#DA70D6'],
  },
  'y2k-nostalgia': {
    primary: '#FF00FF',
    secondary: '#00FFFF',
    accent: '#FFFF00',
    background: '#000000',
    surface: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    success: '#00FF00',
    warning: '#FF8C00',
    error: '#FF1493',
    gradient: ['#FF00FF', '#00FFFF', '#FFFF00'],
  },
} as const;

export type ThemeName = keyof typeof COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 34,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 30,
  },
  h4: {
    fontSize: 20,
    fontWeight: '500' as const,
    lineHeight: 26,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
} as const;

export const SHADOWS = {
  sm: {
    // React Native Web compatible shadows
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  md: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  lg: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
} as const;

export const ANIMATIONS = {
  timing: {
    quick: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease' as const,
    easeIn: 'ease-in' as const,
    easeOut: 'ease-out' as const,
    easeInOut: 'ease-in-out' as const,
  },
} as const;