import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Platform, LogBox } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth, __authDiag } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { GluestackUIProvider } from '../src/providers/GluestackUIProvider';
import { ErrorBoundary, __errorBoundaryDiag } from '../src/components/ErrorBoundary';
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

// WATCHDOG: unconditionally dismiss splash after 8s no matter what state
// the JS runtime is in. If anything in the launch chain hangs — font asset
// registry never resolving, a provider throwing during render and being
// silently swallowed by Sentry.wrap, AuthContext's useEffect never firing —
// this guarantees the user sees SOMETHING. The on-screen checkpoint trail
// rendered in RootLayoutNav then tells us where init got stuck.
//
// Module-scope so it fires regardless of whether RootLayout ever renders.
setTimeout(() => {
  SplashScreen.hideAsync().catch(() => {
    // already hidden by the happy path — ignore
  });
}, 8000);

function RootLayoutNav({ fontsLoaded }: { fontsLoaded: boolean }) {
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

  return (
    <>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPage }}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : (
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
      )}
      {/* Checkpoint trail is rendered AFTER the conditional so it overlays
          both the loading spinner and the post-auth Stack. We can see exactly
          where init is stuck even if the rest of the UI is broken. */}
      <DebugCheckpointTrail
        fontsLoaded={fontsLoaded}
        isLoading={isLoading}
        userSignedIn={!!user}
        onboarded={!!userProfile?.has_completed_onboarding}
      />
    </>
  );
}

// Diagnostic-only overlay (build #33+). Renders a small fixed-position
// footer that updates as init checkpoints clear. ASCII-only strings keep
// grep on the Hermes bundle simple. Pointer-events:none so it never
// blocks real UI taps. Will be removed once we've diagnosed the splash
// hang and confirmed a clean launch.
//
// Build #34: second row reads from __authDiag (AuthContext) and
// __errorBoundaryDiag (ErrorBoundary). Those are mutable singletons updated
// out-of-band, so a 500ms ticker forces a re-render to surface fresh values.
function DebugCheckpointTrail({
  fontsLoaded,
  isLoading,
  userSignedIn,
  onboarded,
}: {
  fontsLoaded: boolean;
  isLoading: boolean;
  userSignedIn: boolean;
  onboarded: boolean;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1_000_000), 500);
    return () => clearInterval(id);
  }, []);

  // Read from singletons each render. Counters are clamped to one digit each
  // (these only need to hint "did it fire / how many times") so the footer
  // stays one line wide on small phones.
  const clamp = (n: number) => (n > 9 ? '9+' : String(n));

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Text style={{ color: '#fff', fontSize: 10, marginRight: 12 }}>
          fonts: {fontsLoaded ? 'ok' : 'load'}
        </Text>
        <Text style={{ color: '#fff', fontSize: 10, marginRight: 12 }}>
          auth: {isLoading ? 'load' : 'ok'}
        </Text>
        <Text style={{ color: '#fff', fontSize: 10, marginRight: 12 }}>
          user: {userSignedIn ? 'in' : 'out'}
        </Text>
        <Text style={{ color: '#fff', fontSize: 10 }}>
          onb: {onboarded ? 'yes' : 'no'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
        <Text style={{ color: '#fff', fontSize: 10, marginRight: 10 }}>
          gs: {clamp(__authDiag.gsResolved)}/{clamp(__authDiag.gsRejected)}/{clamp(__authDiag.gsTimedOut)}
        </Text>
        <Text style={{ color: '#fff', fontSize: 10, marginRight: 10 }}>
          fp: {clamp(__authDiag.fpStarted)}/{clamp(__authDiag.fpResolved)}/{clamp(__authDiag.fpTimedOut)}/{clamp(__authDiag.fpFailed)}
        </Text>
        <Text style={{ color: '#fff', fontSize: 10, marginRight: 10 }}>
          asc: {clamp(__authDiag.authChanges)}
        </Text>
        <Text style={{ color: '#fff', fontSize: 10, marginRight: 10 }}>
          hf: {clamp(__authDiag.hardFailsafe)}
        </Text>
        <Text style={{ color: '#fff', fontSize: 10, marginRight: 10 }}>
          eb: {clamp(__errorBoundaryDiag.errorCount)}
        </Text>
        <Text style={{ color: '#fff', fontSize: 10 }}>
          rs: {clamp(__errorBoundaryDiag.restartCount)}
        </Text>
      </View>
      {/* Build #35 row 3: only render when we actually have an error to show.
          Wraps to multiple lines; the trail is pointer-events:none so it
          never blocks UI even at three rows tall. */}
      {__errorBoundaryDiag.errorCount > 0 ? (
        <View style={{ marginTop: 2 }}>
          <Text style={{ color: '#fbb', fontSize: 10 }} numberOfLines={3}>
            err: {__errorBoundaryDiag.lastMessage || '-'}
          </Text>
          <Text style={{ color: '#fbb', fontSize: 10 }} numberOfLines={1}>
            cmp: {__errorBoundaryDiag.lastComponent || '-'}
          </Text>
        </View>
      ) : null}
    </View>
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

  // FONT GATE DROPPED (build #33 diagnostic): previously this returned null
  // until fonts loaded. If useFonts() entered a state where fontsLoaded was
  // false AND fontError was null (which appears to happen on Hermes/new-arch
  // production builds in some asset-registry edge cases), the entire app
  // hung at this null return — AuthProvider never mounted, so my earlier
  // getSession watchdog couldn't help. Now we render the provider tree
  // immediately and accept system-font fallback for a few hundred ms while
  // Geist loads in the background.
  useEffect(() => {
    if (fontError) {
      console.warn('Font loading error:', fontError);
    }
  }, [fontError]);

  // Build #35: ErrorBoundary moved to the OUTSIDE of every context provider
  // (still inside GluestackUIProvider only because expo-router types want a
  // child here). Previously the boundary sat INSIDE AuthProvider, so any
  // error thrown during AuthProvider's own render — e.g. useEntitlements
  // failing — propagated to withSentry's outer boundary, which silently
  // recovered. Result: eb counter never incremented for those cases, and
  // we couldn't see the error text. With the boundary above the provider
  // tree, errors in *any* provider land in our fallback and surface in
  // __errorBoundaryDiag.
  return (
    <GluestackUIProvider>
      <ErrorBoundary>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <WebConstrainedWrapper>
                <RootLayoutNav fontsLoaded={fontsLoaded} />
              </WebConstrainedWrapper>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GluestackUIProvider>
  );
}

export default withSentry(RootLayout);
