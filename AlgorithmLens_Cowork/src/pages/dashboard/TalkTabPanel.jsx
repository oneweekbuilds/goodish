import React, { useState } from 'react';
import { MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { submitWaitlistEmail } from '../../lib/waitlist/submitWaitlistEmail';
import { THEME, SURFACES } from './dashboardConstants';

/**
 * TalkTabPanel - Waitlist signup for "Talk to your algorithm" feature
 */
const TalkTabPanel = () => {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | submitting | success
  const [message, setMessage] = useState(null);

  const emailTrimmed = email.trim();
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const emailError = touched && !emailTrimmed
    ? 'Please enter an email address.'
    : touched && !emailLooksValid
      ? "That email doesn't look quite right."
      : null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setMessage(null);

    if (!emailTrimmed || !emailLooksValid) return;

    setStatus('submitting');
    const result = await submitWaitlistEmail({ email: emailTrimmed, source: 'talk_tab_waitlist' });
    if (result?.ok) {
      setStatus('success');
      setMessage("Thanks, you're on the list.");
      return;
    }

    setStatus('idle');
    setMessage(result?.error || 'Something went wrong. Please try again.');
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* FIX T2: Reduced padding and softened green treatment for more subtle, premium feel */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(236, 253, 245, 0.5)',
          border: '1px solid rgba(167, 243, 208, 0.4)',
          boxShadow: '0 2px 12px rgba(16, 185, 129, 0.06)',
          padding: 'clamp(1.5rem, 4vw, 2rem)',
        }}
      >
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Talk to your algorithm (coming soon)
          </h2>
        </div>

        <div className="space-y-4 mb-8" style={{ maxWidth: '720px' }}>
          <p className="text-slate-700 leading-relaxed">
            Ever wish you could ask your algorithm why it showed you what it showed you? This feature will let you ask questions about patterns in your feed using your scans as context. Join the waitlist to get access when it launches.
          </p>
        </div>

        <div
          className="mt-10 rounded-2xl"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            padding: 'clamp(1.5rem, 3vw, 2rem)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
        >
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="w-full sm:flex-1">
              <input
                id="talk-waitlist-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                disabled={status === 'success'}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="you@domain.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: status === 'success' ? '#F8FAFC' : '#FFFFFF',
                  border: emailError ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid rgba(148, 163, 184, 0.35)',
                  boxShadow: emailError ? '0 0 0 3px rgba(244, 63, 94, 0.06)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
              />
              <div className="mt-2 min-h-[18px]">
                {emailError ? (
                  <p className="text-xs" style={{ color: 'rgba(225, 29, 72, 0.85)' }}>
                    {emailError}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    We will email you when it is ready.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all w-full sm:w-auto hover:shadow-md"
              style={{
                background: status === 'success' ? 'rgba(16, 185, 129, 0.12)' : '#10B981',
                color: status === 'success' ? 'rgba(5, 150, 105, 0.95)' : '#FFFFFF',
                border: status === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : 'none',
                opacity: status === 'submitting' ? 0.9 : 1,
                height: '42px', // Match input height
              }}
            >
              {status === 'success' ? "You're on the list" : status === 'submitting' ? 'Saving…' : 'Join waitlist'}
            </button>
          </form>

          {message && (
            <div className="mt-4">
              <p
                className="text-sm"
                style={{
                  color: status === 'success' ? 'rgba(5, 150, 105, 0.95)' : 'rgba(225, 29, 72, 0.85)',
                }}
              >
                {message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalkTabPanel;
