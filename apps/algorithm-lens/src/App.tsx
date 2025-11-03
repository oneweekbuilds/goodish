import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/** Pages (lazy where helpful) */
import Home from "./pages/Home";
import DashboardPage from "./figma-ui/pages/DashboardPage";
import PricingPage from "./figma-ui/pages/PricingPage";
import { PrivacyTermsPage } from "./figma-ui/pages/PrivacyTermsPage";
import { AboutPage } from "./figma-ui/pages/AboutPage";
import { SignInPage } from "./figma-ui/pages/SignInPage";
import ExportPage from "./pages/ExportPage";
import ImportRedirect from "./pages/ImportRedirect";

/** Optional: simple HowItWorks page if not provided by Figma yet */
function HowItWorksPage() {
  return (
    <main className="min-h-[60vh] mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">How It Works</h1>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Upload your feed data (or use sample data), we parse and analyze it locally,
        then show what your algorithms have learned about you. This page will be
        replaced by the Figma version as soon as it's ready.
      </p>
    </main>
  );
}

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
  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
  };

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/privacy" element={<PrivacyTermsPage onNavigate={handleNavigate} />} />
      <Route path="/about" element={<AboutPage onNavigate={handleNavigate} />} />
      <Route path="/signin" element={<SignInPage onNavigate={handleNavigate} />} />
      <Route path="/export" element={<ExportPage />} />
      <Route path="/import" element={<ImportRedirect />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
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
