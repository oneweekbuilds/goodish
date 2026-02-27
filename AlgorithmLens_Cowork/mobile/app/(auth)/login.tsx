import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/context/ThemeContext';
import { Eye } from 'lucide-react-native';
import { TYPOGRAPHY, SPACING, RADIUS, COLORS } from '../../src/lib/theme';

// Email validation — checks for user@domain.tld pattern
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email.trim());
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'oauth' | 'email'>('oauth');
  const [emailError, setEmailError] = useState('');
  const [authError, setAuthError] = useState('');
  const emailInputRef = useRef<TextInput>(null);
  const { signInWithOAuth } = useAuth();
  const { colors, shadows } = useTheme();

  // Auto-focus email input when switching to email auth method
  useEffect(() => {
    if (authMethod === 'email') {
      emailInputRef.current?.focus();
    }
  }, [authMethod]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError('');
      await signInWithOAuth('google');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign in failed. Try again');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError('');
      await signInWithOAuth('apple');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign in failed. Try again');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    // Validate email format
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setAuthError('Please enter password');
      return;
    }

    setEmailError('');
    setAuthError('');

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign in failed. Try again');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    // Validate email format
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setAuthError('Please enter password');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    setEmailError('');
    setAuthError('');

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setAuthError('Account created! Signing you in...');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign up failed. Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: SPACING.xl,
          paddingVertical: SPACING['4xl'],
        }}
      >
        {/* Logo and Branding */}
        <View style={{ alignItems: 'center', marginBottom: SPACING['5xl'] }}>
          {/* App Icon */}
          <View
            style={{
              width: 72,
              height: 72,
              backgroundColor: colors.primaryBlue,
              borderRadius: RADIUS.xl,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: SPACING.lg,
              ...shadows.hero,
              shadowColor: colors.primaryBlue,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Eye size={36} color={colors.white} strokeWidth={1.5} />
          </View>
          <Text
            style={{
              ...TYPOGRAPHY.display,
              color: colors.primaryBlue,
              marginBottom: SPACING.xs,
            }}
            accessibilityRole="header"
          >
            AlgorithmLens
          </Text>
          <Text
            style={{
              ...TYPOGRAPHY.bodySmall,
              color: colors.textMuted,
              textAlign: 'center',
              letterSpacing: 0.3,
              fontWeight: '500',
            }}
          >
            {/* E-2 FIX: Stricter epistemic compliance — "appears" instead of "shapes" */}
            See what appears in your feed
          </Text>
        </View>

        {authMethod === 'oauth' ? (
          <>
            {/* OAuth Buttons */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={loading}
              accessibilityLabel="Continue with Google"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
              style={{
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.borderSlate200,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                paddingHorizontal: SPACING.lg,
                marginBottom: SPACING.md,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
                flexDirection: 'row',
                ...shadows.soft,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryBlue} />
              ) : (
                <>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      marginRight: SPACING.sm,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ ...TYPOGRAPHY.buttonLg, fontWeight: 'bold' }}>G</Text>
                  </View>
                  <Text
                    style={{
                      ...TYPOGRAPHY.body,
                      fontWeight: '600',
                      color: colors.textMain,
                    }}
                  >
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAppleSignIn}
              disabled={loading}
              accessibilityLabel="Continue with Apple"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
              style={{
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.borderSlate200,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                paddingHorizontal: SPACING.lg,
                marginBottom: SPACING.xl,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
                flexDirection: 'row',
                ...shadows.soft,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryBlue} />
              ) : (
                <>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      marginRight: SPACING.sm,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ ...TYPOGRAPHY.buttonLg, fontWeight: 'bold' }}>🍎</Text>
                  </View>
                  <Text
                    style={{
                      ...TYPOGRAPHY.body,
                      fontWeight: '600',
                      color: colors.textMain,
                    }}
                  >
                    Continue with Apple
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Error Message for OAuth */}
            {authError ? (
              <Text
                style={{
                  ...TYPOGRAPHY.small,
                  color: colors.error,
                  marginBottom: SPACING.md,
                  marginLeft: SPACING.xs,
                  textAlign: 'center',
                }}
              >
                {authError}
              </Text>
            ) : null}

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: SPACING.xl,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSlate200 }} />
              <Text
                style={{
                  marginHorizontal: SPACING.md,
                  color: colors.textSecondary,
                  ...TYPOGRAPHY.bodySmall,
                }}
              >
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSlate200 }} />
            </View>

            {/* Email/Password Fallback Link */}
            <TouchableOpacity
              onPress={() => setAuthMethod('email')}
              accessibilityLabel="Sign in with email"
              accessibilityRole="button"
              style={{
                paddingVertical: SPACING.md,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  color: colors.primaryBlue,
                  fontWeight: '600',
                }}
              >
                Sign in with email
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Email/Password Fields */}
            <TextInput
              ref={emailInputRef}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              editable={!loading}
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email to sign in or create an account"
              accessible={true}
              style={{
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: emailError ? colors.error : colors.borderSlate200,
                borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.md,
                marginBottom: emailError ? SPACING.xs : SPACING.md,
                ...TYPOGRAPHY.body,
                color: colors.textMain,
                minHeight: 48,
                ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
              }}
              placeholderTextColor={colors.textSecondary}
            />
            {emailError ? (
              <Text
                style={{
                  ...TYPOGRAPHY.small,
                  color: colors.error,
                  marginBottom: SPACING.md,
                  marginLeft: SPACING.xs,
                }}
              >
                {emailError}
              </Text>
            ) : null}

            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              editable={!loading}
              accessibilityLabel="Password"
              accessibilityHint="Minimum 6 characters"
              accessible={true}
              style={{
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.borderSlate200,
                borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.md,
                marginBottom: SPACING.sm,
                ...TYPOGRAPHY.body,
                color: colors.textMain,
                minHeight: 48,
                ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
              }}
              placeholderTextColor={colors.textSecondary}
            />

            {/* Forgot Password Link — L-5 FIX */}
            <TouchableOpacity
              onPress={async () => {
                if (!email || !isValidEmail(email)) {
                  setAuthError('Enter your email address first, then tap Forgot password.');
                  return;
                }
                try {
                  setAuthError('');
                  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
                  if (resetError) {
                    setAuthError(resetError.message);
                  } else {
                    setAuthError('Password reset email sent! Check your inbox.');
                  }
                } catch {
                  setAuthError('Could not send reset email. Please try again.');
                }
              }}
              style={{
                alignSelf: 'flex-end',
                marginBottom: SPACING.xl,
              }}
              accessibilityLabel="Forgot password"
              accessibilityRole="link"
            >
              <Text
                style={{
                  ...TYPOGRAPHY.small,
                  color: colors.primaryBlue,
                  fontWeight: '500',
                }}
              >
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Error Message for Email Auth */}
            {authError ? (
              <Text
                style={{
                  ...TYPOGRAPHY.small,
                  color: colors.error,
                  marginBottom: SPACING.md,
                  marginLeft: SPACING.xs,
                  textAlign: 'center',
                }}
              >
                {authError}
              </Text>
            ) : null}

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleEmailSignIn}
              disabled={loading}
              accessibilityLabel="Sign in"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
              style={{
                backgroundColor: colors.primaryBlue,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                marginBottom: SPACING.md,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
                ...shadows.medium,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text
                  style={{
                    ...TYPOGRAPHY.body,
                    fontWeight: '600',
                    color: colors.white,
                  }}
                >
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleEmailSignUp}
              disabled={loading}
              accessibilityLabel="Create account"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
              style={{
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.borderSlate200,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                marginBottom: SPACING.xl,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryBlue} />
              ) : (
                <Text
                  style={{
                    ...TYPOGRAPHY.body,
                    fontWeight: '600',
                    color: colors.primaryBlue,
                  }}
                >
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to OAuth Link */}
            <TouchableOpacity
              onPress={() => setAuthMethod('oauth')}
              accessibilityLabel="Other sign-in options"
              accessibilityRole="button"
              style={{
                paddingVertical: SPACING.md,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  color: colors.primaryBlue,
                  fontWeight: '600',
                }}
              >
                Other sign-in options
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
