import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SiteHeader, SiteFooter } from './components/SiteChrome';

// Static imports for landing page (always needed)
// PricingPage removed — /pricing now redirects to /plus
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './lib/auth';
import { PaywallProvider } from './lib/plan/PaywallProvider';
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
const MethodologyPage = React.lazy(() => import('./pages/MethodologyPage'));

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
  const location = useLocation();
  // The former Coming Soon gate is retired. The landing page is a static
  // file at /, and the unlaunched web-app routes redirect there (vercel.json).

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


            <SiteHeader />

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
                      {/* HOME ROUTE: the static landing page owns / in production */}
                      <Route path="/" element={<Navigate to="/methodology" replace />} />

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

                      {/* TRANSPARENCY */}
                      <Route path="/methodology" element={<MethodologyPage />} />

                      {/* #4: 404 catch-all route */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                    </motion.div>
                  </AnimatePresence>
                </Suspense>
              </ErrorBoundary>
            </main>

            <SiteFooter />
          </div>
        </ToastProvider>
      </PaywallProvider>
    </AuthProvider>
  );
}

export default App;
