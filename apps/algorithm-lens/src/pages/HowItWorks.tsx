import { useNavigate } from 'react-router-dom';
import { AboutPage } from '../figma-ui/pages/AboutPage';
import { useEffect } from 'react';

/**
 * How It Works Page
 *
 * This page explains the AlgorithmLens process in 4 steps:
 * 1. Data - Connect social accounts
 * 2. Analysis - AI processing
 * 3. Insight - View patterns
 * 4. Reflection - Take action
 *
 * Uses the Figma-designed AboutPage component which contains the "How It Works" content.
 */
export default function HowItWorks() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set document title
    document.title = 'How It Works | AlgorithmLens';
  }, []);

  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
  };

  return <AboutPage onNavigate={handleNavigate} />;
}




