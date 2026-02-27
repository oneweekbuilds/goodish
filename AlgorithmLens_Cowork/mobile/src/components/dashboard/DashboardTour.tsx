/**
 * DashboardTour — Guided tooltip tour of dashboard tabs
 *
 * Triggers once after the user's first scan completes and they land
 * on the dashboard with data. Highlights each of the 6 tabs with a
 * brief explanation. Mobile-optimized: large tap targets, bottom-positioned
 * tooltips, finger-friendly Next/Skip flow.
 *
 * Completion state stored in SecureStore so it only shows once.
 *
 * Adapted from the main site's DashboardTour.jsx (Task 13),
 * redesigned for React Native mobile interaction patterns.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  StyleSheet,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  BarChart3,
  Globe,
  Megaphone,
  Scale,
  MessageSquare,
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING, TYPOGRAPHY, COLORS, SHADOWS } from '../../lib/theme';
import { withAlpha } from '../../lib/utils';

// ─── Storage Key ─────────────────────────────────────────

const TOUR_STORAGE_KEY = 'alg_mobile_dashboard_tour_completed';

// ─── Tour Steps ──────────────────────────────────────────

interface TourStep {
  tabId: string;
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    tabId: 'overview',
    icon: BarChart3,
    title: 'Overview',
    description:
      'Your feed at a glance — see what types of content appeared and in what proportions.',
    accent: COLORS.tourOverview,
  },
  {
    tabId: 'sources',
    icon: Globe,
    title: 'Sources',
    description:
      "Who's creating the content you see? Discover how diverse or concentrated your sources are.",
    accent: COLORS.tourSources,
  },
  {
    tabId: 'ads',
    icon: Megaphone,
    title: 'Ads & Promotions',
    description:
      'How much of your feed is promotional? See advertising patterns and sponsored content.',
    accent: COLORS.tourAds,
  },
  {
    tabId: 'politics',
    icon: Scale,
    title: 'Political Exposure',
    description:
      'Observe the political composition of content in your feed — described, never judged.',
    accent: COLORS.tourPolitics,
  },
  {
    tabId: 'tone',
    icon: MessageSquare,
    title: 'Emotional Tone',
    description:
      'What emotional tones characterize your feed? See the distribution of sentiment.',
    accent: COLORS.tourTone,
  },
  {
    tabId: 'suggested_vs_followed',
    icon: Compass,
    title: 'Suggested vs. Followed',
    description:
      'How much of your feed comes from accounts you chose vs. algorithmic suggestions?',
    accent: COLORS.tourSuggested,
  },
];

// ─── Component Props ─────────────────────────────────────

interface DashboardTourProps {
  /** Force the tour to show even if already completed */
  forceTour?: boolean;
  /** Callback when the tour is completed or skipped */
  onComplete?: () => void;
  /** Callback to programmatically switch the active tab */
  onSwitchTab?: (tabId: string) => void;
}

// ─── Component ───────────────────────────────────────────

export const DashboardTour: React.FC<DashboardTourProps> = ({
  forceTour = false,
  onComplete,
  onSwitchTab,
}) => {
  const { colors } = useTheme();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const { width: screenWidth } = Dimensions.get('window');

  // Check if tour should show
  useEffect(() => {
    if (forceTour) {
      setIsActive(true);
      return;
    }

    const checkTourStatus = async () => {
      try {
        const completed = await SecureStore.getItemAsync(TOUR_STORAGE_KEY);
        if (!completed) {
          // Small delay so the dashboard renders first
          const timer = setTimeout(() => setIsActive(true), 800);
          return () => clearTimeout(timer);
        }
      } catch {
        // If storage fails, don't show tour
      }
    };

    checkTourStatus();
  }, [forceTour]);

  // Animate in when active or step changes
  useEffect(() => {
    if (!isActive) return;

    const animate = async () => {
      const prefersReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();

      fadeAnim.setValue(0);
      slideAnim.setValue(20);

      if (prefersReducedMotion) {
        // Skip animation if reduced motion is enabled
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    animate();
  }, [isActive, currentStep]);

  // Switch to the corresponding tab when step changes
  useEffect(() => {
    if (isActive && onSwitchTab) {
      const currentTourStep = TOUR_STEPS[currentStep];
      if (currentTourStep) onSwitchTab(currentTourStep.tabId);
    }
  }, [isActive, currentStep, onSwitchTab]);

  const completeTour = useCallback(async () => {
    try {
      await SecureStore.setItemAsync(TOUR_STORAGE_KEY, 'true');
    } catch {
      // Silently fail
    }
    setIsActive(false);
    onComplete?.();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep, completeTour]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  if (!step) return null;
  const Icon = step.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      {/* Dimmed overlay — tap to skip */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip tour"
        style={styles.overlay}
      >
        <View style={styles.overlayBg} />
      </TouchableOpacity>

      {/* Tooltip card — positioned at bottom for easy thumb reach */}
      <Animated.View
        style={Platform.OS === 'web' ? {
          ...styles.tooltipContainer,
          opacity: 1,
          transform: [{ translateY: 0 }],
        } : [
          styles.tooltipContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View
          style={Platform.OS === 'web' ? {
            ...styles.tooltipCard,
            backgroundColor: colors.bgCard,
            borderColor: colors.borderSoft,
            width: screenWidth - SPACING['3xl'],
          } : [
            styles.tooltipCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSoft,
              width: screenWidth - SPACING['3xl'],
            },
          ]}
        >
          {/* Accent bar */}
          <View
            style={Platform.OS === 'web' ? {
              ...styles.accentBar,
              backgroundColor: step.accent,
            } : [
              styles.accentBar,
              { backgroundColor: step.accent },
            ]}
          />

          {/* Header: icon + step counter + close */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={Platform.OS === 'web' ? {
                  ...styles.iconContainer,
                  backgroundColor: withAlpha(step.accent, 0.09),
                } : [
                  styles.iconContainer,
                  { backgroundColor: withAlpha(step.accent, 0.09) },
                ]}
              >
                <Icon size={20} color={step.accent} strokeWidth={1.5} />
              </View>
              <View
                style={Platform.OS === 'web' ? {
                  ...styles.stepBadge,
                  backgroundColor: step.accent,
                } : [
                  styles.stepBadge,
                  { backgroundColor: step.accent },
                ]}
              >
                <Text style={styles.stepBadgeText}>
                  {currentStep + 1} of {TOUR_STEPS.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Skip this tour"
            >
              <X size={18} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text
            style={Platform.OS === 'web' ? {
              ...styles.title,
              color: colors.textMain,
            } : [
              styles.title,
              { color: colors.textMain },
            ]}
          >
            {step.title}
          </Text>

          {/* Description */}
          <Text
            style={Platform.OS === 'web' ? {
              ...styles.description,
              color: colors.textMuted,
            } : [
              styles.description,
              { color: colors.textMuted },
            ]}
          >
            {step.description}
          </Text>

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {TOUR_STEPS.map((_, index) => (
              <View
                key={index}
                style={Platform.OS === 'web' ? {
                  ...styles.dot,
                  width: index === currentStep ? 20 : 6,
                  backgroundColor:
                    index <= currentStep ? step.accent : colors.borderSlate200,
                } : [
                  styles.dot,
                  {
                    width: index === currentStep ? 20 : 6,
                    backgroundColor:
                      index <= currentStep ? step.accent : colors.borderSlate200,
                  },
                ]}
              />
            ))}
          </View>

          {/* Navigation buttons — large tap targets for mobile */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Skip tour"
            >
              <Text style={Platform.OS === 'web' ? {
                ...styles.skipText,
                color: colors.textSecondary,
              } : [styles.skipText, { color: colors.textSecondary }]}>
                Skip tour
              </Text>
            </TouchableOpacity>

            <View style={styles.navButtons}>
              {currentStep > 0 && (
                <TouchableOpacity
                  onPress={handleBack}
                  style={Platform.OS === 'web' ? {
                    ...styles.backButton,
                    borderColor: colors.borderSlate200,
                    minHeight: 44,
                  } : [
                    styles.backButton,
                    {
                      borderColor: colors.borderSlate200,
                      minHeight: 44,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Go back to previous step"
                >
                  <ChevronLeft size={16} color={colors.textMuted} strokeWidth={2} />
                  <Text style={Platform.OS === 'web' ? {
                    ...styles.backText,
                    color: colors.textMuted,
                  } : [styles.backText, { color: colors.textMuted }]}>
                    Back
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleNext}
                style={Platform.OS === 'web' ? {
                  ...styles.nextButton,
                  backgroundColor: step.accent,
                  minHeight: 44,
                } : [
                  styles.nextButton,
                  { backgroundColor: step.accent, minHeight: 44 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={isLastStep ? 'Finish tour' : `Next tab: ${TOUR_STEPS[Math.min(currentStep + 1, TOUR_STEPS.length - 1)]?.title ?? 'next'}`}
              >
                <Text style={styles.nextText}>
                  {isLastStep ? 'Got it' : 'Next'}
                </Text>
                <ChevronRight size={16} color={colors.white} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

// ─── Static Export for Storage Key (for clearing state) ──

export const DASHBOARD_TOUR_STORAGE_KEY = TOUR_STORAGE_KEY;

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: SPACING['4xl'],
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center',
  },
  tooltipCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    overflow: 'hidden',
    // Shadow for iOS and Android
    ...SHADOWS.lg,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  stepBadgeText: {
    ...TYPOGRAPHY.captionSmall,
    fontWeight: '600',
    color: COLORS.white,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    lineHeight: RFValue(21),
    marginBottom: SPACING.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  dot: {
    height: 4,
    borderRadius: RADIUS.xs,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  skipText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  backText: {
    fontSize: RFValue(13),
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
  },
  nextText: {
    ...TYPOGRAPHY.labelBold,
    color: COLORS.white,
  },
});

export const DashboardTourMemo = React.memo(DashboardTour);
