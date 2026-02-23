import React, { useState, useEffect, useCallback } from 'react';
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
import Constants from 'expo-constants';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { supabase } from '../../src/lib/supabase';
import { router } from 'expo-router';
import { ChevronDown, ChevronRight, TrendingUp, Check, ExternalLink } from 'lucide-react-native';
import { TYPOGRAPHY, RADIUS, SPACING } from '../../src/lib/theme';
import { presentPlanSelection } from '../../src/lib/checkout';
import { REMINDER_FREQUENCY_OPTIONS, type ReminderFrequency } from '../../src/config/thresholds';
import {
  enableNotifications,
  disableNotifications,
  loadNotificationEnabled,
  loadNotificationFrequency,
  saveNotificationFrequency,
  scheduleReminder,
} from '../../src/services/notifications';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

// Note: These components will be moved inside SettingsScreen to access colors via closure
const SettingSection = ({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
}) => (
  <View style={{ marginBottom: SPACING['2xl'] }}>
    <Text
      style={{
        ...TYPOGRAPHY.xsmall,
        color: colors.textMuted,
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
      }}
    >
      {title}
    </Text>
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
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
  colors,
  accessibilityLabel,
  accessibilityRole,
}: {
  label: string;
  value?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'none' | 'header' | 'search' | 'image' | 'text' | 'adjustable' | 'imagebutton' | 'keyboardkey' | 'summary' | 'alert' | 'checkbox' | 'combobox' | 'menu' | 'menubar' | 'menuitem' | 'progressbar' | 'radio' | 'radiogroup' | 'scrollbar' | 'spinbutton' | 'switch' | 'tab' | 'tabbar' | 'tablist' | 'timer' | 'list' | 'toolbar';
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={accessibilityRole || (onPress ? 'button' : undefined)}
    accessibilityLabel={accessibilityLabel}
    style={{
      paddingHorizontal: SPACING.lg,
      paddingVertical: 14,
      minHeight: 44,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.borderLight,
    }}
  >
    <Text
      style={{
        ...TYPOGRAPHY.body,
        fontWeight: '500',
        color: colors.textMain,
      }}
    >
      {label}
    </Text>
    {value}
  </TouchableOpacity>
);

const InfoText = ({ children, colors }: { children: string; colors: ReturnType<typeof useTheme>['colors'] }) => (
  <Text
    style={{
      ...TYPOGRAPHY.label,
      color: colors.textMuted,
      marginHorizontal: SPACING.lg,
      marginTop: SPACING.sm,
    }}
  >
    {children}
  </Text>
);

export default function SettingsScreen() {
  const { user, userProfile, signOut, updateAiConsent, isPlus, subscription } = useAuth();
  const { colors, shadows } = useTheme();
  const [aiConsent, setAiConsent] = useState(
    userProfile?.ai_analysis_consent ?? true
  );
  const [pushNotifications, setPushNotifications] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState<ReminderFrequency>('7');
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Load persisted notification state on mount
  useEffect(() => {
    (async () => {
      const enabled = await loadNotificationEnabled();
      const frequency = await loadNotificationFrequency();
      setPushNotifications(enabled);
      setNotificationFrequency(frequency);
    })();
  }, []);

  const handleNotificationToggle = useCallback(async (value: boolean) => {
    setNotifLoading(true);
    try {
      if (value) {
        const success = await enableNotifications(notificationFrequency);
        if (!success) {
          // Permission was denied or scheduling failed — keep toggle off
          setPushNotifications(false);
          return;
        }
        setPushNotifications(true);
      } else {
        await disableNotifications();
        setPushNotifications(false);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error toggling notifications:', error);
      }
      Alert.alert('Error', 'Could not update notification settings.');
      setPushNotifications(!value); // Revert
    } finally {
      setNotifLoading(false);
    }
  }, [notificationFrequency]);

  const handleFrequencyChange = useCallback(async (freq: ReminderFrequency) => {
    setNotificationFrequency(freq);
    setShowFrequencyPicker(false);
    await saveNotificationFrequency(freq);
    if (pushNotifications) {
      // Re-schedule with new frequency
      await scheduleReminder(parseInt(freq, 10));
    }
  }, [pushNotifications]);

  const handleAiConsentChange = async (value: boolean) => {
    try {
      setAiConsent(value);
      await updateAiConsent(value);
    } catch (error) {
      if (__DEV__) {
        console.error('Error updating AI consent:', error);
      }
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
    presentPlanSelection();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ScrollView scrollEventThrottle={16}>
        {/* Header */}
        <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl }}>
          <Text
            style={{
              ...TYPOGRAPHY.heroTitle,
              fontSize: 24,
              color: colors.textMain,
            }}
            accessibilityRole="header"
          >
            Settings
          </Text>
        </View>

        {/* Subscription */}
        {isPlus ? (
          <View style={{
            marginHorizontal: SPACING.lg,
            marginBottom: SPACING['2xl'],
            backgroundColor: colors.primaryBlue,
            borderRadius: RADIUS.xl,
            padding: SPACING.xl,
            ...shadows.medium,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
              <Check size={18} color={colors.white} strokeWidth={2.5} />
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.white }}>
                AlgorithmLens Plus
              </Text>
            </View>
            <Text style={{ ...TYPOGRAPHY.label, color: 'rgba(255, 255, 255, 0.8)' }}>
              You have access to longitudinal trend analysis and all premium features.
            </Text>
            {subscription?.trial_days_remaining != null && subscription.trial_days_remaining > 0 && (
              <Text style={{ ...TYPOGRAPHY.small, color: 'rgba(255, 255, 255, 0.65)', marginTop: SPACING.xs }}>
                Trial: {subscription.trial_days_remaining} day{subscription.trial_days_remaining !== 1 ? 's' : ''} remaining
              </Text>
            )}
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleSubscriptionPress}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Plus"
            style={{
              marginHorizontal: SPACING.lg,
              marginBottom: SPACING['2xl'],
              backgroundColor: colors.blue800,
              borderRadius: RADIUS.xl,
              padding: SPACING.xl,
              ...shadows.medium,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
              <TrendingUp size={20} color={colors.white} strokeWidth={2} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.white }}>
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
                  <Check size={14} color={colors.accentGreen} strokeWidth={2.5} />
                  <Text style={{ ...TYPOGRAPHY.label, color: 'rgba(255, 255, 255, 0.9)' }}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: SPACING.md }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.white }}>$10</Text>
              <Text style={{ ...TYPOGRAPHY.bodySmall, color: 'rgba(255, 255, 255, 0.7)' }}>/month</Text>
              <Text style={{ ...TYPOGRAPHY.small, color: 'rgba(255, 255, 255, 0.5)', marginLeft: SPACING.sm }}>
                or $96/year (save 20%)
              </Text>
            </View>
            <View style={{
              backgroundColor: colors.white,
              borderRadius: RADIUS.md,
              paddingVertical: SPACING.md,
              alignItems: 'center',
            }}>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.blue800 }} accessibilityLabel="Start 2-Week Free Trial">
                Start 2-Week Free Trial
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* AI Analysis */}
        <SettingSection title="AI Analysis" colors={colors}>
          <SettingRow
            label="Enable AI analysis"
            value={
              <Switch
                value={aiConsent}
                onValueChange={handleAiConsentChange}
                trackColor={{ false: colors.borderSlate200, true: colors.blue100 }}
                thumbColor={aiConsent ? colors.primaryBlue : colors.textSecondary}
                accessibilityLabel={`Enable AI analysis, currently ${aiConsent ? 'on' : 'off'}`}
                accessible={true}
              />
            }
            isLast={true}
            colors={colors}
          />
          <InfoText colors={colors}>
            AlgorithmLens uses Google Gemini to analyze political content and
            emotional tone. Your data is not used to train AI models.
          </InfoText>
        </SettingSection>

        {/* Scan Reminders */}
        <SettingSection title="Scan Reminders" colors={colors}>
          <SettingRow
            label="Push notifications"
            value={
              <Switch
                value={pushNotifications}
                onValueChange={handleNotificationToggle}
                disabled={notifLoading}
                trackColor={{ false: colors.borderSlate200, true: colors.blue100 }}
                thumbColor={pushNotifications ? colors.primaryBlue : colors.textSecondary}
                accessibilityLabel={`Push notifications, currently ${pushNotifications ? 'on' : 'off'}`}
                accessible={true}
              />
            }
            colors={colors}
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
                      color: colors.primaryBlue,
                    }}
                  >
                    Every {notificationFrequency} days
                  </Text>
                  <ChevronDown
                    size={16}
                    color={colors.textSecondary}
                    strokeWidth={2}
                  />
                </View>
              }
              onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
              isLast={!showFrequencyPicker}
              colors={colors}
            />
          )}
          {pushNotifications && showFrequencyPicker && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.borderLight,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
              }}
            >
              {REMINDER_FREQUENCY_OPTIONS.map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => handleFrequencyChange(freq)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: notificationFrequency === freq }}
                  accessibilityLabel={`Every ${freq} days`}
                  style={{
                    paddingVertical: 10,
                    minHeight: 44,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      ...TYPOGRAPHY.bodySmall,
                      color: colors.textMain,
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
                        backgroundColor: colors.primaryBlue,
                      }}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SettingSection>

        {/* Data & Privacy */}
        <SettingSection title="Data & Privacy" colors={colors}>
          <View
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: colors.textMuted,
              }}
            >
              AlgorithmLens collects data about your feed content to provide
              insights. We never collect personal information, passwords, or
              login credentials. Your data is encrypted and stored securely.
            </Text>
          </View>
        </SettingSection>

        {/* Account */}
        <SettingSection title="Account" colors={colors}>
          <SettingRow
            label="Email"
            value={
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  color: colors.textMuted,
                }}
              >
                {user?.email}
              </Text>
            }
            colors={colors}
          />
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: 14,
              minHeight: 44,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textMuted} />
            ) : (
              <Text
                style={{
                  ...TYPOGRAPHY.body,
                  fontWeight: '500',
                  color: colors.textMuted,
                }}
              >
                Sign Out
              </Text>
            )}
          </TouchableOpacity>
        </SettingSection>

        {/* About */}
        <SettingSection title="About" colors={colors}>
          <SettingRow
            label="App Version"
            value={
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  color: colors.textMuted,
                }}
              >
                {APP_VERSION}
              </Text>
            }
            colors={colors}
          />
          <SettingRow
            label="Privacy Policy"
            onPress={() => openLink('https://algorithmlens.com/privacy')}
            value={
              <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
            }
            colors={colors}
            accessibilityLabel="Privacy Policy"
            accessibilityRole="link"
          />
          <SettingRow
            label="Terms of Service"
            onPress={() => openLink('https://algorithmlens.com/terms')}
            value={
              <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
            }
            colors={colors}
            accessibilityLabel="Terms of Service"
            accessibilityRole="link"
          />
          <SettingRow
            label="Website"
            onPress={() => openLink('https://algorithmlens.com')}
            value={
              <ExternalLink size={16} color={colors.textSecondary} strokeWidth={2} />
            }
            isLast={true}
            colors={colors}
            accessibilityLabel="Website"
            accessibilityRole="link"
          />
          <View
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: colors.textMuted,
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
