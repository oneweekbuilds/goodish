import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppStore } from '../src/stores/appStore';
import { SimpleWelcome } from '../src/screens/SimpleWelcome';
import { DEFAULT_TASK_TEMPLATES } from '../src/constants/tasks';
import { Routine } from '../src/types';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isOnboarded, routines, addRoutine } = useAppStore();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Add demo routine if none exist
    if (isOnboarded && routines.length === 0) {
      const demoRoutine: Routine = {
        id: 'demo-routine-1',
        name: 'My Perfect Morning',
        tasks: DEFAULT_TASK_TEMPLATES.slice(0, 6).map((template, index) => ({
          ...template,
          id: `demo-task-${index}`,
          actualTimes: [template.estimatedTime - 1, template.estimatedTime, template.estimatedTime + 1],
        })),
        isDefault: true,
        estimatedDuration: DEFAULT_TASK_TEMPLATES.slice(0, 6).reduce((sum, task) => sum + task.estimatedTime, 0),
        createdAt: new Date(),
      };
      addRoutine(demoRoutine);
    }
  }, [isOnboarded, routines.length, addRoutine]);

  if (!loaded) {
    return null;
  }

  if (!isOnboarded) {
    return <SimpleWelcome />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
