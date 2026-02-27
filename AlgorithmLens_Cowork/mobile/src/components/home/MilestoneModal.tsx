/**
 * MilestoneModal — Celebrates streak milestones with warm, encouraging messaging.
 *
 * Shows as a gentle overlay when a user reaches a milestone (3, 7, 14, 30 days).
 * The design is celebratory but not over-the-top — matching the calm,
 * sophisticated tone of AlgorithmLens.
 *
 * Each milestone only fires once (tracked via AsyncStorage).
 */

import { triggerNotificationSuccess, triggerSelection } from '../../lib/haptics';
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import { Award } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY, MIN_TOUCH_TARGET } from '../../lib/theme';

interface MilestoneModalProps {
  milestone: {
    days: number;
    title: string;
    message: string;
  };
  onDismiss: () => void;
}

function MilestoneModalComponent({ milestone, onDismiss }: MilestoneModalProps) {
  const { colors, shadows } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = React.useState(false);

  useEffect(() => {
    const checkReducedMotion = async () => {
      try {
        const enabled = await AccessibilityInfo?.isScreenReaderEnabled?.() || false;
        setIsReducedMotionEnabled(enabled);
      } catch {
        setIsReducedMotionEnabled(false);
      }
    };
    checkReducedMotion();
  }, []);

  useEffect(() => {
    // Celebratory haptic
    triggerNotificationSuccess();

    if (isReducedMotionEnabled) {
      // Skip animation if reduced motion is enabled
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    } else {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, scaleAnim, isReducedMotionEnabled]);

  const handleDismiss = () => {
    triggerSelection();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      pointerEvents="auto"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.overlayDimBg,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        opacity: fadeAnim,
      }}
      accessibilityViewIsModal={true}
      accessible={true}
    >
      <Animated.View
        style={Platform.OS === 'web'
          ? {
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS['2xl'],
              padding: SPACING['3xl'],
              marginHorizontal: SPACING['3xl'],
              alignItems: 'center',
              transform: `scale(${scaleAnim.__getValue ? scaleAnim.__getValue() : 1})`,
              ...shadows.hero,
              maxWidth: 320,
            }
          : {
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS['2xl'],
              padding: SPACING['3xl'],
              marginHorizontal: SPACING['3xl'],
              alignItems: 'center',
              transform: [{ scale: scaleAnim }],
              ...shadows.hero,
              maxWidth: 320,
            }
        }
      >
        {/* Award icon */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: RADIUS['2xl'],
            backgroundColor: colors.blue50,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          <Award size={28} color={colors.primaryBlue} strokeWidth={1.5} />
        </View>

        {/* Milestone title */}
        <Text
          style={{
            ...TYPOGRAPHY.h2,
            color: colors.textMain,
            textAlign: 'center',
            marginBottom: SPACING.xs,
          }}
        >
          {milestone.title}
        </Text>

        {/* Day count */}
        <Text
          style={{
            ...TYPOGRAPHY.label,
            color: colors.primaryBlue,
            marginBottom: SPACING.md,
          }}
        >
          {milestone.days} day streak
        </Text>

        {/* Encouraging message */}
        <Text
          style={{
            ...TYPOGRAPHY.bodySmall,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: SPACING.xl,
          }}
        >
          {milestone.message}
        </Text>

        {/* Dismiss button */}
        <TouchableOpacity
          onPress={handleDismiss}
          activeOpacity={0.7}
          accessibilityLabel="Keep going — dismiss milestone celebration"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            backgroundColor: colors.primaryBlue,
            borderRadius: RADIUS.md,
            paddingHorizontal: SPACING['2xl'],
            paddingVertical: SPACING.md,
            minHeight: MIN_TOUCH_TARGET,
            minWidth: 100,
          }}
        >
          <Text
            style={{
              ...TYPOGRAPHY.labelBold,
              color: colors.textInverse,
            }}
          >
            Keep going
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export const MilestoneModal = React.memo(MilestoneModalComponent);
