import React, { useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, Platform, LogBox } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { GluestackUIProvider } from '../src/providers/GluestackUIProvider';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { initSentry, addBreadcrumb, withSentry } from '../src/lib/sentry';
import { initRevenueCat } from '../src/services/revenueCat';
import { SPACING, RADIUS, SHADOWS } from '../src/lib/theme';
import { GL_TYPOGRAPHY } from '../src/lib/gluestackTheme';


// Initialize Sentry before any components render
initSentry();

// H-14 FIX: Suppress error banners in production and known benign warnings in dev
if (!__DEV__) {
  LogBox.ignoreAllLogs(true);
}
LogBox.ignoreLogs([
  'Expected transform functions',
  'SyntaxError',
]);

// Keep splash screen visible until auth loading completes
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading, userProfile } = useAuth();
  const { colors, statusBarStyle } = useTheme();
  const pathname = usePathname();

  // Phase 4: Initialize RevenueCat after auth is established
  useEffect(() => {
    if (user?.id) {
      initRevenueCat(user.id).catch((err) => {
        if (__DEV__) {
          console.warn('RevenueCat init failed (falling back to free tier):', err);
        }
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (pathname) {
      addBreadcrumb('navigation', `Screen: ${pathname}`, { route: pathname });
    }
  }, [pathname]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      if (!user) {
        router.replace('/(auth)/login');
      } else if (!userProfile?.has_completed_onboarding) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isLoading, user, userProfile]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPage }}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={statusBarStyle} backgroundColor={colors.bgPage} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgPage },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scanner/[platform]" options={{ headerShown: false }} />
        <Stack.Screen
          name="broadcast/[platform]"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="analysis/[sessionId]"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}

// G-2 FIX: Web wrapper constrains app to mobile viewport width
function WebConstrainedWrapper({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
      }}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 428,
          backgroundColor: colors.bgPage,
          ...SHADOWS.lg,
          overflow: 'hidden' as any,
        }}
      >
        {/* G-5 FIX: Mock iOS status bar for web preview */}
        <View
          style={{
            height: 44,
            backgroundColor: colors.bgPage,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: SPACING.xl,
          }}
        >
          <Text style={{ ...GL_TYPOGRAPHY.labelBold, color: colors.textMain }}>
            9:41
          </Text>
          <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' }}>
            <View style={{ width: 16, height: 10, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: colors.textMain, justifyContent: 'center', paddingLeft: 1 }}>
              <View style={{ width: 10, height: 6, backgroundColor: colors.textMain, borderRadius: 1 }} />
            </View>
          </View>
        </View>
        {children}
      </View>
    </View>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Regular': require('../assets/fonts/Geist_400Regular.ttf'),
    'Geist-Medium': require('../assets/fonts/Geist_500Medium.ttf'),
    'Geist-SemiBold': require('../assets/fonts/Geist_600SemiBold.ttf'),
    'Geist-Bold': require('../assets/fonts/Geist_700Bold.ttf'),
  });

  // Keep splash visible until fonts are loaded
  // Auth loading is handled separately in RootLayoutNav
  useEffect(() => {
    if (fontError) {
      // If fonts fail to load, hide splash anyway so the app doesn't hang
      console.warn('Font loading error:', fontError);
    }
  }, [fontError]);

  // Don't render anything until fonts are ready
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GluestackUIProvider>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <WebConstrainedWrapper>
                <RootLayoutNav />
              </WebConstrainedWrapper>
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}

export default withSentry(RootLayout);
