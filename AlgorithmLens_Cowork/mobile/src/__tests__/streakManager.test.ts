import {
  computeStreakState,
  getWelcomeBackMessage,
  isStreakAtRisk,
} from '../lib/streakManager';
import type { StreakData } from '../types/streak';
import { DEFAULT_STREAK_CONFIG } from '../types/streak';

function makeStreakData(overrides: Partial<StreakData> = {}): StreakData {
  return {
    current_streak: 0,
    longest_streak: 0,
    last_scan_date: null,
    grace_days_used: 0,
    max_grace_days: DEFAULT_STREAK_CONFIG.grace_days,
    in_grace_period: false,
    is_paused: false,
    total_scans: 0,
    first_scan_date: null,
    ...overrides,
  };
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateString(d);
}

describe('streakManager', () => {
  describe('computeStreakState', () => {
    it('returns NEW for zero scans', () => {
      expect(computeStreakState(makeStreakData())).toBe('NEW');
    });

    it('returns NEW for null last_scan_date with scans', () => {
      expect(computeStreakState(makeStreakData({ total_scans: 5 }))).toBe('NEW');
    });

    it('returns ACTIVE when scanned today', () => {
      const data = makeStreakData({
        total_scans: 1,
        current_streak: 1,
        last_scan_date: daysAgo(0),
      });
      expect(computeStreakState(data)).toBe('ACTIVE');
    });

    it('returns GRACE when scanned yesterday with active streak', () => {
      const data = makeStreakData({
        total_scans: 3,
        current_streak: 3,
        last_scan_date: daysAgo(1),
      });
      expect(computeStreakState(data)).toBe('GRACE');
    });

    it('returns NEW when scanned yesterday with no streak', () => {
      const data = makeStreakData({
        total_scans: 1,
        current_streak: 0,
        last_scan_date: daysAgo(1),
      });
      expect(computeStreakState(data)).toBe('NEW');
    });

    it('returns GRACE when missed 2 days with grace available', () => {
      const data = makeStreakData({
        total_scans: 5,
        current_streak: 5,
        last_scan_date: daysAgo(2),
        grace_days_used: 0,
        max_grace_days: 1,
      });
      expect(computeStreakState(data)).toBe('GRACE');
    });

    it('returns PAUSED when missed 2 days with no grace left', () => {
      const data = makeStreakData({
        total_scans: 5,
        current_streak: 5,
        last_scan_date: daysAgo(2),
        grace_days_used: 1,
        max_grace_days: 1,
      });
      expect(computeStreakState(data)).toBe('PAUSED');
    });

    it('returns PAUSED when missed 3+ days', () => {
      const data = makeStreakData({
        total_scans: 10,
        current_streak: 7,
        last_scan_date: daysAgo(5),
      });
      expect(computeStreakState(data)).toBe('PAUSED');
    });
  });

  describe('getWelcomeBackMessage', () => {
    it('mentions longest streak for 7+ day streaks', () => {
      const data = makeStreakData({ longest_streak: 10, total_scans: 15 });
      const msg = getWelcomeBackMessage(data);
      expect(msg).toContain('10-day streak');
      expect(msg).toContain('Welcome back');
    });

    it('generic welcome for users with some scans', () => {
      const data = makeStreakData({ longest_streak: 3, total_scans: 5 });
      const msg = getWelcomeBackMessage(data);
      expect(msg).toContain('Welcome back');
      expect(msg).toContain('Every scan');
    });

    it('first-timer message for zero scans', () => {
      const data = makeStreakData();
      const msg = getWelcomeBackMessage(data);
      expect(msg).toContain('Welcome');
      expect(msg).toContain('first scan');
    });
  });

  describe('isStreakAtRisk', () => {
    it('returns false for no streak', () => {
      expect(isStreakAtRisk(makeStreakData())).toBe(false);
    });

    it('returns false when already scanned today', () => {
      const data = makeStreakData({
        current_streak: 3,
        last_scan_date: daysAgo(0),
        total_scans: 3,
      });
      expect(isStreakAtRisk(data)).toBe(false);
    });

    // Time-dependent test: at-risk detection depends on current hour >= 18
    it('returns false for zero streak regardless of time', () => {
      const data = makeStreakData({
        current_streak: 0,
        last_scan_date: daysAgo(1),
        total_scans: 1,
      });
      expect(isStreakAtRisk(data)).toBe(false);
    });
  });
});
