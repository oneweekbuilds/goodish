/**
 * Supabase client for AlgorithmLens mobile app.
 * Handles authentication and session management.
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use ?? '' so missing vars don't produce `undefined` — createClient handles empty
// strings gracefully (fails at auth-call time with a clear error, not at import time).
// A module-level throw here would crash the entire JS bundle, meaning
// SplashScreen.preventAutoHideAsync() is never called and the splash hangs forever.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Log loudly but do NOT throw — a module-level throw propagates up the import
  // chain and crashes _layout.tsx before React mounts, making the splash
  // un-dismissable and the app permanently stuck.
  console.error(
    '[supabase] CRITICAL: Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Auth will not function. Set these in eas.json env or as EAS Secrets.'
  );
}

// Import SecureStore only on native platforms
let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

// Custom storage adapter: use SecureStore on native, AsyncStorage on web
const StorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      return SecureStore ? await SecureStore.getItemAsync(key) : null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else if (SecureStore) {
        await SecureStore.setItemAsync(key, value);
      }
    } catch {
      if (__DEV__) {
        console.warn('Storage setItem failed:', key);
      }
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else if (SecureStore) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      if (__DEV__) {
        console.warn('Storage removeItem failed:', key);
      }
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
