import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Logo from './components/Logo';
import HeroSection from './components/Hero/HeroSection';
import SectionTracking from './components/Sections/SectionTracking';
import LabelsPreviewSection from './components/Sections/LabelsPreviewSection';
import SectionLoop from './components/Sections/SectionLoop';
import HeroDashboardPreview from './components/Hero/HeroDashboardPreview';
import HowItWorksSection from './components/Sections/HowItWorksSection';
import PricingPage from './components/PricingPage';
import ScanTestPage from './pages/ScanTestPage';
import ScanPage from './pages/ScanPage';
import ScanHistoryPage from './pages/ScanHistoryPage';

// New Phase 3 Pages
import StartPage from './pages/StartPage';
import ScanPlatformPage from './pages/ScanPlatformPage';
import ProcessingPage from './pages/ProcessingPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Auth
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import { AuthProvider } from './lib/auth';

// Coming Soon Mode - Minimal Overlay
import { isComingSoon } from './config/comingSoon';
import ComingSoonBanner from './components/ComingSoonBanner';
import WaitlistSignup from './components/WaitlistSignup';

function App() {
  const comingSoonMode = isComingSoon();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);

  // Route guard: Block direct URL access to gated routes when Coming Soon mode is enabled
  useEffect(() => {
    if (comingSoonMode && location.pathname !== '/') {
      // Check if this route is gated
      const isGated = [
        '/dashboard',
        '/start',
        '/scan',
        '/history',
        '/pricing',
      ].some(route => location.pathname.startsWith(route));

      if (isGated) {
        // Redirect to home
        navigate('/', { replace: true });
        // Show message
        setShowRedirectMessage(true);
        // Hide message after 5 seconds
        setTimeout(() => setShowRedirectMessage(false), 5000);
      }
    }
  }, [location.pathname, comingSoonMode, navigate]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg-page font-sans text-text-main selection:bg-primary-blue/20">
        {/* Coming Soon Banner - Only shows when Coming Soon mode is enabled */}
        {comingSoonMode && <ComingSoonBanner />}

      {/* Redirect Message - Shows when user tries to access gated route */}
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

      <main>
        <Routes>
          {/* HOME ROUTE – MUST LOOK EXACTLY LIKE CURRENT HOMEPAGE */}
          <Route
            path="/"
            element={
              <>
                <HeroSection />

                {/* Waitlist Block #1 - Immediately after hero section (Coming Soon mode only) */}
                {comingSoonMode && (
                  <section className="py-12 sm:py-20 bg-bg-page">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-main mb-3">
                        Join the Waitlist
                      </h3>
                      <p className="text-base sm:text-lg text-text-muted mb-8 sm:mb-10 px-2">
                        Get early access when AlgorithmLens launches
                      </p>
                      <WaitlistSignup id="waitlist" />
                    </div>
                  </section>
                )}

                <SectionTracking />
                <LabelsPreviewSection />
                <SectionLoop />
                <HeroDashboardPreview />
                <HowItWorksSection />

                {/* Waitlist Block #2 - Near bottom, before final CTA (Coming Soon mode only) */}
                {comingSoonMode && (
                  <section className="py-12 sm:py-20 bg-bg-page/50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-main mb-3">
                        Join the Waitlist
                      </h3>
                      <p className="text-base sm:text-lg text-text-muted mb-8 sm:mb-10 px-2">
                        Get early access when AlgorithmLens launches
                      </p>
                      <WaitlistSignup id="waitlist-footer" />
                    </div>
                  </section>
                )}

                {!comingSoonMode && (
                  <section className="py-12 sm:py-26 mt-12 sm:mt-20 bg-bg-page text-center">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-6 sm:mb-8">
                        Ready to see your profile?
                      </h2>
                      <p className="text-base sm:text-lg text-text-muted mb-8 sm:mb-12 max-w-xl mx-auto px-2">
                        Upload a screen recording of your feed to generate your AlgorithmLens dashboard. Private and secure.
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

          {/* PRICING ROUTE */}
          <Route path="/pricing" element={<PricingPage />} />

          {/* ========================================
              PHASE 3: UNIFIED SCAN FLOW ROUTES
              ======================================== */}
          
          {/* Platform Selection - Entry point for new scan flow */}
          <Route path="/start" element={<StartPage />} />
          
          {/* Platform-specific scan methods (extension or upload) */}
          <Route path="/scan/platform/:platform" element={<ScanPlatformPage />} />
          
          {/* Processing animation while scan is being analyzed */}
          <Route path="/scan/processing" element={<ProcessingPage />} />
          
          {/* Full results page for a specific scan */}
          <Route path="/scan/results/:scanId" element={<ResultsPage />} />
          
          {/* New improved scan history page */}
          <Route path="/history" element={<HistoryPage />} />

          {/* Dashboard - catalog-driven analytics views */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* ========================================
              AUTH ROUTES
              ======================================== */}

          {/* Magic link callback - completes authentication */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* ========================================
              LEGACY ROUTES (kept for backwards compatibility)
              ======================================== */}
          
          {/* Legacy scan page - redirects or shows old flow */}
          <Route path="/scan" element={<ScanPage />} />
          
          {/* Legacy scan history - kept for Chrome extension compatibility */}
          <Route path="/scan-history" element={<ScanHistoryPage />} />

          {/* INTERNAL TEST ROUTE */}
          <Route path="/scan-test" element={<ScanTestPage />} />
        </Routes>
      </main>

        {/* Footer */}
        <footer className="py-12 bg-bg-page">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Logo variant="footer" />
            </div>
            <p className="text-sm text-text-muted font-medium">
              © {new Date().getFullYear()} AlgorithmLens. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
