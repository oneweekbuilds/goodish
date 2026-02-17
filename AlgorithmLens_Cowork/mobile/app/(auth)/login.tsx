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
import { Eye } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../src/lib/theme';

// Email validation helper
const isValidEmail = (email: string): boolean => {
  return email.includes('@') && email.includes('.');
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'oauth' | 'email'>('oauth');
  const [emailError, setEmailError] = useState('');
  const emailInputRef = useRef<TextInput>(null);
  const { signInWithOAuth } = useAuth();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgPage }}>
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
              backgroundColor: COLORS.primaryBlue,
              borderRadius: RADIUS.xl,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: SPACING.lg,
              ...SHADOWS.hero,
            }}
          >
            <Eye size={36} color={COLORS.white} strokeWidth={1.5} />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: COLORS.primaryBlue,
              marginBottom: 6,
              letterSpacing: -0.5,
            }}
          >
            AlgorithmLens
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: COLORS.textMuted,
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
              style={{
                backgroundColor: COLORS.bgCard,
                borderWidth: 1,
                borderColor: COLORS.borderSlate200,
                borderRadius: RADIUS.md,
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 12,
                alignItems: 'center',
                ...SHADOWS.soft,
              }}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.primaryBlue} />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: COLORS.textMain,
                  }}
                >
                  Continue with Google
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAppleSignIn}
              disabled={loading}
              style={{
                backgroundColor: COLORS.bgCard,
                borderWidth: 1,
                borderColor: COLORS.borderSlate200,
                borderRadius: RADIUS.md,
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 24,
                alignItems: 'center',
                ...SHADOWS.soft,
              }}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.primaryBlue} />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: COLORS.textMain,
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
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.borderSlate200 }} />
              <Text
                style={{
                  marginHorizontal: 12,
                  color: COLORS.textSecondary,
                  fontSize: 14,
                }}
              >
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.borderSlate200 }} />
            </View>

            {/* Email/Password Fallback Link */}
            <TouchableOpacity
              onPress={() => setAuthMethod('email')}
              style={{
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.primaryBlue,
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
              editable={!loading}
              style={{
                backgroundColor: COLORS.bgCard,
                borderWidth: 1,
                borderColor: emailError ? COLORS.error : COLORS.borderSlate200,
                borderRadius: RADIUS.md,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: emailError ? 6 : 12,
                fontSize: 16,
                color: COLORS.textMain,
              }}
              placeholderTextColor={COLORS.textSecondary}
            />
            {emailError ? (
              <Text
                style={{
                  fontSize: 12,
                  color: COLORS.error,
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
              editable={!loading}
              style={{
                backgroundColor: COLORS.bgCard,
                borderWidth: 1,
                borderColor: COLORS.borderSlate200,
                borderRadius: RADIUS.md,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 20,
                fontSize: 16,
                color: COLORS.textMain,
              }}
              placeholderTextColor={COLORS.textSecondary}
            />

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleEmailSignIn}
              disabled={loading}
              style={{
                backgroundColor: COLORS.primaryBlue,
                borderRadius: RADIUS.md,
                paddingVertical: 14,
                marginBottom: 12,
                alignItems: 'center',
                ...SHADOWS.medium,
              }}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: COLORS.white,
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
              style={{
                backgroundColor: COLORS.bgCard,
                borderWidth: 1,
                borderColor: COLORS.borderSlate200,
                borderRadius: RADIUS.md,
                paddingVertical: 14,
                marginBottom: 24,
                alignItems: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.primaryBlue} />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: COLORS.primaryBlue,
                  }}
                >
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to OAuth Link */}
            <TouchableOpacity
              onPress={() => setAuthMethod('oauth')}
              style={{
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.primaryBlue,
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
