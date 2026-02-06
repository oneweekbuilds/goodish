import React, { useState, useEffect } from 'react';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth/useAuth';
import { track, extractEmailDomain, EVENTS } from '../../lib/analytics';

/**
 * ResultsGate - Email capture gate for anonymous users
 *
 * Shows when:
 * - User is anonymous (planTier === 'anon')
 * - Results are ready (scans loaded, not in error state)
 * - NOT in demo mode
 *
 * States:
 * - idle: email entry form
 * - sending: sending magic link
 * - sent: confirmation (email sent successfully)
 * - error: show error, allow retry
 *
 * Props:
 * - scanCount: number of scans (for analytics)
 */
const ResultsGate = ({ scanCount = 0 }) => {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState(null);

  // Check for pending email in localStorage on mount
  useEffect(() => {
    try {
      const pendingEmail = localStorage.getItem('alg_pending_email');
      if (pendingEmail) {
        setEmail(pendingEmail);
      }
    } catch (err) {
      // localStorage unavailable - continue without pre-filling
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      return; // Basic validation
    }

    setState('sending');
    setError(null);

    // Track email submission (before sending link)
    const emailDomain = extractEmailDomain(email);
    track(EVENTS.EMAIL_SUBMITTED, {
      emailDomain,
      scanCount,
    });

    // Store email in localStorage
    try {
      localStorage.setItem('alg_pending_email', email);
    } catch (err) {
      // localStorage unavailable - continue anyway
    }

    // Send magic link via Supabase
    const { error: magicLinkError } = await sendMagicLink(email);

    if (magicLinkError) {
      setState('error');
      setError(magicLinkError.message || 'Failed to send sign-in link');
      return;
    }

    // Track successful magic link send
    track(EVENTS.MAGIC_LINK_SENT, {
      emailDomain,
      redirectTo: '/auth/callback',
      scanCount,
    });

    // Success
    setState('sent');
  };

  const handleRetry = () => {
    setState('idle');
    setError(null);
  };

  if (state === 'sent') {
    // Confirmation state (truthful - email was sent)
    return (
      <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
            {/* Success icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Mail size={32} className="text-emerald-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-3">
              Check your email
            </h1>

            {/* Body - truthful messaging */}
            <div className="text-slate-600 text-center space-y-3">
              <p className="leading-relaxed">
                We sent you a sign-in link to view your results.
              </p>
              <p className="text-sm text-slate-500">
                Sent to: <span className="font-medium text-slate-700">{email}</span>
              </p>
              <p className="text-xs text-slate-500 mt-4">
                The link may take a minute to arrive.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    // Error state
    return (
      <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
            {/* Error icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-3">
              Something went wrong
            </h1>

            {/* Error message */}
            <p className="text-slate-600 text-center mb-6 leading-relaxed">
              {error}
            </p>

            {/* Retry button */}
            <button
              onClick={handleRetry}
              className="w-full py-3 px-6 bg-primary-blue text-white rounded-full font-semibold text-base hover:bg-blue-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Email entry form (idle or sending)
  return (
    <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-blue/10 flex items-center justify-center">
              <Lock size={32} className="text-primary-blue" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-3">
            Your analysis is ready
          </h1>

          {/* Body */}
          <p className="text-slate-600 text-center mb-6 leading-relaxed">
            Enter your email to view your results and save this scan.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={state === 'sending'}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/60 focus:border-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={state === 'sending' || !email}
              className="w-full py-3 px-6 bg-primary-blue text-white rounded-full font-semibold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2"
            >
              {state === 'sending' ? 'Sending sign-in link...' : 'View my results'}
            </button>

            {/* Email consent note */}
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              We will email you your sign-in link and occasional product updates. No spam, unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResultsGate;
