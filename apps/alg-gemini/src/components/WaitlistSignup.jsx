import React, { useState } from 'react';

/**
 * WaitlistSignup Component
 *
 * Subscribes users to the AlgorithmLens waitlist via Beehiiv Magic Link.
 * Uses browser redirect (no backend, no iframe) for clean subscriber attribution.
 *
 * Beehiiv Magic Link:
 * https://magic.beehiiv.com/v1/607214bf-384d-41dc-bc24-ac0c304c62b4
 *
 * UTM Parameters for segmentation:
 * - utm_source=algorithmlens
 * - utm_medium=waitlist
 * - utm_campaign=coming_soon
 */

const WaitlistSignup = ({ placement = 'default' }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Simple email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Show loading state
    setIsSubmitting(true);

    // Build Beehiiv Magic Link URL with UTM parameters
    const beehiivBaseUrl = 'https://magic.beehiiv.com/v1/607214bf-384d-41dc-bc24-ac0c304c62b4';
    const params = new URLSearchParams({
      email: email.trim(),
      utm_source: 'algorithmlens',
      utm_medium: 'waitlist',
      utm_campaign: 'coming_soon',
    });

    const subscriptionUrl = `${beehiivBaseUrl}?${params.toString()}`;

    // Redirect to Beehiiv Magic Link
    // Beehiiv will handle the subscription and redirect back
    window.location.href = subscriptionUrl;

    // Set success state (will show briefly before redirect)
    setSuccess(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="p-6 rounded-2xl bg-primary-blue/10 border border-primary-blue/30 text-center">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-lg font-semibold text-text-main mb-2">
            You're on the AlgorithmLens waitlist!
          </p>
          <p className="text-sm text-text-muted">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor={`waitlist-email-${placement}`} className="sr-only">
            Email address for AlgorithmLens waitlist
          </label>
          <input
            id={`waitlist-email-${placement}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-full border-2 border-primary-blue/30 bg-bg-page/50 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary-blue transition-colors"
            disabled={isSubmitting}
            aria-label="Email address for AlgorithmLens waitlist"
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `waitlist-error-${placement}` : undefined}
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-primary-blue text-white rounded-full font-bold shadow-glow hover:shadow-lg hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          disabled={isSubmitting}
          aria-label="Join the AlgorithmLens waitlist"
        >
          {isSubmitting ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>

      {error && (
        <div
          id={`waitlist-error-${placement}`}
          className="mt-3 text-sm text-red-500 text-center"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <p className="text-xs text-text-muted mt-3 text-center">
        Be the first to know when AlgorithmLens launches
      </p>
    </div>
  );
};

export default WaitlistSignup;
