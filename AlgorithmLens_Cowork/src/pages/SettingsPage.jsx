/**
 * SettingsPage - User settings and profile management
 *
 * Matches the mobile app's settings scope:
 * - Account Info: email, creation date, current plan
 * - Scan Preferences: default duration, preferred platforms, auto-save
 * - AI Analysis: consent toggle with epistemic restraint explanation
 * - Plan Management: current plan, upgrade/downgrade CTA, billing portal
 * - Data Export: export scan data as JSON or CSV
 *
 * Equalization Tracker: Main Site → P3 → Settings Page
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings,
  User,

  Brain,
  CreditCard,
  ChevronRight,
  Check,
  AlertCircle,
  ExternalLink,
  Shield,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAuth } from '../lib/auth/useAuth';
import { authenticatedFetch, isUnauthorized } from '../lib/api/authenticatedFetch';
import { getApiBaseUrl, isDemoMode as checkDemoMode } from '../lib/apiConfig';
import { getStoredPlanTier, PLAN_TIERS, getStoredSubscriptionStatus } from '../lib/plan/planTier';
import { PRICING } from '../lib/plan/pricingConfig';
import SEO from '../components/SEO';

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEYS = {
  aiConsent: 'alg_ai_consent',
};

// ============================================
// HELPER: Load/save preferences from localStorage
// ============================================

function loadAiConsent() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.aiConsent);
    if (stored !== null) return stored === 'true';
  } catch {
    // ignore
  }
  return true; // default: enabled
}

function saveAiConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEYS.aiConsent, String(value));
  } catch {
    // ignore
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

/** Section wrapper with title and icon */
function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-card border border-border-light overflow-hidden">
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border-light/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-primary-blue" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-main">{title}</h2>
            {description && (
              <p className="text-sm text-text-muted mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4">
        {children}
      </div>
    </section>
  );
}

/** Row with label and value */
function SettingsRow({ label, value, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2 ${className}`}>
      <span className="text-sm font-medium text-text-main">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-text-muted">{value}</span>}
        {action}
      </div>
    </div>
  );
}

/** Toggle switch */
function Toggle({ enabled, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 ${
        enabled ? 'bg-primary-blue' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SettingsPage() {
  const { session, user, authReady, signOut } = useAuth();
  const navigate = useNavigate();
  const isDemoMode = checkDemoMode();

  // State
  const [aiConsent, setAiConsent] = useState(loadAiConsent);
  const [planTier, setPlanTier] = useState(() => getStoredPlanTier() || PLAN_TIERS.ANON);
  const [subscriptionStatus, setSubscriptionStatus] = useState(() => getStoredSubscriptionStatus());
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState(null);

  // Sync plan tier on auth changes
  useEffect(() => {
    if (authReady) {
      setPlanTier(getStoredPlanTier() || PLAN_TIERS.ANON);
      setSubscriptionStatus(getStoredSubscriptionStatus());
    }
  }, [authReady, session]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (authReady && !session && !isDemoMode) {
      navigate('/dashboard', { replace: true });
    }
  }, [authReady, session, isDemoMode, navigate]);

  // --- Preference handlers ---

  const handleAiConsentChange = useCallback((value) => {
    setAiConsent(value);
    saveAiConsent(value);
  }, []);

  // --- Billing portal ---

  const openBillingPortal = useCallback(async () => {
    if (isDemoMode) {
      setPortalError('Subscription management is not available in demo mode.');
      return;
    }

    setIsPortalLoading(true);
    setPortalError(null);

    try {
      const apiBase = getApiBaseUrl();
      const response = await authenticatedFetch(`${apiBase}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings`,
        }),
      });

      if (isUnauthorized(response)) {
        navigate('/dashboard');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setPortalError(errorData.detail || 'Unable to open billing portal. Please try again.');
        return;
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setPortalError('Unable to reach billing portal. Please check your connection.');
    } finally {
      setIsPortalLoading(false);
    }
  }, [isDemoMode, navigate]);

  // --- Sign out ---

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  // --- Derived ---

  const isPlus = planTier === PLAN_TIERS.PLUS;
  const isFree = planTier === PLAN_TIERS.FREE;
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <>
      <SEO path="/settings" />
      <div className="min-h-screen bg-bg-page pt-20 md:pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Page header */}
          <div className="flex items-center gap-3 mb-2">
            <Settings size={24} className="text-primary-blue" />
            <h1 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight-heading">
              Settings
            </h1>
          </div>

          {/* ===== ACCOUNT INFO ===== */}
          <SettingsSection icon={User} title="Account" description="Your account information">
            <SettingsRow
              label="Email"
              value={user?.email || 'Not signed in'}
            />
            {createdAt && (
              <SettingsRow
                label="Member since"
                value={createdAt}
              />
            )}
            <SettingsRow
              label="Current plan"
              value={
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isPlus
                    ? 'bg-primary-blue/10 text-primary-blue'
                    : 'bg-gray-100 text-text-muted'
                }`}>
                  {isPlus && <Check size={12} />}
                  {isPlus ? 'Plus' : isFree ? 'Free' : 'Anonymous'}
                </span>
              }
            />
            <div className="pt-2 border-t border-border-light/50">
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-text-muted hover:text-status-error transition-colors"
              >
                Sign out
              </button>
            </div>
          </SettingsSection>

          {/* ===== AI ANALYSIS ===== */}
          <SettingsSection
            icon={Brain}
            title="AI Analysis"
            description="Control how AI processes your scan data"
          >
            <SettingsRow
              label="Enable AI analysis"
              action={
                <Toggle
                  enabled={aiConsent}
                  onChange={handleAiConsentChange}
                  label="Toggle AI analysis consent"
                />
              }
            />

            {/* Epistemic restraint explanation */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Shield size={16} className="text-primary-blue mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm text-text-main font-medium">
                    What AI analysis does
                  </p>
                  <p className="text-sm text-text-muted leading-relaxed">
                    AlgorithmLens uses Google Gemini to analyze political content and emotional
                    tone in your feed. This powers the Politics and Tone tabs on your dashboard.
                  </p>
                  <p className="text-sm text-text-main font-medium mt-3">
                    What it does not do
                  </p>
                  <ul className="text-sm text-text-muted space-y-1 leading-relaxed">
                    <li>• Your data is not used to train AI models</li>
                    <li>• Analysis results are observational, not definitive claims</li>
                    <li>• AI classification has inherent limitations — results reflect what the model detected, which may not capture the full context of your feed</li>
                    <li>• Disabling this only affects AI-powered tabs; basic metrics still work</li>
                  </ul>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* ===== PLAN MANAGEMENT ===== */}
          <SettingsSection
            icon={CreditCard}
            title="Plan Management"
            description="Manage your subscription and billing"
          >
            {/* Current plan display */}
            {isPlus ? (
              <div className="bg-primary-blue/5 rounded-xl p-4 border border-primary-blue/20">
                <div className="flex items-center gap-2 mb-1">
                  <Check size={16} className="text-primary-blue" />
                  <span className="text-sm font-semibold text-primary-blue">AlgorithmLens Plus</span>
                </div>
                <p className="text-sm text-text-muted">
                  You have access to longitudinal trend analysis and all premium features.
                </p>
                {subscriptionStatus === 'trialing' && (
                  <p className="text-xs text-text-muted mt-1">
                    You're on a free trial
                  </p>
                )}
                {subscriptionStatus === 'past_due' && (
                  <p className="text-xs text-status-error mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Payment past due — please update your billing information
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 border border-border-light">
                <p className="text-sm font-semibold text-text-main mb-1">Free Plan</p>
                <p className="text-sm text-text-muted mb-3">
                  Upgrade to Plus for longitudinal trend analysis across all 6 dashboard tabs.
                </p>
                <Link
                  to="/plus"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Plus — {PRICING.monthly.label}
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}

            {/* Billing portal link */}
            {isPlus && (
              <div className="pt-2">
                <button
                  onClick={openBillingPortal}
                  disabled={isPortalLoading}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-blue hover:text-blue-700 transition-colors disabled:opacity-50"
                >
                  {isPortalLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-blue/30 border-t-primary-blue rounded-full animate-spin" />
                      Opening portal...
                    </span>
                  ) : (
                    <>
                      <ExternalLink size={14} />
                      Manage billing in Stripe
                    </>
                  )}
                </button>
                {portalError && (
                  <p className="text-xs text-status-error mt-1">{portalError}</p>
                )}
              </div>
            )}
          </SettingsSection>

          {/* About / legal links */}
          <div className="text-center py-4 space-y-2">
            <p className="text-xs text-text-muted">
              AlgorithmLens — built by Goodish to increase human agency
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
              <Link to="/privacy" className="hover:text-primary-blue transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-primary-blue transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
