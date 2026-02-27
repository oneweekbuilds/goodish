import { getUserFriendlyNetworkError, TimeoutError, withTimeout } from '../lib/networkUtils';

describe('networkUtils', () => {
  describe('getUserFriendlyNetworkError', () => {
    it('handles TimeoutError', () => {
      const err = new TimeoutError('Request timed out', 5000);
      expect(getUserFriendlyNetworkError(err)).toBe('Request timed out');
    });

    it('handles network request failed', () => {
      const err = new Error('Network request failed');
      expect(getUserFriendlyNetworkError(err)).toContain('connect to the internet');
    });

    it('handles Failed to fetch', () => {
      const err = new Error('Failed to fetch');
      expect(getUserFriendlyNetworkError(err)).toContain('connect to the internet');
    });

    it('handles ECONNREFUSED', () => {
      const err = new Error('ECONNREFUSED');
      expect(getUserFriendlyNetworkError(err)).toContain('connect to the internet');
    });

    it('handles Gemini API errors', () => {
      const err = new Error('Failed to call generativelanguage.googleapis.com');
      expect(getUserFriendlyNetworkError(err)).toContain('analysis service');
    });

    it('handles Supabase errors', () => {
      const err = new Error('supabase connection failed');
      expect(getUserFriendlyNetworkError(err)).toContain('saving your data');
    });

    it('handles abort errors', () => {
      const err = new Error('The operation was aborted');
      expect(getUserFriendlyNetworkError(err)).toContain('cancelled');
    });

    it('returns generic message for unknown errors', () => {
      const err = new Error('Something weird happened');
      expect(getUserFriendlyNetworkError(err)).toContain('Something unexpected');
    });

    it('handles non-Error objects', () => {
      expect(getUserFriendlyNetworkError('string error')).toContain('Something unexpected');
    });

    it('handles null/undefined', () => {
      expect(getUserFriendlyNetworkError(null)).toContain('Something unexpected');
      expect(getUserFriendlyNetworkError(undefined)).toContain('Something unexpected');
    });
  });

  describe('TimeoutError', () => {
    it('has correct name and timeoutMs', () => {
      const err = new TimeoutError('test', 3000);
      expect(err.name).toBe('TimeoutError');
      expect(err.timeoutMs).toBe(3000);
      expect(err.message).toBe('test');
      expect(err instanceof Error).toBe(true);
    });
  });

  describe('withTimeout', () => {
    it('resolves when promise finishes before timeout', async () => {
      const result = await withTimeout(Promise.resolve(42), 1000);
      expect(result).toBe(42);
    });

    it('rejects with TimeoutError when promise takes too long', async () => {
      const slow = new Promise((resolve) => setTimeout(resolve, 200));
      await expect(withTimeout(slow, 10, 'test')).rejects.toThrow(TimeoutError);
    });

    it('includes label in timeout message', async () => {
      const slow = new Promise((resolve) => setTimeout(resolve, 200));
      await expect(withTimeout(slow, 10, 'analysis service')).rejects.toThrow(/analysis service/);
    });

    it('propagates original error if promise rejects before timeout', async () => {
      const failing = Promise.reject(new Error('original error'));
      await expect(withTimeout(failing, 5000)).rejects.toThrow('original error');
    });
  });
});
