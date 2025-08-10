import React from 'react';
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
  const defaultNavItems: NavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/projects', label: 'Projects' },
    { href: '/about', label: 'About' },
  ];
  const navItems = links ?? defaultNavItems;

  return (
    <nav className={cn('sticky top-0 z-50 w-full border-b border-goodish-gray bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60', className)}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {showLogo && (
          <Link href={homeHref} className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-xl font-bold text-goodish-green">Good</span>
              <span className="text-xl font-bold text-goodish-teal">ish</span>
            </div>
          </Link>
        )}
        
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-goodish-charcoal transition-colors hover:text-goodish-teal"
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        {/* Mobile menu placeholder */}
        <div className="md:hidden">
          <button className="text-goodish-charcoal">
            <span className="sr-only">Open menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
