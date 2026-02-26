/**
 * Tests for errorMessages.js — error-to-user-message mapping.
 */
import { describe, test, expect } from 'vitest';
import { getErrorMessage, getErrorMessageByStatus, getErrorContext } from './errorMessages.js';

describe('getErrorMessageByStatus', () => {
  test('400 returns invalid request message', () => {
    expect(getErrorMessageByStatus(400)).toContain('Invalid request');
  });

  test('401 returns session expired message', () => {
    expect(getErrorMessageByStatus(401)).toContain('session has expired');
  });

  test('403 returns permission message', () => {
    expect(getErrorMessageByStatus(403)).toContain('permission');
  });

  test('404 returns not found message', () => {
    expect(getErrorMessageByStatus(404)).toContain('not found');
  });

  test('409 returns conflict message', () => {
    expect(getErrorMessageByStatus(409)).toContain('conflicts');
  });

  test('413 returns file too large message', () => {
    expect(getErrorMessageByStatus(413)).toContain('too large');
  });

  test('429 returns rate limit message', () => {
    expect(getErrorMessageByStatus(429)).toContain('Too many requests');
  });

  test('500 returns server error message', () => {
    expect(getErrorMessageByStatus(500)).toContain('went wrong');
  });

  test('502 returns same message as 500', () => {
    expect(getErrorMessageByStatus(502)).toBe(getErrorMessageByStatus(500));
  });

  test('503 returns same message as 500', () => {
    expect(getErrorMessageByStatus(503)).toBe(getErrorMessageByStatus(500));
  });

  test('504 returns same message as 500', () => {
    expect(getErrorMessageByStatus(504)).toBe(getErrorMessageByStatus(500));
  });

  test('unknown status returns default message', () => {
    expect(getErrorMessageByStatus(999)).toContain('unexpected');
  });
});

describe('getErrorMessage', () => {
  test('handles number input', () => {
    expect(getErrorMessage(404)).toContain('not found');
  });

  test('handles string input', () => {
    expect(getErrorMessage('Custom error text')).toBe('Custom error text');
  });

  test('handles Error with network failure', () => {
    const err = new Error('Failed to fetch');
    expect(getErrorMessage(err)).toContain('internet connection');
  });

  test('handles Error with NetworkError', () => {
    const err = new Error('NetworkError when attempting to fetch');
    expect(getErrorMessage(err)).toContain('internet connection');
  });

  test('handles Error with timeout', () => {
    const err = new Error('Request timeout');
    expect(getErrorMessage(err)).toContain('took too long');
  });

  test('handles Error with descriptive message', () => {
    const err = new Error('Something specific went wrong');
    expect(getErrorMessage(err)).toBe('Something specific went wrong');
  });

  test('handles Error with undefined in message', () => {
    const err = new Error('undefined is not a function');
    expect(getErrorMessage(err)).toContain('unexpected');
  });

  test('handles null input', () => {
    expect(getErrorMessage(null)).toContain('unexpected');
  });

  test('handles undefined input', () => {
    expect(getErrorMessage(undefined)).toContain('unexpected');
  });
});

describe('getErrorContext', () => {
  test('classifies number as http_error', () => {
    const ctx = getErrorContext(500);
    expect(ctx.type).toBe('http_error');
    expect(ctx.status).toBe(500);
    expect(ctx.message).toBeTruthy();
  });

  test('classifies network Error as network_error', () => {
    const ctx = getErrorContext(new Error('Failed to fetch'));
    expect(ctx.type).toBe('network_error');
    expect(ctx.status).toBeNull();
  });

  test('classifies timeout Error as timeout_error', () => {
    const ctx = getErrorContext(new Error('timeout'));
    expect(ctx.type).toBe('timeout_error');
  });

  test('classifies normal Error as application_error', () => {
    const ctx = getErrorContext(new Error('Something broke'));
    expect(ctx.type).toBe('application_error');
  });

  test('classifies string as string_error', () => {
    const ctx = getErrorContext('error string');
    expect(ctx.type).toBe('string_error');
    expect(ctx.status).toBeNull();
  });

  test('classifies unknown input as unknown', () => {
    const ctx = getErrorContext({});
    expect(ctx.type).toBe('unknown');
  });
});
