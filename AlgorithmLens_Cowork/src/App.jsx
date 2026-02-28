import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Logo from './components/Logo';
import HeroSection from './components/Hero/HeroSection';
import SectionTracking from './components/Sections/SectionTracking';
import LabelsPreviewSection from './components/Sections/LabelsPreviewSection';
import SectionLoop from './components/Sections/SectionLoop';
import HeroDashboardPreview from './components/Hero/HeroDashboardPreview';
import HowItWorksSection from './components/Sections/HowItWorksSection';
import TwoWaysSection from './components/Sections/TwoWaysSection';
// import SocialProofSection from './components/Sections/SocialProofSection'; // Removed: contained unverified claims
import SEO from './components/SEO';

// Static imports for landing page (always needed)
// PricingPage removed — /pricing now redirects to /plus
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './lib/auth';
import { PaywallProvider } from './lib/plan/PaywallProvider';
import { isComingSoon } from './config/comingSoon';
import ComingSoonBanner from './components/ComingSoonBanner';
import WaitlistSignup from './components/WaitlistSignup';
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Lazy-loaded page components
const StartPage = React.lazy(() => import('./pages/StartPage'));
const ScanPlatformPage = React.lazy(() => import('./pages/ScanPlatformPage'));
const ProcessingPage = React.lazy(() => import('./pages/ProcessingPage'));
const ResultsPage = React.lazy(() => import('./pages/ResultsPage'));
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const PlusPage = React.lazy(() => import('./pages/plus/PlusPage'));
const ScanTestPage = React.lazy(() => import('./pages/ScanTestPage'));
const ScanPage = React.lazy(() => import('./pages/ScanPage'));
const ScanHistoryPage = React.lazy(() => import('./pages/ScanHistoryPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const EventsDebugPage = React.lazy(() => import('./pages/dev/EventsDebugPage'));
const EntitlementsDebugPage = React.lazy(() => import('./pages/dev/EntitlementsDebugPage'));
const AuthCallbackPage = React.lazy(() => import('./pages/auth/AuthCallbackPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-bg-page">
      <div className="space-y-4 w-64">
        <div className="h-4 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

function App() {
  const comingSoonMode = isComingSoon();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);

  // Route guard: Block direct URL access to gated routes when Coming Soon mode is enabled
  useEffect(() => {
    let timeoutId;
    if (comingSoonMode && location.pathname !== '/') {
      const isGated = [
        '/dashboard',
        '/start',
        '/scan',
        '/history',
        '/plus',
        '/settings',
      ].some(route => location.pathname.startsWith(route));

      if (isGated) {
        navigate('/', { replace: true });
        setShowRedirectMessage(true);
        // (Audit 8 M7) Store timeout ID for cleanup to prevent memory leak
        timeoutId = setTimeout(() => setShowRedirectMessage(false), 5000);
      }
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [location.pathname, comingSoonMode, navigate]);

  return (
    <AuthProvider>
      <PaywallProvider>
        <ToastProvider>
          <div className="min-h-[100dvh] bg-bg-page font-sans text-text-main selection:bg-primary-blue/20">
            {/* Skip to content link - visible on focus for keyboard navigation */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-blue focus:text-white focus:rounded-lg"
            >
              Skip to main content
            </a>

            {/* Coming Soon Banner */}
            {comingSoonMode && <ComingSoonBanner />}

            {/* Redirect Message */}
            {showRedirectMessage && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
                <div className="bg-primary-blue/10 border border-primary-blue/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-text-main font-medium flex-1">
                      AlgorithmLens is coming soon. Join the waitlist.
                    </p>
                    <button
                      onClick={() => setShowRedirectMessage(false)}
                      className="text-text-muted hover:text-text-main transition-colors"
                      aria-label="Dismiss message"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Navbar />

            <main id="main-content">
              <ErrorBoundary fallbackTitle="Something went wrong" fallbackMessage="An error occurred while loading this page. Please try refreshing.">
                <Suspense fallback={<LoadingFallback />}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={location.pathname}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Routes>
                      {/* HOME ROUTE */}
                      <Route
                        path="/"
                        element={
                          <>
                            <SEO path="/" />
                            <HeroSection />

                            {/* Waitlist Block #1 (Coming Soon mode only) */}
                            {comingSoonMode && (
                              <section className="py-12 sm:py-20 bg-bg-page">
                                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                                  {/* #18: Fixed h3 → h2 for proper heading hierarchy */}
                                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-main mb-3">
                                    Join the Waitlist
                                  </h2>
                                  <p className="text-base sm:text-lg text-text-muted mb-8 sm:mb-10 px-2">
                                    Get early access when AlgorithmLens launches
                                  </p>
                                  <WaitlistSignup id="waitlist" />
                                </div>
                              </section>
                            )}

                            {/* <SocialProofSection /> — Removed: contained unverified claims */}
                            <SectionTracking />
                            <LabelsPreviewSection />
                            <SectionLoop />
                            <HeroDashboardPreview />
                            <HowItWorksSection />
                            <TwoWaysSection />

                            {/* Waitlist Block #2 - Differentiated messaging (#10.3) */}
                            {comingSoonMode && (
                              <section className="py-12 sm:py-20 bg-bg-page/50">
                                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-main mb-3">
                                    Be the First to Know
                                  </h2>
                                  <p className="text-base sm:text-lg text-text-muted mb-8 sm:mb-10 px-2">
                                    Sign up now and we'll notify you on launch day
                                  </p>
                                  <WaitlistSignup id="waitlist-footer" />
                                </div>
                              </section>
                            )}

                            {!comingSoonMode && (
                              <section className="py-12 sm:py-26 mt-12 sm:mt-20 bg-bg-page text-center">
                                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-6 sm:mb-8">
                                    Ready to see what the algorithm sees?
                                  </h2>
                                  <p className="text-base sm:text-lg text-text-muted mb-8 sm:mb-12 max-w-xl mx-auto px-2">
                                    Scan your feed and get your AlgorithmLens dashboard in minutes.
                                  </p>
                                  <Link
                                    to="/start"
                                    className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-primary-blue text-white rounded-full font-bold text-base sm:text-lg shadow-glow hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                  >
                                    Start a Scan
                                  </Link>
                                </div>
                              </section>
                            )}
                          </>
                        }
                      />

                      {/* PRICING REDIRECT */}
                      <Route path="/pricing" element={<Navigate to="/plus" replace />} />

                      {/* SCAN FLOW ROUTES */}
                      <Route path="/start" element={<StartPage />} />
                      <Route path="/scan/platform/:platform" element={<ScanPlatformPage />} />
                      <Route path="/scan/processing" element={<ProcessingPage />} />
                      <Route path="/scan/results/:scanId" element={<ResultsPage />} />
                      <Route path="/history" element={<HistoryPage />} />

                      {/* Dashboard */}
                      <Route path="/dashboard" element={<DashboardPage />} />

                      {/* Plus page */}
                      <Route path="/plus" element={<PlusPage />} />

                      {/* Settings */}
                      <Route path="/settings" element={<SettingsPage />} />

                      {/* AUTH ROUTES */}
                      <Route path="/auth/callback" element={<AuthCallbackPage />} />

                      {/* LEGACY ROUTES */}
                      <Route path="/scan" element={<ScanPage />} />
                      <Route path="/scan-history" element={<ScanHistoryPage />} />
                      <Route path="/scan-test" element={<ScanTestPage />} />

                      {/* DEV ROUTES */}
                      <Route path="/dev/events" element={<EventsDebugPage />} />
                      <Route path="/dev/entitlements" element={<EntitlementsDebugPage />} />

                      {/* LEGAL ROUTES */}
                      <Route path="/privacy" element={<PrivacyPage />} />
                      <Route path="/terms" element={<TermsPage />} />

                      {/* #4: 404 catch-all route */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                    </motion.div>
                  </AnimatePresence>
                </Suspense>
              </ErrorBoundary>
            </main>

            {/* #17: Enhanced footer with refined styling */}
            <footer className="py-16 bg-bg-page">
              {/* Subtle gradient divider replacing hard border */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 sm:gap-8">
                  <div className="flex flex-col gap-2">
                    <Logo variant="footer" />
                    <p className="text-sm font-medium text-text-muted max-w-xs">
                      Understand what appears in your social media feed. Built at MIT.
                    </p>
                  </div>

                  {/* (Audit 8 H5) Added nav landmark for footer navigation */}
                  <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-8 sm:gap-x-12 gap-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-text-main mb-3">Product</h3>
                      <ul className="space-y-2">
                        <li><Link to="/start" className="text-sm text-text-muted hover:text-primary-blue transition-colors">Start a Scan</Link></li>
                        <li><Link to="/dashboard" className="text-sm text-text-muted hover:text-primary-blue transition-colors">Dashboard</Link></li>
                        <li><Link to="/plus" className="text-sm text-text-muted hover:text-primary-blue transition-colors">Plus</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-main mb-3">Legal</h3>
                      <ul className="space-y-2">
                        <li><Link to="/privacy" className="text-sm text-text-muted hover:text-primary-blue transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="text-sm text-text-muted hover:text-primary-blue transition-colors">Terms of Service</Link></li>
                      </ul>
                    </div>
                  </nav>
                </div>

                <div className="mt-10 pt-6 border-t border-border-light/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-xs text-text-muted">
                    © 2026 AlgorithmLens. All rights reserved.
                  </p>
                  <p className="text-sm font-medium text-text-muted">
                    Built at MIT.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ToastProvider>
      </PaywallProvider>
    </AuthProvider>
  );
}

export default App;
