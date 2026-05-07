/**
 * Achievements — Badge system for rewarding scanning curiosity.
 *
 * Design principles:
 * 1. Celebrate milestones warmly, never competitively
 * 2. All data persisted in AsyncStorage (offline-first)
 * 3. Check functions are pure — side-effect-free eligibility checks
 * 4. Graceful degradation if storage is unavailable
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  EarnedAchievement,
  AchievementCheckContext,
  ScanHistoryEntry,
  StreakFreezeData,
  WeeklySummaryData,
  FeedScoreTrendPoint,
  TrendDirection,
} from '../types/achievements';
import {
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_STORAGE_KEYS,
} from '../types/achievements';

// ─── Constants ───────────────────────────────────────────

const MAX_SCAN_HISTORY = 500; // Cap to prevent unbounded storage
const MAX_SCORE_HISTORY = 90; // ~3 months of daily scores

// ─── Achievement Persistence ────────────────────────────

/** Load all earned achievements from storage. */
export async function loadEarnedAchievements(): Promise<EarnedAchievement[]> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.EARNED_ACHIEVEMENTS);
    if (raw === null) return [];
    return JSON.parse(raw) as EarnedAchievement[];
  } catch {
    if (__DEV__) {
      console.warn('[Achievements] Failed to load earned achievements');
    }
    return [];
  }
}

/** Save earned achievements to storage. */
async function saveEarnedAchievements(achievements: EarnedAchievement[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      ACHIEVEMENT_STORAGE_KEYS.EARNED_ACHIEVEMENTS,
      JSON.stringify(achievements)
    );
  } catch {
    if (__DEV__) {
      console.warn('[Achievements] Failed to save earned achievements');
    }
  }
}

/** Mark an achievement as seen (dismisses the earn animation). */
export async function markAchievementSeen(id: string): Promise<void> {
  const achievements = await loadEarnedAchievements();
  const updated = achievements.map((a) =>
    a.id === id ? { ...a, seen: true } : a
  );
  await saveEarnedAchievements(updated);
}

// ─── Achievement Checkers ───────────────────────────────

type AchievementChecker = (ctx: AchievementCheckContext) => boolean;

const CHECKERS: Record<string, AchievementChecker> = {
  first_scan: (ctx) => ctx.totalScans >= 1,
  multi_platform: (ctx) => ctx.platformsScanned.length >= 3,
  streak_starter: (ctx) => ctx.longestStreak >= 3,
  week_warrior: (ctx) => ctx.longestStreak >= 7,
  feed_detective: (ctx) => ctx.totalScans >= 50,
  pattern_spotter: (ctx) => {
    if (ctx.scoreHistory.length < 2) return false;
    const sorted = [...ctx.scoreHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    // Check if any 7-day window shows improvement
    for (let i = 1; i < sorted.length; i++) {
      if ((sorted[i]?.score ?? 0) > (sorted[i - 1]?.score ?? 0)) return true;
    }
    return false;
  },
  night_owl: (ctx) => ctx.scanHour >= 22,
  early_bird: (ctx) => ctx.scanHour < 8,
};

/**
 * Check all achievements and return any newly earned ones.
 * Does NOT persist — caller is responsible for saving.
 */
export async function checkAchievements(
  ctx: AchievementCheckContext
): Promise<EarnedAchievement[]> {
  const earned = await loadEarnedAchievements();
  const earnedIds = new Set(earned.map((a) => a.id));
  const newlyEarned: EarnedAchievement[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (earnedIds.has(def.id)) continue;
    const checker = CHECKERS[def.id];
    if (checker && checker(ctx)) {
      newlyEarned.push({
        id: def.id,
        earned_at: new Date().toISOString(),
        seen: false,
      });
    }
  }

  if (newlyEarned.length > 0) {
    await saveEarnedAchievements([...earned, ...newlyEarned]);
  }

  return newlyEarned;
}

// ─── Scan History ───────────────────────────────────────

/** Load scan history for trending and achievement checks. */
export async function loadScanHistory(): Promise<ScanHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.SCAN_HISTORY);
    if (raw === null) return [];
    return JSON.parse(raw) as ScanHistoryEntry[];
  } catch {
    if (__DEV__) {
      console.warn('[Achievements] Failed to load scan history');
    }
    return [];
  }
}

/** Record a scan in history. Caps at MAX_SCAN_HISTORY entries. */
export async function recordScanHistory(entry: ScanHistoryEntry): Promise<void> {
  try {
    const history = await loadScanHistory();
    history.push(entry);
    // Keep only the most recent entries
    const trimmed = history.length > MAX_SCAN_HISTORY
      ? history.slice(history.length - MAX_SCAN_HISTORY)
      : history;
    await AsyncStorage.setItem(
      ACHIEVEMENT_STORAGE_KEYS.SCAN_HISTORY,
      JSON.stringify(trimmed)
    );
  } catch {
    if (__DEV__) {
      console.warn('[Achievements] Failed to record scan history');
    }
  }
}

/** Get unique platforms from scan history. */
export async function getScannedPlatforms(): Promise<string[]> {
  const history = await loadScanHistory();
  return [...new Set(history.map((h) => h.platform))];
}

// ─── Score History (for trending) ───────────────────────

/** Load feed score history. */
export async function loadScoreHistory(): Promise<FeedScoreTrendPoint[]> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.SCORE_HISTORY);
    if (raw === null) return [];
    return JSON.parse(raw) as FeedScoreTrendPoint[];
  } catch {
    if (__DEV__) {
      console.warn('[Achievements] Failed to load score history');
    }
    return [];
  }
}

/** Record a feed score data point. One per day max. */
export async function recordScoreHistory(score: number): Promise<void> {
  try {
    const history = await loadScoreHistory();
    const today = getLocalDateString();

    // Replace today's entry if it exists, otherwise append
    const existingIndex = history.findIndex((h) => h.date === today);
    if (existingIndex >= 0) {
      history[existingIndex] = { date: today, score };
    } else {
      history.push({ date: today, score });
    }

    const trimmed = history.length > MAX_SCORE_HISTORY
      ? history.slice(history.length - MAX_SCORE_HISTORY)
      : history;

    await AsyncStorage.setItem(
      ACHIEVEMENT_STORAGE_KEYS.SCORE_HISTORY,
      JSON.stringify(trimmed)
    );
  } catch {
    if (__DEV__) {
      console.warn('[Achievements] Failed to record score history');
    }
  }
}

/** Get the last 7 days of score data for sparkline. */
export async function getRecentScoreTrend(): Promise<{
  points: FeedScoreTrendPoint[];
  direction: TrendDirection;
  changePercent: number;
}> {
  const history = await loadScoreHistory();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);

  const recent = history
    .filter((h) => h.date >= sevenDaysAgoStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (recent.length < 2) {
    return { points: recent, direction: 'stable', changePercent: 0 };
  }

  const first = recent[0]?.score ?? 0;
  const last = recent[recent.length - 1]?.score ?? 0;
  const change = last - first;
  const changePercent = first > 0 ? Math.round((change / first) * 100) : 0;

  let direction: TrendDirection = 'stable';
  if (changePercent > 3) direction = 'improving';
  else if (changePercent < -3) direction = 'declining';

  return { points: recent, direction, changePercent };
}

// ─── Streak Freeze ──────────────────────────────────────

/** Load streak freeze data. */
export async function loadStreakFreeze(): Promise<StreakFreezeData> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEYS.STREAK_FREEZE);
    if (raw === null) return getDefaultFreezeData();
    const data = JSON.parse(raw) as StreakFreezeData;
    // Check if we need to grant a new freeze (new week)
    return maybeGrantNewFreeze(data);
  } catch {
    return getDefaultFreezeData();
  }
}

/** Save streak freeze data. */
export async function saveStreakFreeze(data: StreakFreezeData): Promise<void> {
  try {
    await AsyncStorage.setItem(
      ACHIEVEMENT_STORAGE_KEYS.STREAK_FREEZE,
      JSON.stringify(data)
    );
  } catch {
    if (__DEV__) {
      console.warn('[Achievements] Failed to save streak freeze');
    }
  }
}

/** Use the streak freeze (auto-applied when streak is about to break). */
export async function useStreakFreeze(): Promise<boolean> {
  const freeze = await loadStreakFreeze();
  if (!freeze.available) return false;

  freeze.available = false;
  freeze.lastUsedDate = getLocalDateString();
  freeze.autoApplied = true;
  await saveStreakFreeze(freeze);
  return true;
}

function getDefaultFreezeData(): StreakFreezeData {
  return {
    available: true,
    lastUsedDate: null,
    lastGrantedWeek: getMondayOfWeek(),
    autoApplied: false,
  };
}

/** Grant a new freeze if a new week has started. */
function maybeGrantNewFreeze(data: StreakFreezeData): StreakFreezeData {
  const currentMonday = getMondayOfWeek();
  if (data.lastGrantedWeek !== currentMonday) {
    return {
      available: true,
      lastUsedDate: data.lastUsedDate,
      lastGrantedWeek: currentMonday,
      autoApplied: false,
    };
  }
  return data;
}

// ─── Weekly Summary ─────────────────────────────────────

/** Compute weekly summary from scan history. */
export async function computeWeeklySummary(): Promise<WeeklySummaryData | null> {
  const history = await loadScanHistory();
  if (history.length === 0) return null;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const thisWeekScans = history.filter(
    (h) => new Date(h.date).getTime() >= weekStart.getTime()
  );
  const prevWeekScans = history.filter((h) => {
    const t = new Date(h.date).getTime();
    return t >= prevWeekStart.getTime() && t < weekStart.getTime();
  });

  if (thisWeekScans.length === 0 && prevWeekScans.length === 0) return null;

  // Use this week's scans if available, otherwise fall back to last week
  const activeScans = thisWeekScans.length > 0 ? thisWeekScans : prevWeekScans;

  const platformBreakdown: Record<string, number> = {};
  let totalAdPct = 0;
  let totalScore = 0;
  let totalPosts = 0;

  for (const scan of activeScans) {
    platformBreakdown[scan.platform] = (platformBreakdown[scan.platform] || 0) + 1;
    totalAdPct += scan.adPercentage;
    totalScore += scan.feedScore;
    totalPosts += scan.postCount;
  }

  const avgAdPct = activeScans.length > 0 ? totalAdPct / activeScans.length : 0;
  const avgScore = activeScans.length > 0 ? totalScore / activeScans.length : 0;

  // Previous week comparison
  let prevWeekAvgAd: number | null = null;
  let prevWeekAvgScore: number | null = null;
  if (prevWeekScans.length > 0 && thisWeekScans.length > 0) {
    prevWeekAvgAd = prevWeekScans.reduce((s, h) => s + h.adPercentage, 0) / prevWeekScans.length;
    prevWeekAvgScore = prevWeekScans.reduce((s, h) => s + h.feedScore, 0) / prevWeekScans.length;
  }

  // Find top platform
  let topPlatform: string | null = null;
  let topCount = 0;
  for (const [platform, count] of Object.entries(platformBreakdown)) {
    if (count > topCount) {
      topPlatform = platform;
      topCount = count;
    }
  }

  const weekId = getISOWeekId(now);

  return {
    weekId,
    scanCount: activeScans.length,
    platformBreakdown,
    avgAdPercentage: Math.round(avgAdPct * 10) / 10,
    prevWeekAvgAdPercentage: prevWeekAvgAd !== null ? Math.round(prevWeekAvgAd * 10) / 10 : null,
    topPlatform,
    topPlatformCount: topCount,
    avgFeedScore: Math.round(avgScore),
    prevWeekAvgFeedScore: prevWeekAvgScore !== null ? Math.round(prevWeekAvgScore) : null,
    totalPosts,
  };
}

// ─── Smart Scan Suggestions ─────────────────────────────

export interface ScanSuggestion {
  type: 'different_platform' | 'time_check' | 'different_time';
  message: string;
  /** Optional platform to suggest. */
  suggestedPlatform?: string;
}

/** Generate contextual scan suggestions based on history. */
export async function getSmartSuggestions(
  lastScanDate: string | null
): Promise<ScanSuggestion | null> {
  const history = await loadScanHistory();

  // Priority 1: Haven't scanned in 2+ days
  if (lastScanDate) {
    const daysSince = daysBetweenDates(getLocalDateString(), lastScanDate);
    if (daysSince >= 2) {
      const dayName = getDayName(lastScanDate);
      return {
        type: 'time_check',
        message: `Your last scan was ${dayName}. Feeds shift over time, want to see what's changed?`,
      };
    }
  }

  // Priority 2: 3+ scans on one platform, suggest another
  if (history.length >= 3) {
    const platformCounts: Record<string, number> = {};
    for (const scan of history.slice(-10)) {
      platformCounts[scan.platform] = (platformCounts[scan.platform] || 0) + 1;
    }

    const allPlatforms = ['instagram', 'twitter', 'youtube', 'tiktok', 'facebook', 'reddit'];
    const scannedPlatforms = new Set(history.map((h) => h.platform));
    const unscanned = allPlatforms.filter((p) => !scannedPlatforms.has(p));

    // Find dominant platform
    let dominant: string | null = null;
    let dominantCount = 0;
    for (const [platform, count] of Object.entries(platformCounts)) {
      if (count >= 3 && count > dominantCount) {
        dominant = platform;
        dominantCount = count;
      }
    }

    if (dominant && unscanned.length > 0) {
      const suggestion = unscanned[0];
      return {
        type: 'different_platform',
        message: `You've scanned ${formatPlatformName(dominant)} ${dominantCount} times recently. Scanning a different platform can show how content varies.`,
        suggestedPlatform: suggestion,
      };
    }
  }

  // Priority 3: Time-of-day suggestion
  if (history.length >= 3) {
    const recentHours = history.slice(-5).map((h) => h.hourOfDay);
    const allMorning = recentHours.every((h) => h < 12);
    const allEvening = recentHours.every((h) => h >= 17);

    if (allMorning) {
      return {
        type: 'different_time',
        message: 'You tend to scan in the morning. Feed content can look different later in the day.',
      };
    }
    if (allEvening) {
      return {
        type: 'different_time',
        message: 'You tend to scan in the evening. Morning feeds can look quite different.',
      };
    }
  }

  return null;
}

// ─── Date Helpers ───────────────────────────────────────

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** DST-safe calendar day difference using UTC to avoid timezone issues. */
function daysBetweenDates(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00Z');
  const b = new Date(dateB + 'T00:00:00Z');
  return Math.round(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return getLocalDateString(d);
}

function getISOWeekId(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return `${diffDays} days ago`;
}

function formatPlatformName(platform: string): string {
  const names: Record<string, string> = {
    instagram: 'Instagram',
    twitter: 'Twitter/X',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    reddit: 'Reddit',
  };
  return names[platform] || platform;
}
