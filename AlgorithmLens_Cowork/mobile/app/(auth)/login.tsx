import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/context/ThemeContext';
import { Eye } from 'lucide-react-native';
import { SPACING, RADIUS, ICON_SIZES } from '../../src/lib/theme';
import { GL_TYPOGRAPHY } from '../../src/lib/gluestackTheme';
import { Button, Text, Divider } from '../../src/components/glue';
import { getUserFriendlyNetworkError } from '../../src/lib/networkUtils';

// Email validation — checks for user@domain.tld pattern
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email.trim());
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Build #44: OAuth (Google / Apple) is hidden because the supporting
  // packages (expo-web-browser, expo-apple-authentication) aren't yet
  // installed and the auth/callback route doesn't exist. Tapping either
  // button previously did nothing. Email-only login until those land in a
  // future build. Initial authMethod set to 'email' so the email branch
  // renders on first load.
  // TODO build #45+: re-enable OAuth once expo-web-browser, expo-apple-authentication
  // packages added and an auth/callback route exists.
  const [authMethod, setAuthMethod] = useState<'oauth' | 'email'>('email');
  const [emailError, setEmailError] = useState('');
  const [authError, setAuthError] = useState('');
  // Build #44: success messages (e.g. "Account created!", "Password reset
  // email sent!") were previously stuffed into authError state and rendered
  // in red — confusing because red signals failure. Track them separately
  // so the UI can render them in the success/info color.
  const [authInfo, setAuthInfo] = useState('');
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
    setAuthInfo('');

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Build #44: route raw Supabase auth errors through the friendly
        // network-error mapper. Adds a specific case for "Invalid login
        // credentials" so the user sees a helpful prompt rather than
        // technical jargon.
        setAuthError(getUserFriendlyNetworkError(error));
      }
    } catch (error) {
      setAuthError(getUserFriendlyNetworkError(error));
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
    setAuthInfo('');

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Build #44: friendly error mapping (covers "User already registered")
        setAuthError(getUserFriendlyNetworkError(error));
      } else {
        // Build #44: success message goes to authInfo (rendered in success
        // color), not authError (red). Clear any prior error first.
        setAuthError('');
        setAuthInfo('Account created! Signing you in...');
      }
    } catch (error) {
      setAuthError(getUserFriendlyNetworkError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: SPACING.xl,
          paddingVertical: SPACING['4xl'],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Branding */}
        <View style={{ alignItems: 'center', marginBottom: SPACING['5xl'] }}>
          {/* App Icon */}
          <View
            style={{
              width: ICON_SIZES['6xl'],
              height: ICON_SIZES['6xl'],
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
            variant="display"
            color={colors.primaryBlue}
            style={{ marginBottom: SPACING.xs }}
            accessibilityRole="header"
          >
            AlgorithmLens
          </Text>
          <Text
            variant="bodySmall"
            color={colors.textMuted}
            align="center"
            style={{
              letterSpacing: 0.3,
              fontWeight: '500',
            }}
          >
            {/* E-2 FIX: Stricter epistemic compliance — "appears" instead of "shapes" */}
            See what appears in your feed
          </Text>
        </View>

        {/* Build #44: OAuth branch is unreachable (hard-gated to false). The
            full UI is preserved below for re-enable later — see TODO in the
            useState initializer at the top of this component. The email
            branch is the only reachable path. */}
        {false && authMethod === 'oauth' ? (
          <>
            {/* OAuth Buttons */}
            <Button
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              disabled={loading}
              loading={loading}
              variant="secondary"
              size="lg"
              accessibilityLabel="Continue with Google"
              icon={<Text style={{ fontWeight: 'bold', fontSize: GL_TYPOGRAPHY.body.fontSize }}>G</Text>}
              style={{ marginBottom: SPACING.md }}
            />

            <Button
              title="Continue with Apple"
              onPress={handleAppleSignIn}
              disabled={loading}
              loading={loading}
              variant="secondary"
              size="lg"
              accessibilityLabel="Continue with Apple"
              icon={<Text style={{ fontSize: GL_TYPOGRAPHY.h3.fontSize }}>🍎</Text>}
              style={{ marginBottom: SPACING.xl }}
            />

            {/* Error Message for OAuth */}
            {authError ? (
              <Text
                variant="small"
                color={colors.error}
                align="center"
                style={{
                  marginBottom: SPACING.md,
                  marginLeft: SPACING.xs,
                }}
              >
                {authError}
              </Text>
            ) : null}

            {/* Divider with "or" label */}
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
                  ...GL_TYPOGRAPHY.bodySmall,
                }}
              >
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSlate200 }} />
            </View>

            {/* Email/Password Fallback Link */}
            <TouchableOpacity
              onPress={() => setAuthMethod('email')}
              activeOpacity={0.6}
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
                  ...GL_TYPOGRAPHY.bodySmall,
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
                ...GL_TYPOGRAPHY.body,
                color: colors.textMain,
                minHeight: 48,
                ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
              }}
              placeholderTextColor={colors.textSecondary}
            />
            {emailError ? (
              <Text
                variant="small"
                color={colors.error}
                style={{
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
                ...GL_TYPOGRAPHY.body,
                color: colors.textMain,
                minHeight: 48,
                ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
              }}
              placeholderTextColor={colors.textSecondary}
            />

            {/* Forgot Password Link — L-5 FIX */}
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={async () => {
                if (!email || !isValidEmail(email)) {
                  setAuthError('Enter your email address first, then tap Forgot password.');
                  return;
                }
                try {
                  setAuthError('');
                  setAuthInfo('');
                  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
                  if (resetError) {
                    // Build #44: friendly error mapping
                    setAuthError(getUserFriendlyNetworkError(resetError));
                  } else {
                    // Build #44: success → authInfo, not authError.
                    setAuthError('');
                    setAuthInfo('Password reset email sent! Check your inbox.');
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
                  ...GL_TYPOGRAPHY.small,
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
                variant="small"
                color={colors.error}
                align="center"
                style={{
                  marginBottom: SPACING.md,
                  marginLeft: SPACING.xs,
                }}
              >
                {authError}
              </Text>
            ) : null}

            {/* Build #44: Success / info messages render in success color
                instead of red. authInfo is set by handleEmailSignUp on
                account-creation success and the forgot-password handler. */}
            {authInfo ? (
              <Text
                variant="small"
                color={colors.successBright}
                align="center"
                style={{
                  marginBottom: SPACING.md,
                  marginLeft: SPACING.xs,
                  fontWeight: '500',
                }}
              >
                {authInfo}
              </Text>
            ) : null}

            {/* Sign In Button */}
            <Button
              title="Sign In"
              onPress={handleEmailSignIn}
              disabled={loading}
              loading={loading}
              variant="primary"
              size="lg"
              accessibilityLabel="Sign in"
              style={{ marginBottom: SPACING.md }}
            />

            {/* Sign Up Button */}
            <Button
              title="Create Account"
              onPress={handleEmailSignUp}
              disabled={loading}
              loading={loading}
              variant="secondary"
              size="lg"
              accessibilityLabel="Create account"
              style={{ marginBottom: SPACING.xl }}
            />

            {/* Build #44: "Other sign-in options" link hidden because OAuth
                branch is gated off. Re-enable when OAuth ships. */}
            {false && (
              <TouchableOpacity
                onPress={() => setAuthMethod('oauth')}
                activeOpacity={0.6}
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
                    ...GL_TYPOGRAPHY.bodySmall,
                    color: colors.primaryBlue,
                    fontWeight: '600',
                  }}
                >
                  Other sign-in options
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
