import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/Hero/HeroSection';
import SectionTracking from './components/Sections/SectionTracking';
import LabelsPreviewSection from './components/Sections/LabelsPreviewSection';
import SectionLoop from './components/Sections/SectionLoop';
import HeroDashboardPreview from './components/Hero/HeroDashboardPreview';
import HowItWorksSection from './components/Sections/HowItWorksSection';
import { Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';
import PricingPage from './components/PricingPage';
import ScanTestPage from './pages/ScanTestPage';
import ScanPage from './pages/ScanPage';
import ScanHistoryPage from './pages/ScanHistoryPage';

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
                      Link your feeds to generate your AlgorithmLens dashboard. Read-only access. We never post on your behalf.
                    </p>

                    <button className="px-10 py-4 bg-primary-blue text-white rounded-full font-bold text-lg shadow-glow hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      Get Started
                    </button>
                  </div>
                </section>
              </>
            }
          />

          {/* PRICING ROUTE – NEW PAGE */}
          <Route path="/pricing" element={<PricingPage />} />

          {/* SCAN FLOW – USER-FACING */}
          <Route path="/scan" element={<ScanPage />} />

          {/* SCAN HISTORY */}
          <Route path="/history" element={<ScanHistoryPage />} />

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

const SocialIcon = ({ icon: Icon, color }) => (
  <div
    className={`w-16 h-16 rounded-2xl bg-white border border-border-light flex items-center justify-center transition-all duration-300 cursor-pointer shadow-soft hover:scale-110 ${color === 'blue'
      ? 'text-text-muted hover:text-primary-blue hover:border-primary-blue hover:bg-primary-blue/5'
      : 'text-text-muted hover:text-accent-green hover:border-accent-green hover:bg-accent-green/5'
      }`}
  >
    <Icon size={26} strokeWidth={2} />
  </div>
);

export default App;
