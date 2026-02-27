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
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F7F8FC',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.algorithmlens.app',
    buildNumber: '1',
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: ['processing', 'fetch'],
      NSUserActivityTypes: ['com.algorithmlens.broadcast'],
      NSCameraUsageDescription:
        'AlgorithmLens uses screen broadcasting to analyze your social media feed. Camera access is required by the system for ReplayKit broadcast, though we never capture from the camera.',
      NSMicrophoneUsageDescription:
        'AlgorithmLens does not record audio. Microphone permission is required by the system for ReplayKit broadcast.',
      NSSiriUsageDescription:
        'AlgorithmLens uses Siri to let you quickly start feed scans with voice commands or Shortcuts automations.',
      ITSAppUsesNonExemptEncryption: false,
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
  scheme: 'algorithmlens',
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-dev-client',
    './plugins/withBroadcastExtension',
  ],
  extra: {
    eas: {
      projectId: '',
    },
  },
  owner: 'algorithmlens',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: '',
  },
});
