import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Switch,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { router } from 'expo-router';
import { Eye, Globe, ChartBar, CircleCheck, TrendingUp } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../src/lib/theme';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const [aiConsent, setAiConsent] = useState(true);
  const [showDetails, setShowDetails] = useState<'sent' | 'notSent' | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user, completeOnboarding } = useAuth();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const position = event.nativeEvent.contentOffset.x;
    const page = Math.round(position / width);
    setCurrentPage(page);
  };

  const scrollToPage = (page: number) => {
    scrollViewRef.current?.scrollTo({
      x: page * width,
      animated: true,
    });
    setCurrentPage(page);
  };

  const handleGetStarted = async () => {
    try {
      if (user?.id) {
        // Try to update user profile with onboarding completion and AI consent
        await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            has_completed_onboarding: true,
            ai_analysis_consent: aiConsent,
          }, { onConflict: 'user_id' });
      }
    } catch (error) {
      console.warn('Could not save onboarding status:', error);
    }
    // Update local state so navigation doesn't loop back
    completeOnboarding(aiConsent);
    // Navigate to main app
    router.replace('/(tabs)');
  };

  const screenData = [
    {
      title: 'See what shapes your feed',
      description:
        'AlgorithmLens gives you a clear picture of what appears in your social media feed — sources, ads, tone, and more.',
      icon: 'welcome',
    },
    {
      title: 'Quick scans, real insights',
      steps: [
        { icon: 'globe', text: 'Open a platform' },
        { icon: 'scroll', text: 'Scroll your feed for 10 minutes' },
        { icon: 'chart', text: 'See your analysis' },
      ],
      description:
        "You don't need to scan every session — just enough to build a meaningful sample.",
    },
    {
      title: 'Help us analyze deeper',
      isConsent: true,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgPage }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
      >
        {/* Screen 1: Welcome */}
        <View
          style={{
            width,
            paddingHorizontal: 20,
            paddingVertical: 40,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            {/* Branded app icon */}
            <View
              style={{
                width: 72,
                height: 72,
                backgroundColor: COLORS.primaryBlue,
                borderRadius: RADIUS.xl,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: SPACING['3xl'],
                ...SHADOWS.hero,
              }}
            >
              <Eye size={36} color={COLORS.white} strokeWidth={1.5} />
            </View>

            <Text
              style={{
                ...TYPOGRAPHY.heroTitle,
                fontSize: 28,
                color: COLORS.textMain,
                marginBottom: SPACING.lg,
              }}
            >
              See what shapes your feed
            </Text>

            <Text
              style={{
                ...TYPOGRAPHY.bodyLarge,
                color: COLORS.textMuted,
              }}
            >
              AlgorithmLens gives you a clear picture of what appears in your social media feed — sources, ads, tone, and more.
            </Text>

            {/* Plus teaser */}
            <View
              style={{
                marginTop: SPACING['2xl'],
                backgroundColor: COLORS.blue50,
                borderRadius: RADIUS.md,
                padding: SPACING.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: COLORS.blue100,
                  borderRadius: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <TrendingUp size={18} color={COLORS.primaryBlue} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...TYPOGRAPHY.labelBold, color: COLORS.textMain, marginBottom: 2 }}>
                  Free to use — Plus available
                </Text>
                <Text style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted }}>
                  All 6 analysis tabs are free. Upgrade to Plus for trend tracking over time.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Screen 2: How It Works */}
        <View
          style={{
            width,
            paddingHorizontal: 20,
            paddingVertical: 40,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text
              style={{
                ...TYPOGRAPHY.heroTitle,
                fontSize: 28,
                color: COLORS.textMain,
                marginBottom: SPACING['3xl'],
              }}
            >
              Quick scans, real insights
            </Text>

            {/* Steps */}
            <View style={{ marginBottom: SPACING['3xl'], gap: SPACING.xl }}>
              {[
                { icon: Globe, label: 'Open a platform' },
                { icon: ChartBar, label: 'Scroll your feed for 10 minutes' },
                { icon: CircleCheck, label: 'See your analysis' },
              ].map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: COLORS.blue100,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <item.icon size={20} color={COLORS.primaryBlue} strokeWidth={1.5} />
                  </View>
                  <Text
                    style={{
                      ...TYPOGRAPHY.bodyLarge,
                      fontWeight: '500',
                      color: COLORS.textMain,
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: COLORS.textMuted,
              }}
            >
              You don't need to scan every session — just enough to build a meaningful sample.
            </Text>
          </View>
        </View>

        {/* Screen 3: AI Consent */}
        <View
          style={{
            width,
            paddingHorizontal: 20,
            paddingVertical: 40,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text
              style={{
                ...TYPOGRAPHY.heroTitle,
                fontSize: 28,
                color: COLORS.textMain,
                marginBottom: SPACING['2xl'],
              }}
            >
              Help us analyze deeper
            </Text>

            <Text
              style={{
                ...TYPOGRAPHY.body,
                color: COLORS.textMuted,
                marginBottom: SPACING['3xl'],
              }}
            >
              To analyze political content and emotional tone, AlgorithmLens sends post text (not images, not your identity) to Google's Gemini AI for analysis. Google does not use this data to train AI models.
            </Text>

            {/* Toggle */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: SPACING.lg,
                paddingVertical: 14,
                backgroundColor: COLORS.bgCard,
                borderRadius: RADIUS.md,
                marginBottom: SPACING['2xl'],
                borderWidth: 1,
                borderColor: COLORS.borderSlate200,
              }}
            >
              <Text
                style={{
                  ...TYPOGRAPHY.h3,
                  color: COLORS.textMain,
                }}
              >
                Enable AI analysis
              </Text>
              <Switch
                value={aiConsent}
                onValueChange={setAiConsent}
                trackColor={{ false: COLORS.borderSlate200, true: COLORS.blue100 }}
                thumbColor={aiConsent ? COLORS.primaryBlue : COLORS.textSecondary}
              />
            </View>

            {/* What gets sent */}
            <TouchableOpacity
              onPress={() =>
                setShowDetails(showDetails === 'sent' ? null : 'sent')
              }
              style={{
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
                backgroundColor: COLORS.bgCardGradientEnd,
                borderRadius: RADIUS.sm,
                marginBottom: SPACING.md,
              }}
            >
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  fontWeight: '600',
                  color: COLORS.textMain,
                }}
              >
                What gets sent
              </Text>
              {showDetails === 'sent' && (
                <Text
                  style={{
                    ...TYPOGRAPHY.label,
                    color: COLORS.textMuted,
                    marginTop: SPACING.sm,
                  }}
                >
                  Post captions and hashtags only. No images, no account info.
                </Text>
              )}
            </TouchableOpacity>

            {/* What doesn't get sent */}
            <TouchableOpacity
              onPress={() =>
                setShowDetails(showDetails === 'notSent' ? null : 'notSent')
              }
              style={{
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
                backgroundColor: COLORS.bgCardGradientEnd,
                borderRadius: RADIUS.sm,
              }}
            >
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  fontWeight: '600',
                  color: COLORS.textMain,
                }}
              >
                What doesn't get sent
              </Text>
              {showDetails === 'notSent' && (
                <Text
                  style={{
                    ...TYPOGRAPHY.label,
                    color: COLORS.textMuted,
                    marginTop: SPACING.sm,
                  }}
                >
                  Your identity, photos, videos, or browsing history.
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: SPACING.xl,
          paddingVertical: SPACING.xl,
          backgroundColor: COLORS.bgCard,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderSlate200,
        }}
      >
        {/* Dot Indicator */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: SPACING.sm,
            marginBottom: SPACING.lg,
          }}
        >
          {[0, 1, 2].map((idx) => (
            <View
              key={idx}
              style={{
                width: currentPage === idx ? 24 : 8,
                height: 8,
                backgroundColor:
                  currentPage === idx ? COLORS.primaryBlue : COLORS.borderSlate300,
                borderRadius: 4,
              }}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        {currentPage < 2 ? (
          <TouchableOpacity
            onPress={() => scrollToPage(currentPage + 1)}
            style={{
              backgroundColor: COLORS.primaryBlue,
              borderRadius: RADIUS.md,
              paddingVertical: 14,
              alignItems: 'center',
              ...SHADOWS.medium,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.white,
              }}
            >
              Next
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleGetStarted}
            style={{
              backgroundColor: COLORS.primaryBlue,
              borderRadius: RADIUS.md,
              paddingVertical: 14,
              alignItems: 'center',
              ...SHADOWS.medium,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.white,
              }}
            >
              Get Started
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
