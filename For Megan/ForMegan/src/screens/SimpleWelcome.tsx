import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAppStore } from '../stores/appStore';
import { User } from '../types';

const { width, height } = Dimensions.get('window');

export const SimpleWelcome: React.FC = () => {
  const { completeOnboarding, setUser } = useAppStore();

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
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <Text style={styles.logoEmoji}>🌅</Text>

        {/* Title */}
        <Text style={styles.title}>For Megan</Text>
        <Text style={styles.subtitle}>
          Your personal morning optimization bestie
        </Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🤖</Text>
            <Text style={styles.featureText}>
              AI learns your actual task times
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🎯</Text>
            <Text style={styles.featureText}>
              Smart departure timing for trips
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>✨</Text>
            <Text style={styles.featureText}>
              Beautiful Gen Z design that adapts to you
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>📱</Text>
            <Text style={styles.featureText}>
              Integrates with Oura Ring, Hatch & more
            </Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started ✨</Text>
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          Free forever • No signup required for demo
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    background: 'linear-gradient(135deg, #FFB07A, #FF8C69, #FFA07A)',
    minHeight: height,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#696969',
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.9,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 48,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#2F4F4F',
    flex: 1,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FF8C69',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    color: '#696969',
    textAlign: 'center',
    opacity: 0.8,
  },
});