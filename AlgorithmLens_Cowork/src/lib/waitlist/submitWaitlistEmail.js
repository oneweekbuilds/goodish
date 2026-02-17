import { logError } from '../errorLogger.js';

const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  // Intentionally simple: enough for client-side UX, not enforcement.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

/**
 * Submit a waitlist email for the Talk tab.
 *
 * Sends to the /api/subscribe endpoint which proxies to Beehiiv API v2.
 * The `source` param is passed as utm_campaign for segmentation.
 *
 * @param {{ email: string, source: string }} params
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function submitWaitlistEmail({ email, source }) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedSource = typeof source === 'string' ? source.trim() : '';

  if (!normalizedEmail) return { ok: false, error: 'Please enter an email address.' };
  if (!isValidEmail(normalizedEmail)) return { ok: false, error: 'That email doesn\'t look quite right.' };
  if (!normalizedSource) return { ok: false, error: 'Missing source.' };

  try {
    // Public endpoint — no auth required
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      return { ok: true };
    }

    // Return user-friendly error, not raw API details
    return { ok: false, error: data.error === 'beehiiv_error'
      ? 'Something went wrong. Please try again.'
      : (data.error || 'Something went wrong. Please try again.')
    };
  } catch (err) {
    logError('submitWaitlistEmail', 'Waitlist submission failed:', err);
    return { ok: false, error: 'Unable to connect. Please try again.' };
  }
}
