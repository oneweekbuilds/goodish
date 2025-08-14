"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@goodish/lib';
import { Twitter } from 'lucide-react';

interface NavItem { href: string; label: string }

interface NavbarProps {
  className?: string;
  showLogo?: boolean;
  homeHref?: string;
  links?: NavItem[];
}

export function Navbar({ className, showLogo = true, homeHref = '/', links }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const defaultNavItems: NavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/projects', label: 'Projects' },
    { href: '/about', label: 'About' },
    { href: '/why', label: 'Why' },
    { href: '/faq', label: 'FAQ' },
  ];
  const navItems = links ?? defaultNavItems;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMenuOpen]);

  return (
    <nav className={cn(
      'sticky top-0 z-40 w-full border-b border-goodish-gray/50 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 relative transition-all duration-200',
      isScrolled && 'shadow-sm bg-white/98',
      className
    )}>
      {/* Top hairline gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-goodish-teal/30 to-transparent"></div>
      
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {showLogo && (
          <Link 
            href={homeHref} 
            className="inline-flex items-center gap-2 px-3 py-2 -mx-3 -my-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2 transition-all duration-200 hover:bg-gray-50 hover:scale-105"
            aria-label="Goodish - Go to homepage"
          >
            <div className="flex items-center">
              <span className="text-2xl md:text-3xl font-bold text-goodish-green">Good</span>
              <span className="text-2xl md:text-3xl font-bold text-goodish-teal">ish</span>
            </div>
          </Link>
        )}
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative text-sm font-medium text-goodish-charcoal transition-colors hover:text-goodish-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              {item.label}
              {/* Animated underline */}
              <span className="absolute bottom-0 left-0 bg-current h-[2px] w-0 group-hover:w-full group-focus-visible:w-full transition-[width] duration-300"></span>
            </Link>
          ))}
          
          {/* X Social Link */}
          <a
            href="https://x.com/Goodish_org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Goodish on X"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-goodish-charcoal/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-goodish-teal transition-colors"
          >
            <Twitter className="h-4 w-4 text-goodish-charcoal" />
          </a>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button 
            className="text-goodish-charcoal p-2 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2 transition-colors"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
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
        <div 
          id="mobile-menu"
          ref={menuRef}
          className="md:hidden border-t border-goodish-gray/50 bg-white/95 backdrop-blur-md"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm font-medium text-goodish-charcoal transition-colors hover:text-goodish-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2 rounded-lg px-3 py-2 hover:bg-gray-50"
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
