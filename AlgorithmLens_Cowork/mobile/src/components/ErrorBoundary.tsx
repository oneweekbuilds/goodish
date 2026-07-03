/**
 * ErrorBoundary — Global React error boundary for AlgorithmLens.
 *
 * Catches unhandled React rendering errors and shows a recovery screen
 * instead of crashing the app. Logs errors to Sentry for debugging.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AlertCircle } from 'lucide-react-native';
import { captureError } from '../lib/sentry';
import { SPACING, RADIUS, COLORS, ICON_SIZES } from '../lib/theme';
import { GL_TYPOGRAPHY } from '../lib/gluestackTheme';
import { Text } from './glue';

interface Props {
  children: ReactNode;
  /** Optional fallback component. If not provided, uses default error screen. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '', errorStack: '' };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred',
      errorStack: error.stack || '',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack || null,
    });
    // Always log error details to console for debugging
    console.error('[ErrorBoundary] error.message:', error.message);
    console.error('[ErrorBoundary] error.stack:', error.stack);
    if (errorInfo.componentStack) {
      console.error('[ErrorBoundary] componentStack:', errorInfo.componentStack);
    }
    // CRITICAL: If a render error is caught before SplashScreen.hideAsync() has been
    // called, the splash will hang forever — the ErrorBoundary renders its own UI
    // (not RootLayoutNav) so the normal hideAsync path in RootLayoutNav never runs.
    // Calling hideAsync here guarantees the splash is dismissed even on crash.
    SplashScreen.hideAsync().catch(() => {});
  }

  handleRestart = (): void => {
    this.setState({ hasError: false, errorMessage: '', errorStack: '' });
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, errorMessage: '', errorStack: '' });
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
          <Text
            variant="scoreSmall"
            color={COLORS.textMain}
            align="center"
            style={{ marginBottom: SPACING.sm }}
          >
            Something went wrong
          </Text>
          <Text
            variant="bodySmall"
            color={COLORS.textSecondary}
            align="center"
            style={{ marginBottom: SPACING.lg, maxWidth: 300 }}
          >
            We ran into an unexpected problem. This doesn't happen often — try
            restarting and things should be back to normal.
          </Text>
          {/* DEBUG: Temporary error details for Build 16 — remove before public launch */}
          {this.state.errorMessage ? (
            <View style={styles.debugBox}>
              <Text
                variant="small"
                color={COLORS.textMuted}
                style={{ fontFamily: 'monospace', marginBottom: SPACING.xs }}
              >
                {this.state.errorMessage}
              </Text>
              {this.state.errorStack ? (
                <Text
                  variant="small"
                  color={COLORS.textMuted}
                  style={{ fontFamily: 'monospace', fontSize: 10 }}
                >
                  {this.state.errorStack.slice(0, 400)}
                </Text>
              ) : null}
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRestart}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text
              variant="buttonMd"
              color={COLORS.white}
            >
              Try Again
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'transparent', marginTop: SPACING.sm }]}
            onPress={this.handleGoHome}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go home"
          >
            <Text
              variant="buttonMd"
              color={COLORS.primary}
            >
              Go Home
            </Text>
          </TouchableOpacity>
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
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
  },
  // DEBUG: Temporary debug box for Build 16 — remove before public launch
  debugBox: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING['2xl'],
    maxWidth: 320,
    width: '100%',
  },
});
