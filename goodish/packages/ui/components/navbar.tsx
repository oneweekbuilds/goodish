import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@goodish/lib';

interface NavItem { href: string; label: string }

interface NavbarProps {
  className?: string;
  showLogo?: boolean;
  homeHref?: string;
  links?: NavItem[];
}

export function Navbar({ className, showLogo = true, homeHref = '/', links }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const defaultNavItems: NavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/projects', label: 'Projects' },
    { href: '/about', label: 'About' },
  ];
  const navItems = links ?? defaultNavItems;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className={cn('sticky top-0 z-50 w-full border-b border-goodish-gray bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60', className)}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {showLogo && (
          <Link 
            href={homeHref} 
            className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2 rounded"
          >
            <div className="flex items-center">
              <span className="text-xl font-bold text-goodish-green">Good</span>
              <span className="text-xl font-bold text-goodish-teal">ish</span>
            </div>
          </Link>
        )}
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-goodish-charcoal transition-colors hover:text-goodish-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2 rounded px-2 py-1"
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button 
            className="text-goodish-charcoal p-2 rounded-md hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">Open menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-goodish-gray bg-white">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm font-medium text-goodish-charcoal transition-colors hover:text-goodish-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2 rounded px-3 py-2 hover:bg-gray-50"
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
