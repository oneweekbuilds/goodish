import { Task, TaskCategory } from '../types';

export const DEFAULT_TASK_TEMPLATES: Omit<Task, 'id' | 'actualTimes'>[] = [
  // Hygiene
  {
    name: 'Brush Teeth',
    estimatedTime: 2,
    icon: '🦷',
    category: 'hygiene' as TaskCategory,
    isActive: true,
    customInstructions: 'Use electric toothbrush for 2 minutes',
  },
  {
    name: 'Shower',
    estimatedTime: 8,
    icon: '🚿',
    category: 'hygiene' as TaskCategory,
    isActive: true,
    customInstructions: 'Include hair wash time if needed',
  },
  {
    name: 'Skincare Routine',
    estimatedTime: 5,
    icon: '🧴',
    category: 'hygiene' as TaskCategory,
    isActive: true,
    customInstructions: 'Moisturizer and sunscreen',
  },

  // Breakfast
  {
    name: 'Make Coffee',
    estimatedTime: 3,
    icon: '☕',
    category: 'breakfast' as TaskCategory,
    isActive: true,
    customInstructions: 'Grind beans and brew',
  },
  {
    name: 'Prepare Breakfast',
    estimatedTime: 10,
    icon: '🥞',
    category: 'breakfast' as TaskCategory,
    isActive: true,
    customInstructions: 'Quick meal or overnight oats',
  },
  {
    name: 'Take Vitamins',
    estimatedTime: 1,
    icon: '💊',
    category: 'breakfast' as TaskCategory,
    isActive: true,
  },

  // Exercise
  {
    name: 'Quick Stretch',
    estimatedTime: 5,
    icon: '🧘‍♀️',
    category: 'exercise' as TaskCategory,
    isActive: true,
    customInstructions: 'Basic morning stretches',
  },
  {
    name: 'Workout',
    estimatedTime: 20,
    icon: '💪',
    category: 'exercise' as TaskCategory,
    isActive: false,
    customInstructions: 'Full workout routine',
  },
  {
    name: 'Walk/Jog',
    estimatedTime: 15,
    icon: '🏃‍♀️',
    category: 'exercise' as TaskCategory,
    isActive: false,
    customInstructions: 'Light cardio',
  },

  // Grooming
  {
    name: 'Get Dressed',
    estimatedTime: 5,
    icon: '👗',
    category: 'grooming' as TaskCategory,
    isActive: true,
    customInstructions: 'Check weather for outfit choice',
  },
  {
    name: 'Hair Styling',
    estimatedTime: 8,
    icon: '💇‍♀️',
    category: 'grooming' as TaskCategory,
    isActive: true,
  },
  {
    name: 'Makeup',
    estimatedTime: 10,
    icon: '💄',
    category: 'grooming' as TaskCategory,
    isActive: true,
    customInstructions: 'Quick everyday look',
  },

  // Preparation
  {
    name: 'Pack Bag/Purse',
    estimatedTime: 3,
    icon: '👜',
    category: 'preparation' as TaskCategory,
    isActive: true,
    customInstructions: 'Keys, wallet, phone check',
  },
  {
    name: 'Check Weather',
    estimatedTime: 1,
    icon: '🌤️',
    category: 'preparation' as TaskCategory,
    isActive: true,
    customInstructions: 'Grab umbrella or jacket if needed',
  },
  {
    name: 'Review Calendar',
    estimatedTime: 2,
    icon: '📅',
    category: 'preparation' as TaskCategory,
    isActive: true,
    customInstructions: 'Check appointments and meetings',
  },

  // Wellness
  {
    name: 'Meditation',
    estimatedTime: 5,
    icon: '🧘',
    category: 'wellness' as TaskCategory,
    isActive: false,
    customInstructions: 'Breathing exercises or mindfulness',
  },
  {
    name: 'Journaling',
    estimatedTime: 5,
    icon: '📝',
    category: 'wellness' as TaskCategory,
    isActive: false,
    customInstructions: 'Gratitude or intention setting',
  },
  {
    name: 'Listen to Podcast',
    estimatedTime: 15,
    icon: '🎧',
    category: 'wellness' as TaskCategory,
    isActive: false,
    customInstructions: 'While getting ready',
  },
];

export const ROUTINE_TEMPLATES = [
  {
    name: 'Minimal Morning',
    description: 'Quick 15-minute routine for busy days',
    duration: 15,
    taskIds: ['brush-teeth', 'get-dressed', 'pack-bag'],
    icon: '⚡',
  },
  {
    name: 'Self-Care Sunday',
    description: 'Luxurious 45-minute wellness routine',
    duration: 45,
    taskIds: ['skincare', 'shower', 'meditation', 'healthy-breakfast', 'journaling'],
    icon: '🌸',
  },
  {
    name: 'Gym Day Grind',
    description: 'Energizing 30-minute pre-workout routine',
    duration: 30,
    taskIds: ['quick-stretch', 'protein-smoothie', 'gym-clothes', 'pack-gym-bag'],
    icon: '🏋️‍♀️',
  },
  {
    name: 'WFH Vibes',
    description: 'Relaxed 20-minute work-from-home routine',
    duration: 20,
    taskIds: ['shower', 'coffee', 'comfortable-clothes', 'workspace-setup'],
    icon: '🏠',
  },
] as const;

export const TASK_CATEGORIES = {
  hygiene: {
    name: 'Hygiene',
    icon: '🚿',
    color: '#4FC3F7',
  },
  breakfast: {
    name: 'Breakfast',
    icon: '🥞',
    color: '#FFB74D',
  },
  exercise: {
    name: 'Exercise',
    icon: '💪',
    color: '#81C784',
  },
  grooming: {
    name: 'Grooming',
    icon: '💄',
    color: '#F06292',
  },
  preparation: {
    name: 'Prep',
    icon: '👜',
    color: '#9575CD',
  },
  wellness: {
    name: 'Wellness',
    icon: '🧘',
    color: '#4DB6AC',
  },
  custom: {
    name: 'Custom',
    icon: '⭐',
    color: '#A1887F',
  },
} as const;