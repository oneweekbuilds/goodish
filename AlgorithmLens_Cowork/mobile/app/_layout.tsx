import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform, LogBox } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

// Keep splash screen visible until auth loading completes.
// NOTE: Returns a Promise — not awaited here intentionally (standard Expo pattern
// for module-level calls). The native side processes this synchronously.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore — means the splash was already hidden (e.g. hot reload in dev).
});

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
      // Always call hideAsync with catch — it's safe to call multiple times.
      SplashScreen.hideAsync().catch(() => {});

      if (!user) {
        router.replace('/(auth)/login');
      } else if (userProfile !== null && !userProfile.has_completed_onboarding) {
        // NAVIGATION GUARD FIX: Only route to onboarding if the profile is actually
        // loaded AND onboarding is confirmed incomplete. When the 10s safety timer fires
        // before fetchOrCreateProfile resolves, userProfile is null — in that case we
        // send the user to tabs (a logged-in user who hasn't completed onboarding will
        // be gated there), and when the profile loads the effect re-runs correctly.
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

  // FONT TIMEOUT: After 3 seconds, proceed regardless of font load state.
  // useFonts loads from the app bundle (not network) and should complete in <100ms,
  // but if the asset system hangs, this prevents the return-null gate from blocking
  // the entire provider tree indefinitely.
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setFontTimeout(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Font error handler: call hideAsync so the splash doesn't hang if fonts fail
  // before RootLayoutNav ever mounts (RootLayoutNav is the normal hideAsync caller).
  useEffect(() => {
    if (fontError) {
      console.warn('[_layout] Font loading error — proceeding without custom fonts:', fontError);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontError]);

  // NUCLEAR FALLBACK: No matter what else fails — font hang, auth hang, render
  // crash in a provider, anything — the splash is guaranteed to hide within 5 seconds.
  // This is the last line of defense. After 5 seconds the user will see either
  // the ActivityIndicator (if auth is still loading) or the navigated screen.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (__DEV__) {
        console.warn('[_layout] Nuclear fallback fired — forcing SplashScreen.hideAsync() at 5s');
      }
      SplashScreen.hideAsync().catch(() => {});
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Block render only until fonts complete, a font error occurs, OR the 3s timeout fires.
  // Without the fontTimeout guard this could block forever if useFonts hangs.
  if (!fontsLoaded && !fontError && !fontTimeout) {
    return null;
  }

  return (
    // GestureHandlerRootView must wrap the entire app tree for react-native-gesture-handler
    // (and by extension @gorhom/bottom-sheet v5) to work correctly on iOS and Android.
    // Without this, BottomSheet gestures may crash or silently fail at runtime.
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}

export default withSentry(RootLayout);
