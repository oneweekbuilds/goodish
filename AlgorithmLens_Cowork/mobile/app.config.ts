/**
 * app.config.ts — Expo configuration with config plugins for native modules.
 *
 * This replaces app.json to support:
 * 1. expo-dev-client for development builds (required for native modules)
 * 2. Custom config plugin for the iOS Broadcast Extension (ReplayKit)
 * 3. Custom config plugin for the Shortcuts module (AppIntents)
 *
 * The broadcast extension is a separate iOS target that runs in its own
 * process and captures screen frames via ReplayKit. It communicates with
 * the main app through a shared App Group container.
 */

import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'AlgorithmLens',
  slug: 'algorithmlens',
  version: '1.1.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F7F8FC',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.algorithmlens.app',
    buildNumber: '1',
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: ['fetch'],
      NSUserActivityTypes: ['com.algorithmlens.broadcast'],
      NSCameraUsageDescription:
        'AlgorithmLens uses screen broadcasting to analyze your social media feed. Camera access is required by the system for ReplayKit broadcast, though we never capture from the camera.',
      NSMicrophoneUsageDescription:
        'AlgorithmLens does not record audio. Microphone permission is required by the system for ReplayKit broadcast.',
      NSSiriUsageDescription:
        'AlgorithmLens uses Siri to let you quickly start feed scans with voice commands or Shortcuts automations.',
      ITSAppUsesNonExemptEncryption: false,
      // Build #41: declare schemes used by Linking.canOpenURL in
      // broadcastSessionManager.openPlatformApp. iOS 9+ silently returns
      // false for any scheme not in this allowlist, which made every
      // "Back to <Platform>" button report "<Platform> not installed"
      // even when the app WAS installed. Match the schemes declared in
      // PLATFORM_BROADCAST_CONFIGS in src/types/broadcast.ts.
      LSApplicationQueriesSchemes: [
        'instagram',
        'twitter',
        'youtube',
        'snssdk1233', // TikTok
        'fb',          // Facebook
        'reddit',
      ],
    },
    entitlements: {
      'com.apple.security.application-groups': [
        'group.com.algorithmlens.broadcast',
      ],
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyTracking: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#F7F8FC',
    },
    package: 'com.algorithmlens.app',
    versionCode: 1,
    permissions: [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION',
      'android.permission.POST_NOTIFICATIONS',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'single' as const,
    meta: {
      viewport:
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    },
  },
  // URL scheme registered for deep linking and OAuth callbacks.
  // Linking.createURL('/auth/callback') produces: algorithmlens://auth/callback
  //
  // ⚠️  REQUIRED MANUAL STEP: Add the following URL to your Supabase project's
  //     Auth → URL Configuration → Redirect URLs allowlist:
  //       algorithmlens://auth/callback
  //     Without this, OAuth sign-in will fail with "redirect_uri_mismatch".
  //
  scheme: 'algorithmlens',
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-dev-client',
    // expo-web-browser is required for OAuth sign-in on iOS (opens SFSafariViewController).
    // The plugin registers the app's URL scheme so the in-app browser can redirect back
    // to the app after OAuth completes.
    'expo-web-browser',
    './plugins/withBroadcastExtension',
  ],
  extra: {
    eas: {
      projectId: 'e49ded34-bf98-45eb-a09c-0bc4721a65bf',
      build: {
        experimental: {
          ios: {
            appExtensions: [
              {
                targetName: 'BroadcastExtension',
                bundleIdentifier: 'com.algorithmlens.app.BroadcastExtension',
                entitlements: {
                  'com.apple.security.application-groups': [
                    'group.com.algorithmlens.broadcast',
                  ],
                },
              },
            ],
          },
        },
      },
    },
    router: {},
  },
  owner: 'jwjwin0',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: `https://u.expo.dev/e49ded34-bf98-45eb-a09c-0bc4721a65bf`,
  },
});
