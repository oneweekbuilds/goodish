/**
 * FirstUseWalkthrough — M-22 FIX: Simple 3-step walkthrough for first-time users.
 *
 * Shows a fullscreen modal with dots pagination on first app open.
 * Stores completion in AsyncStorage so it only shows once.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Eye, ScanSearch, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from 'from '../../lib/theme';'

const STORAGE_KEY = '@algorithmlens_has_seen_walkthrough';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  {
    Icon: Eye,
    title: 'See what\'s in your feed',
    description: 'AlgorithmLens shows you what\'s in your social media feed — sources, ads, tone, and more.',
  },
  {
    Icon: ScanSearch,
    title: 'Scan any platform',
    description: 'Pick a platform, scroll through your feed, and we\'ll capture what appears.',
  },
  {
    Icon: BarChart3,
    title: 'Get insights',
    description: 'View your feed composition — ads, suggested content, sources, and tone breakdown.',
  },
];

interface FirstUseWalkthroughProps {
  /** Force show for testing — bypasses AsyncStorage check */
  forceShow?: boolean;
}

function FirstUseWalkthroughComponent({ forceShow }: FirstUseWalkthroughProps) {
  const { colors, shadows } = useTheme();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }
    // H-07 FIX: Check both the walkthrough flag AND scan history.
    // Never show walkthrough if user has any scan history (belt-and-suspenders).
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem('@algorithmlens_onboarding_completed'),
      AsyncStorage.getItem('@algorithmlens/streak_data'),
    ]).then(([walkthroughSeen, onboardingDone, streakRaw]) => {
      // If walkthrough already dismissed, skip
      if (walkthroughSeen === 'true') return;
      // If formal onboarding was completed, skip
      if (onboardingDone === 'true') return;
      // If user has scan history, skip (they're not a first-time user)
      if (streakRaw) {
        try {
          const streakData = JSON.parse(streakRaw);
          if (streakData.total_scans > 0) return;
        } catch {
          // Parse failed — fall through to show walkthrough
        }
      }
      setVisible(true);
    }).catch(() => {
      // If AsyncStorage fails, show walkthrough as safe default
      setVisible(true);
    });
  }, [forceShow]);

  const handleDismiss = useCallback(async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Non-blocking
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep((prev) => prev + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      });
    } else {
      handleDismiss();
    }
  }, [currentStep, fadeAnim, handleDismiss]);

  if (!visible) return null;

  const step = STEPS[currentStep];
  if (!step) return null;
  const StepIcon = step.Icon;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlayDimBg,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: SPACING['2xl'],
        }}
      >
        <View
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.xl,
            padding: SPACING['2xl'],
            maxWidth: 340,
            width: '100%',
            alignItems: 'center',
            ...shadows.xl,
          }}
        >
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
            {/* Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.blue50,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: SPACING.xl,
              }}
            >
              <StepIcon size={28} color={colors.primaryBlue} strokeWidth={1.8} />
            </View>

            {/* Title */}
            <Text
              style={{
                ...TYPOGRAPHY.h2,
                color: colors.textMain,
                textAlign: 'center',
                marginBottom: SPACING.sm,
              }}
            >
              {step.title}
            </Text>

            {/* Description */}
            <Text
              style={{
                ...TYPOGRAPHY.body,
                color: colors.textMuted,
                textAlign: 'center',
                marginBottom: SPACING.xl,
              }}
            >
              {step.description}
            </Text>
          </Animated.View>

          {/* Dots */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: SPACING.sm,
              marginBottom: SPACING.xl,
            }}
          >
            {STEPS.map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: currentStep === idx ? 20 : 8,
                  height: 8,
                  backgroundColor:
                    currentStep === idx ? colors.primaryBlue : colors.borderSlate300,
                  borderRadius: RADIUS.full,
                }}
              />
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Get Started' : 'Next'}
            style={{
              backgroundColor: colors.primaryBlue,
              borderRadius: RADIUS.md,
              paddingVertical: SPACING.md,
              paddingHorizontal: SPACING['3xl'],
              alignItems: 'center',
              width: '100%',
              minHeight: 48,
              ...shadows.soft,
            }}
          >
            <Text style={{ ...TYPOGRAPHY.buttonMd, color: colors.textInverse }}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>

          {/* Skip link (not on last step) */}
          {!isLast && (
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel="Skip walkthrough"
              style={{
                marginTop: SPACING.md,
                paddingVertical: SPACING.sm,
                minHeight: MIN_TOUCH_TARGET,
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...TYPOGRAPHY.label, color: colors.textTertiary }}>
                Skip
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

export const FirstUseWalkthrough = React.memo(FirstUseWalkthroughComponent);
