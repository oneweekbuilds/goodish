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
  Scan,
  Brain,
  CreditCard,
  Download,
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

const SUPPORTED_PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'reddit', label: 'Reddit' },
];

const SCAN_DURATIONS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 180, label: '3 minutes' },
];

const STORAGE_KEYS = {
  scanPrefs: 'alg_scan_preferences',
  aiConsent: 'alg_ai_consent',
};

// ============================================
// HELPER: Load/save preferences from localStorage
// ============================================

function loadPreferences() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.scanPrefs);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return {
    defaultDuration: 60,
    preferredPlatforms: ['tiktok', 'instagram'],
    autoSave: true,
  };
}

function savePreferences(prefs) {
  try {
    localStorage.setItem(STORAGE_KEYS.scanPrefs, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

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
  const [preferences, setPreferences] = useState(loadPreferences);
  const [aiConsent, setAiConsent] = useState(loadAiConsent);
  const [planTier, setPlanTier] = useState(() => getStoredPlanTier() || PLAN_TIERS.ANON);
  const [subscriptionStatus, setSubscriptionStatus] = useState(() => getStoredSubscriptionStatus());
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [exportError, setExportError] = useState(null);
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

  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      savePreferences(updated);
      return updated;
    });
  }, []);

  const togglePlatform = useCallback((platformId) => {
    setPreferences(prev => {
      const platforms = prev.preferredPlatforms.includes(platformId)
        ? prev.preferredPlatforms.filter(p => p !== platformId)
        : [...prev.preferredPlatforms, platformId];
      const updated = { ...prev, preferredPlatforms: platforms };
      savePreferences(updated);
      return updated;
    });
  }, []);

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

  // --- Data export ---

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const apiBase = getApiBaseUrl();
      const response = await authenticatedFetch(
        `${apiBase}/api/scans?limit=100`
      );

      if (isUnauthorized(response)) {
        setExportError('Please sign in to export your data.');
        return;
      }

      if (!response.ok) {
        setExportError('Unable to fetch scan data. Please try again.');
        return;
      }

      const data = await response.json();
      const scans = data.scans || [];

      if (scans.length === 0) {
        setExportError('No scan data found to export.');
        return;
      }

      let content;
      let mimeType;
      let extension;

      if (exportFormat === 'json') {
        content = JSON.stringify(scans, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // CSV export
        const headers = ['id', 'platform', 'created_at', 'status', 'total_items', 'ad_percentage'];
        const rows = scans.map(s => [
          s.id,
          s.platform,
          s.created_at,
          s.status,
          s.total_items || '',
          s.ad_percentage || '',
        ]);
        content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      }

      // Trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `algorithmlens-scans-${new Date().toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError('Export failed. Please check your connection and try again.');
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat]);

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

          {/* ===== SCAN PREFERENCES ===== */}
          <SettingsSection icon={Scan} title="Scan Preferences" description="Configure your default scan settings">
            {/* Default duration */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Default scan duration
              </label>
              <div className="flex flex-wrap gap-2">
                {SCAN_DURATIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => updatePreference('defaultDuration', d.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      preferences.defaultDuration === d.value
                        ? 'bg-primary-blue text-white'
                        : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred platforms */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Preferred platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      preferences.preferredPlatforms.includes(p.id)
                        ? 'bg-primary-blue/10 text-primary-blue border border-primary-blue/30'
                        : 'bg-gray-100 text-text-muted hover:bg-gray-200 border border-transparent'
                    }`}
                  >
                    {preferences.preferredPlatforms.includes(p.id) && (
                      <Check size={12} className="inline mr-1" />
                    )}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-save */}
            <SettingsRow
              label="Auto-save scan results"
              action={
                <Toggle
                  enabled={preferences.autoSave}
                  onChange={(v) => updatePreference('autoSave', v)}
                  label="Toggle auto-save"
                />
              }
            />
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

          {/* ===== DATA EXPORT ===== */}
          <SettingsSection
            icon={Download}
            title="Data Export"
            description="Download your scan data"
          >
            <div className="space-y-3">
              {/* Format selector */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-2">
                  Export format
                </label>
                <div className="flex gap-2">
                  {['json', 'csv'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        exportFormat === fmt
                          ? 'bg-primary-blue text-white'
                          : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-green text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export scan data ({exportFormat.toUpperCase()})
                  </>
                )}
              </button>

              {exportError && (
                <p className="text-sm text-status-error flex items-center gap-1">
                  <AlertCircle size={14} />
                  {exportError}
                </p>
              )}

              <p className="text-xs text-text-muted">
                Exports all your scan summaries. Individual feed items are not included for privacy.
              </p>
            </div>
          </SettingsSection>

          {/* About / legal links */}
          <div className="text-center py-4 space-y-2">
            <p className="text-xs text-text-muted">
              AlgorithmLens — built by Goodish to increase human agency
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
              <a href="mailto:legal@algorithmlens.com?subject=Privacy%20Policy%20Inquiry" className="hover:text-primary-blue transition-colors">Privacy Policy</a>
              <span>·</span>
              <a href="mailto:legal@algorithmlens.com?subject=Terms%20of%20Service%20Inquiry" className="hover:text-primary-blue transition-colors">Terms of Service</a>
              <span>·</span>
              <a href="mailto:support@algorithmlens.com" className="hover:text-primary-blue transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
