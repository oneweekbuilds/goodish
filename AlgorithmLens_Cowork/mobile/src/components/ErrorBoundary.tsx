/**
 * ErrorBoundary — Global React error boundary for AlgorithmLens.
 *
 * Catches unhandled React rendering errors and shows a recovery screen
 * instead of crashing the app. Logs errors to Sentry for debugging.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text as RNText, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { captureError } from '../lib/sentry';
import { SPACING, RADIUS, COLORS, ICON_SIZES } from '../lib/theme';

// Build #35: fallback uses plain react-native Text (no glue Text, no useTheme)
// so ErrorBoundary can sit ABOVE the provider tree. Previously the fallback
// imported Text from './glue', which calls useTheme() — meaning the boundary
// could not catch errors thrown above ThemeProvider without crashing during
// fallback render itself.

interface Props {
  children: ReactNode;
  /** Optional fallback component. If not provided, uses default error screen. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

// Build #34 diagnostic export, expanded in #35.
// The DebugCheckpointTrail in app/_layout.tsx reads from this object on every
// tick to surface ErrorBoundary state in the on-screen footer. Mutable
// singleton; safe because there is exactly one ErrorBoundary instance.
//
// In #35 we also surface the error in the fallback UI itself — when Sentry
// is not configured (current state), this is the ONLY way to see what
// actually threw on a TestFlight build.
export const __errorBoundaryDiag: {
  errorCount: number;
  lastMessage: string;
  lastStack: string;
  lastComponent: string;
  lastAt: number;
  restartCount: number;
} = {
  errorCount: 0,
  lastMessage: '',
  lastStack: '',
  lastComponent: '',
  lastAt: 0,
  restartCount: 0,
};

// React's componentStack format is one indented line per frame, e.g.
//   "\n    in ComponentName (at file.tsx:42)"
// We grab the first frame's name as a hint for which component threw.
function parseTopComponent(componentStack: string): string {
  const m = componentStack.match(/(?:^|\n)\s*(?:in|at)\s+([A-Za-z0-9_$.]+)/);
  return m && m[1] ? m[1] : 'unknown';
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const componentStack = errorInfo.componentStack || '';
    __errorBoundaryDiag.errorCount += 1;
    __errorBoundaryDiag.lastMessage = (error.message || 'unknown').slice(0, 200);
    __errorBoundaryDiag.lastStack = (error.stack || '').slice(0, 200);
    __errorBoundaryDiag.lastComponent = parseTopComponent(componentStack);
    __errorBoundaryDiag.lastAt = Date.now();

    captureError(error, 'ErrorBoundary', {
      componentStack: componentStack || null,
    });
    // Always log error details to console for debugging
    console.error('[ErrorBoundary] error.message:', error.message);
    console.error('[ErrorBoundary] error.stack:', error.stack);
    if (componentStack) {
      console.error('[ErrorBoundary] componentStack:', componentStack);
    }
  }

  handleRestart = (): void => {
    __errorBoundaryDiag.restartCount += 1;
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleGoHome = (): void => {
    __errorBoundaryDiag.restartCount += 1;
    this.setState({ hasError: false, errorMessage: '' });
    router.replace('/(tabs)/');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          {/* L-17 FIX: Calm icon instead of bright yellow emoji */}
          <View style={styles.iconContainer}>
            <AlertCircle size={28} color={COLORS.textSecondary} strokeWidth={1.8} />
          </View>
          <RNText style={styles.title}>Something went wrong</RNText>
          <RNText style={styles.subtitle}>
            We ran into an unexpected problem. This doesn't happen often, try
            restarting and things should be back to normal.
          </RNText>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRestart}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <RNText style={styles.primaryButtonText}>Try Again</RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.ghostButton]}
            onPress={this.handleGoHome}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go home"
          >
            <RNText style={styles.ghostButtonText}>Go Home</RNText>
          </TouchableOpacity>

          {/* Build #35: surface the captured error directly. With Sentry not
              configured, this on-screen detail block is the only place the
              actual error text is visible. ASCII labels keep grep on the
              Hermes bundle simple. */}
          <View style={styles.diagBlock}>
            <RNText style={styles.diagLabel}>err: <RNText style={styles.diagValue}>{__errorBoundaryDiag.lastMessage || this.state.errorMessage}</RNText></RNText>
            <RNText style={styles.diagLabel}>cmp: <RNText style={styles.diagValue}>{__errorBoundaryDiag.lastComponent || 'unknown'}</RNText></RNText>
            <RNText style={styles.diagLabel}>count: <RNText style={styles.diagValue}>{__errorBoundaryDiag.errorCount} errors / {__errorBoundaryDiag.restartCount} restarts</RNText></RNText>
            {__errorBoundaryDiag.lastStack ? (
              <RNText style={[styles.diagLabel, { marginTop: SPACING.sm }]}>
                stack: <RNText style={styles.diagValue}>{__errorBoundaryDiag.lastStack}</RNText>
              </RNText>
            ) : null}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['3xl'],
    backgroundColor: COLORS.bgPrimary,
  },
  iconContainer: {
    width: ICON_SIZES['5xl'],
    height: ICON_SIZES['5xl'],
    borderRadius: RADIUS['2xl'],
    // L-17 FIX: Neutral background instead of warning yellow
    backgroundColor: COLORS.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
    maxWidth: 300,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
  },
  ghostButton: {
    backgroundColor: 'transparent',
    marginTop: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  ghostButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  diagBlock: {
    marginTop: SPACING['2xl'],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.sm,
    maxWidth: '100%',
  },
  diagLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: undefined,
  },
  diagValue: {
    color: COLORS.textMain,
    fontSize: 11,
    fontWeight: '500',
  },
});
