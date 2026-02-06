import React, { useState } from 'react';
import { LogIn, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { track, EVENTS } from '../../lib/analytics';

/**
 * SignInPrompt - Reusable component for signed-out states
 *
 * Shows a calm prompt to sign in with magic link flow.
 * Used across dashboard, upload pages, and processing pages.
 *
 * @param {Object} props
 * @param {string} props.title - Title text (e.g., "Sign in to view your results")
 * @param {string} props.body - Body text explaining why sign-in is needed
 * @param {string} props.source - Analytics source for tracking (e.g., "dashboard_401", "upload_401")
 * @param {Function} props.onBack - Optional callback for "Back" or secondary action
 * @param {string} props.backLabel - Label for back button (default: "Back to home")
 */
export default function SignInPrompt({
  title = 'Sign in to continue',
  body = 'Your scans are saved to your account. Sign in to access them.',
  source = 'generic_signin_prompt',
  onBack = null,
  backLabel = 'Back to home'
}) {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [showEmailInput, setShowEmailInput] = useState(false);

  // Check if demo mode
  const isDemoMode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('demo') === '1'
    : false;

  const handleSendMagicLink = async (e) => {
    e.preventDefault();

    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setSending(true);
    setError(null);

    // Track magic link requested (skip in demo mode)
    if (!isDemoMode) {
      track(EVENTS.MAGIC_LINK_REQUESTED, {
        source,
        email: email,
      });
    }

    // Send magic link
    const result = await sendMagicLink(email);

    if (result.error) {
      setError('Could not send sign-in link. Please try again.');
      setSending(false);
    } else {
      setSent(true);
      setSending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] py-12 px-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-blue/10 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-primary-blue" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-text-main text-center mb-3">
          {title}
        </h2>

        {/* Body */}
        <p className="text-text-muted text-center mb-8">
          {body}
        </p>

        {/* Email input (conditional) */}
        {!showEmailInput && !sent && (
          <div className="space-y-3">
            <button
              onClick={() => setShowEmailInput(true)}
              className="w-full py-3 px-6 bg-primary-blue text-white font-semibold rounded-lg hover:bg-primary-blue/90 transition-colors flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              Send me a sign-in link
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="w-full py-3 px-6 text-text-muted hover:text-text-main transition-colors"
              >
                {backLabel}
              </button>
            )}
          </div>
        )}

        {showEmailInput && !sent && (
          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-main mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={sending}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 px-6 bg-primary-blue text-white font-semibold rounded-lg hover:bg-primary-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? 'Sending...' : 'Send sign-in link'}
              {!sending && <ArrowRight size={20} />}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowEmailInput(false);
                setError(null);
              }}
              className="w-full py-2 text-text-muted hover:text-text-main transition-colors text-sm"
            >
              Cancel
            </button>
          </form>
        )}

        {sent && (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-1">Check your email</p>
              <p className="text-green-700 text-sm">
                We sent a sign-in link to <strong>{email}</strong>
              </p>
            </div>
            <p className="text-sm text-text-muted">
              Click the link in your email to sign in. You can close this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
