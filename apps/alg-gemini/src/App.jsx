import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
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

function App() {
  return (
    <div className="min-h-screen bg-bg-page font-sans text-text-main selection:bg-primary-blue/20">
      <Navbar />

      <main>
        <Routes>
          {/* HOME ROUTE – MUST LOOK EXACTLY LIKE CURRENT HOMEPAGE */}
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                <SectionTracking />
                <LabelsPreviewSection />
                <SectionLoop />
                <HeroDashboardPreview />
                <HowItWorksSection />

                <section className="py-26 mt-20 bg-bg-page text-center">
                  <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-8">
                      Ready to see your profile?
                    </h2>
                    <p className="text-lg text-text-muted mb-12 max-w-xl mx-auto">
                      Upload a screen recording of your feed to generate your AlgorithmLens dashboard. Private and secure.
                    </p>

                    <Link 
                      to="/start"
                      className="inline-block px-10 py-4 bg-primary-blue text-white rounded-full font-bold text-lg shadow-glow hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      Start a Scan
                    </Link>
                  </div>
                </section>
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
            <img
              src="/logo-full.png"
              alt="AlgorithmLens"
              style={{ width: '270px', height: 'auto', opacity: 0.8 }}
            />
          </div>
          <p className="text-sm text-text-muted font-medium">
            © {new Date().getFullYear()} AlgorithmLens. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
