/**
 * Onboarding. Three screens that appear once per new user, after sign-in
 * and before the tab shell:
 *
 *   1. Value prop. What a scan does and what it tells you.
 *   2. Brand thesis. The pull-quote, alone on the screen, vertically
 *      centered. The quietest screen of the three by design.
 *   3. Call to action. A one-line setup of the first scan.
 *
 * One route, three internal states. No back navigation. A top-right
 * "Skip" link on screens 1 and 2 completes the flow and routes to Home;
 * screen 3's primary CTA does the same thing. Either path calls
 * useAuth.completeOnboarding(true), which auto-grants ai_analysis_consent
 * and persists has_completed_onboarding to Supabase + AsyncStorage. The
 * AI-consent disclosure surfaces explicitly at capture time via the
 * Scan-flow CaptureFooter, not here.
 *
 * Legacy users with has_completed_onboarding already set do not see this
 * surface; the gating in app/_layout.tsx routes them straight to /(tabs).
 */
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PrimaryButton, StepIndicator } from '../../src/design-system';
import {
  colors,
  layout,
  spacing,
  tap,
  type,
} from '../../src/design-tokens/tokens';
import { useAuth } from '../../src/context/AuthContext';

const TOTAL_SCREENS = 3;
const CONTENT_MAX_WIDTH = 340;

export default function OnboardingScreen() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const { completeOnboarding } = useAuth();

  const finishAndExit = useCallback(async () => {
    try {
      await completeOnboarding(true);
    } catch {
      // Non-blocking; the AuthContext belt-and-suspenders AsyncStorage
      // write means subsequent launches still see onboarding as complete.
    }
    router.replace('/(tabs)');
  }, [completeOnboarding]);

  const handleSkip = useCallback(() => {
    finishAndExit();
  }, [finishAndExit]);

  const handleContinue = useCallback(() => {
    if (currentScreen < TOTAL_SCREENS - 1) {
      setCurrentScreen((s) => s + 1);
    } else {
      finishAndExit();
    }
  }, [currentScreen, finishAndExit]);

  const isLastScreen = currentScreen === TOTAL_SCREENS - 1;
  const ctaLabel = isLastScreen ? 'Get started' : 'Continue';
  const showSkip = !isLastScreen;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View
        style={{
          height: tap.min,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingHorizontal: layout.screenPaddingX,
        }}
      >
        {showSkip ? (
          <Pressable
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            hitSlop={8}
            style={({ pressed }) => ({
              paddingVertical: spacing.s2,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text
              style={{
                fontSize: type.body.fontSize,
                lineHeight: type.body.lineHeight,
                fontWeight: type.body.fontWeight,
                color: colors.brandPrimary,
              }}
            >
              Skip
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: layout.screenPaddingX,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {currentScreen === 0 ? <ValuePropScreen /> : null}
        {currentScreen === 1 ? <BrandThesisScreen /> : null}
        {currentScreen === 2 ? <FirstScanScreen /> : null}
      </View>

      <View
        style={{
          paddingHorizontal: layout.screenPaddingX,
          paddingBottom: spacing.s5,
          gap: spacing.s5,
        }}
      >
        <StepIndicator stepCount={TOTAL_SCREENS} currentStep={currentScreen} />
        <PrimaryButton label={ctaLabel} onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

/* Screen bodies */

function ValuePropScreen() {
  return (
    <View style={{ maxWidth: CONTENT_MAX_WIDTH, alignItems: 'center' }}>
      <Text
        accessibilityRole="header"
        style={headlineStyle}
      >
        See what's in your feed
      </Text>
      <Text style={[bodyStyle, { marginTop: spacing.s4 }]}>
        Each scan samples your feed for about a minute and tells you what
        appeared. Sources, ads, tone, and what came from accounts you don't
        follow.
      </Text>
    </View>
  );
}

function BrandThesisScreen() {
  return (
    <View style={{ maxWidth: CONTENT_MAX_WIDTH }}>
      <Text
        accessibilityRole="header"
        style={pullQuoteStyle}
      >
        We won't tell you what the algorithm wants. We'll tell you what you
        saw.
      </Text>
    </View>
  );
}

function FirstScanScreen() {
  return (
    <View style={{ maxWidth: CONTENT_MAX_WIDTH, alignItems: 'center' }}>
      <Text
        accessibilityRole="header"
        style={headlineStyle}
      >
        Your first scan
      </Text>
      <Text style={[bodyStyle, { marginTop: spacing.s4 }]}>
        Pick a platform on the next screen, then scroll your feed. That's
        it.
      </Text>
    </View>
  );
}

const headlineStyle = {
  fontSize: type.display.fontSize,
  lineHeight: type.display.lineHeight,
  fontWeight: type.display.fontWeight,
  letterSpacing: type.display.letterSpacing,
  color: colors.textPrimary,
  textAlign: 'center' as const,
} as const;

const bodyStyle = {
  fontSize: type.body.fontSize,
  lineHeight: type.body.lineHeight,
  fontWeight: type.body.fontWeight,
  color: colors.textSecondary,
  textAlign: 'center' as const,
} as const;

const pullQuoteStyle = {
  fontSize: type.display.fontSize,
  lineHeight: type.display.lineHeight,
  fontWeight: type.display.fontWeight,
  letterSpacing: type.display.letterSpacing,
  color: colors.textPrimary,
  textAlign: 'center' as const,
} as const;
