import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { router } from 'expo-router';
import { ChevronDown, ChevronRight, TrendingUp, Check, ExternalLink } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SHADOWS, SPACING } from '../../src/lib/theme';

const APP_VERSION = '1.0.0';

// TODO: Replace with direct Stripe Checkout session URLs when backend is ready
const STRIPE_CHECKOUT_URL = 'https://algorithmlens.com/pricing';

const SettingSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={{ marginBottom: SPACING['2xl'] }}>
    <Text
      style={{
        ...TYPOGRAPHY.xsmall,
        color: COLORS.textMuted,
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
      }}
    >
      {title}
    </Text>
    <View
      style={{
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  </View>
);

const SettingRow = ({
  label,
  value,
  onPress,
  isLast = false,
}: {
  label: string;
  value?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    style={{
      paddingHorizontal: SPACING.lg,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: COLORS.borderLight,
    }}
  >
    <Text
      style={{
        ...TYPOGRAPHY.body,
        fontWeight: '500',
        color: COLORS.textMain,
      }}
    >
      {label}
    </Text>
    {value}
  </TouchableOpacity>
);

const InfoText = ({ children }: { children: string }) => (
  <Text
    style={{
      ...TYPOGRAPHY.label,
      color: COLORS.textMuted,
      marginHorizontal: SPACING.lg,
      marginTop: SPACING.sm,
    }}
  >
    {children}
  </Text>
);

export default function SettingsScreen() {
  const { user, userProfile, signOut, updateAiConsent } = useAuth();
  const [aiConsent, setAiConsent] = useState(
    userProfile?.ai_analysis_consent ?? true
  );
  const [pushNotifications, setPushNotifications] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState<
    '3' | '5' | '7'
  >('7');
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAiConsentChange = async (value: boolean) => {
    try {
      setAiConsent(value);
      await updateAiConsent(value);
    } catch (error) {
      console.error('Error updating AI consent:', error);
      setAiConsent(!value); // Revert on error
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign out?', 'You will need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await signOut();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  const handleSubscriptionPress = () => {
    Alert.alert('Choose Your Plan', 'Select a subscription option:', [
      {
        text: 'Monthly — $10/month',
        onPress: () => {
          openLink(`${STRIPE_CHECKOUT_URL}?plan=monthly`);
        },
      },
      {
        text: 'Annual — $96/year (save 20%)',
        onPress: () => {
          openLink(`${STRIPE_CHECKOUT_URL}?plan=annual`);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgPage }}>
      <ScrollView scrollEventThrottle={16}>
        {/* Header */}
        <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl }}>
          <Text
            style={{
              ...TYPOGRAPHY.heroTitle,
              fontSize: 24,
              color: COLORS.textMain,
            }}
          >
            Settings
          </Text>
        </View>

        {/* Subscription */}
        {userProfile?.is_user_plus ? (
          <View style={{
            marginHorizontal: SPACING.lg,
            marginBottom: SPACING['2xl'],
            backgroundColor: COLORS.primaryBlue,
            borderRadius: RADIUS.xl,
            padding: SPACING.xl,
            ...SHADOWS.medium,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
              <Check size={18} color={COLORS.white} strokeWidth={2.5} />
              <Text style={{ ...TYPOGRAPHY.h3, color: COLORS.white }}>
                AlgorithmLens Plus
              </Text>
            </View>
            <Text style={{ ...TYPOGRAPHY.label, color: 'rgba(255, 255, 255, 0.8)' }}>
              You have access to longitudinal trend analysis and all premium features.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleSubscriptionPress}
            style={{
              marginHorizontal: SPACING.lg,
              marginBottom: SPACING['2xl'],
              backgroundColor: COLORS.blue800,
              borderRadius: RADIUS.xl,
              padding: SPACING.xl,
              ...SHADOWS.medium,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
              <TrendingUp size={20} color={COLORS.white} strokeWidth={2} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>
                Upgrade to Plus
              </Text>
            </View>
            <Text style={{ ...TYPOGRAPHY.bodySmall, color: 'rgba(255, 255, 255, 0.85)', marginBottom: SPACING.lg }}>
              See how your feed changes over time with longitudinal trend analysis.
            </Text>
            <View style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
              {[
                'Track trends across all 6 dashboard tabs',
                'Compare scans over weeks and months',
                'See if your feed composition is shifting',
              ].map((feature, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Check size={14} color={COLORS.accentGreen} strokeWidth={2.5} />
                  <Text style={{ ...TYPOGRAPHY.label, color: 'rgba(255, 255, 255, 0.9)' }}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: SPACING.md }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.white }}>$10</Text>
              <Text style={{ ...TYPOGRAPHY.bodySmall, color: 'rgba(255, 255, 255, 0.7)' }}>/month</Text>
              <Text style={{ ...TYPOGRAPHY.small, color: 'rgba(255, 255, 255, 0.5)', marginLeft: SPACING.sm }}>
                or $96/year (save 20%)
              </Text>
            </View>
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: RADIUS.md,
              paddingVertical: SPACING.md,
              alignItems: 'center',
            }}>
              <Text style={{ ...TYPOGRAPHY.h3, color: COLORS.blue800 }}>
                Start 2-Week Free Trial
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* AI Analysis */}
        <SettingSection title="AI Analysis">
          <SettingRow
            label="Enable AI analysis"
            value={
              <Switch
                value={aiConsent}
                onValueChange={handleAiConsentChange}
                trackColor={{ false: COLORS.borderSlate200, true: COLORS.blue100 }}
                thumbColor={aiConsent ? COLORS.primaryBlue : COLORS.textSecondary}
              />
            }
            isLast={true}
          />
          <InfoText>
            AlgorithmLens uses Google Gemini to analyze political content and
            emotional tone. Your data is not used to train AI models.
          </InfoText>
        </SettingSection>

        {/* Scan Reminders */}
        <SettingSection title="Scan Reminders">
          <SettingRow
            label="Push notifications"
            value={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: COLORS.borderSlate200, true: COLORS.blue100 }}
                thumbColor={pushNotifications ? COLORS.primaryBlue : COLORS.textSecondary}
              />
            }
          />
          {pushNotifications && (
            <SettingRow
              label="Frequency"
              value={
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING.sm,
                  }}
                >
                  <Text
                    style={{
                      ...TYPOGRAPHY.bodySmall,
                      fontWeight: '600',
                      color: COLORS.primaryBlue,
                    }}
                  >
                    Every {notificationFrequency} days
                  </Text>
                  <ChevronDown
                    size={16}
                    color={COLORS.textSecondary}
                    strokeWidth={2}
                  />
                </View>
              }
              onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
              isLast={!showFrequencyPicker}
            />
          )}
          {pushNotifications && showFrequencyPicker && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: COLORS.borderLight,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
              }}
            >
              {['3', '5', '7'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => {
                    setNotificationFrequency(freq as '3' | '5' | '7');
                    setShowFrequencyPicker(false);
                  }}
                  style={{
                    paddingVertical: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      ...TYPOGRAPHY.bodySmall,
                      color: COLORS.textMain,
                      fontWeight:
                        notificationFrequency === freq ? '600' : '400',
                    }}
                  >
                    Every {freq} days
                  </Text>
                  {notificationFrequency === freq && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: COLORS.primaryBlue,
                      }}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SettingSection>

        {/* Data & Privacy */}
        <SettingSection title="Data & Privacy">
          <View
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: COLORS.textMuted,
              }}
            >
              AlgorithmLens collects data about your feed content to provide
              insights. We never collect personal information, passwords, or
              login credentials. Your data is encrypted and stored securely.
            </Text>
          </View>
        </SettingSection>

        {/* Account */}
        <SettingSection title="Account">
          <SettingRow
            label="Email"
            value={
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  color: COLORS.textMuted,
                }}
              >
                {user?.email}
              </Text>
            }
          />
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={loading}
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: COLORS.borderLight,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.textMuted} />
            ) : (
              <Text
                style={{
                  ...TYPOGRAPHY.body,
                  fontWeight: '500',
                  color: COLORS.textMuted,
                }}
              >
                Sign Out
              </Text>
            )}
          </TouchableOpacity>
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <SettingRow
            label="App Version"
            value={
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  color: COLORS.textMuted,
                }}
              >
                {APP_VERSION}
              </Text>
            }
          />
          <SettingRow
            label="Privacy Policy"
            onPress={() => openLink('https://algorithmlens.com/privacy')}
            value={
              <ChevronRight size={16} color={COLORS.textSecondary} strokeWidth={2} />
            }
          />
          <SettingRow
            label="Terms of Service"
            onPress={() => openLink('https://algorithmlens.com/terms')}
            value={
              <ChevronRight size={16} color={COLORS.textSecondary} strokeWidth={2} />
            }
          />
          <SettingRow
            label="Website"
            onPress={() => openLink('https://algorithmlens.com')}
            value={
              <ExternalLink size={16} color={COLORS.textSecondary} strokeWidth={2} />
            }
            isLast={true}
          />
          <View
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: COLORS.borderLight,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: COLORS.textMuted,
              }}
            >
              Part of Goodish — building tools that increase human agency.
            </Text>
          </View>
        </SettingSection>

        {/* Spacing */}
        <View style={{ height: SPACING['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}
