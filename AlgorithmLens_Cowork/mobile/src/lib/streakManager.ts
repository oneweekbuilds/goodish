/**
 * StreakManager — AsyncStorage persistence and streak rules engine.
 *
 * Design principles (from research):
 * 1. Sessions not minutes — scanning once = streak maintained
 * 2. 1 grace day — miss one day, streak pauses but doesn't break
 * 3. Milestone celebrations at 3, 7, 14, 30 days (not every day)
 * 4. Recovery mechanic — "Welcome back" not "You lost your streak"
 * 5. No guilt — never show "streak lost" language, frame as "streak paused"
 *
 * All dates are stored as YYYY-MM-DD strings in the device's local timezone.
 * Server timestamps are NOT used for streak calculation — this is intentional
 * to avoid timezone edge cases and network dependency.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StreakData, StreakDisplayState } from '../types/streak';
import {
  STREAK_STORAGE_KEYS,
  DEFAULT_STREAK_CONFIG,
  STREAK_MILESTONES,
} from '../types/streak';
import type { StreakFreezeData } from '../types/achievements';

// ─── Date Helpers ────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD in local timezone. */
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns the number of calendar days between two YYYY-MM-DD date strings. */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  const diffMs = Math.abs(a.getTime() - b.getTime());
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ─── Default Streak Data ─────────────────────────────────

const DEFAULT_STREAK_DATA: StreakData = {
  current_streak: 0,
  longest_streak: 0,
  last_scan_date: null,
  grace_days_used: 0,
  max_grace_days: DEFAULT_STREAK_CONFIG.grace_days,
  in_grace_period: false,
  is_paused: false,
  total_scans: 0,
  first_scan_date: null,
};

// ─── Persistence ─────────────────────────────────────────

/** Reads streak data from AsyncStorage, returning defaults if not found. */
export async function loadStreakData(): Promise<StreakData> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_STORAGE_KEYS.STREAK_DATA);
    if (raw === null) return { ...DEFAULT_STREAK_DATA };

    const parsed = JSON.parse(raw) as Partial<StreakData>;
    return {
      ...DEFAULT_STREAK_DATA,
      ...parsed,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[StreakManager] Failed to load streak data:', error);
    }
    return { ...DEFAULT_STREAK_DATA };
  }
}

/** Writes streak data to AsyncStorage. */
async function saveStreakData(data: StreakData): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STREAK_STORAGE_KEYS.STREAK_DATA,
      JSON.stringify(data)
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[StreakManager] Failed to save streak data:', error);
    }
  }
}

// ─── Celebrated Milestones ───────────────────────────────

/** Returns the set of milestone day counts that have already been celebrated. */
export async function loadCelebratedMilestones(): Promise<Set<number>> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_STORAGE_KEYS.CELEBRATED_MILESTONES);
    if (raw === null) return new Set();
    const arr = JSON.parse(raw) as number[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

/** Marks a milestone as celebrated so it won't be shown again. */
export async function markMilestoneCelebrated(days: number): Promise<void> {
  try {
    const celebrated = await loadCelebratedMilestones();
    celebrated.add(days);
    await AsyncStorage.setItem(
      STREAK_STORAGE_KEYS.CELEBRATED_MILESTONES,
      JSON.stringify([...celebrated])
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[StreakManager] Failed to save milestone:', error);
    }
  }
}

// ─── Streak State Computation ────────────────────────────

/**
 * Computes the current StreakDisplayState from streak data.
 * This is a pure function — no side effects.
 */
export function computeStreakState(data: StreakData): StreakDisplayState {
  if (data.total_scans === 0 || data.last_scan_date === null) {
    return 'NEW';
  }

  const today = getLocalDateString();
  const daysSinceLastScan = daysBetween(today, data.last_scan_date);

  if (daysSinceLastScan === 0) {
    // Scanned today — streak is active
    return 'ACTIVE';
  }

  if (daysSinceLastScan === 1) {
    // Missed today but scanned yesterday — still active, showing as grace
    return data.current_streak > 0 ? 'GRACE' : 'NEW';
  }

  if (daysSinceLastScan === 2 && data.grace_days_used < data.max_grace_days) {
    // Missed yesterday AND today, but grace day covers yesterday
    return 'GRACE';
  }

  // Missed too many days — streak is paused
  return 'PAUSED';
}

/**
 * Returns the pending milestone to celebrate, if any.
 * Returns null if no uncelebrated milestone matches the current streak.
 */
export async function getPendingMilestone(
  data: StreakData
): Promise<(typeof STREAK_MILESTONES)[number] | null> {
  if (data.current_streak <= 0) return null;

  const celebrated = await loadCelebratedMilestones();

  for (const milestone of STREAK_MILESTONES) {
    if (data.current_streak >= milestone.days && !celebrated.has(milestone.days)) {
      return milestone;
    }
  }

  return null;
}

// ─── Streak Mutation ─────────────────────────────────────

/**
 * Records a completed scan and updates the streak accordingly.
 *
 * Rules:
 * - If the user already scanned today, increment total_scans but don't change streak.
 * - If the user scanned yesterday, extend the streak by 1.
 * - If the user missed one day (grace), extend the streak and consume a grace day.
 * - If the user missed 2+ days, start a new streak at 1.
 *
 * Returns the updated StreakData and any pending milestone.
 */
export async function recordScan(): Promise<{
  streak: StreakData;
  milestone: (typeof STREAK_MILESTONES)[number] | null;
}> {
  const data = await loadStreakData();
  const today = getLocalDateString();

  // Always increment total scans
  data.total_scans += 1;

  // Set first scan date if this is the first scan ever
  if (data.first_scan_date === null) {
    data.first_scan_date = today;
  }

  if (data.last_scan_date === today) {
    // Already scanned today — no streak change, just save incremented total
    await saveStreakData(data);
    return { streak: data, milestone: null };
  }

  if (data.last_scan_date === null) {
    // First scan ever — start streak at 1
    data.current_streak = 1;
    data.grace_days_used = 0;
    data.in_grace_period = false;
    data.is_paused = false;
  } else {
    const daysSinceLastScan = daysBetween(today, data.last_scan_date);

    if (daysSinceLastScan === 1) {
      // Consecutive day — extend streak
      data.current_streak += 1;
      data.in_grace_period = false;
    } else if (daysSinceLastScan === 2 && data.grace_days_used < data.max_grace_days) {
      // Missed one day — grace day covers it
      data.current_streak += 2; // +1 for grace day, +1 for today
      data.grace_days_used += 1;
      data.in_grace_period = false;
    } else {
      // Missed too many days — new streak
      data.current_streak = 1;
      data.grace_days_used = 0;
      data.in_grace_period = false;
      data.is_paused = false;
    }
  }

  // Update longest streak
  if (data.current_streak > data.longest_streak) {
    data.longest_streak = data.current_streak;
  }

  data.last_scan_date = today;

  await saveStreakData(data);

  // Check for pending milestone
  const milestone = await getPendingMilestone(data);

  return { streak: data, milestone };
}

/**
 * Returns a "welcome back" message for users returning from a paused streak.
 * The message is warm and encouraging — never guilt-inducing.
 */
export function getWelcomeBackMessage(data: StreakData): string {
  if (data.longest_streak >= 7) {
    return `Welcome back. You had a ${data.longest_streak}-day streak before. Ready to start a new one?`;
  }
  if (data.total_scans > 0) {
    return 'Welcome back. Every scan adds to your understanding of your feed.';
  }
  return 'Welcome. Start your first scan to see what appears in your feed.';
}

/**
 * Returns a greeting message appropriate for the time of day.
 */
export function getTimeBasedGreeting(name?: string): string {
  const hour = new Date().getHours();
  const displayName = name || 'there';

  if (hour < 12) return `Good morning, ${displayName}`;
  if (hour < 17) return `Good afternoon, ${displayName}`;
  return `Good evening, ${displayName}`;
}

// ─── Streak Freeze ──────────────────────────────────────

/**
 * Returns the Monday of the current week as YYYY-MM-DD.
 */
function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return getLocalDateString(d);
}

const DEFAULT_FREEZE: StreakFreezeData = {
  available: true,
  lastUsedDate: null,
  lastGrantedWeek: null,
  autoApplied: false,
};

/** Load streak freeze data — grants a new freeze each Monday. */
export async function loadStreakFreeze(): Promise<StreakFreezeData> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_STORAGE_KEYS.STREAK_FREEZE);
    const data: StreakFreezeData = raw !== null
      ? { ...DEFAULT_FREEZE, ...(JSON.parse(raw) as Partial<StreakFreezeData>) }
      : { ...DEFAULT_FREEZE };

    // Grant a new freeze if the week has changed
    const currentMonday = getMondayOfWeek();
    if (data.lastGrantedWeek !== currentMonday) {
      data.available = true;
      data.lastGrantedWeek = currentMonday;
      data.autoApplied = false;
      await saveStreakFreeze(data);
    }

    return data;
  } catch {
    return { ...DEFAULT_FREEZE };
  }
}

/** Save streak freeze data. */
export async function saveStreakFreeze(data: StreakFreezeData): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STREAK_STORAGE_KEYS.STREAK_FREEZE,
      JSON.stringify(data)
    );
  } catch {
    if (__DEV__) {
      console.warn('[StreakManager] Failed to save streak freeze');
    }
  }
}

/**
 * Attempts to use a streak freeze to prevent streak loss.
 * Returns true if the freeze was successfully applied.
 */
export async function useStreakFreeze(): Promise<boolean> {
  const freeze = await loadStreakFreeze();
  if (!freeze.available) return false;

  freeze.available = false;
  freeze.lastUsedDate = getLocalDateString();
  freeze.autoApplied = true;
  await saveStreakFreeze(freeze);
  return true;
}

// ─── Streak At-Risk Detection ───────────────────────────

/**
 * Checks whether the streak is "at risk" — meaning it's late in the
 * day and the user hasn't scanned yet. Used for gentle home screen indicators.
 *
 * Returns true if:
 * - User has an active streak (>= 1 day)
 * - Haven't scanned today
 * - It's 6 PM or later
 */
export function isStreakAtRisk(data: StreakData): boolean {
  if (data.current_streak <= 0 || data.last_scan_date === null) return false;

  const today = getLocalDateString();
  if (data.last_scan_date === today) return false; // Already scanned today

  const hour = new Date().getHours();
  return hour >= 18; // 6 PM or later
}

/**
 * Enhanced recordScan that integrates streak freeze logic.
 * If the user missed days but has a freeze available, the freeze
 * is auto-applied to save the streak.
 */
export async function recordScanWithFreeze(): Promise<{
  streak: StreakData;
  milestone: (typeof STREAK_MILESTONES)[number] | null;
  freezeUsed: boolean;
}> {
  const data = await loadStreakData();
  const today = getLocalDateString();
  let freezeUsed = false;

  // Always increment total scans
  data.total_scans += 1;

  if (data.first_scan_date === null) {
    data.first_scan_date = today;
  }

  if (data.last_scan_date === today) {
    await saveStreakData(data);
    return { streak: data, milestone: null, freezeUsed: false };
  }

  if (data.last_scan_date === null) {
    data.current_streak = 1;
    data.grace_days_used = 0;
    data.in_grace_period = false;
    data.is_paused = false;
  } else {
    const daysSinceLastScan = daysBetween(today, data.last_scan_date);

    if (daysSinceLastScan === 1) {
      data.current_streak += 1;
      data.in_grace_period = false;
    } else if (daysSinceLastScan === 2 && data.grace_days_used < data.max_grace_days) {
      data.current_streak += 2;
      data.grace_days_used += 1;
      data.in_grace_period = false;
    } else if (daysSinceLastScan <= 3 && data.current_streak > 0) {
      // Try using a streak freeze before breaking the streak
      const freeze = await loadStreakFreeze();
      if (freeze.available) {
        freeze.available = false;
        freeze.lastUsedDate = today;
        freeze.autoApplied = true;
        await saveStreakFreeze(freeze);
        // Freeze covers the gap — streak continues
        data.current_streak += 1;
        data.in_grace_period = false;
        freezeUsed = true;
      } else {
        data.current_streak = 1;
        data.grace_days_used = 0;
        data.in_grace_period = false;
        data.is_paused = false;
      }
    } else {
      data.current_streak = 1;
      data.grace_days_used = 0;
      data.in_grace_period = false;
      data.is_paused = false;
    }
  }

  if (data.current_streak > data.longest_streak) {
    data.longest_streak = data.current_streak;
  }

  data.last_scan_date = today;
  await saveStreakData(data);

  const milestone = await getPendingMilestone(data);
  return { streak: data, milestone, freezeUsed };
}

/**
 * Resets all streak data. Used for testing or account reset.
 */
export async function resetStreakData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STREAK_STORAGE_KEYS.STREAK_DATA,
      STREAK_STORAGE_KEYS.CELEBRATED_MILESTONES,
      STREAK_STORAGE_KEYS.STREAK_FREEZE,
    ]);
  } catch (error) {
    if (__DEV__) {
      console.warn('[StreakManager] Failed to reset streak data:', error);
    }
  }
}
