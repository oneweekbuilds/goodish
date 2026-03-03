/**
 * GluestackUIProvider — Lightweight wrapper for gluestack-ui v2 + NativeWind.
 *
 * In gluestack-ui v2, components use NativeWind (Tailwind CSS for React Native)
 * for styling. This provider sets up the necessary context for GL* components
 * to access the design system tokens and theme mode.
 *
 * This wraps AROUND the existing ThemeProvider/AuthProvider hierarchy
 * and does NOT break any existing rendering.
 */

import React, { createContext, useContext } from 'react';
import { View } from 'react-native';

interface GluestackContextValue {
  /** Whether gluestack-ui is available */
  ready: boolean;
}

const GluestackContext = createContext<GluestackContextValue>({ ready: true });

export function useGluestack() {
  return useContext(GluestackContext);
}

interface GluestackUIProviderProps {
  children: React.ReactNode;
}

/**
 * GluestackUIProvider — wraps the app to signal that NativeWind + gluestack
 * infrastructure is available. GL* components check this context to confirm
 * the design system is initialized.
 *
 * NativeWind v4 handles CSS injection automatically via the metro config
 * and babel preset — no additional CSS variable injection is needed here.
 */
export function GluestackUIProvider({ children }: GluestackUIProviderProps) {
  return (
    <GluestackContext.Provider value={{ ready: true }}>
      {children}
    </GluestackContext.Provider>
  );
}
