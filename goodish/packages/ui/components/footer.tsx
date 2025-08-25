import React from 'react';
import { cn } from '@goodish/lib';
import { X as TwitterIcon } from 'lucide-react';
import { SubscribeForm } from '../index';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/projects', label: 'Projects' },
    { href: '/about', label: 'About' },
    { href: '/why', label: 'Why' },
    { href: '/faq', label: 'FAQ' },
  ];

  return (
    <footer className={cn('bg-goodish-teal/20 text-gray-800 relative', className)}>
      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-goodish-teal/30 to-transparent"></div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center">
              <span className="text-2xl font-bold leading-none">
                <img src="/goodish-logo.png" alt="Goodish" className="h-12 w-auto block" />
              </span>
            </div>
            <p className="text-base text-gray-600 max-w-md leading-relaxed">
              AI-powered projects that direct money and energy toward doing good in the world. Built in hours, not months.
            </p>
            <p className="text-sm text-gray-500">
              Small scope, AI assistance, and proven templates let us ship meaningful projects quickly.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Navigation</h4>
            <nav className="space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block text-sm text-gray-600 hover:text-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 rounded px-1 py-1"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Email signup */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Stay updated</h4>
            <p className="text-sm text-gray-600">Follow along as new projects ship</p>
            <p className="text-xs text-gray-500">See examples in action—subscribing helps these projects grow.</p>
            <div className="mt-4">
              <SubscribeForm 
                variant="compact" 
                formId="goodish"
                showHeading={false}
                bgBlendClass="bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-300 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <p className="text-sm text-gray-500">
              © 2025 Goodish. Part of Goodish.org
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">•</span>
              <p className="text-sm text-gray-500">
                Doing good is no longer hard.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://x.com/Goodish_org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm hover:underline text-gray-500 hover:text-goodish-teal transition-colors"
            >
              <TwitterIcon className="h-4 w-4" />
              <span>X (Twitter)</span>
            </a>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">
              Built with transparency and impact in mind
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
