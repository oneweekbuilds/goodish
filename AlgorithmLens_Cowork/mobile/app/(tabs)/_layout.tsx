import React from 'react';
import { Platform, TouchableOpacity, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, LayoutDashboard, Clock, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { SPACING } from '../../src/lib/theme';
import { GL_TYPOGRAPHY } from '../../src/lib/gluestackTheme';
import { triggerImpactLight } from '../../src/lib/haptics';

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

/** Props accepted by WebCompatibleTabButton — mirrors react-navigation's tab bar button shape. */
interface TabBarButtonProps {
  onPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: string;
  accessibilityLabel?: string;
}

/**
 * G-3 FIX: Web-compatible tab bar button.
 * react-native-web's Pressable/TouchableOpacity can fail to translate
 * mouse events to press events. This wrapper adds an explicit onClick
 * handler on web to ensure reliable mouse click handling.
 */
function WebCompatibleTabButton(props: TabBarButtonProps) {
  if (Platform.OS === 'web') {
    const { onPress, children, style, accessibilityRole, ...rest } = props;
    return (
      <div
        onClick={onPress}
        role="tab"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPress?.();
          }
        }}
        style={{
          cursor: 'pointer',
          display: 'flex',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          padding: 0,
          // @ts-ignore
          ...(typeof style === 'object' ? style : {}),
        }}
        {...rest}
      >
        {children}
      </div>
    );
  }
  // On native, use standard TouchableOpacity with haptic feedback
  const { children, style, onPress, ...rest } = props;
  const handlePress = () => {
    triggerImpactLight();
    onPress?.();
  };
  return (
    <TouchableOpacity
      {...rest}
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityLabel={rest.accessibilityLabel || 'Tab'}
      style={Platform.OS === 'web' ? {
        ...style,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      } : [style, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
      {children}
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // L-15 FIX: Enable fade animation between tab switches
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.primaryBlue,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: Platform.OS === 'web' ? {
          backgroundColor: colors.bgCard,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderSoft,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: SPACING.sm,
          height: 49 + Math.max(insets.bottom, 0),
          maxWidth: 428,
          alignSelf: 'center' as const,
          width: '100%',
        } : {
          backgroundColor: colors.bgCard,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderSoft,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: SPACING.sm,
          height: 49 + Math.max(insets.bottom, 0),
        },
        tabBarLabelStyle: {
          ...GL_TYPOGRAPHY.captionSmall,
          fontWeight: '500',
          marginTop: SPACING.xxs,
        },
        tabBarActiveBackgroundColor: 'transparent',
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: SPACING.xs,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Home size={24} color={color} strokeWidth={2} />
          ),
          tabBarAccessibilityLabel: 'Home tab',
          // G-3 FIX: Web-compatible click handling + haptic feedback on native
          tabBarButton: (props: TabBarButtonProps) => <WebCompatibleTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={24} color={color} strokeWidth={2} />
          ),
          tabBarAccessibilityLabel: 'Dashboard tab',
          ...(Platform.OS === 'web' ? { tabBarButton: (props: TabBarButtonProps) => <WebCompatibleTabButton {...props} /> } : {}),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <Clock size={24} color={color} strokeWidth={2} />
          ),
          tabBarAccessibilityLabel: 'History tab',
          ...(Platform.OS === 'web' ? { tabBarButton: (props: TabBarButtonProps) => <WebCompatibleTabButton {...props} /> } : {}),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Settings size={24} color={color} strokeWidth={2} />
          ),
          tabBarAccessibilityLabel: 'Settings tab',
          ...(Platform.OS === 'web' ? { tabBarButton: (props: TabBarButtonProps) => <WebCompatibleTabButton {...props} /> } : {}),
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
