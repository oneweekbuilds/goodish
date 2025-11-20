import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/common/Button';
import { useAppStore } from '../../stores/appStore';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { ThemeName, User } from '../../types';

const { width, height } = Dimensions.get('window');

export const Welcome: React.FC = () => {
  const { completeOnboarding, setUser } = useAppStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const theme: ThemeName = 'sunrise-vibes';
  const colors = COLORS[theme];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    // Create demo user
    const demoUser: User = {
      id: 'demo-user-1',
      name: 'Megan',
      email: 'megan@example.com',
      timezone: 'America/Los_Angeles',
      sleepGoal: 8,
      personalityType: 'consistent-cruiser',
      createdAt: new Date(),
      preferences: {
        theme: 'sunrise-vibes',
        notifications: true,
        haptics: true,
        sounds: true,
        wakeUpBuffer: 5,
      },
    };

    setUser(demoUser);
    completeOnboarding();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🌅</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            For Megan
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your personal morning optimization bestie
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🤖</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>
                AI learns your actual task times
              </Text>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🎯</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>
                Smart departure timing for trips
              </Text>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>✨</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>
                Beautiful Gen Z design that adapts to you
              </Text>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>📱</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>
                Integrates with Oura Ring, Hatch & more
              </Text>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaContainer}>
            <Button
              title="Get Started ✨"
              onPress={handleGetStarted}
              theme={theme}
              size="large"
              style={styles.ctaButton}
            />
            
            <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
              Free forever • No signup required for demo
            </Text>
          </View>
        </Animated.View>

        {/* Background decoration */}
        <View style={styles.backgroundDecoration}>
          <Text style={[styles.decorationEmoji, styles.decoration1]}>⏰</Text>
          <Text style={[styles.decorationEmoji, styles.decoration2]}>☕</Text>
          <Text style={[styles.decorationEmoji, styles.decoration3]}>🚿</Text>
          <Text style={[styles.decorationEmoji, styles.decoration4]}>👗</Text>
          <Text style={[styles.decorationEmoji, styles.decoration5]}>🏃‍♀️</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: SPACING.xl,
  },
  logoEmoji: {
    fontSize: 80,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.h4,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    opacity: 0.9,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: SPACING.xxl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  featureText: {
    ...TYPOGRAPHY.body1,
    flex: 1,
    lineHeight: 24,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  disclaimer: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    opacity: 0.8,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  decorationEmoji: {
    position: 'absolute',
    fontSize: 32,
  },
  decoration1: {
    top: height * 0.15,
    left: width * 0.1,
  },
  decoration2: {
    top: height * 0.25,
    right: width * 0.1,
  },
  decoration3: {
    top: height * 0.45,
    left: width * 0.05,
  },
  decoration4: {
    bottom: height * 0.25,
    right: width * 0.15,
  },
  decoration5: {
    bottom: height * 0.15,
    left: width * 0.2,
  },
});