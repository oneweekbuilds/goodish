/**
 * UpgradeModal — Custom branded upgrade screen for AlgorithmLens Plus.
 *
 * H-16 FIX: Replaces the generic native Alert.alert() plan selection
 * with a polished, branded bottom sheet that matches the app's design
 * system. This is the most critical revenue conversion moment in the app.
 *
 * Design follows PlatformBottomSheet patterns:
 * - Animated bottom sheet with overlay
 * - Uses the app's TYPOGRAPHY, SPACING, RADIUS, and ThemeContext colors
 * - Calm, measured aesthetic (Oura Ring–inspired)
 *
 * Pricing (display only — Stripe is the source of truth):
 * - Monthly: $10/month
 * - Annual: $96/year (save 20%)
 * - Both include 14-day free trial
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  TrendingUp,
  BarChart3,
  History,
  Sparkles,
  Headphones,
  X,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../lib/theme';
import { startCheckout, type PlanType } from '../../lib/checkout';
import { triggerImpactLight, triggerImpactMedium } from '../../lib/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Features to display in the comparison list.
 * Free tier has all 6 tabs but with fewer charts, no time range selection,
 * and fewer English takeaways. Plus unlocks the full experience. */
const PLUS_FEATURES = [
  {
    icon: BarChart3,
    label: 'Full charts on every tab',
    freeLabel: 'Limited charts per tab',
  },
  {
    icon: TrendingUp,
    label: 'Time range selection & trends',
    freeLabel: 'Current scan only',
  },
  {
    icon: History,
    label: 'Unlimited scan history',
    freeLabel: 'Not included',
  },
  {
    icon: Sparkles,
    label: 'Deeper analysis & takeaways',
    freeLabel: 'Basic insights',
  },
  {
    icon: Headphones,
    label: 'Priority support',
    freeLabel: 'Not included',
  },
] as const;

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
}

function UpgradeModalComponent({ visible, onClose }: UpgradeModalProps) {
  const { colors, shadows } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelectedPlan('annual');
      setLoading(false);
      setError(null);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, overlayAnim]);

  const handlePlanSelect = useCallback(
    (plan: PlanType) => {
      triggerImpactLight();
      setSelectedPlan(plan);
    },
    [],
  );

  const handleCheckout = useCallback(async () => {
    triggerImpactMedium();
    setLoading(true);
    setError(null);
    try {
      await startCheckout(selectedPlan);
      onClose();
    } catch (err) {
      // Show inline error with retry option instead of relying solely on Alert
      const msg =
        err instanceof Error ? err.message : 'Could not start checkout.';
      if (msg.includes('Network request failed') || msg.includes('network') || msg.includes('connect')) {
        setError('Unable to connect to payment server. Check your connection and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPlan, onClose]);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      accessibilityViewIsModal={true}
    >
      {/* Overlay */}
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: colors.overlayDimBg,
          opacity: overlayAnim,
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleClose}
          accessibilityLabel="Close upgrade modal"
          accessibilityRole="button"
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={
          Platform.OS === 'web'
            ? {
                position: 'absolute' as const,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.bgCard,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
                paddingTop: SPACING.md,
                paddingBottom: SPACING['5xl'],
                paddingHorizontal: SPACING.xl,
                ...shadows.xl,
              }
            : {
                position: 'absolute' as const,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.bgCard,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
                paddingTop: SPACING.md,
                paddingBottom: SPACING['5xl'],
                paddingHorizontal: SPACING.xl,
                transform: [{ translateY: slideAnim }],
                ...shadows.xl,
              }
        }
      >
        {/* Handle bar */}
        <View
          style={{
            alignSelf: 'center',
            width: 36,
            height: 4,
            borderRadius: RADIUS.full,
            backgroundColor: colors.borderSlate300,
            marginBottom: SPACING.xl,
          }}
        />

        {/* Header row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: SPACING.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Sparkles size={20} color={colors.primary} strokeWidth={2} />
            <Text
              style={{
                ...TYPOGRAPHY.h2,
                color: colors.textMain,
              }}
            >
              Unlock Plus
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close upgrade modal"
            accessibilityRole="button"
            style={{
              width: 44,
              height: 44,
              minHeight: 44,
              minWidth: 44,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <X size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Feature comparison list */}
        <View style={{ marginBottom: SPACING['2xl'] }}>
          {PLUS_FEATURES.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: SPACING.lg,
                  gap: SPACING.md,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: RADIUS.sm,
                    backgroundColor: colors.blue50,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <IconComponent
                    size={16}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...TYPOGRAPHY.bodySmall,
                      fontWeight: '500',
                      color: colors.textMain,
                    }}
                  >
                    {feature.label}
                  </Text>
                  <Text
                    style={{
                      ...TYPOGRAPHY.captionSmall,
                      color: colors.textTertiary,
                    }}
                  >
                    Free: {feature.freeLabel}
                  </Text>
                </View>
                <View style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: colors.green50,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Check size={12} color={colors.accentGreen} strokeWidth={3} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Plan cards */}
        <View
          style={{
            flexDirection: 'row',
            gap: SPACING.md,
            marginBottom: SPACING['2xl'],
          }}
        >
          {/* Annual plan card */}
          <TouchableOpacity
            onPress={() => handlePlanSelect('annual')}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedPlan === 'annual' }}
            accessibilityLabel="Annual plan, $96 per year, save 20%"
            style={{
              flex: 1,
              borderWidth: selectedPlan === 'annual' ? 2 : 1,
              borderColor:
                selectedPlan === 'annual'
                  ? colors.primary
                  : colors.borderDefault,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              backgroundColor:
                selectedPlan === 'annual'
                  ? colors.blue50
                  : colors.bgCard,
              ...(selectedPlan === 'annual' ? shadows.soft : {}),
            }}
          >
            {/* Save badge */}
            <View
              style={{
                backgroundColor: colors.success,
                borderRadius: RADIUS.xs,
                paddingHorizontal: SPACING.sm,
                paddingVertical: SPACING.xxs,
                alignSelf: 'flex-start',
                marginBottom: SPACING.sm,
              }}
            >
              <Text
                style={{
                  ...TYPOGRAPHY.captionSmall,
                  fontWeight: '700',
                  color: colors.white,
                }}
              >
                SAVE 20%
              </Text>
            </View>
            <Text
              style={{
                ...TYPOGRAPHY.h3,
                color: colors.textMain,
                marginBottom: SPACING.xxs,
              }}
            >
              Annual
            </Text>
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                fontWeight: '600',
                color: colors.textMain,
              }}
            >
              $96/year
            </Text>
            <Text
              style={{
                ...TYPOGRAPHY.captionSmall,
                color: colors.textTertiary,
              }}
            >
              $8/mo effective
            </Text>
          </TouchableOpacity>

          {/* Monthly plan card */}
          <TouchableOpacity
            onPress={() => handlePlanSelect('monthly')}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedPlan === 'monthly' }}
            accessibilityLabel="Monthly plan, $10 per month"
            style={{
              flex: 1,
              borderWidth: selectedPlan === 'monthly' ? 2 : 1,
              borderColor:
                selectedPlan === 'monthly'
                  ? colors.primary
                  : colors.borderDefault,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              backgroundColor:
                selectedPlan === 'monthly'
                  ? colors.blue50
                  : colors.bgCard,
              ...(selectedPlan === 'monthly' ? shadows.soft : {}),
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.h3,
                color: colors.textMain,
                marginBottom: SPACING.xxs,
                marginTop: SPACING['2xl'], // Align with annual card's content start
              }}
            >
              Monthly
            </Text>
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                fontWeight: '600',
                color: colors.textMain,
              }}
            >
              $10/month
            </Text>
            <Text
              style={{
                ...TYPOGRAPHY.captionSmall,
                color: colors.textTertiary,
              }}
            >
              Flexible billing
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inline error message */}
        {error && (
          <View
            style={{
              backgroundColor: colors.red50 ?? '#FEF2F2',
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              marginBottom: SPACING.md,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: colors.error ?? '#DC2626',
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
          </View>
        )}

        {/* CTA button — H-06 FIX: text is always visible, spinner shown alongside text */}
        <TouchableOpacity
          onPress={handleCheckout}
          activeOpacity={0.7}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={error ? 'Try again' : 'Start 14-day free trial'}
          style={{
            backgroundColor: colors.primary,
            borderRadius: RADIUS.lg,
            paddingVertical: SPACING.lg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: SPACING.sm,
            minHeight: 52,
            opacity: loading ? 0.85 : 1,
            ...shadows.soft,
          }}
        >
          {loading && (
            <ActivityIndicator size="small" color={colors.textInverse} />
          )}
          <Text
            style={{
              ...TYPOGRAPHY.buttonLg,
              color: colors.textInverse,
            }}
          >
            {error ? 'Try again' : 'Start 14-day free trial'}
          </Text>
        </TouchableOpacity>

        {/* Dismiss link */}
        <TouchableOpacity
          onPress={handleClose}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Maybe later"
          style={{
            alignItems: 'center',
            paddingVertical: SPACING.md,
            marginTop: SPACING.xs,
          }}
        >
          <Text
            style={{
              ...TYPOGRAPHY.bodySmall,
              color: colors.textTertiary,
            }}
          >
            Maybe later
          </Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text
          style={{
            ...TYPOGRAPHY.captionSmall,
            color: colors.textTertiary,
            textAlign: 'center',
          }}
        >
          No charge for 14 days. Cancel anytime.
        </Text>
      </Animated.View>
    </Modal>
  );
}

export const UpgradeModal = React.memo(UpgradeModalComponent);
