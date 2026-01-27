import React from 'react';

/**
 * ComingSoonBanner Component
 *
 * Thin strip at the very top of the page (above navbar).
 * Shows Coming Soon message with CTA to scroll to first waitlist block.
 */

const ComingSoonBanner = () => {
  const scrollToWaitlist = (e) => {
    e.preventDefault();
    const waitlistBlock = document.getElementById('waitlist');
    if (waitlistBlock) {
      waitlistBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="w-full bg-primary-blue/10 border-b border-primary-blue/20 py-3 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center">
        <p className="text-sm font-medium text-text-main">
          AlgorithmLens is coming soon. Join the waitlist for early access.
        </p>
        <button
          onClick={scrollToWaitlist}
          className="px-4 py-1.5 bg-primary-blue text-white text-sm font-semibold rounded-full hover:shadow-glow transition-all duration-300"
          aria-label="Scroll to waitlist signup"
        >
          Join Waitlist
        </button>
      </div>
    </div>
  );
};

export default ComingSoonBanner;
