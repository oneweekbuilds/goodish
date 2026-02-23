/**
 * ErrorBoundary — Global React error boundary for AlgorithmLens.
 *
 * Catches unhandled React rendering errors and shows a recovery screen
 * instead of crashing the app. Logs errors to Sentry for debugging.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { captureError } from '../lib/sentry';
import { SPACING, TYPOGRAPHY, RADIUS, COLORS } from '../lib/theme';

interface Props {
  children: ReactNode;
  /** Optional fallback component. If not provided, uses default error screen. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
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
    captureError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack || null,
    });
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }
  }

  handleRestart = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⚠️</Text>
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We ran into an unexpected problem. This doesn't happen often — try
            restarting and things should be back to normal.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRestart}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Try Again</Text>
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
    width: 64,
    height: 64,
    borderRadius: RADIUS['2xl'],
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    ...TYPOGRAPHY.scoreSmall,
    color: COLORS.textMain,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
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
  buttonText: {
    ...TYPOGRAPHY.buttonMd,
    color: COLORS.white,
  },
});
