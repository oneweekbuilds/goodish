import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, User, Routine, Task, Trip, DailyInsight, DeviceIntegration, ThemeName } from '../types';

interface AppStore extends AppState {
  // User actions
  setUser: (user: User) => void;
  updateUserPreferences: (preferences: Partial<User['preferences']>) => void;
  
  // Routine actions
  addRoutine: (routine: Routine) => void;
  updateRoutine: (routineId: string, updates: Partial<Routine>) => void;
  deleteRoutine: (routineId: string) => void;
  setActiveRoutine: (routine: Routine | null) => void;
  
  // Task actions
  addTaskToRoutine: (routineId: string, task: Task) => void;
  updateTask: (routineId: string, taskId: string, updates: Partial<Task>) => void;
  removeTaskFromRoutine: (routineId: string, taskId: string) => void;
  recordTaskCompletion: (taskId: string, completionTime: number) => void;
  
  // Trip actions
  addTrip: (trip: Trip) => void;
  updateTrip: (tripId: string, updates: Partial<Trip>) => void;
  deleteTrip: (tripId: string) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  
  // Insights actions
  addDailyInsight: (insight: DailyInsight) => void;
  
  // Integration actions
  updateIntegration: (type: DeviceIntegration['type'], updates: Partial<DeviceIntegration>) => void;
  
  // App state actions
  completeOnboarding: () => void;
  
  // Theme actions
  setTheme: (theme: ThemeName) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      routines: [],
      activeRoutine: null,
      trips: [],
      insights: [],
      integrations: [
        { type: 'oura', isConnected: false },
        { type: 'hatch', isConnected: false },
        { type: 'apple-health', isConnected: false },
        { type: 'google-fit', isConnected: false },
      ],
      isOnboarded: false,
      currentTrip: null,

      // User actions
      setUser: (user) => set({ user }),
      
      updateUserPreferences: (preferences) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, preferences: { ...state.user.preferences, ...preferences } }
            : null,
        })),

      // Routine actions
      addRoutine: (routine) =>
        set((state) => ({
          routines: [...state.routines, routine],
        })),

      updateRoutine: (routineId, updates) =>
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === routineId ? { ...routine, ...updates } : routine
          ),
          activeRoutine:
            state.activeRoutine?.id === routineId
              ? { ...state.activeRoutine, ...updates }
              : state.activeRoutine,
        })),

      deleteRoutine: (routineId) =>
        set((state) => ({
          routines: state.routines.filter((routine) => routine.id !== routineId),
          activeRoutine: state.activeRoutine?.id === routineId ? null : state.activeRoutine,
        })),

      setActiveRoutine: (routine) => set({ activeRoutine: routine }),

      // Task actions
      addTaskToRoutine: (routineId, task) =>
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === routineId
              ? {
                  ...routine,
                  tasks: [...routine.tasks, task],
                  estimatedDuration: routine.estimatedDuration + task.estimatedTime,
                }
              : routine
          ),
        })),

      updateTask: (routineId, taskId, updates) =>
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === routineId
              ? {
                  ...routine,
                  tasks: routine.tasks.map((task) =>
                    task.id === taskId ? { ...task, ...updates } : task
                  ),
                }
              : routine
          ),
        })),

      removeTaskFromRoutine: (routineId, taskId) =>
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === routineId
              ? {
                  ...routine,
                  tasks: routine.tasks.filter((task) => task.id !== taskId),
                  estimatedDuration: routine.estimatedDuration - 
                    (routine.tasks.find(t => t.id === taskId)?.estimatedTime || 0),
                }
              : routine
          ),
        })),

      recordTaskCompletion: (taskId, completionTime) =>
        set((state) => {
          const updatedRoutines = state.routines.map((routine) => ({
            ...routine,
            tasks: routine.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    actualTimes: [...task.actualTimes.slice(-9), completionTime], // Keep last 10 records
                  }
                : task
            ),
          }));

          return { routines: updatedRoutines };
        }),

      // Trip actions
      addTrip: (trip) =>
        set((state) => ({
          trips: [...state.trips, trip],
        })),

      updateTrip: (tripId, updates) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId ? { ...trip, ...updates } : trip
          ),
          currentTrip:
            state.currentTrip?.id === tripId
              ? { ...state.currentTrip, ...updates }
              : state.currentTrip,
        })),

      deleteTrip: (tripId) =>
        set((state) => ({
          trips: state.trips.filter((trip) => trip.id !== tripId),
          currentTriip: state.currentTrip?.id === tripId ? null : state.currentTrip,
        })),

      setCurrentTrip: (trip) => set({ currentTrip: trip }),

      // Insights actions
      addDailyInsight: (insight) =>
        set((state) => {
          const existingIndex = state.insights.findIndex((i) => i.date === insight.date);
          if (existingIndex >= 0) {
            // Update existing insight
            const updatedInsights = [...state.insights];
            updatedInsights[existingIndex] = insight;
            return { insights: updatedInsights };
          } else {
            // Add new insight
            return { insights: [...state.insights, insight] };
          }
        }),

      // Integration actions
      updateIntegration: (type, updates) =>
        set((state) => ({
          integrations: state.integrations.map((integration) =>
            integration.type === type ? { ...integration, ...updates } : integration
          ),
        })),

      // App state actions
      completeOnboarding: () => set({ isOnboarded: true }),

      // Theme actions
      setTheme: (theme) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                preferences: { ...state.user.preferences, theme },
              }
            : null,
        })),
    }),
    {
      name: 'for-megan-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        routines: state.routines,
        trips: state.trips,
        insights: state.insights,
        integrations: state.integrations,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);