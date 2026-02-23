/**
 * Sentry Error Tracking for AlgorithmLens Mobile App
 *
 * Captures WebView injection failures, Stripe checkout errors,
 * Supabase auth errors, scan processing failures, and navigation breadcrumbs.
 *
 * Configuration:
 *   - DSN: Placeholder until production deployment
 *   - Environment: "production" for builds, "development" for __DEV__
 *   - Release: Reads from app.json version
 *   - Error sample rate: 1.0 (capture all errors)
 *   - Performance sample rate: 0.1 (capture 10% of transactions)
 *   - User context: user ID + tier only (no PII)
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://placeholder@sentry.io/0';
const IS_PLACEHOLDER_DSN = SENTRY_DSN.includes('placeholder@sentry.io');
const IS_DEV = __DEV__;
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

/**
 * Initialize Sentry SDK. Call once at app startup.
 * Note: initSentry is synchronous and lightweight — uses Sentry's fast initialization path.
 * If additional heavy operations are needed in the future, consider deferring with InteractionManager.
 */
export function initSentry(): void {
  if (IS_PLACEHOLDER_DSN && !IS_DEV) {
    if (__DEV__) {
      console.warn(
        '[Sentry] Using placeholder DSN in production build. Error tracking is disabled. '
        + 'Set EXPO_PUBLIC_SENTRY_DSN in your .env file.'
      );
    }
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_DEV ? 'development' : 'production',
    release: `algorithmlens-mobile@${APP_VERSION}`,

    // Capture all errors, sample 10% of performance transactions
    sampleRate: 1.0,
    tracesSampleRate: 0.1,

    // Scrub PII from events
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete (event.user as Record<string, unknown>).username;
        delete (event.user as Record<string, unknown>).name;
      }
      return event;
    },

    // Filter noisy errors
    ignoreErrors: [
      // React Native noise
      'Non-Error promise rejection captured',
      // WebView noise
      'WebView was terminated',
    ],

    debug: IS_DEV,
    enableAutoSessionTracking: true,
    enableNativeFramesTracking: !IS_DEV,
  });
}

/**
 * Set user context on Sentry.
 * Only includes user ID and tier — no PII.
 *
 * @param userId - Supabase user ID (pass null to clear)
 * @param tier - 'free' or 'plus'
 */
export function setSentryUser(userId: string | null | undefined, tier?: string): void {
  if (typeof userId === 'string') {
    Sentry.setUser({ id: userId });
  } else if (userId === null) {
    Sentry.setUser(null);
  }
  if (tier) {
    Sentry.setTag('user_tier', tier);
  }
}

/**
 * Capture an error with structured context.
 *
 * @param error - The error to report
 * @param context - Where the error occurred
 * @param extra - Additional context data
 */
export function captureError(
  error: Error | string,
  context: string,
  extra?: Record<string, unknown> | null
): void {
  Sentry.withScope((scope) => {
    scope.setTag('error_context', context);
    if (extra) {
      scope.setExtras(extra);
    }
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureException(new Error(String(error)));
    }
  });
}

/**
 * Capture a message-level event.
 *
 * @param message - Description
 * @param level - Sentry severity
 * @param extra - Additional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'warning',
  extra?: Record<string, unknown> | null
): void {
  Sentry.withScope((scope) => {
    if (extra) {
      scope.setExtras(extra);
    }
    Sentry.captureMessage(message, level);
  });
}

/**
 * Add a breadcrumb for state transitions or navigation.
 *
 * @param category - Breadcrumb category ('navigation', 'scan', 'auth', 'payment')
 * @param message - What happened
 * @param data - Extra data
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown> | null
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data: data || undefined,
    level: 'info',
  });
}

/**
 * Wrap a React Native component with Sentry error boundary.
 * Use for the root app component.
 */
export const withSentry = Sentry.wrap;
