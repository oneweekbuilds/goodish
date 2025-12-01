import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY_PROFILE = 'algGeminiUserProfile';
const STORAGE_KEY_ONBOARDING = 'algGeminiOnboardingCompleted';

const UserProfileContext = createContext(undefined);

export const UserProfileProvider = ({ children }) => {
  const [userProfile, setUserProfileState] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState(false);

  // Initial load - client-side only
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Check for profile
      const stored = window.localStorage.getItem(STORAGE_KEY_PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          setUserProfileState(parsed);
        }
      }

      // Check for onboarding completion (either via profile or skip)
      const onboardingCompleted = window.localStorage.getItem(STORAGE_KEY_ONBOARDING) === 'true';
      if (onboardingCompleted || stored) {
        setHasCompletedOnboardingState(true);
      }
    } catch (err) {
      console.error('Failed to read user profile from localStorage', err);
    }
  }, []);

  const setUserProfile = (profile) => {
    setUserProfileState(profile);
    if (typeof window === 'undefined') return;

    try {
      if (profile) {
        window.localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
        // Profile saved means onboarding is complete
        window.localStorage.setItem(STORAGE_KEY_ONBOARDING, 'true');
      } else {
        window.localStorage.removeItem(STORAGE_KEY_PROFILE);
      }
    } catch (err) {
      console.error('Failed to write user profile to localStorage', err);
    }
  };

  const setHasCompletedOnboarding = (value) => {
    setHasCompletedOnboardingState(Boolean(value));
    if (typeof window === 'undefined') return;

    try {
      if (value) {
        // Persist onboarding completion even if no profile is saved (skip case)
        window.localStorage.setItem(STORAGE_KEY_ONBOARDING, 'true');
      } else {
        window.localStorage.removeItem(STORAGE_KEY_ONBOARDING);
      }
    } catch (err) {
      console.error('Failed to write onboarding completion to localStorage', err);
    }
  };

  const value = {
    userProfile,
    setUserProfile,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const ctx = useContext(UserProfileContext);
  if (ctx === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return ctx;
};


