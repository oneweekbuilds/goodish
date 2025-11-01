import React, { useState, useEffect } from 'react';
import LogoMark from '../LogoMark';
import { Button } from '../system/Button';

export interface HeaderProps {
  currentRoute?: 'home' | 'dashboard' | 'about' | 'demo';
  onNavigate?: (route: 'home' | 'dashboard' | 'about' | 'demo') => void;
  onTrySample?: () => void;
  onConnect?: () => void;
}

/**
 * Header component with Apple-grade polish
 * - Sticky after 48px scroll with translucent surface + hairline border
 * - Logo with magnifying glass icon (no clipping)
 * - Center nav with active state underlines
 * - Right CTAs (Try Sample Data + Connect)
 * - Hamburger menu for mobile
 * - Keyboard accessible with visible focus rings
 */
export function Header({ currentRoute = 'home', onNavigate, onTrySample, onConnect }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 48);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', route: 'home' as const },
    { label: 'Dashboard', route: 'dashboard' as const },
    { label: 'About', route: 'about' as const },
    { label: 'Try Demo', route: 'demo' as const },
  ];

  return (
    <header
      className={`
        fixed top-0 inset-x-0 z-sticky
        transition-all duration-300
        ${isScrolled ? 'bg-panel/95 backdrop-blur-md shadow-e1 border-b border-line' : 'bg-transparent'}
      `.replace(/\s+/g, ' ').trim()}
    >
      <div className="max-w-container mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Left: Logo + Wordmark */}
        <button
          onClick={() => onNavigate?.('home')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg overflow-visible"
          aria-label="Go to homepage"
        >
          <LogoMark size={32} animated={false} />
          <div
            className="text-xl font-semibold tracking-tight text-ink"
            style={{
              lineHeight: '1.1',
              overflow: 'visible', // Ensure no clipping
            }}
          >
            AlgorithmLens
          </div>
        </button>

        {/* Center: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.route}
              onClick={() => onNavigate?.(item.route)}
              className={`
                text-[15px] py-2 px-1
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded
                ${currentRoute === item.route
                  ? 'text-ink font-medium border-b-2 border-brand'
                  : 'text-inkMuted hover:text-ink'
                }
              `.replace(/\s+/g, ' ').trim()}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: CTAs (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {onTrySample && (
            <Button variant="primary" size="md" onClick={onTrySample}>
              Try Sample Data
            </Button>
          )}
          {onConnect && (
            <Button variant="secondary" size="md" onClick={onConnect}>
              Connect
            </Button>
          )}
        </div>

        {/* Mobile: Hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 hover:bg-neuLight rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMobileMenuOpen ? (
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <>
                <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Sheet */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-panel border-t border-line shadow-e3 animate-slide-up">
          <nav className="flex flex-col p-4">
            {navItems.map((item) => (
              <button
                key={item.route}
                onClick={() => {
                  onNavigate?.(item.route);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  text-left py-3 px-4 rounded-lg
                  transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
                  ${currentRoute === item.route
                    ? 'text-ink font-medium bg-brandLight'
                    : 'text-inkMuted hover:text-ink hover:bg-neuLight'
                  }
                `.replace(/\s+/g, ' ').trim()}
                style={{ minHeight: '44px' }} // Touch-friendly
              >
                {item.label}
              </button>
            ))}

            {/* Mobile CTAs */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-line">
              {onTrySample && (
                <Button variant="primary" size="md" onClick={() => {
                  onTrySample();
                  setIsMobileMenuOpen(false);
                }}>
                  Try Sample Data
                </Button>
              )}
              {onConnect && (
                <Button variant="ghost" size="md" onClick={() => {
                  onConnect();
                  setIsMobileMenuOpen(false);
                }}>
                  Connect
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
