import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { BrandLogo } from './BrandLogo';
import { AccountBadge } from './AccountBadge';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  currentPlan: 'free' | 'premium';
  onPlanChange: (plan: 'free' | 'premium') => void;
}

export function Navbar({ onNavigate, currentPage, currentPlan, onPlanChange }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', page: 'landing', id: 'home' },
    { label: 'Dashboard', page: 'dashboard', id: 'dashboard' },
    { label: 'Pricing', page: 'pricing', id: 'pricing' },
    { label: 'How It Works', page: 'about', id: 'how-it-works' },
    { label: 'About', page: 'about', id: 'about' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/98 backdrop-blur-xl' 
          : 'bg-white/70 backdrop-blur-md'
      }`}
      style={{
        height: '80px',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: scrolled ? 'var(--elevation-1)' : 'none',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-20 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <button
            onClick={() => onNavigate('landing')}
            className="group"
          >
            <BrandLogo size="md" showText={true} />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center" style={{ gap: '32px' }}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.page)}
                className={`text-base font-medium transition-all ${
                  currentPage === link.page 
                    ? 'text-foreground font-semibold' 
                    : 'hover:text-foreground'
                }`}
                style={{ 
                  color: currentPage === link.page ? 'var(--foreground)' : 'var(--foreground-secondary)',
                  transition: 'var(--transition-fast)',
                  position: 'relative',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '1px solid var(--brand-purple)';
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
              >
                {link.label}
                {currentPage === link.page && (
                  <span 
                    className="absolute left-0 right-0 rounded-full"
                    style={{ 
                      bottom: '-4px',
                      height: '2px',
                      background: 'var(--brand-gradient)',
                      width: 'calc(100% + 8px)',
                      marginLeft: '-4px',
                    }} 
                  />
                )}
              </button>
            ))}
          </div>

          {/* Desktop CTA + Account Badge */}
          <div className="hidden md:flex items-center gap-4">
            <AccountBadge
              currentPlan={currentPlan}
              onManagePlan={() => onNavigate('pricing')}
              onBillingHistory={() => {/* TODO */}}
              onDeleteData={() => {/* TODO */}}
              onLogOut={() => {/* TODO */}}
            />
            <Button 
              onClick={() => onNavigate(currentPage === 'landing' ? 'signin' : 'dashboard')}
              className="text-base font-semibold"
              style={{
                height: '56px',
                borderRadius: 'var(--radius-button)',
                background: 'var(--brand-gradient)',
                transition: 'var(--transition-hover)',
                boxShadow: 'none',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--brand-gradient-reverse)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--brand-gradient)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '1px solid var(--brand-purple)';
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              {currentPage === 'landing' ? 'Get Started Free' : 'Dashboard'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-secondary/50 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              borderRadius: 'var(--radius-button)',
              transition: 'var(--transition-fast)',
              height: '64px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '1px solid var(--brand-purple)';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-6 pb-4 space-y-2 animate-in slide-in-from-top-4 duration-300">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.page);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left py-3 px-4 text-base transition-all duration-300 rounded-2xl ${
                  currentPage === link.page 
                    ? 'text-foreground bg-gradient-to-r from-primary/10 to-accent/10 font-semibold' 
                    : 'hover:text-foreground hover:bg-secondary/50'
                }`}
                style={{ color: currentPage === link.page ? 'var(--foreground)' : 'var(--foreground-secondary)' }}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4">
              <Button
                className="w-full text-base shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6BA89E 0%, #A79ACB 100%)',
                }}
                onClick={() => {
                  onNavigate(currentPage === 'landing' ? 'signin' : 'dashboard');
                  setMobileMenuOpen(false);
                }}
              >
                {currentPage === 'landing' ? 'Get Started Free' : 'Try the Dashboard'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
