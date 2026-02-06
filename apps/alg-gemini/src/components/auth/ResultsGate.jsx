import React, { useState, useEffect } from 'react';
import { Lock, Mail, Check } from 'lucide-react';

/**
 * ResultsGate - Email capture gate for anonymous users
 *
 * Shows when:
 * - User is anonymous (planTier === 'anon')
 * - Results are ready (scans loaded, not in error state)
 * - NOT in demo mode
 *
 * Props:
 * - onEmailSubmit: callback(email) when user submits email
 */
const ResultsGate = ({ onEmailSubmit }) => {
  const [email, setEmail] = useState('');
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for pending email in localStorage on mount
  useEffect(() => {
    try {
      const pendingEmail = localStorage.getItem('alg_pending_email');
      if (pendingEmail) {
        setEmail(pendingEmail);
        setIsSubmitted(true);
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

    setIsSubmitting(true);

    // Store email in localStorage
    try {
      localStorage.setItem('alg_pending_email', email);
      if (wantsUpdates) {
        localStorage.setItem('alg_wants_updates', 'true');
      }
    } catch (err) {
      // localStorage unavailable - continue anyway
    }

    // Call parent callback (for future magic link logic)
    if (onEmailSubmit) {
      await onEmailSubmit({ email, wantsUpdates });
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {!isSubmitted ? (
          // Email entry form
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/60 focus:border-primary-blue transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              {/* Optional updates checkbox */}
              <div className="flex items-start gap-3">
                <input
                  id="updates"
                  type="checkbox"
                  checked={wantsUpdates}
                  onChange={(e) => setWantsUpdates(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary-blue border-slate-300 rounded focus:ring-2 focus:ring-primary-blue/60"
                  disabled={isSubmitting}
                />
                <label htmlFor="updates" className="text-sm text-slate-600">
                  Send me occasional product updates (optional)
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full py-3 px-6 bg-primary-blue text-white rounded-full font-semibold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2"
              >
                {isSubmitting ? 'Submitting...' : 'View my results'}
              </button>
            </form>

            {/* Privacy line */}
            <p className="text-xs text-slate-500 text-center mt-6 leading-relaxed">
              We only use your email to give you access to your results. We respect your privacy.
            </p>
          </div>
        ) : (
          // Confirmation state (truthful, no false claims)
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
                Next, we'll email you a sign-in link to view your results.
              </p>
              <p className="text-sm text-slate-500">
                Sent to: <span className="font-medium text-slate-700">{email}</span>
              </p>
            </div>

            {/* Checkmark indicator */}
            <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Check size={16} className="text-emerald-600" />
              <span>Email saved</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsGate;
