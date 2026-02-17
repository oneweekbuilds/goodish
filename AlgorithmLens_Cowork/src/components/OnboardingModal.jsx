import React, { useState, useEffect, useRef } from 'react';
import { useUserProfile } from '../context/UserProfileContext';

const FOCUS_OPTIONS = ['TikTok', 'Instagram', 'YouTube', 'My ads', 'Everything'];

const OnboardingModal = () => {
  const { setUserProfile, setHasCompletedOnboarding } = useUserProfile();
  const [name, setName] = useState('');
  const [focus, setFocus] = useState('');
  const [customFocus, setCustomFocus] = useState('');
  const [error, setError] = useState('');
  const firstInputRef = useRef(null);
  const modalRef = useRef(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Focus management: Focus on first input when modal opens
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a name or tap Skip for now.');
      return;
    }

    const profile = {
      name: name.trim(),
      focus: focus || customFocus.trim() || '',
    };

    setUserProfile(profile);
    setHasCompletedOnboarding(true);
  };

  const handleSkip = () => {
    setHasCompletedOnboarding(true);
  };

  const handleFocusSelect = (option) => {
    setFocus(option);
    setCustomFocus('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
        aria-label="Close onboarding"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to AlgorithmLens"
        className="relative bg-white rounded-xl shadow-lg max-w-md w-full p-6 z-10"
      >
        {/* Title */}
        <h2 className="text-2xl font-bold text-text-main mb-2">
          Welcome to AlgorithmLens
        </h2>

        {/* Body */}
        <p className="text-text-muted mb-6">
          To personalize your experience, tell us what to call you and what you most want to understand about your feed.
        </p>

        {/* Name Input */}
        <div className="mb-6">
          <label htmlFor="onboarding-name" className="block text-sm font-medium text-text-main mb-2">
            What should we call you?
          </label>
          <input
            ref={firstInputRef}
            id="onboarding-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Enter your name"
            className="w-full px-4 py-2.5 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-text-main"
          />
          {error && (
            <p className="mt-2 text-sm text-status-error">{error}</p>
          )}
        </div>

        {/* Focus Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-main mb-3">
            What are you most curious about?
          </label>
          
          {/* Quick Options */}
          <div className="flex flex-wrap gap-2 mb-3">
            {FOCUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleFocusSelect(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  focus === option
                    ? 'bg-primary-blue text-white'
                    : 'bg-primary-blue/5 text-text-main hover:bg-primary-blue/10'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <input
            type="text"
            value={customFocus}
            onChange={(e) => {
              setCustomFocus(e.target.value);
              setFocus('');
            }}
            placeholder="Or type something else..."
            className="w-full px-4 py-2.5 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-text-main"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2.5 text-text-muted font-medium rounded-lg hover:bg-primary-blue/5 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-primary-blue text-white font-semibold rounded-lg hover:bg-primary-blue/90 transition-colors"
          >
            Save and continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;




