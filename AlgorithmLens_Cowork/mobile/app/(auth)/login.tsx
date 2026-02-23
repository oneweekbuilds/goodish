import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/context/ThemeContext';
import { Eye } from 'lucide-react-native';
import { TYPOGRAPHY, SPACING, RADIUS } from '../../src/lib/theme';

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
      await signInWithOAuth('google');
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Try again');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithOAuth('apple');
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Try again');
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
      Alert.alert('Missing fields', 'Please enter password');
      return;
    }

    setEmailError('');

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Sign in failed', error.message);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Try again');
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
      Alert.alert('Missing fields', 'Please enter password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters');
      return;
    }

    setEmailError('');

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert('Sign up failed', error.message);
      } else {
        Alert.alert('Success', 'Account created! Signing you in...');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Try again');
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
          paddingHorizontal: 20,
          paddingVertical: 40,
        }}
      >
        {/* Logo and Branding */}
        <View style={{ alignItems: 'center', marginBottom: 50 }}>
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
            }}
          >
            <Eye size={36} color={colors.white} strokeWidth={1.5} />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: colors.primaryBlue,
              marginBottom: 6,
              letterSpacing: -0.5,
            }}
            accessibilityRole="header"
          >
            AlgorithmLens
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textMuted,
              textAlign: 'center',
              letterSpacing: 0.3,
            }}
          >
            See what shapes your feed
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
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 12,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
                ...shadows.soft,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryBlue} />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.textMain,
                  }}
                >
                  Continue with Google
                </Text>
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
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 24,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
                ...shadows.soft,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryBlue} />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.textMain,
                  }}
                >
                  Continue with Apple
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 20,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSlate200 }} />
              <Text
                style={{
                  marginHorizontal: 12,
                  color: colors.textSecondary,
                  fontSize: 14,
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
                paddingVertical: 12,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
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
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: emailError ? 6 : 12,
                fontSize: 16,
                color: colors.textMain,
                minHeight: 48,
              }}
              placeholderTextColor={colors.textSecondary}
            />
            {emailError ? (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.error,
                  marginBottom: 12,
                  marginLeft: 4,
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
              accessible={true}
              style={{
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.borderSlate200,
                borderRadius: RADIUS.md,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 20,
                fontSize: 16,
                color: colors.textMain,
                minHeight: 48,
              }}
              placeholderTextColor={colors.textSecondary}
            />

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
                paddingVertical: 14,
                marginBottom: 12,
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
                    fontSize: 16,
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
                paddingVertical: 14,
                marginBottom: 24,
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
                    fontSize: 16,
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
                paddingVertical: 12,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
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
