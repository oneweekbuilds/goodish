import React from 'react';
import { Tabs } from 'expo-router';
import { Home, LayoutDashboard, Clock, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';

/**
 * Tabs layout — updated for broadcast-first architecture.
 *
 * Tab order:
 * 1. Home (Calm Home Screen) — primary landing, platform picker + streak
 * 2. Dashboard — six-tab feed analysis (existing)
 * 3. History — scan history list (existing)
 * 4. Settings — preferences, subscription, AI consent (existing)
 *
 * The old "Scan" tab is removed from the tab bar. Scanning is now
 * initiated from the Home screen's platform picker, which offers
 * both Broadcast (primary) and Precision (WebView) modes.
 *
 * The scan route still exists for Precision Mode — it's just no
 * longer a top-level tab.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryBlue,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: colors.borderSlate200,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom, 0),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Home size={22} color={color} strokeWidth={2} />
          ),
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={22} color={color} strokeWidth={2} />
          ),
          tabBarAccessibilityLabel: 'Dashboard tab',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <Clock size={22} color={color} strokeWidth={2} />
          ),
          tabBarAccessibilityLabel: 'History tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Settings size={22} color={color} strokeWidth={2} />
          ),
          tabBarAccessibilityLabel: 'Settings tab',
        }}
      />
      {/* Scan tab hidden from bar — accessed via Home platform picker */}
      <Tabs.Screen
        name="scan"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
