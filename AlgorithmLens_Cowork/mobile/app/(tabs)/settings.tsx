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
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { supabase } from '../../src/lib/supabase';
import { router } from 'expo-router';
import { ChevronDown, ChevronRight, TrendingUp, Check, ExternalLink } from 'lucide-react-native';
import { TYPOGRAPHY, RADIUS, SPACING, MIN_TOUCH_TARGET } from '../../src/lib/theme';
import Divider from '../../src/components/ui/Divider';
import { Card } from '../../src/components/ui/Card';
import { UpgradeModal } from '../../src/components/plan/UpgradeModal';
import { REMINDER_FREQUENCY_OPTIONS, type ReminderFrequency } from '../../src/config/thresholds';
import {
  enableNotifications,
  disableNotifications,
  loadNotificationEnabled,
  loadNotificationFrequency,
  saveNotificationFrequency,
  scheduleReminder,
} from '../../src/services/notifications';

import { authenticatedFetch } from '../../src/lib/api';
import { captureError } from '../../src/lib/sentry';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

// Note: These components will be moved inside SettingsScreen to access colors via closure
// L-09 FIX: Enhanced section separators — follows iOS Settings pattern with
// prominent divider lines and generous spacing between groups.
const SettingSection = ({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
}) => (
  <View style={{
    marginBottom: SPACING['3xl'],
    paddingBottom: SPACING.xl,
  }}>
    <Text
      style={{
        ...TYPOGRAPHY.xsmall,
        color: colors.textMuted,
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
    {/* Section divider line */}
    <Divider
      spacing={SPACING['2xl']}
      color={colors.borderLight}
      thickness={1}
    />
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
  <>
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={accessibilityRole || (onPress ? 'button' : undefined)}
      accessibilityLabel={accessibilityLabel}
      style={{
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        minHeight: MIN_TOUCH_TARGET,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    {!isLast && (
      <View style={{
        height: 1,
        backgroundColor: colors.borderLight,
        marginHorizontal: SPACING.lg,
      }} />
    )}
  </>
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
  // H-16 FIX: Custom branded upgrade modal replaces generic Alert.alert()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // L-08 FIX: Collapsible legal section
  const [legalExpanded, setLegalExpanded] = useState(false);
  // M-12 FIX: Delete Account requires typing "DELETE" to confirm
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
    setShowUpgradeModal(true);
  };

  // I9 FIX: Open Stripe billing portal for Plus subscribers
  const [portalLoading, setPortalLoading] = useState(false);
  const handleManageSubscription = useCallback(async () => {
    setPortalLoading(true);
    try {
      const response = await authenticatedFetch('/api/stripe/create-portal-session', {
        method: 'POST',
        body: JSON.stringify({
          returnUrl: 'algorithmlens://settings',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Could not open billing portal.');
      }

      const data = await response.json();
      if (data.url) {
        await Linking.openURL(data.url);
      } else {
        throw new Error('No portal URL returned.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not open billing portal.';
      captureError(err instanceof Error ? err : new Error(message), 'settings:billing-portal');
      Alert.alert('Billing Portal', message);
    } finally {
      setPortalLoading(false);
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ScrollView scrollEventThrottle={16}>
        {/* Header */}
        <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl }}>
          <Text
            style={{
              ...TYPOGRAPHY.heroTitle,
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
            borderRadius: RADIUS.lg,
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
            {/* I9 FIX: Manage Subscription button — opens Stripe billing portal */}
            <TouchableOpacity
              onPress={handleManageSubscription}
              disabled={portalLoading}
              accessibilityRole="button"
              accessibilityLabel="Manage subscription"
              style={{
                marginTop: SPACING.md,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.sm,
                paddingHorizontal: SPACING.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.sm,
                minHeight: MIN_TOUCH_TARGET,
              }}
            >
              {portalLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <ExternalLink size={14} color={colors.white} strokeWidth={2} />
                  <Text style={{ ...TYPOGRAPHY.buttonSm, color: colors.white }}>
                    Manage Subscription
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

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
                accessibilityHint="Turns on Gemini AI analysis for political content and tone"
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
                accessibilityHint="Sends periodic reminders to scan your feeds"
                accessible={true}
              />
            }
            colors={colors}
          />
          {/* L-07 FIX: Clear notification toggle descriptions */}
          <InfoText colors={colors}>
            {pushNotifications
              ? 'Choose how often you\'d like to be reminded below.'
              : 'Get periodic reminders to scan your feed'}
          </InfoText>
          {/* S-3 FIX: Show frequency preview even when notifications are off */}
          {!pushNotifications && (
            <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm }}>
              <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>
                Default: Every {notificationFrequency} days
              </Text>
            </View>
          )}
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
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
                borderTopWidth: 1,
                borderTopColor: colors.borderLight,
              }}
            >
              {REMINDER_FREQUENCY_OPTIONS.map((freq, idx) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => handleFrequencyChange(freq)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: notificationFrequency === freq }}
                  accessibilityLabel={`Every ${freq} days`}
                  style={{
                    paddingVertical: SPACING.sm,
                    minHeight: MIN_TOUCH_TARGET,
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

        {/* Data & Privacy — M-05 FIX: Full text always visible */}
        <SettingSection title="Data & Privacy" colors={colors}>
          <View
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.md,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: colors.textMuted,
                flexWrap: 'wrap',
              }}
            >
              AlgorithmLens analyzes your feed content to show you its composition. We never collect passwords, login credentials, or personally identifiable information. Your data is not used to train AI models.
            </Text>
            <TouchableOpacity
              onPress={() => openLink('https://algorithmlens.com/privacy')}
              accessibilityRole="link"
              accessibilityLabel="Learn more about our data practices"
              style={{ marginTop: SPACING.sm }}
            >
              <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.primaryBlue, fontWeight: '500' }}>
                Learn more about our data practices
              </Text>
            </TouchableOpacity>
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
            isLast={false}
          />
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.md,
              minHeight: MIN_TOUCH_TARGET,
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
          <View style={{ height: 1, backgroundColor: colors.borderLight, marginHorizontal: SPACING.lg }} />
          {/* M-07 FIX: Extra spacing above Delete Account to separate from Sign Out */}
          <View style={{ height: SPACING.xl }} />
          {/* M-12 FIX: Delete Account with type-to-confirm gate */}
          <TouchableOpacity
            onPress={() => {
              setDeleteConfirmText('');
              setShowDeleteModal(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.md,
              minHeight: MIN_TOUCH_TARGET,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.body,
                fontWeight: '500',
                color: colors.error,
              }}
            >
              Delete Account
            </Text>
          </TouchableOpacity>
        </SettingSection>

        {/* About — L-08 FIX: Collapsible legal section */}
        <SettingSection title="About" colors={colors}>
          {/* Inline upgrade row — replaces old floating dark banner (VH-007) */}
          {!isPlus && (
            <TouchableOpacity
              onPress={handleSubscriptionPress}
              accessibilityRole="button"
              accessibilityLabel="Upgrade to Plus — track trends over time"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: SPACING.lg,
                paddingHorizontal: SPACING.lg,
                backgroundColor: colors.bgCard,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                <View style={{
                  width: 32, height: 32, borderRadius: RADIUS.md,
                  backgroundColor: colors.blue50,
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  <TrendingUp size={16} color={colors.primaryBlue} />
                </View>
                <View>
                  <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain }}>
                    Upgrade to Plus
                  </Text>
                  <Text style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary }}>
                    Track trends over time
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          {/* S-8 FIX: Show build number alongside version */}
          <SettingRow
            label="App Version"
            value={
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  color: colors.textMuted,
                }}
              >
                {APP_VERSION} (1)
              </Text>
            }
            colors={colors}
          />
          {/* L-08 FIX: Group legal links into expandable row */}
          <SettingRow
            label="Legal"
            onPress={() => setLegalExpanded(!legalExpanded)}
            value={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textTertiary }}>
                  Privacy, Terms, Website
                </Text>
                <ChevronDown
                  size={14}
                  color={colors.textSecondary}
                  strokeWidth={2}
                  style={{ transform: [{ rotate: legalExpanded ? '180deg' : '0deg' }] }}
                />
              </View>
            }
            isLast={!legalExpanded}
            colors={colors}
            accessibilityLabel={legalExpanded ? 'Collapse legal links' : 'Expand legal links'}
          />
          {legalExpanded && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight }}>
              <SettingRow
                label="Privacy Policy"
                onPress={() => openLink('https://algorithmlens.com/privacy')}
                value={<ExternalLink size={14} color={colors.textSecondary} strokeWidth={2} />}
                colors={colors}
                accessibilityLabel="Privacy Policy"
                accessibilityRole="link"
                isLast={false}
              />
              <SettingRow
                label="Terms of Service"
                onPress={() => openLink('https://algorithmlens.com/terms')}
                value={<ExternalLink size={14} color={colors.textSecondary} strokeWidth={2} />}
                colors={colors}
                accessibilityLabel="Terms of Service"
                accessibilityRole="link"
                isLast={false}
              />
              <SettingRow
                label="Website"
                onPress={() => openLink('https://algorithmlens.com')}
                value={<ExternalLink size={14} color={colors.textSecondary} strokeWidth={2} />}
                isLast={true}
                colors={colors}
                accessibilityLabel="Website"
                accessibilityRole="link"
              />
            </View>
          )}
          <View
            style={{
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.md,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
            }}
          >
            {/* S-7 FIX: Goodish is now a tappable link */}
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: colors.textMuted,
              }}
            >
              Part of{' '}
              <Text
                onPress={() => openLink('https://goodish.com')}
                accessibilityRole="link"
                accessibilityLabel="Visit Goodish"
                style={{ color: colors.primaryBlue, textDecorationLine: 'underline' }}
              >
                Goodish
              </Text>
              {' '}— building tools that increase human agency.
            </Text>
          </View>
        </SettingSection>

        {/* Spacing — account for tab bar height */}
        <View style={{ height: SPACING['6xl'] }} />
      </ScrollView>

      {/* H-16 FIX: Branded upgrade modal replaces generic native Alert */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* M-12 FIX: Delete Account confirmation modal — requires typing "DELETE" */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
        statusBarTranslucent
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: SPACING.xl,
        }}>
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.xl,
            padding: SPACING.xl,
            width: '100%',
            maxWidth: 340,
            ...shadows.xl,
          }}>
            <Text style={{
              ...TYPOGRAPHY.h2,
              color: colors.error,
              marginBottom: SPACING.md,
            }}>
              Delete Account
            </Text>
            <Text style={{
              ...TYPOGRAPHY.body,
              color: colors.textMain,
              marginBottom: SPACING.lg,
            }}>
              This will permanently delete your account and all scan history. This cannot be undone.
            </Text>
            <Text style={{
              ...TYPOGRAPHY.label,
              color: colors.textSecondary,
              marginBottom: SPACING.sm,
            }}>
              Type DELETE to confirm:
            </Text>
            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              style={{
                borderWidth: 1,
                borderColor: deleteConfirmText === 'DELETE' ? colors.error : colors.borderDefault,
                borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                ...TYPOGRAPHY.body,
                color: colors.textMain,
                marginBottom: SPACING.xl,
                minHeight: MIN_TOUCH_TARGET,
              }}
              accessibilityLabel="Type DELETE to confirm account deletion"
            />
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={{
                  flex: 1,
                  paddingVertical: SPACING.md,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: colors.borderDefault,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 48,
                }}
              >
                <Text style={{ ...TYPOGRAPHY.buttonSm, color: colors.textSecondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  // TODO: Implement actual account deletion API call
                  Alert.alert(
                    'Request Submitted',
                    'Your account deletion request has been submitted. You will receive a confirmation email.'
                  );
                }}
                disabled={deleteConfirmText !== 'DELETE'}
                accessibilityRole="button"
                accessibilityLabel="Confirm delete account"
                style={{
                  flex: 1,
                  paddingVertical: SPACING.md,
                  borderRadius: RADIUS.md,
                  backgroundColor: deleteConfirmText === 'DELETE' ? colors.error : colors.borderSlate200,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 48,
                }}
              >
                <Text style={{
                  ...TYPOGRAPHY.buttonSm,
                  color: deleteConfirmText === 'DELETE' ? colors.white : colors.textTertiary,
                }}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
