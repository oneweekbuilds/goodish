import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/** Pages (lazy where helpful) */
import Home from "./pages/Home";
import DashboardPage from "./figma-ui/pages/DashboardPage";
import PricingPage from "./figma-ui/pages/PricingPage";
import { PrivacyTermsPage } from "./components/PrivacyTermsPage";
import { AboutPage } from "./figma-ui/pages/AboutPage";
import { SignInPage } from "./figma-ui/pages/SignInPage";
import ExportPage from "./pages/ExportPage";
import ImportRedirect from "./pages/ImportRedirect";
import HowItWorks from "./pages/HowItWorks";
import ConnectedSessions from "./pages/ConnectedSessions";
import DatasetPage from "./pages/Dataset";

function NotFound() {
  return (
    <main className="min-h-[60vh] mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">Page not found</h1>
      <p className="text-muted-foreground">
        Check the URL or use the navigation above.
      </p>
    </main>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<'free' | 'premium'>(() => {
    // Load from localStorage or default to 'free'
    const savedPlan = localStorage.getItem('algorithmLens_plan') as 'free' | 'premium' | null;
    return savedPlan || 'free';
  });
  
  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
  };

  const handlePlanChange = (plan: 'free' | 'premium') => {
    setCurrentPlan(plan);
    // Persist to localStorage
    localStorage.setItem('algorithmLens_plan', plan);
    // Navigate to dashboard after upgrade
    if (plan === 'premium') {
      navigate('/dashboard');
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} currentPlan={currentPlan} onUpgrade={handleUpgrade} />} />
      <Route path="/pricing" element={<PricingPage currentPlan={currentPlan} onPlanChange={handlePlanChange} />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/privacy" element={<PrivacyTermsPage onNavigate={handleNavigate} />} />
      <Route path="/about" element={<AboutPage onNavigate={handleNavigate} />} />
      <Route path="/signin" element={<SignInPage onNavigate={handleNavigate} />} />
      <Route path="/export" element={<ExportPage />} />
      <Route path="/import" element={<ImportRedirect />} />
      <Route path="/connected-sessions" element={<ConnectedSessions />} />
      <Route path="/dataset" element={<DatasetPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1">
        <AppRoutes />
      </div>
      <Footer />
    </div>
  );
}
