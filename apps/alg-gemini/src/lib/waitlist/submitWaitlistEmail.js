const STORAGE_KEY = 'algTalkWaitlist';

const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  // Intentionally simple: enough for client-side UX, not enforcement.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

/**
 * Submit a waitlist email for the Talk tab.
 *
 * For now this validates + stores locally so the UI can be exercised without backend wiring.
 * TODO(beehiiv): Replace localStorage persistence with Beehiiv API submission (keep `source` for segmentation).
 *
 * @param {{ email: string, source: string }} params
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function submitWaitlistEmail({ email, source }) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedSource = typeof source === 'string' ? source.trim() : '';

  if (!normalizedEmail) return { ok: false, error: 'Please enter an email address.' };
  if (!isValidEmail(normalizedEmail)) return { ok: false, error: 'That email doesn’t look quite right.' };
  if (!normalizedSource) return { ok: false, error: 'Missing source.' };

  try {
    const raw = window?.localStorage?.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(existing) ? existing : [];

    const already = list.some((entry) => {
      if (!entry) return false;
      if (typeof entry === 'string') return entry.toLowerCase() === normalizedEmail;
      if (typeof entry === 'object' && typeof entry.email === 'string') {
        return entry.email.toLowerCase() === normalizedEmail;
      }
      return false;
    });

    const next = already
      ? list
      : [
          ...list,
          {
            email: normalizedEmail,
            source: normalizedSource,
            createdAt: new Date().toISOString(),
          },
        ];

    window?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
    return { ok: true };
  } catch (err) {
    // Local persistence failure shouldn't block the optimistic UX.
    console.warn('Failed to store waitlist email locally:', err);
    return { ok: true };
  }
}

