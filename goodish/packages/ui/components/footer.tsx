import React from 'react';
import Link from 'next/link';
import { EmailSignup } from './email-signup';
import { cn } from '@goodish/lib';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/projects', label: 'Projects' },
    { href: '/about', label: 'About' },
  ];

  return (
    <footer className={cn('bg-goodish-charcoal text-white', className)}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-xl font-bold text-goodish-green">Good</span>
              <span className="text-xl font-bold text-goodish-teal">ish</span>
            </div>
            <p className="text-sm text-gray-300 max-w-xs">
              AI-powered projects that direct money and energy toward doing good in the world.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="font-semibold">Navigation</h4>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Email signup */}
          <div className="space-y-4">
            <h4 className="font-semibold">Stay updated</h4>
            <EmailSignup 
              title="Join the list"
              description="Get updates on new projects and how to build for good."
              variant="inline"
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-400">
            © 2024 Goodish. Part of Goodish.org
          </p>
          <p className="text-sm text-gray-400">
            Doing good is no longer hard.
          </p>
        </div>
      </div>
    </footer>
  );
}
