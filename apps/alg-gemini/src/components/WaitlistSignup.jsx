import React, { useState } from 'react';

/**
 * WaitlistSignup Component
 *
 * Minimal waitlist signup for Coming Soon mode.
 * Uses Beehiiv Magic Link for subscription (no backend needed).
 *
 * Beehiiv Magic Link:
 * https://magic.beehiiv.com/v1/607214bf-384d-41dc-bc24-ac0c304c62b4
 *
 * UTM Parameters:
 * - utm_source=algorithmlens
 * - utm_medium=waitlist
 * - utm_campaign=coming_soon
 */

const WaitlistSignup = ({ id }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Simple email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);

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

    try {
      // Build Beehiiv Magic Link URL with UTM parameters
      const beehiivBaseUrl = 'https://magic.beehiiv.com/v1/607214bf-384d-41dc-bc24-ac0c304c62b4';
      const params = new URLSearchParams({
        email: email.trim(),
        utm_source: 'algorithmlens',
        utm_medium: 'waitlist',
        utm_campaign: 'coming_soon',
        redirect_url: window.location.href, // Keep user on current page
      });

      const subscriptionUrl = `${beehiivBaseUrl}?${params.toString()}`;

      // Submit to Beehiiv API instead of redirecting
      const response = await fetch(subscriptionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Success - show confirmation message
        setIsSuccess(true);
        setEmail(''); // Clear email field
      } else {
        // Handle error response
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      // Network or other error
      console.error('Waitlist submission error:', err);
      setError('Unable to connect. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full px-4" id={id}>
      {isSuccess ? (
        <div
          className="text-center py-8 px-6 bg-primary-blue/10 border border-primary-blue/30 rounded-2xl"
          role="status"
          aria-live="polite"
        >
          <div className="text-2xl mb-3">✓</div>
          <p className="text-lg font-semibold text-text-main mb-2">
            You're on the AlgorithmLens waitlist.
          </p>
          <p className="text-sm text-text-muted">
            We'll email you when we launch.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <label htmlFor={`waitlist-email-${id}`} className="sr-only">
                Email address for AlgorithmLens waitlist
              </label>
              <input
                id={`waitlist-email-${id}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your email"
                className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full border-2 border-primary-blue/30 bg-bg-page text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 transition-all shadow-sm text-sm sm:text-base"
                disabled={isSubmitting}
                aria-label="Email address for AlgorithmLens waitlist"
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `waitlist-error-${id}` : undefined}
              />
            </div>
            <button
              type="submit"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-primary-blue text-white rounded-full font-bold text-sm sm:text-base shadow-glow hover:shadow-lg hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 whitespace-nowrap w-full sm:w-auto"
              disabled={isSubmitting}
              aria-label="Join the AlgorithmLens waitlist"
            >
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>

          {error && (
            <div
              id={`waitlist-error-${id}`}
              className="mt-4 text-sm text-red-500 text-center font-medium"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WaitlistSignup;
