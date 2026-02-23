/**
 * ThemeContext — System-aware dark mode switching for AlgorithmLens mobile.
 *
 * Detects system color scheme via useColorScheme() and provides the active
 * color set + shadow set to all components via context.
 *
 * Supports three modes:
 * - 'system' (default): follows device setting
 * - 'light': always light
 * - 'dark': always dark
 *
 * Usage in components:
 *   const { colors, shadows, isDark } = useTheme();
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  LIGHT_COLORS,
  DARK_COLORS,
  LIGHT_SHADOWS,
  DARK_SHADOWS,
  PLATFORMS,
  DARK_PLATFORMS,
  type ThemeColors,
  type ThemeShadows,
} from '../lib/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

// Structural type for platform entries
type PlatformEntry = { readonly name: string; readonly color: string; readonly icon: string };
type PlatformMap = { readonly [key: string]: PlatformEntry };

interface ThemeContextValue {
  /** The active color token set (light or dark). */
  colors: ThemeColors;
  /** The active shadow token set (light or dark). */
  shadows: ThemeShadows;
  /** The active platform set (adjusts TikTok for dark). */
  platforms: PlatformMap;
  /** Whether the current resolved theme is dark. */
  isDark: boolean;
  /** The current preference: 'system' | 'light' | 'dark'. */
  mode: ThemeMode;
  /** Update the theme preference. */
  setMode: (mode: ThemeMode) => void;
  /** StatusBar style: 'light' for dark backgrounds, 'dark' for light. */
  statusBarStyle: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setMode] = useState<ThemeMode>('light');

  const value = useMemo(() => {
    const resolvedDark =
      mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

    return {
      colors: resolvedDark ? DARK_COLORS : LIGHT_COLORS,
      shadows: resolvedDark ? DARK_SHADOWS : LIGHT_SHADOWS,
      platforms: resolvedDark ? DARK_PLATFORMS : PLATFORMS,
      isDark: resolvedDark,
      mode,
      setMode,
      statusBarStyle: (resolvedDark ? 'light' : 'dark') as 'light' | 'dark',
    };
  }, [mode, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the current theme colors, shadows, and mode.
 * Must be used within a ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Convenience hook that returns just the colors object.
 */
export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}
