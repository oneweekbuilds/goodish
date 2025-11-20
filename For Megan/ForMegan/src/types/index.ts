export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  sleepGoal: number; // in hours
  personalityType: 'slow-starter' | 'quick-mover' | 'consistent-cruiser';
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'sunrise-vibes' | 'ocean-calm' | 'forest-energy' | 'midnight-mode' | 'y2k-nostalgia';
  notifications: boolean;
  haptics: boolean;
  sounds: boolean;
  wakeUpBuffer: number; // minutes before first task
}

export interface Task {
  id: string;
  name: string;
  estimatedTime: number; // minutes
  actualTimes: number[]; // historical completion times
  icon: string;
  category: TaskCategory;
  isActive: boolean;
  customInstructions?: string;
}

export type TaskCategory = 
  | 'hygiene' 
  | 'breakfast' 
  | 'exercise' 
  | 'grooming' 
  | 'preparation' 
  | 'wellness' 
  | 'custom';

export interface Routine {
  id: string;
  name: string;
  tasks: Task[];
  isDefault: boolean;
  estimatedDuration: number; // calculated from tasks
  createdAt: Date;
  lastUsed?: Date;
}

export interface Trip {
  id: string;
  destination: {
    name: string;
    address: string;
    placeId: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  arrivalTime: Date;
  departureTime: Date;
  routineId: string;
  travelMode: 'driving' | 'transit' | 'walking' | 'bicycling';
  bufferTime: number; // extra minutes for safety
  feedback?: 'early' | 'on-time' | 'late';
  actualDeparture?: Date;
  createdAt: Date;
}

export interface DailyInsight {
  date: string; // YYYY-MM-DD
  sleepScore?: number;
  routineCompletion: number; // percentage
  punctualityRating: 'early' | 'on-time' | 'late';
  weatherConditions: WeatherData;
  tasksCompleted: number;
  totalTasks: number;
  learningAdjustments: {
    taskId: string;
    oldTime: number;
    newTime: number;
    reason: string;
  }[];
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

export interface DeviceIntegration {
  type: 'oura' | 'hatch' | 'apple-health' | 'google-fit';
  isConnected: boolean;
  lastSync?: Date;
  authToken?: string;
}

export interface OuraData {
  sleepScore: number;
  readinessScore: number;
  activityScore: number;
  hrv: number;
  restingHR: number;
  sleepStages: {
    deep: number;
    light: number;
    rem: number;
    awake: number;
  };
}

export interface AppState {
  user: User | null;
  routines: Routine[];
  activeRoutine: Routine | null;
  trips: Trip[];
  insights: DailyInsight[];
  integrations: DeviceIntegration[];
  isOnboarded: boolean;
  currentTrip: Trip | null;
}